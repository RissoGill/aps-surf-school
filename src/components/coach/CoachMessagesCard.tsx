import { useState, useEffect } from "react";
import { MessageSquare, Plus, Send, Clock, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { escapeHtml } from "@/utils/htmlSanitize";

interface CoachMessage {
  id: string;
  coach_id: string;
  subject: string;
  message: string;
  is_resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
  updated_at: string;
  read_by_coach: boolean;
}

interface MessageReply {
  id: string;
  message_id: string;
  sender_type: string;
  sender_id: string;
  content: string;
  created_at: string;
}

interface CoachMessagesCardProps {
  coachId: string;
  coachName?: string;
}

export const CoachMessagesCard = ({ coachId, coachName }: CoachMessagesCardProps) => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  // Mutation to mark message as read
  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from('coach_messages')
        .update({ read_by_coach: true })
        .eq('id', messageId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach-messages', coachId] });
    }
  });

  // Fetch messages for this coach
  const { data: messages, isLoading } = useQuery({
    queryKey: ['coach-messages', coachId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coach_messages')
        .select('*')
        .eq('coach_id', coachId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as CoachMessage[];
    },
    enabled: !!coachId
  });

  // Fetch replies for all messages
  const { data: allReplies } = useQuery({
    queryKey: ['coach-message-replies', coachId],
    queryFn: async () => {
      if (!messages?.length) return [];
      
      const messageIds = messages.map(m => m.id);
      const { data, error } = await supabase
        .from('coach_message_replies')
        .select('*')
        .in('message_id', messageIds)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as MessageReply[];
    },
    enabled: !!messages?.length
  });

  // Create new message mutation
  const createMessageMutation = useMutation({
    mutationFn: async ({ subject, message }: { subject: string; message: string }) => {
      const { data, error } = await supabase
        .from('coach_messages')
        .insert({
          coach_id: coachId,
          subject: subject.trim(),
          message: message.trim()
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach-messages', coachId] });
      setIsNewMessageOpen(false);
      setNewSubject("");
      setNewMessage("");
      toast({
        title: t('coach.messages.messageSent'),
        description: t('coach.messages.messageSent'),
      });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('coach.messages.sendError'),
        variant: "destructive"
      });
    }
  });

  // Create reply mutation
  const createReplyMutation = useMutation({
    mutationFn: async ({ messageId, content }: { messageId: string; content: string }) => {
      const { data, error } = await supabase
        .from('coach_message_replies')
        .insert({
          message_id: messageId,
          sender_type: 'coach',
          sender_id: coachId,
          content: content.trim()
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach-message-replies', coachId] });
      setReplyingTo(null);
      setReplyContent("");
      toast({
        title: t('coach.messages.replySent'),
      });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('coach.messages.sendError'),
        variant: "destructive"
      });
    }
  });

  // Real-time subscription for new replies
  useEffect(() => {
    if (!messages?.length) return;

    const channel = supabase
      .channel('coach-messages-replies')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'coach_message_replies'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['coach-message-replies', coachId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'coach_messages'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['coach-messages', coachId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [messages, coachId, queryClient]);

  const handleSubmitNewMessage = () => {
    if (newSubject.trim().length < 3 || newMessage.trim().length < 10) {
      toast({
        title: t('common.error'),
        description: t('coach.messages.validationError'),
        variant: "destructive"
      });
      return;
    }
    createMessageMutation.mutate({ subject: newSubject, message: newMessage });
  };

  const handleSubmitReply = (messageId: string) => {
    if (replyContent.trim().length < 10) {
      toast({
        title: t('common.error'),
        description: t('coach.messages.validationError'),
        variant: "destructive"
      });
      return;
    }
    createReplyMutation.mutate({ messageId, content: replyContent });
  };

  const toggleExpanded = (messageId: string, isUnread: boolean) => {
    const newExpanded = new Set(expandedMessages);
    if (newExpanded.has(messageId)) {
      newExpanded.delete(messageId);
    } else {
      newExpanded.add(messageId);
      // Mark as read when expanding an unread message
      if (isUnread) {
        markAsReadMutation.mutate(messageId);
      }
    }
    setExpandedMessages(newExpanded);
  };

  const getRepliesForMessage = (messageId: string) => {
    return allReplies?.filter(r => r.message_id === messageId) || [];
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === 'pt' ? 'pt-PT' : 'en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const unreadCount = messages?.filter(m => !m.read_by_coach).length || 0;
  const pendingCount = messages?.filter(m => !m.is_resolved).length || 0;

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-start gap-4">
          <MessageSquare className="h-5 w-5 text-primary shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-xl">{t('coach.messages.title')}</CardTitle>
              {unreadCount > 0 && (
                <Badge variant="destructive">
                  {unreadCount} {t('coach.messages.unread')}
                </Badge>
              )}
              {pendingCount > 0 && unreadCount === 0 && (
                <Badge variant="secondary">
                  {pendingCount} {t('coach.messages.pending')}
                </Badge>
              )}
            </div>
            <CardDescription className="mt-1">{t('coach.messages.description')}</CardDescription>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Dialog open={isNewMessageOpen} onOpenChange={setIsNewMessageOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full sm:w-auto gap-1">
                <Plus className="h-4 w-4" />
                {t('coach.messages.new')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('coach.messages.new')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">{t('coach.messages.subject')}</Label>
                  <Input
                    id="subject"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder={t('coach.messages.subjectPlaceholder')}
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">{t('coach.messages.message')}</Label>
                  <Textarea
                    id="message"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={t('coach.messages.messagePlaceholder')}
                    rows={5}
                    maxLength={2000}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsNewMessageOpen(false)}>
                  {t('coach.messages.cancel')}
                </Button>
                <Button 
                  onClick={handleSubmitNewMessage}
                  disabled={createMessageMutation.isPending}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {t('coach.messages.send')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4 text-muted-foreground">
            {t('common.loading')}
          </div>
        ) : !messages?.length ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>{t('coach.messages.noMessages')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => {
              const replies = getRepliesForMessage(msg.id);
              const isExpanded = expandedMessages.has(msg.id);
              const isReplying = replyingTo === msg.id;
              
              return (
                <Collapsible key={msg.id} open={isExpanded} onOpenChange={() => toggleExpanded(msg.id, !msg.read_by_coach)}>
                  <div className={`border rounded-lg p-3 ${!msg.read_by_coach ? 'border-red-500 bg-red-50 dark:bg-red-950/20' : ''}`}>
                    <CollapsibleTrigger asChild>
                      <div className="flex items-start justify-between cursor-pointer hover:bg-muted/50 rounded p-1 -m-1">
                        <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            {msg.is_resolved ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : !msg.read_by_coach ? (
                              <Clock className="h-4 w-4 text-red-500" />
                            ) : (
                              <Clock className="h-4 w-4 text-amber-500" />
                            )}
                            <span className="font-medium">{escapeHtml(msg.subject)}</span>
                            {!msg.read_by_coach && (
                              <Badge variant="destructive" className="text-xs">
                                {t('coach.messages.unread')}
                              </Badge>
                            )}
                            <Badge variant={msg.is_resolved ? "outline" : "default"} className="text-xs">
                              {msg.is_resolved ? t('coach.messages.resolved') : t('coach.messages.pending')}
                            </Badge>
                            {replies.length > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {replies.length} {replies.length === 1 ? 'resposta' : 'respostas'}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {escapeHtml(msg.message)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {t('coach.messages.sent')}: {formatDate(msg.created_at)}
                          </p>
                        </div>
                        <div className="ml-2">
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <div className="mt-3 pt-3 border-t">
                        {/* Full message */}
                        <div className="bg-muted/50 rounded p-3 mb-3">
                          <p className="text-sm whitespace-pre-wrap">{escapeHtml(msg.message)}</p>
                        </div>
                        
                        {/* Replies */}
                        {replies.length > 0 && (
                          <div className="space-y-2 mb-3">
                            <p className="text-sm font-medium">{t('coach.messages.conversation')}:</p>
                            <ScrollArea className="max-h-60">
                              <div className="space-y-2">
                                {replies.map((reply) => (
                                  <div
                                    key={reply.id}
                                    className={`p-2 rounded text-sm ${
                                      reply.sender_type === 'coach'
                                        ? 'bg-primary/10 ml-4'
                                        : 'bg-secondary mr-4'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-medium text-xs">
                                        {reply.sender_type === 'coach' 
                                          ? t('coach.messages.you') 
                                          : t('coach.messages.admin')
                                        }
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {formatDate(reply.created_at)}
                                      </span>
                                    </div>
                                    <p className="whitespace-pre-wrap">{escapeHtml(reply.content)}</p>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          </div>
                        )}
                        
                        {/* Reply form */}
                        {!msg.is_resolved && (
                          <>
                            {isReplying ? (
                              <div className="space-y-2">
                                <Textarea
                                  value={replyContent}
                                  onChange={(e) => setReplyContent(e.target.value)}
                                  placeholder={t('coach.messages.replyPlaceholder')}
                                  rows={3}
                                  maxLength={2000}
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleSubmitReply(msg.id)}
                                    disabled={createReplyMutation.isPending}
                                  >
                                    <Send className="h-3 w-3 mr-1" />
                                    {t('coach.messages.send')}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setReplyingTo(null);
                                      setReplyContent("");
                                    }}
                                  >
                                    {t('coach.messages.cancel')}
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setReplyingTo(msg.id)}
                              >
                                <MessageSquare className="h-3 w-3 mr-1" />
                                {t('coach.messages.reply')}
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CoachMessagesCard;
