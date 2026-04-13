import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface AttendanceRecord {
  id: string;
  athlete_id: string;
  date: string;
  status: string | null;
  coach_id: string;
  beach_location: string | null;
  notes: string | null;
  photos: string | null;
  videos: string | null;
}

interface AttendanceWithNames extends AttendanceRecord {
  athlete_name: string;
  coach_name: string;
}

export const AttendanceManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingRecord, setEditingRecord] = useState<AttendanceWithNames | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Fetch attendance records with athlete and coach names
  const { data: attendanceRecords, isLoading } = useQuery({
    queryKey: ['admin-attendance-records'],
    queryFn: async () => {
      const [attendanceRes, athletesRes, coachesRes] = await Promise.all([
        supabase.from('attendance').select('*').order('date', { ascending: false }).limit(10000),
        supabase.from('atletas').select('athlete_id, first_name, last_name'),
        supabase.from('coach').select('coach_id, first_name, last_name')
      ]);

      if (attendanceRes.error) throw attendanceRes.error;
      if (athletesRes.error) throw athletesRes.error;
      if (coachesRes.error) throw coachesRes.error;

      const athleteMap = new Map(
        (athletesRes.data || []).map(a => [a.athlete_id, `${a.first_name} ${a.last_name}`])
      );
      const coachMap = new Map(
        (coachesRes.data || []).map(c => [c.coach_id, `${c.first_name} ${c.last_name}`])
      );

      return (attendanceRes.data || []).map(record => ({
        ...record,
        athlete_name: athleteMap.get(record.athlete_id) || 'Unknown',
        coach_name: coachMap.get(record.coach_id) || 'Unknown'
      })) as AttendanceWithNames[];
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (record: AttendanceWithNames) => {
      const { data, error } = await supabase
        .from('attendance')
        .update({
          date: record.date,
          status: record.status,
          beach_location: record.beach_location,
          notes: record.notes
        })
        .eq('id', record.id);
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-attendance-records'] });
      toast({
        title: "Success",
        description: "Attendance record updated successfully",
      });
      setEditingRecord(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update record: ${error.message}`,
        variant: "destructive",
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
      toast({
        title: "Success",
        description: "Attendance record deleted successfully",
      });
      setDeleteId(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete record: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const handleUpdate = () => {
    if (editingRecord) {
      updateMutation.mutate(editingRecord);
    }
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
    }
  };

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <CardTitle>Attendance Records Management</CardTitle>
        </div>
        <CardDescription>View, edit, or delete attendance records from all coaches</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : !attendanceRecords || attendanceRecords.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No attendance records found</p>
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
                    <TableCell className="font-medium">
                      {new Date(record.date).toLocaleDateString('en-GB')}
                    </TableCell>
                    <TableCell>{record.athlete_name}</TableCell>
                    <TableCell>{record.coach_name}</TableCell>
                    <TableCell>
                      {record.status ? (
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          record.status.toLowerCase() === 'present' ? 'bg-success/10 text-success' :
                          record.status.toLowerCase() === 'absent' ? 'bg-destructive/10 text-destructive' :
                          'bg-warning/10 text-warning'
                        }`}>
                          {record.status}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell>{record.beach_location || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingRecord(record)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(record.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
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

      {/* Edit Dialog */}
      <Dialog open={!!editingRecord} onOpenChange={(open) => !open && setEditingRecord(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Attendance Record</DialogTitle>
            <DialogDescription>
              Update attendance information for {editingRecord?.athlete_name}
            </DialogDescription>
          </DialogHeader>
          {editingRecord && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={editingRecord.date}
                  onChange={(e) => setEditingRecord({ ...editingRecord, date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={editingRecord.status}
                  onValueChange={(value) => setEditingRecord({ ...editingRecord, status: value })}
                >
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
                  value={editingRecord.beach_location || ''}
                  onChange={(e) => setEditingRecord({ ...editingRecord, beach_location: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={editingRecord.notes || ''}
                  onChange={(e) => setEditingRecord({ ...editingRecord, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRecord(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Updating..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the attendance record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};