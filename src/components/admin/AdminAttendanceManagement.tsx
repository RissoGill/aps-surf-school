import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface AttendanceRecord {
  id: string;
  athlete_id: string;
  date: string;
  status: string;
  coach_id: string;
  beach_location: string | null;
  notes: string | null;
  athleteName?: string;
  coachName?: string;
}

export const AdminAttendanceManagement = () => {
  const [editRecord, setEditRecord] = useState<AttendanceRecord | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<AttendanceRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  // Fetch attendance records with athlete and coach names
  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ['admin-attendance-all'],
    queryFn: async () => {
      const [attendanceRes, athletesRes, coachesRes] = await Promise.all([
        supabase.from('attendance').select('*').order('date', { ascending: false }),
        supabase.from('atletas').select('athlete_id, first_name, last_name'),
        supabase.from('coach').select('coach_id, first_name, last_name')
      ]);

      if (attendanceRes.error) throw attendanceRes.error;
      if (athletesRes.error) throw athletesRes.error;
      if (coachesRes.error) throw coachesRes.error;

      // Create maps for athlete and coach names
      const athleteMap = new Map(
        athletesRes.data?.map(a => [a.athlete_id, `${a.first_name} ${a.last_name}`])
      );
      const coachMap = new Map(
        coachesRes.data?.map(c => [c.coach_id, `${c.first_name} ${c.last_name}`])
      );

      // Enrich attendance records with names
      return attendanceRes.data?.map(record => ({
        ...record,
        athleteName: athleteMap.get(record.athlete_id) || record.athlete_id,
        coachName: coachMap.get(record.coach_id) || record.coach_id
      })) || [];
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (record: AttendanceRecord) => {
      const { error } = await supabase
        .from('attendance')
        .update({
          date: record.date,
          status: record.status,
          beach_location: record.beach_location,
          notes: record.notes
        })
        .eq('id', record.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-attendance-all'] });
      toast({ title: "Success", description: "Attendance record updated successfully" });
      setEditRecord(null);
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: `Failed to update record: ${error.message}`,
        variant: "destructive" 
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Get the attendance record before deleting to check if we need to decrement tokens
      const { data: attendanceRecord } = await supabase
        .from('attendance')
        .select('athlete_id')
        .eq('id', id)
        .single();

      const { error } = await supabase
        .from('attendance')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // If athlete has Pack plan, decrement used_tokens
      if (attendanceRecord?.athlete_id) {
        const { data: athleteData } = await supabase
          .from('atletas')
          .select('plan_type')
          .eq('athlete_id', attendanceRecord.athlete_id)
          .single();

        if (athleteData?.plan_type === 'Pack') {
          const { data: packData } = await supabase
            .from('packs')
            .select('*')
            .eq('athlete_id', attendanceRecord.athlete_id)
            .eq('active', true)
            .order('purchase_date', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (packData && parseInt(packData.used_tokens || '0') > 0) {
            const newUsedTokens = (parseInt(packData.used_tokens || '0') - 1).toString();
            await supabase
              .from('packs')
              .update({ used_tokens: newUsedTokens })
              .eq('id', packData.id);
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-attendance-all'] });
      toast({ title: "Success", description: "Attendance record deleted successfully" });
      setDeleteRecord(null);
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: `Failed to delete record: ${error.message}`,
        variant: "destructive" 
      });
    }
  });

  const filteredRecords = attendanceData?.filter(record => 
    record.athleteName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.coachName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.date?.includes(searchTerm)
  );

  return (
    <>
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Attendance Records Management</CardTitle>
          <CardDescription>Update or delete attendance records from any coach</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Search by athlete, coach, or date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
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
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No attendance records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRecords?.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                        <TableCell>{record.athleteName}</TableCell>
                        <TableCell>{record.coachName}</TableCell>
                        <TableCell>
                          <span className={`capitalize ${
                            record.status === 'Present' ? 'text-success' :
                            record.status === 'Absent' ? 'text-destructive' :
                            'text-warning'
                          }`}>
                            {record.status}
                          </span>
                        </TableCell>
                        <TableCell>{record.beach_location || '-'}</TableCell>
                        <TableCell className="max-w-xs truncate">{record.notes || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditRecord(record)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setDeleteRecord(record)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editRecord} onOpenChange={() => setEditRecord(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Attendance Record</DialogTitle>
            <DialogDescription>
              Update attendance details for {editRecord?.athleteName}
            </DialogDescription>
          </DialogHeader>
          
          {editRecord && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Date</label>
                <Input
                  type="date"
                  value={editRecord.date}
                  onChange={(e) => setEditRecord({ ...editRecord, date: e.target.value })}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={editRecord.status}
                  onValueChange={(value) => setEditRecord({ ...editRecord, status: value })}
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
                <label className="text-sm font-medium">Beach Location</label>
                <Input
                  value={editRecord.beach_location || ''}
                  onChange={(e) => setEditRecord({ ...editRecord, beach_location: e.target.value })}
                  placeholder="Enter beach location"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  value={editRecord.notes || ''}
                  onChange={(e) => setEditRecord({ ...editRecord, notes: e.target.value })}
                  placeholder="Enter notes"
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRecord(null)}>
              Cancel
            </Button>
            <Button 
              onClick={() => editRecord && updateMutation.mutate(editRecord)}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteRecord} onOpenChange={() => setDeleteRecord(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Attendance Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this attendance record for {deleteRecord?.athleteName} on {deleteRecord?.date ? new Date(deleteRecord.date).toLocaleDateString() : ''}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteRecord && deleteMutation.mutate(deleteRecord.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
