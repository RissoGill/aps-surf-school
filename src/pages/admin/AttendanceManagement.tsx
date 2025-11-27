import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Search, Calendar, Pencil, Trash2, Eye } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import AppHeader from "@/components/shared/AppHeader";
import AppFooter from "@/components/shared/AppFooter";
import { useLanguage } from "@/i18n/LanguageContext";

interface Athlete {
  athlete_id: string;
  first_name: string;
  last_name: string;
}

interface AttendanceRecord {
  id: string;
  athlete_id: string;
  date: string;
  status: string | null;
  coach_id: string;
  shift: string | null;
  beach_location: string | null;
  notes: string | null;
  coach_name?: string;
}

const AttendanceManagement = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userRole, setUserRole] = useState<string>('admin');
  const [editForm, setEditForm] = useState({
    date: "",
    status: "",
    shift: "",
    coach_id: "",
    beach_location: "",
    notes: ""
  });

  // Session validation on mount - using legacy localStorage auth
  useEffect(() => {
    const adminSessionStr = localStorage.getItem('adminSession');
    if (!adminSessionStr) {
      toast({ title: t('login.sessionExpired'), variant: "destructive" });
      navigate("/login/administration");
      return;
    }

    try {
      const adminSession = JSON.parse(adminSessionStr);
      setUserRole(adminSession.role || 'admin');
    } catch (error) {
      console.error('Error parsing admin session:', error);
      toast({ title: t('login.sessionExpired'), variant: "destructive" });
      navigate("/login/administration");
    }
  }, [navigate, t, toast]);

  // Fetch all athletes
  const { data: athletes, isLoading: isLoadingAthletes } = useQuery({
    queryKey: ['athletes-search'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('atletas')
        .select('athlete_id, first_name, last_name')
        .order('first_name');
      
      if (error) throw error;
      return data as Athlete[];
    }
  });

  // Fetch all coaches for dropdown
  const { data: allCoaches } = useQuery({
    queryKey: ['all-coaches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coach')
        .select('coach_id, first_name, last_name')
        .order('first_name');
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch attendance records for selected athlete
  const { data: attendanceRecords, isLoading: isLoadingAttendance } = useQuery({
    queryKey: ['athlete-attendance', selectedAthlete?.athlete_id],
    queryFn: async () => {
      if (!selectedAthlete) return [];

      const [attendanceRes, coachesRes] = await Promise.all([
        supabase
          .from('attendance')
          .select('*')
          .eq('athlete_id', selectedAthlete.athlete_id)
          .order('date', { ascending: false }),
        supabase
          .from('coach')
          .select('coach_id, first_name, last_name')
      ]);

      if (attendanceRes.error) throw attendanceRes.error;
      if (coachesRes.error) throw coachesRes.error;

      // Create coach name map
      const coachMap = new Map(
        (coachesRes.data || []).map(c => [
          String(c.coach_id || '').trim().toUpperCase(),
          `${c.first_name || ''} ${c.last_name || ''}`.trim()
        ])
      );

      // Map records with coach names and filter by valid statuses
      const validStatuses = ['Present', 'Absent', 'Justified'];
      const records = (attendanceRes.data || [])
        .filter(record => record.status && validStatuses.includes(record.status))
        .map(record => {
          const coachKey = String(record.coach_id || '').trim().toUpperCase();
          return {
            ...record,
            coach_name: record.coach_id ? (coachMap.get(coachKey) || `Coach ${record.coach_id}`) : 'Not assigned'
          } as AttendanceRecord;
        });

      return records;
    },
    enabled: !!selectedAthlete
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const res = await fetch('https://bzzzecvzoahauqrhkvds.functions.supabase.co/functions/v1/attendance-admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, updates })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update attendance');
      }
    },
    onSuccess: () => {
      // Invalidate all relevant caches across dashboards
      queryClient.invalidateQueries({ queryKey: ['athlete-attendance'] });
      if (selectedAthlete?.athlete_id) {
        queryClient.invalidateQueries({ queryKey: ['attendance', selectedAthlete.athlete_id] });
        queryClient.invalidateQueries({ queryKey: ['guardian-attendance', selectedAthlete.athlete_id] });
        queryClient.invalidateQueries({ queryKey: ['guardian-annual-attendance', selectedAthlete.athlete_id] });
        queryClient.invalidateQueries({ queryKey: ['guardian-media', selectedAthlete.athlete_id] });
      }
      queryClient.invalidateQueries({ queryKey: ['admin-athletes-attendance'] });
      toast({ title: t('admin.attendanceManagement.success'), description: t('admin.attendanceManagement.recordUpdated') });
      setEditDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ 
        title: t('admin.attendanceManagement.error'), 
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch('https://bzzzecvzoahauqrhkvds.functions.supabase.co/functions/v1/attendance-admin', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to delete attendance');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['athlete-attendance'] });
      if (selectedAthlete?.athlete_id) {
        queryClient.invalidateQueries({ queryKey: ['attendance', selectedAthlete.athlete_id] });
        queryClient.invalidateQueries({ queryKey: ['guardian-attendance', selectedAthlete.athlete_id] });
        queryClient.invalidateQueries({ queryKey: ['guardian-annual-attendance', selectedAthlete.athlete_id] });
        queryClient.invalidateQueries({ queryKey: ['guardian-media', selectedAthlete.athlete_id] });
      }
      queryClient.invalidateQueries({ queryKey: ['admin-athletes-attendance'] });
      toast({ title: t('admin.attendanceManagement.success'), description: t('admin.attendanceManagement.recordDeleted') });
      setDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ 
        title: t('admin.attendanceManagement.error'), 
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Filter athletes based on search
  const filteredAthletes = athletes?.filter(athlete => 
    `${athlete.first_name} ${athlete.last_name}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  ) || [];

  const handleAthleteSelect = (athlete: Athlete) => {
    setSelectedAthlete(athlete);
    setSearchTerm(`${athlete.first_name} ${athlete.last_name}`);
  };

  const handleRowDoubleClick = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setViewDialogOpen(true);
  };

  const handleView = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setViewDialogOpen(true);
  };

  const handleEdit = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setEditForm({
      date: record.date,
      status: record.status || "",
      shift: record.shift || "",
      coach_id: record.coach_id || "",
      beach_location: record.beach_location || "",
      notes: record.notes || ""
    });
    setEditDialogOpen(true);
  };

  const handleDelete = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setDeleteDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!selectedRecord) return;

    // Build updates and keep ID consistent with new date if it changed
    const updates: any = { ...editForm };
    if (editForm.date && editForm.date !== selectedRecord.date) {
      updates.id = `${selectedRecord.athlete_id}-${editForm.date}`;
    }

    updateMutation.mutate({
      id: selectedRecord.id,
      updates
    });
  };

  const handleConfirmDelete = () => {
    if (!selectedRecord) return;
    deleteMutation.mutate(selectedRecord.id);
  };

  return (
    <div className="min-h-screen bg-gradient-surface">
      <AppHeader title={t('admin.attendanceManagement.title')} showBack backTo="/dashboard/administration" />
      
      <main className="mobile-container py-6">
        <Card className="shadow-soft mb-6">
          <CardHeader>
            <CardTitle className="text-title text-2xl font-bold flex items-center gap-2">
              <Calendar className="h-6 w-6 text-primary" />
              {t('admin.attendanceManagement.athleteSearch')}
            </CardTitle>
            <CardDescription>{t('admin.attendanceManagement.searchDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('admin.attendanceManagement.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              
              {/* Search Results Dropdown */}
              {searchTerm && !selectedAthlete && filteredAthletes.length > 0 && (
                <Card className="absolute z-10 w-full mt-1 max-h-60 overflow-y-auto">
                  <CardContent className="p-2">
                    {filteredAthletes.map((athlete) => (
                      <Button
                        key={athlete.athlete_id}
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => handleAthleteSelect(athlete)}
                      >
                        {athlete.first_name} {athlete.last_name}
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Clear Selection */}
            {selectedAthlete && (
              <div className="flex items-center justify-between bg-muted p-3 rounded-lg">
                <div>
                  <p className="font-medium">{t('admin.attendanceManagement.selectedAthlete')}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedAthlete.first_name} {selectedAthlete.last_name}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedAthlete(null);
                    setSearchTerm("");
                  }}
                >
                  {t('admin.attendanceManagement.clear')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attendance Records Table */}
        {selectedAthlete && (
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-title">{t('admin.attendanceManagement.attendanceRecords')}</CardTitle>
              <CardDescription>
                {t('admin.attendanceManagement.doubleClickHint')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingAttendance ? (
                <div className="text-center py-8 text-muted-foreground">{t('admin.attendanceManagement.loadingRecords')}</div>
              ) : !attendanceRecords?.length ? (
                <div className="text-center py-8 text-muted-foreground">{t('admin.attendanceManagement.noRecordsFound')}</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('admin.attendanceManagement.date')}</TableHead>
                        <TableHead>{t('admin.attendanceManagement.coach')}</TableHead>
                        <TableHead>{t('admin.attendanceManagement.status')}</TableHead>
                        <TableHead>{t('admin.attendanceManagement.shift')}</TableHead>
                        <TableHead>{t('admin.attendanceManagement.beach')}</TableHead>
                        <TableHead>{t('admin.attendanceManagement.notes')}</TableHead>
                        <TableHead className="text-right">{t('admin.attendanceManagement.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendanceRecords.map((record) => (
                        <TableRow 
                          key={record.id}
                          onDoubleClick={() => handleRowDoubleClick(record)}
                          className="cursor-pointer hover:bg-muted/50"
                        >
                          <TableCell>{record.date ? new Date(record.date).toLocaleDateString() : '-'}</TableCell>
                          <TableCell>{record.coach_name}</TableCell>
                          <TableCell>
                            {record.status ? (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                record.status.toLowerCase() === 'present' 
                                  ? 'bg-success/10 text-success'
                                  : record.status.toLowerCase() === 'absent'
                                  ? 'bg-destructive/10 text-destructive'
                                  : 'bg-warning/10 text-warning'
                              }`}>
                                {record.status}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-xs">-</span>
                            )}
                          </TableCell>
                          <TableCell>{record.shift || '-'}</TableCell>
                          <TableCell>{record.beach_location || '-'}</TableCell>
                          <TableCell className="max-w-xs truncate">{record.notes || '-'}</TableCell>
                          <TableCell className="text-right">
                            {userRole !== 'reports_viewer' && (
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(record);
                                  }}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(record);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>

      <AppFooter />

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-title">Attendance Record Details</DialogTitle>
            <DialogDescription>
              View and manage attendance record
            </DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div>
                <Label className="text-title">Date</Label>
                <p className="font-medium">
                  {selectedRecord.date ? new Date(selectedRecord.date).toLocaleDateString() : '-'}
                </p>
              </div>
              <div>
                <Label className="text-title">Coach</Label>
                <p className="font-medium">{selectedRecord.coach_name}</p>
              </div>
              <div>
                <Label className="text-title">Status</Label>
                <p className="font-medium">{selectedRecord.status || '-'}</p>
              </div>
              <div>
                <Label className="text-title">Shift</Label>
                <p className="font-medium">{selectedRecord.shift || '-'}</p>
              </div>
              <div>
                <Label className="text-title">Beach Location</Label>
                <p className="font-medium">{selectedRecord.beach_location || '-'}</p>
              </div>
              <div>
                <Label className="text-title">Notes</Label>
                <p className="font-medium">{selectedRecord.notes || '-'}</p>
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setViewDialogOpen(false)}
            >
              Close
            </Button>
            <Button
              variant="outline"
              onClick={() => handleEdit(selectedRecord!)}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleDelete(selectedRecord!)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-title">Edit Attendance Record</DialogTitle>
            <DialogDescription>
              Update the attendance details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="date" className="text-title">Date</Label>
              <Input
                id="date"
                type="date"
                value={editForm.date}
                onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="status" className="text-title">Status</Label>
              <Select value={editForm.status} onValueChange={(value) => setEditForm({ ...editForm, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Present">Present</SelectItem>
                  <SelectItem value="Absent">Absent</SelectItem>
                  <SelectItem value="Justified">Justified</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="shift" className="text-title">Shift</Label>
              <Select value={editForm.shift} onValueChange={(value) => setEditForm({ ...editForm, shift: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select shift" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Morning">Morning</SelectItem>
                  <SelectItem value="Afternoon">Afternoon</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="coach" className="text-title">Coach</Label>
              <Select value={editForm.coach_id} onValueChange={(value) => setEditForm({ ...editForm, coach_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select coach" />
                </SelectTrigger>
                <SelectContent>
                  {allCoaches?.map((coach) => (
                    <SelectItem key={coach.coach_id} value={coach.coach_id}>
                      {coach.first_name} {coach.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="beach" className="text-title">Beach Location</Label>
              <Input
                id="beach"
                value={editForm.beach_location}
                onChange={(e) => setEditForm({ ...editForm, beach_location: e.target.value })}
                placeholder="e.g., Carcavelos"
              />
            </div>
            <div>
              <Label htmlFor="notes" className="text-title">Notes</Label>
              <Textarea
                id="notes"
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder="Add any additional notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Attendance Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this attendance record for{' '}
              {selectedRecord?.date ? new Date(selectedRecord.date).toLocaleDateString() : ''}?
              This action cannot be undone and will be reflected in athlete and guardian dashboards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AttendanceManagement;
