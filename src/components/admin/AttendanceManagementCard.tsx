import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Trash2, Calendar } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface AttendanceRecord {
  id: string;
  athlete_id: string;
  date: string;
  status: string | null;
  coach_id: string;
  beach_location: string | null;
  notes: string | null;
  athlete_name?: string;
  coach_name?: string;
}

export function AttendanceManagementCard() {
  const queryClient = useQueryClient();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [editForm, setEditForm] = useState({
    date: "",
    status: "",
    beach_location: "",
    notes: ""
  });

  // Fetch attendance records with athlete and coach names
  const { data: attendanceRecords, isLoading } = useQuery({
    queryKey: ['admin-attendance-records'],
    queryFn: async () => {
      const [attendanceRes, athletesRes, coachesRes] = await Promise.all([
        supabase.from('attendance').select('*').order('date', { ascending: false }),
        supabase.from('atletas').select('athlete_id, first_name, last_name'),
        supabase.from('coach').select('coach_id, first_name, last_name')
      ]);

      if (attendanceRes.error) throw attendanceRes.error;
      if (athletesRes.error) throw athletesRes.error;
      if (coachesRes.error) throw coachesRes.error;

      console.log('Raw attendance records:', attendanceRes.data?.length);
      console.log('October records:', attendanceRes.data?.filter(r => r.date?.startsWith('2025-10')).length);

      // Create lookup maps (normalized)
      const athleteMap = new Map(
        (athletesRes.data || []).map(a => [
          String(a.athlete_id || '').trim().toUpperCase(),
          `${a.first_name || ''} ${a.last_name || ''}`.trim()
        ])
      );
      const coachMap = new Map(
        (coachesRes.data || []).map(c => [
          String(c.coach_id || '').trim().toUpperCase(),
          [c.first_name, c.last_name].filter(Boolean).join(' ').trim() || c.first_name || 'Unknown Coach'
        ])
      );

      // Map all records (no date/status filtering)
      const allRecords = (attendanceRes.data || []).map(record => {
        const athleteKey = String(record.athlete_id || '').trim().toUpperCase();
        const coachKey = String(record.coach_id || '').trim().toUpperCase();
        return {
          ...record,
          athlete_name: athleteMap.get(athleteKey) || record.athlete_id || 'Unknown',
          coach_name: record.coach_id ? (coachMap.get(coachKey) || `Coach ${record.coach_id}`) : 'Not assigned'
        } as any;
      });

      return allRecords;
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { error } = await supabase
        .from('attendance')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-attendance-records'] });
      toast({ title: "Success", description: "Attendance record updated successfully" });
      setEditDialogOpen(false);
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('attendance')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-attendance-records'] });
      toast({ title: "Success", description: "Attendance record deleted successfully" });
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleEdit = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setEditForm({
      date: record.date,
      status: record.status,
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
    updateMutation.mutate({
      id: selectedRecord.id,
      updates: editForm
    });
  };

  const handleConfirmDelete = () => {
    if (!selectedRecord) return;
    deleteMutation.mutate(selectedRecord.id);
  };

  return (
    <>
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            Attendance Management
          </CardTitle>
          <CardDescription>View, edit, and delete attendance records from all coaches</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading attendance records...</div>
          ) : !attendanceRecords?.length ? (
            <div className="text-center py-8 text-muted-foreground">No attendance records found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Athlete</TableHead>
                    <TableHead>Coach</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Beach</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{record.date ? new Date(record.date).toLocaleDateString() : '-'}</TableCell>
                      <TableCell>{record.athlete_name}</TableCell>
                      <TableCell>{record.coach_name || '-'}</TableCell>
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
                      <TableCell>{record.beach_location || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(record)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(record)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Attendance Record</DialogTitle>
            <DialogDescription>
              Update the attendance details for {selectedRecord?.athlete_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={editForm.date}
                onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
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
              <Label htmlFor="beach">Beach Location</Label>
              <Input
                id="beach"
                value={editForm.beach_location}
                onChange={(e) => setEditForm({ ...editForm, beach_location: e.target.value })}
                placeholder="e.g., Carcavelos"
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
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
              Are you sure you want to delete the attendance record for {selectedRecord?.athlete_name} on{' '}
              {selectedRecord?.date ? new Date(selectedRecord.date).toLocaleDateString() : ''}?
              This action cannot be undone.
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
    </>
  );
}