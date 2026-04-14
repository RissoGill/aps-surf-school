import { useState, useEffect } from "react";
import { MessageSquare, Send, Clock, Check, Filter, ChevronDown, ChevronUp, RefreshCw, Mail, History } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
}

interface MessageReply {
  id: string;
  message_id: string;
  sender_type: string;
  sender_id: string;
  content: string;
  created_at: string;
}

interface Coach {
  coach_id: string;
  first_name: string | null;
  last_name: string | null;
}

export const CoachMessagesManagementCard = () => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showHistory, setShowHistory] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [coachFilter, setCoachFilter] = useState<string>("all");
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  
  // New message form state
  const [showNewMessageForm, setShowNewMessageForm] = useState(false);
  const [newMessageCoach, setNewMessageCoach] = useState<string>("");
  const [newMessageSubject, setNewMessageSubject] = useState("");
  const [newMessageContent, setNewMessageContent] = useState("");

  // Fetch all coaches for filter
  const { data: coaches } = useQuery({
    queryKey: ['coaches-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coach')
        .select('coach_id, first_name, last_name')
        .order('first_name', { ascending: true });
      
      if (error) throw error;
      return data as Coach[];
    }
  });

  // Fetch all messages
  const { data: messages, isLoading, refetch } = useQuery({
    queryKey: ['admin-coach-messages', statusFilter, coachFilter],
    queryFn: async () => {
      let query = supabase
        .from('coach_messages')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (statusFilter === "pending") {
        query = query.eq('is_resolved', false);
      } else if (statusFilter === "resolved") {
        query = query.eq('is_resolved', true);
      }
      
      if (coachFilter !== "all") {
        query = query.eq('coach_id', coachFilter);
      }
      
      const { data, error } = await query.limit(10000);
      
      if (error) throw error;
      return data as CoachMessage[];
    }
  });

  // Fetch all replies
  const { data: allReplies } = useQuery({
    queryKey: ['admin-coach-message-replies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coach_message_replies')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(10000);
      
      if (error) throw error;
      return data as MessageReply[];
    }
  });

  // Create new message mutation
  const createMessageMutation = useMutation({
    mutationFn: async ({ coachId, subject, message }: { coachId: string; subject: string; message: string }) => {
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
      queryClient.invalidateQueries({ queryKey: ['admin-coach-messages'] });
      setShowNewMessageForm(false);
      setNewMessageCoach("");
      setNewMessageSubject("");
      setNewMessageContent("");
      toast({
        title: t('admin.coachMessages.messageSent'),
      });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        variant: "destructive"
      });
    }
  });

  // Create reply mutation
  const createReplyMutation = useMutation({
    mutationFn: async ({ messageId, content }: { messageId: string; content: string }) => {
      // Get admin info from localStorage
      const adminSession = localStorage.getItem('adminSession');
      const adminId = adminSession ? JSON.parse(adminSession).id || 'admin' : 'admin';
      
      const { data, error } = await supabase
        .from('coach_message_replies')
        .insert({
          message_id: messageId,
          sender_type: 'admin',
          sender_id: adminId,
          content: content.trim()
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coach-message-replies'] });
      setReplyingTo(null);
      setReplyContent("");
      toast({
        title: t('admin.coachMessages.replySent'),
      });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        variant: "destructive"
      });
    }
  });

  // Toggle resolved status mutation
  const toggleResolvedMutation = useMutation({
    mutationFn: async ({ messageId, isResolved }: { messageId: string; isResolved: boolean }) => {
      const adminSession = localStorage.getItem('adminSession');
      const adminId = adminSession ? JSON.parse(adminSession).id || 'admin' : 'admin';
      
      const { error } = await supabase
        .from('coach_messages')
        .update({
          is_resolved: isResolved,
          resolved_at: isResolved ? new Date().toISOString() : null,
          resolved_by: isResolved ? adminId : null
        })
        .eq('id', messageId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coach-messages'] });
      toast({
        title: t('admin.coachMessages.statusUpdated'),
      });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        variant: "destructive"
      });
    }
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('admin-coach-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'coach_messages'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['admin-coach-messages'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'coach_message_replies'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['admin-coach-message-replies'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

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

  const handleSubmitNewMessage = () => {
    if (!newMessageCoach) {
      toast({
        title: t('common.error'),
        description: t('admin.coachMessages.selectCoachError'),
        variant: "destructive"
      });
      return;
    }
    if (newMessageSubject.trim().length < 3) {
      toast({
        title: t('common.error'),
        description: t('coach.messages.subjectMinLength'),
        variant: "destructive"
      });
      return;
    }
    if (newMessageContent.trim().length < 10) {
      toast({
        title: t('common.error'),
        description: t('coach.messages.validationError'),
        variant: "destructive"
      });
      return;
    }
    createMessageMutation.mutate({
      coachId: newMessageCoach,
      subject: newMessageSubject,
      message: newMessageContent
    });
  };

  const toggleExpanded = (messageId: string) => {
    const newExpanded = new Set(expandedMessages);
    if (newExpanded.has(messageId)) {
      newExpanded.delete(messageId);
    } else {
      newExpanded.add(messageId);
    }
    setExpandedMessages(newExpanded);
  };

  const getRepliesForMessage = (messageId: string) => {
    return allReplies?.filter(r => r.message_id === messageId) || [];
  };

  const getCoachName = (coachId: string) => {
    const coach = coaches?.find(c => c.coach_id === coachId);
    if (coach) {
      return [coach.first_name, coach.last_name].filter(Boolean).join(' ') || coachId;
    }
    return coachId;
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

  const pendingCount = messages?.filter(m => !m.is_resolved).length || 0;

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <CardTitle className="text-xl">{t('admin.coachMessages.title')}</CardTitle>
          {pendingCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {pendingCount}
            </Badge>
          )}
        </div>
        <div className="flex justify-end gap-2 mt-2">
            <Button
              variant={showHistory ? "secondary" : "outline"}
              size="sm"
              onClick={() => {
                setShowHistory(!showHistory);
                if (!showHistory) {
                  setStatusFilter("all");
                } else {
                  setStatusFilter("pending");
                }
              }}
            >
              <History className="h-4 w-4 mr-1" />
              {showHistory ? t('admin.coachMessages.hideHistory') : t('admin.coachMessages.showHistory')}
            </Button>
            <Button variant="default" size="sm" onClick={() => setShowNewMessageForm(!showNewMessageForm)}>
              <Mail className="h-4 w-4 mr-1" />
              {t('admin.coachMessages.newMessage')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardDescription>{t('admin.coachMessages.description')}</CardDescription>
        
        {/* New Message Form */}
        {showNewMessageForm && (
          <div className="mt-4 p-4 border rounded-lg bg-muted/30 space-y-3">
            <h4 className="font-medium">{t('admin.coachMessages.newMessageTitle')}</h4>
            
            <div>
              <Label htmlFor="coach-select" className="text-sm">{t('admin.coachMessages.selectCoach')}</Label>
              <Select value={newMessageCoach} onValueChange={setNewMessageCoach}>
                <SelectTrigger id="coach-select" className="mt-1">
                  <SelectValue placeholder={t('admin.coachMessages.selectCoachPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {coaches?.map(coach => (
                    <SelectItem key={coach.coach_id} value={coach.coach_id}>
                      {coach.coach_id} - {[coach.first_name, coach.last_name].filter(Boolean).join(' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="subject-input" className="text-sm">{t('coach.messages.subject')}</Label>
              <Input
                id="subject-input"
                value={newMessageSubject}
                onChange={(e) => setNewMessageSubject(e.target.value)}
                placeholder={t('coach.messages.subjectPlaceholder')}
                maxLength={100}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="message-input" className="text-sm">{t('coach.messages.message')}</Label>
              <Textarea
                id="message-input"
                value={newMessageContent}
                onChange={(e) => setNewMessageContent(e.target.value)}
                placeholder={t('admin.coachMessages.messageToCoachPlaceholder')}
                rows={4}
                maxLength={2000}
                className="mt-1"
              />
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowNewMessageForm(false);
                  setNewMessageCoach("");
                  setNewMessageSubject("");
                  setNewMessageContent("");
                }}
              >
                {t('coach.messages.cancel')}
              </Button>
              <Button
                size="sm"
                onClick={handleSubmitNewMessage}
                disabled={createMessageMutation.isPending}
              >
                <Send className="h-3 w-3 mr-1" />
                {t('coach.messages.send')}
              </Button>
            </div>
          </div>
        )}
        
        {/* Filters */}
        <div className="flex flex-wrap gap-2 mt-3">
          {showHistory && (
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('admin.coachMessages.filterAll')}</SelectItem>
                <SelectItem value="pending">{t('admin.coachMessages.filterPending')}</SelectItem>
                <SelectItem value="resolved">{t('admin.coachMessages.filterResolved')}</SelectItem>
              </SelectContent>
            </Select>
          )}
          
          <Select value={coachFilter} onValueChange={setCoachFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={t('admin.coachMessages.allCoaches')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('admin.coachMessages.allCoaches')}</SelectItem>
              {coaches?.map(coach => (
                <SelectItem key={coach.coach_id} value={coach.coach_id}>
                  {coach.coach_id} - {[coach.first_name, coach.last_name].filter(Boolean).join(' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
            <p>{t('admin.coachMessages.noMessages')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => {
              const replies = getRepliesForMessage(msg.id);
              const isExpanded = expandedMessages.has(msg.id);
              const isReplying = replyingTo === msg.id;
              
              return (
                <Collapsible key={msg.id} open={isExpanded} onOpenChange={() => toggleExpanded(msg.id)}>
                  <div className="border rounded-lg p-3">
                    <CollapsibleTrigger asChild>
                      <div className="flex items-start justify-between cursor-pointer hover:bg-muted/50 rounded p-1 -m-1">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            {msg.is_resolved ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Clock className="h-4 w-4 text-amber-500" />
                            )}
                            <Badge variant="outline" className="text-xs">
                              {msg.coach_id} - {getCoachName(msg.coach_id)}
                            </Badge>
                            <span className="font-medium">{escapeHtml(msg.subject)}</span>
                            <Badge variant={msg.is_resolved ? "secondary" : "destructive"} className="text-xs">
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
                            {formatDate(msg.created_at)}
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
                        {/* Coach info */}
                        <div className="text-sm mb-2">
                          <span className="text-muted-foreground">{t('admin.coachMessages.from')}:</span>{' '}
                          <span className="font-medium">{getCoachName(msg.coach_id)} ({msg.coach_id})</span>
                        </div>
                        
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
                                      reply.sender_type === 'admin'
                                        ? 'bg-primary/10 ml-4'
                                        : 'bg-secondary mr-4'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-medium text-xs">
                                        {reply.sender_type === 'admin' 
                                          ? t('coach.messages.admin')
                                          : `${t('admin.coachMessages.coach')} (${reply.sender_id})`
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
                        
                        {/* Actions */}
                        <div className="flex flex-wrap gap-2">
                          {/* Reply form */}
                          {isReplying ? (
                            <div className="w-full space-y-2">
                              <Textarea
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder={t('admin.coachMessages.replyPlaceholder')}
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
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setReplyingTo(msg.id)}
                              >
                                <MessageSquare className="h-3 w-3 mr-1" />
                                {t('admin.coachMessages.reply')}
                              </Button>
                              
                              <Button
                                size="sm"
                                variant={msg.is_resolved ? "outline" : "default"}
                                onClick={() => toggleResolvedMutation.mutate({ 
                                  messageId: msg.id, 
                                  isResolved: !msg.is_resolved 
                                })}
                                disabled={toggleResolvedMutation.isPending}
                              >
                                {msg.is_resolved ? (
                                  <>
                                    <Clock className="h-3 w-3 mr-1" />
                                    {t('admin.coachMessages.markPending')}
                                  </>
                                ) : (
                                  <>
                                    <Check className="h-3 w-3 mr-1" />
                                    {t('admin.coachMessages.markResolved')}
                                  </>
                                )}
                              </Button>
                            </>
                          )}
                        </div>
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

export default CoachMessagesManagementCard;
