import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { User, ChevronDown, ChevronRight, Calendar, Sun, Moon, Edit, Trash2, UserPlus, Users, MapPin } from "lucide-react";

interface Athlete {
  athlete_id: string;
  first_name: string | null;
  last_name: string | null;
  is_active: boolean | null;
}

interface AttendanceRecord {
  id: string;
  athlete_id: string;
  athlete_name: string;
  date: string;
  shift: string | null;
  status: string | null;
  beach_location: string | null;
  notes: string | null;
  coach_id: string;
}

interface CoachTrainingManagementProps {
  userRole: string | null;
  athletes: Athlete[];
}

const CoachTrainingManagement = ({ userRole, athletes }: CoachTrainingManagementProps) => {
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();

  // State
  const [selectedCoach, setSelectedCoach] = useState<string>("");
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());

  // Dialogs
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addAthleteDialogOpen, setAddAthleteDialogOpen] = useState(false);

  // Selected data
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [selectedSession, setSelectedSession] = useState<{ date: string; shift: string; coachId: string } | null>(null);

  // Edit form state
  const [editStatus, setEditStatus] = useState<string>("Present");
  const [editBeach, setEditBeach] = useState<string>("");
  const [editNotes, setEditNotes] = useState<string>("");
  const [editShift, setEditShift] = useState<string>("Morning");

  // Add athlete state
  const [searchAthlete, setSearchAthlete] = useState<string>("");
  const [selectedAthleteToAdd, setSelectedAthleteToAdd] = useState<string>("");

  // Fetch coaches
  const { data: coaches } = useQuery({
    queryKey: ['admin-coaches-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coach')
        .select('coach_id, first_name, last_name')
        .order('first_name');
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch attendance for selected coach
  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ['admin-coach-attendance-detail', selectedCoach],
    enabled: !!selectedCoach,
    queryFn: async () => {
      // Find coach_id from selected coach name
      const coach = coaches?.find(c => 
        `${c.first_name || ''} ${c.last_name || ''}`.trim() === selectedCoach
      );
      
      if (!coach) return { sessions: {}, coachId: '' };

      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('coach_id', coach.coach_id)
        .order('date', { ascending: false });

      if (error) throw error;

      // Group by month -> session (date + shift) -> athletes
      const sessions: Record<string, Record<string, AttendanceRecord[]>> = {};

      (data || []).forEach((record: any) => {
        if (!record.date) return;

        const yearMonth = record.date.slice(0, 7);
        const sessionKey = `${record.date}_${record.shift || 'unknown'}`;
        
        const athleteData = athletes.find(a => a.athlete_id === record.athlete_id);
        const athleteName = athleteData 
          ? `${athleteData.first_name || ''} ${athleteData.last_name || ''}`.trim() || record.athlete_id
          : record.athlete_id;

        if (!sessions[yearMonth]) {
          sessions[yearMonth] = {};
        }
        if (!sessions[yearMonth][sessionKey]) {
          sessions[yearMonth][sessionKey] = [];
        }

        sessions[yearMonth][sessionKey].push({
          id: record.id,
          athlete_id: record.athlete_id,
          athlete_name: athleteName,
          date: record.date,
          shift: record.shift,
          status: record.status,
          beach_location: record.beach_location,
          notes: record.notes,
          coach_id: record.coach_id
        });
      });

      return { sessions, coachId: coach.coach_id };
    }
  });

  // Mutations
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const adminSession = localStorage.getItem('adminSession');
      const adminId = adminSession ? JSON.parse(adminSession).id || 'admin' : 'admin';
      
      const { data, error } = await supabase.functions.invoke('attendance-admin', {
        method: 'PATCH',
        body: { 
          id, 
          updates, 
          role: 'admin', 
          userId: adminId 
        }
      });
      
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coach-attendance-detail'] });
      queryClient.invalidateQueries({ queryKey: ['admin-athletes-attendance'] });
      toast({ title: t('common.success'), description: t('admin.coachAttendance.updateSuccess') });
      setEditDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const adminSession = localStorage.getItem('adminSession');
      const adminId = adminSession ? JSON.parse(adminSession).id || 'admin' : 'admin';
      
      const { data, error } = await supabase.functions.invoke('attendance-admin', {
        method: 'DELETE',
        body: { 
          id, 
          role: 'admin', 
          userId: adminId
        }
      });
      
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coach-attendance-detail'] });
      queryClient.invalidateQueries({ queryKey: ['admin-athletes-attendance'] });
      toast({ title: t('common.success'), description: t('admin.coachAttendance.deleteSuccess') });
      setDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    }
  });

  const addMutation = useMutation({
    mutationFn: async ({ athleteId, date, shift, coachId }: { athleteId: string; date: string; shift: string; coachId: string }) => {
      const adminSession = localStorage.getItem('adminSession');
      const adminId = adminSession ? JSON.parse(adminSession).id || 'admin' : 'admin';
      const newId = `${athleteId}-${date}-${shift || 'unknown'}`;
      
      const { data, error } = await supabase.functions.invoke('attendance-admin', {
        method: 'POST',
        body: {
          id: newId,
          athlete_id: athleteId,
          date,
          shift,
          coach_id: coachId,
          status: 'Present',
          role: 'admin',
          userId: adminId
        }
      });
      
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.duplicate) throw new Error(t('admin.coachAttendance.athleteAlreadyInTraining'));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coach-attendance-detail'] });
      queryClient.invalidateQueries({ queryKey: ['admin-athletes-attendance'] });
      toast({ title: t('common.success'), description: t('admin.coachAttendance.addSuccess') });
      setAddAthleteDialogOpen(false);
      setSelectedAthleteToAdd("");
      setSearchAthlete("");
    },
    onError: (error: any) => {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    }
  });

  // Build coach list with names
  const coachList = useMemo(() => {
    if (!coaches) return [];
    return coaches.map(c => ({
      id: c.coach_id,
      name: `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.coach_id
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [coaches]);

  // Toggle functions
  const toggleMonth = (month: string) => {
    setExpandedMonths(prev => {
      const next = new Set(prev);
      if (next.has(month)) next.delete(month);
      else next.add(month);
      return next;
    });
  };

  const toggleSession = (sessionKey: string) => {
    setExpandedSessions(prev => {
      const next = new Set(prev);
      if (next.has(sessionKey)) next.delete(sessionKey);
      else next.add(sessionKey);
      return next;
    });
  };

  // Open edit dialog
  const handleEdit = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setEditStatus(record.status || 'Present');
    setEditBeach(record.beach_location || '');
    setEditNotes(record.notes || '');
    setEditShift(record.shift || 'Morning');
    setEditDialogOpen(true);
  };

  // Open delete dialog
  const handleDelete = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setDeleteDialogOpen(true);
  };

  // Open add athlete dialog
  const handleAddAthlete = (date: string, shift: string, coachId: string) => {
    setSelectedSession({ date, shift, coachId });
    setAddAthleteDialogOpen(true);
  };

  // Submit edit
  const submitEdit = () => {
    if (!selectedRecord) return;
    updateMutation.mutate({
      id: selectedRecord.id,
      updates: {
        status: editStatus,
        beach_location: editBeach || null,
        notes: editNotes || null,
        shift: editShift
      }
    });
  };

  // Submit delete
  const submitDelete = () => {
    if (!selectedRecord) return;
    deleteMutation.mutate(selectedRecord.id);
  };

  // Submit add athlete
  const submitAddAthlete = () => {
    if (!selectedSession || !selectedAthleteToAdd) return;
    addMutation.mutate({
      athleteId: selectedAthleteToAdd,
      date: selectedSession.date,
      shift: selectedSession.shift,
      coachId: selectedSession.coachId
    });
  };

  // Filter athletes for add dialog
  const filteredAthletes = useMemo(() => {
    if (!selectedSession || !attendanceData?.sessions) return [];
    
    const sessionKey = `${selectedSession.date}_${selectedSession.shift}`;
    const existingAthleteIds = new Set(
      attendanceData.sessions[selectedSession.date.slice(0, 7)]?.[sessionKey]?.map(r => r.athlete_id) || []
    );
    
    return athletes
      .filter(a => a.is_active !== false)
      .filter(a => !existingAthleteIds.has(a.athlete_id))
      .filter(a => {
        if (!searchAthlete) return true;
        const name = `${a.first_name || ''} ${a.last_name || ''}`.toLowerCase();
        return name.includes(searchAthlete.toLowerCase());
      })
      .sort((a, b) => {
        const nameA = `${a.first_name || ''} ${a.last_name || ''}`;
        const nameB = `${b.first_name || ''} ${b.last_name || ''}`;
        return nameA.localeCompare(nameB);
      });
  }, [athletes, selectedSession, attendanceData, searchAthlete]);

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === 'pt' ? 'pt-PT' : 'en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  // Format month for display
  const formatMonth = (yearMonth: string) => {
    const [year, month] = yearMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString(language === 'pt' ? 'pt-PT' : 'en-GB', {
      month: 'long',
      year: 'numeric'
    });
  };

  const isReportsViewer = userRole === 'reports_viewer';

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
              <User className="h-6 w-6 text-secondary" />
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-1">{t('admin.coachAttendance.title')}</h4>
              <p className="text-sm text-muted-foreground">{t('admin.coachAttendance.subtitle')}</p>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <Select value={selectedCoach} onValueChange={setSelectedCoach}>
            <SelectTrigger className="w-full md:w-64 bg-background">
              <SelectValue placeholder={t('admin.coachAttendance.selectCoach')} />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              {coachList.map((coach) => (
                <SelectItem key={coach.id} value={coach.name}>
                  {coach.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      {selectedCoach && (
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : !attendanceData?.sessions || Object.keys(attendanceData.sessions).length === 0 ? (
            <p className="text-center text-muted-foreground py-8">{t('admin.coachAttendance.noTrainings')}</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(attendanceData.sessions)
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([yearMonth, sessions]) => {
                  const isMonthExpanded = expandedMonths.has(yearMonth);
                  const totalSessions = Object.keys(sessions).length;
                  const totalAthletes = Object.values(sessions).reduce((sum, s) => sum + s.length, 0);

                  return (
                    <Collapsible key={yearMonth} open={isMonthExpanded} onOpenChange={() => toggleMonth(yearMonth)}>
                      <CollapsibleTrigger className="w-full">
                        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                          <div className="flex items-center gap-3">
                            {isMonthExpanded ? (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            )}
                            <Calendar className="h-5 w-5 text-primary" />
                            <span className="font-medium capitalize">{formatMonth(yearMonth)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{totalSessions} {t('admin.coachAttendance.trainingSessions')}</Badge>
                            <Badge variant="outline">{totalAthletes} {t('admin.coachAttendance.athletes')}</Badge>
                          </div>
                        </div>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <div className="ml-4 mt-2 space-y-2">
                          {Object.entries(sessions)
                            .sort(([a], [b]) => b.localeCompare(a))
                            .map(([sessionKey, records]) => {
                              const [date, shift] = sessionKey.split('_');
                              const isSessionExpanded = expandedSessions.has(sessionKey);
                              const isMorning = shift === 'Morning';
                              const beachLocation = records[0]?.beach_location;

                              return (
                                <Collapsible key={sessionKey} open={isSessionExpanded} onOpenChange={() => toggleSession(sessionKey)}>
                                  <CollapsibleTrigger className="w-full">
                                    <div className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                                      isMorning 
                                        ? 'bg-amber-50 border-amber-200 hover:bg-amber-100 dark:bg-amber-950/20 dark:border-amber-800' 
                                        : 'bg-blue-50 border-blue-200 hover:bg-blue-100 dark:bg-blue-950/20 dark:border-blue-800'
                                    }`}>
                                      <div className="flex items-center gap-3">
                                        {isSessionExpanded ? (
                                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                        )}
                                        {isMorning ? (
                                          <Sun className="h-4 w-4 text-amber-600" />
                                        ) : (
                                          <Moon className="h-4 w-4 text-blue-600" />
                                        )}
                                        <span className="font-medium">{formatDate(date)}</span>
                                        <Badge variant={isMorning ? "default" : "secondary"} className={
                                          isMorning 
                                            ? 'bg-amber-500 hover:bg-amber-600' 
                                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                                        }>
                                          {shift === 'Morning' ? t('admin.coachAttendance.morning') : t('admin.coachAttendance.afternoon')}
                                        </Badge>
                                        {beachLocation && (
                                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            {beachLocation}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="flex items-center gap-1">
                                          <Users className="h-3 w-3" />
                                          {records.length}
                                        </Badge>
                                        {!isReportsViewer && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleAddAthlete(date, shift, attendanceData.coachId);
                                            }}
                                            className="h-8 px-2"
                                          >
                                            <UserPlus className="h-4 w-4" />
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  </CollapsibleTrigger>

                                  <CollapsibleContent>
                                    <div className="ml-8 mt-2 space-y-1">
                                      {records.map((record) => (
                                        <div 
                                          key={record.id}
                                          className="flex items-center justify-between p-2 bg-background rounded border"
                                        >
                                          <div className="flex items-center gap-3">
                                            <span className="font-medium">{record.athlete_name}</span>
                                            <Badge variant={
                                              record.status === 'Present' ? 'default' :
                                              record.status === 'Absent' ? 'destructive' :
                                              'secondary'
                                            } className="text-xs">
                                              {record.status === 'Present' ? t('admin.coachAttendance.present') :
                                               record.status === 'Absent' ? t('admin.coachAttendance.absent') :
                                               t('admin.coachAttendance.justified')}
                                            </Badge>
                                            {record.notes && (
                                              <span className="text-xs text-muted-foreground italic">
                                                {record.notes.length > 30 ? record.notes.slice(0, 30) + '...' : record.notes}
                                              </span>
                                            )}
                                          </div>
                                          {!isReportsViewer && (
                                            <div className="flex items-center gap-1">
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEdit(record)}
                                                className="h-8 w-8 p-0"
                                              >
                                                <Edit className="h-4 w-4" />
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(record)}
                                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                              >
                                                <Trash2 className="h-4 w-4" />
                                              </Button>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </CollapsibleContent>
                                </Collapsible>
                              );
                            })}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
            </div>
          )}
        </CardContent>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-background">
          <DialogHeader>
            <DialogTitle>{t('admin.coachAttendance.editAttendance')}</DialogTitle>
            <DialogDescription>
              {selectedRecord?.athlete_name} - {selectedRecord?.date && formatDate(selectedRecord.date)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('admin.coachAttendance.status')}</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="Present">{t('admin.coachAttendance.present')}</SelectItem>
                  <SelectItem value="Absent">{t('admin.coachAttendance.absent')}</SelectItem>
                  <SelectItem value="Justified">{t('admin.coachAttendance.justified')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('admin.coachAttendance.shift')}</Label>
              <Select value={editShift} onValueChange={setEditShift}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="Morning">{t('admin.coachAttendance.morning')}</SelectItem>
                  <SelectItem value="Afternoon">{t('admin.coachAttendance.afternoon')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('admin.coachAttendance.beach')}</Label>
              <Input
                value={editBeach}
                onChange={(e) => setEditBeach(e.target.value)}
                placeholder={t('admin.coachAttendance.beachPlaceholder')}
              />
            </div>
            <div>
              <Label>{t('admin.coachAttendance.notes')}</Label>
              <Input
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder={t('admin.coachAttendance.notesPlaceholder')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={submitEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? t('common.loading') : t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.coachAttendance.confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.coachAttendance.deleteDescription')
                .replace('{athleteName}', selectedRecord?.athlete_name || '')
                .replace('{date}', selectedRecord?.date ? formatDate(selectedRecord.date) : '')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={submitDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? t('common.loading') : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Athlete Dialog */}
      <Dialog open={addAthleteDialogOpen} onOpenChange={setAddAthleteDialogOpen}>
        <DialogContent className="bg-background">
          <DialogHeader>
            <DialogTitle>{t('admin.coachAttendance.addAthlete')}</DialogTitle>
            <DialogDescription>
              {selectedSession?.date && formatDate(selectedSession.date)} - {
                selectedSession?.shift === 'Morning' 
                  ? t('admin.coachAttendance.morning') 
                  : t('admin.coachAttendance.afternoon')
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('admin.coachAttendance.searchAthlete')}</Label>
              <Input
                value={searchAthlete}
                onChange={(e) => setSearchAthlete(e.target.value)}
                placeholder={t('admin.coachAttendance.searchPlaceholder')}
              />
            </div>
            <div>
              <Label>{t('admin.coachAttendance.selectAthlete')}</Label>
              <Select value={selectedAthleteToAdd} onValueChange={setSelectedAthleteToAdd}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder={t('admin.coachAttendance.selectAthletePlaceholder')} />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50 max-h-60">
                  {filteredAthletes.length === 0 ? (
                    <div className="p-2 text-center text-muted-foreground text-sm">
                      {t('admin.coachAttendance.noAthletesAvailable')}
                    </div>
                  ) : (
                    filteredAthletes.map((athlete) => (
                      <SelectItem key={athlete.athlete_id} value={athlete.athlete_id}>
                        {`${athlete.first_name || ''} ${athlete.last_name || ''}`.trim() || athlete.athlete_id}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddAthleteDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={submitAddAthlete} 
              disabled={!selectedAthleteToAdd || addMutation.isPending}
            >
              {addMutation.isPending ? t('common.loading') : t('admin.coachAttendance.addToTraining')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default CoachTrainingManagement;
