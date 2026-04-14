import { useState } from "react";
import { Bell, Plus, Check, X, Edit2, Trash2, Users, History } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "@/hooks/use-toast";

interface Alert {
  id: string;
  subject: string | null;
  message: string;
  target_type: string;
  target_ids: string[] | null;
  is_resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface Coach {
  coach_id: string;
  first_name: string | null;
  last_name: string | null;
}

interface Athlete {
  athlete_id: string;
  first_name: string | null;
  last_name: string | null;
}

interface AlertsManagementCardProps {
  userRole: string | null;
  currentUser: string | null;
}

const AlertsManagementCard = ({ userRole, currentUser }: AlertsManagementCardProps) => {
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [targetType, setTargetType] = useState("all");
  const [targetIds, setTargetIds] = useState<string[]>([]);

  // Fetch alerts
  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['admin-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10000);
      
      if (error) throw error;
      return data as Alert[];
    }
  });

  // Fetch coaches for dropdown
  const { data: coaches = [] } = useQuery({
    queryKey: ['coaches-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coach')
        .select('coach_id, first_name, last_name')
        .order('first_name');
      
      if (error) throw error;
      return data as Coach[];
    }
  });

  // Fetch athletes for dropdown
  const { data: athletes = [] } = useQuery({
    queryKey: ['athletes-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('atletas')
        .select('athlete_id, first_name, last_name')
        .eq('is_active', true)
        .order('first_name');
      
      if (error) throw error;
      return data as Athlete[];
    }
  });

  // Create alert mutation
  const createMutation = useMutation({
    mutationFn: async (alertData: { subject: string; message: string; target_type: string; target_ids: string[] | null }) => {
      const { error } = await supabase
        .from('alerts')
        .insert({
          subject: alertData.subject,
          message: alertData.message,
          target_type: alertData.target_type,
          target_ids: alertData.target_ids,
          created_by: currentUser
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-alerts'] });
      toast({ title: t('common.success'), description: t('admin.alerts.created') });
      resetForm();
    },
    onError: () => {
      toast({ title: t('common.error'), description: t('admin.alerts.createError'), variant: "destructive" });
    }
  });

  // Update alert mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Alert> }) => {
      const { error } = await supabase
        .from('alerts')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-alerts'] });
      toast({ title: t('common.success'), description: t('admin.alerts.updated') });
      resetForm();
    },
    onError: () => {
      toast({ title: t('common.error'), description: t('admin.alerts.updateError'), variant: "destructive" });
    }
  });

  // Delete alert mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('alerts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-alerts'] });
      toast({ title: t('common.success'), description: t('admin.alerts.deleted') });
    },
    onError: () => {
      toast({ title: t('common.error'), description: t('admin.alerts.deleteError'), variant: "destructive" });
    }
  });

  const resetForm = () => {
    setSubject("");
    setMessage("");
    setTargetType("all");
    setTargetIds([]);
    setEditingAlert(null);
    setIsDialogOpen(false);
  };

  const handleSubmit = () => {
    if (!subject.trim()) {
      toast({ title: t('common.error'), description: t('admin.alerts.subjectRequired'), variant: "destructive" });
      return;
    }
    if (!message.trim()) {
      toast({ title: t('common.error'), description: t('admin.alerts.messageRequired'), variant: "destructive" });
      return;
    }

    const finalTargetIds = (targetType === 'specific_coach' || targetType === 'specific_athlete') 
      ? (targetIds.length > 0 ? targetIds : null) 
      : null;

    if (editingAlert) {
      updateMutation.mutate({
        id: editingAlert.id,
        data: { subject, message, target_type: targetType, target_ids: finalTargetIds }
      });
    } else {
      createMutation.mutate({ subject, message, target_type: targetType, target_ids: finalTargetIds });
    }
  };

  const handleEdit = (alert: Alert) => {
    setEditingAlert(alert);
    setSubject(alert.subject || "");
    setMessage(alert.message);
    setTargetType(alert.target_type);
    setTargetIds(alert.target_ids || []);
    setIsDialogOpen(true);
  };

  const handleToggleResolved = (alert: Alert) => {
    updateMutation.mutate({
      id: alert.id,
      data: {
        is_resolved: !alert.is_resolved,
        resolved_at: !alert.is_resolved ? new Date().toISOString() : null,
        resolved_by: !alert.is_resolved ? currentUser : null
      }
    });
  };

  const handleToggleCoach = (coachId: string) => {
    setTargetIds(prev => 
      prev.includes(coachId) 
        ? prev.filter(id => id !== coachId)
        : [...prev, coachId]
    );
  };

  const handleToggleAthlete = (athleteId: string) => {
    setTargetIds(prev => 
      prev.includes(athleteId) 
        ? prev.filter(id => id !== athleteId)
        : [...prev, athleteId]
    );
  };

  const getTargetLabel = (alert: Alert) => {
    switch (alert.target_type) {
      case 'all':
        return t('admin.alerts.targetAll');
      case 'coaches':
        return t('admin.alerts.targetCoaches');
      case 'athletes':
        return t('admin.alerts.targetAthletes');
      case 'guardians':
        return t('admin.alerts.targetGuardians');
      case 'specific_coach':
        if (!alert.target_ids || alert.target_ids.length === 0) return t('admin.alerts.targetSpecificCoach');
        const coachNames = alert.target_ids
          .map(id => {
            const coach = coaches.find(c => c.coach_id === id);
            return coach ? `${coach.first_name || ''} ${coach.last_name || ''}`.trim() : id;
          })
          .filter(Boolean);
        return coachNames.length > 2 
          ? `${coachNames.slice(0, 2).join(', ')} +${coachNames.length - 2}` 
          : coachNames.join(', ');
      case 'specific_athlete':
        if (!alert.target_ids || alert.target_ids.length === 0) return t('admin.alerts.targetSpecificAthlete');
        const athleteNames = alert.target_ids
          .map(id => {
            const athlete = athletes.find(a => a.athlete_id === id);
            return athlete ? `${athlete.first_name || ''} ${athlete.last_name || ''}`.trim() : id;
          })
          .filter(Boolean);
        return athleteNames.length > 2 
          ? `${athleteNames.slice(0, 2).join(', ')} +${athleteNames.length - 2}` 
          : athleteNames.join(', ');
      default:
        return alert.target_type;
    }
  };

  const canEdit = userRole === 'admin' || userRole === 'super_admin';

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
            <Bell className="h-6 w-6 text-destructive" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg">{t('admin.alerts.title')}</CardTitle>
            <CardDescription>{t('admin.alerts.description')}</CardDescription>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-2">
          <Button
              variant={showHistory ? "secondary" : "outline"}
              size="sm"
              className="gap-2"
              onClick={() => setShowHistory(!showHistory)}
            >
              <History className="h-4 w-4" />
              {showHistory ? t('admin.alerts.hideHistory') : t('admin.alerts.showHistory')}
            </Button>
            {canEdit && (
            <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsDialogOpen(open); }}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  {t('admin.alerts.new')}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingAlert ? t('admin.alerts.edit') : t('admin.alerts.new')}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">{t('admin.alerts.subject')}</label>
                    <Input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder={t('admin.alerts.subjectPlaceholder')}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">{t('admin.alerts.message')}</label>
                    <Textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={t('admin.alerts.messagePlaceholder')}
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">{t('admin.alerts.targetLabel')}</label>
                    <Select value={targetType} onValueChange={(value) => { setTargetType(value); setTargetIds([]); }}>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder={t('admin.alerts.selectTarget')} />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        <SelectItem value="all">{t('admin.alerts.targetAll')}</SelectItem>
                        <SelectItem value="coaches">{t('admin.alerts.targetCoaches')}</SelectItem>
                        <SelectItem value="athletes">{t('admin.alerts.targetAthletes')}</SelectItem>
                        <SelectItem value="guardians">{t('admin.alerts.targetGuardians')}</SelectItem>
                        <SelectItem value="specific_coach">{t('admin.alerts.targetSpecificCoach')}</SelectItem>
                        <SelectItem value="specific_athlete">{t('admin.alerts.targetSpecificAthlete')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {targetType === 'specific_coach' && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        {t('admin.alerts.selectCoaches')} ({targetIds.length} {t('admin.alerts.selected')})
                      </label>
                      <ScrollArea className="h-48 border rounded-md p-3">
                        <div className="space-y-2">
                          {coaches.map((coach) => (
                            <div key={coach.coach_id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`coach-${coach.coach_id}`}
                                checked={targetIds.includes(coach.coach_id)}
                                onCheckedChange={() => handleToggleCoach(coach.coach_id)}
                              />
                              <label
                                htmlFor={`coach-${coach.coach_id}`}
                                className="text-sm cursor-pointer flex-1"
                              >
                                {`${coach.first_name || ''} ${coach.last_name || ''}`.trim()} ({coach.coach_id})
                              </label>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}

                  {targetType === 'specific_athlete' && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        {t('admin.alerts.selectAthletes')} ({targetIds.length} {t('admin.alerts.selected')})
                      </label>
                      <ScrollArea className="h-48 border rounded-md p-3">
                        <div className="space-y-2">
                          {athletes.map((athlete) => (
                            <div key={athlete.athlete_id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`athlete-${athlete.athlete_id}`}
                                checked={targetIds.includes(athlete.athlete_id)}
                                onCheckedChange={() => handleToggleAthlete(athlete.athlete_id)}
                              />
                              <label
                                htmlFor={`athlete-${athlete.athlete_id}`}
                                className="text-sm cursor-pointer flex-1"
                              >
                                {`${athlete.first_name || ''} ${athlete.last_name || ''}`.trim()} ({athlete.athlete_id})
                              </label>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={resetForm}>
                      {t('common.cancel')}
                    </Button>
                    <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                      {editingAlert ? t('common.save') : t('admin.alerts.create')}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4 text-muted-foreground">{t('common.loading')}</div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>{t('admin.alerts.noAlerts')}</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {alerts.filter(a => showHistory || !a.is_resolved).map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border ${
                  alert.is_resolved 
                    ? 'bg-muted/50 border-muted' 
                    : 'bg-destructive/5 border-destructive/20'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {alert.subject && (
                      <p className={`text-sm font-semibold mb-1 ${alert.is_resolved ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                        {alert.subject}
                      </p>
                    )}
                    <p className={`text-sm ${alert.is_resolved ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                      {alert.message}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <Badge variant={alert.is_resolved ? "secondary" : "destructive"} className="text-xs">
                        {alert.is_resolved ? t('admin.alerts.resolved') : t('admin.alerts.pending')}
                      </Badge>
                      <Badge variant="outline" className="text-xs gap-1">
                        <Users className="h-3 w-3" />
                        {getTargetLabel(alert)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(alert.created_at).toLocaleDateString(language === 'pt' ? 'pt-PT' : 'en-GB')}
                      </span>
                    </div>
                  </div>
                  {canEdit && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleToggleResolved(alert)}
                        title={alert.is_resolved ? t('admin.alerts.markPending') : t('admin.alerts.markResolved')}
                      >
                        {alert.is_resolved ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEdit(alert)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => deleteMutation.mutate(alert.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AlertsManagementCard;