import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AppHeader from "@/components/shared/AppHeader";
import SponsorBanner from "@/components/shared/SponsorBanner";
import AppFooter from "@/components/shared/AppFooter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AttendanceRecord {
  Id: string;
  Date: string | null;
  status: string | null;
  coach_name: string | null;
  praia: string | null;
  notas: string | null;
  athlete_name: string;
}

const AttendanceRecords = () => {
  const { data: attendanceRecords, isLoading, error } = useQuery({
    queryKey: ["attendance-records"],
    queryFn: async () => {
      const [attendanceRes, athletesRes, coachesRes] = await Promise.all([
        supabase
          .from("attendance")
          .select(`
            id,
            date,
            status,
            coach_id,
            beach_location,
            notes,
            athlete_id
          `)
          .order("date", { ascending: false }),
        supabase
          .from("atletas")
          .select("athlete_id, first_name, last_name"),
        supabase
          .from("coach")
          .select("coach_id, first_name")
      ]);

      if (attendanceRes.error) throw attendanceRes.error;
      if (athletesRes.error) {
        console.warn("Error fetching athletes:", athletesRes.error.message);
      }
      if (coachesRes.error) {
        console.warn("Error fetching coaches:", coachesRes.error.message);
      }

      const athletes = athletesRes.data || [];
      const coaches = coachesRes.data || [];
      
      const nameById = new Map(
        athletes.map((a: any) => [
          a.athlete_id,
          ("" + `${a.first_name || ""} ${a.last_name || ""}`.trim()) || "Unknown Athlete",
        ])
      );
      
      const coachNameById = new Map(
        coaches.map((c: any) => [c.coach_id, c.first_name || "Unknown Coach"])
      );

      // Filter: only records with status and from September 2025 onwards
      const filteredAttendance = (attendanceRes.data || []).filter((record: any) => {
        // Must have a non-empty status
        const hasStatus = record.status && String(record.status).trim().length > 0;
        if (!hasStatus) return false;
        
        if (!record.date) return false;
        const recordDate = new Date(record.date);
        const septemberCutoff = new Date('2025-09-01');
        return recordDate >= septemberCutoff;
      });

      const recordsWithNames = filteredAttendance.map((record: any) => ({
        Id: record.id,
        Date: record.date,
        status: record.status,
        coach_name: record.coach_id ? coachNameById.get(record.coach_id) || "Unknown Coach" : "Unknown Coach",
        praia: record.beach_location,
        notas: record.notes,
        athlete_name: record.athlete_id ? nameById.get(record.athlete_id) || "Unknown Athlete" : "Unknown Athlete",
      }));

      return recordsWithNames as AttendanceRecord[];
    },
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader title="Attendance Records" showBack backTo="/dashboard/coach" />
      <SponsorBanner />
      
      <main className="flex-1 mobile-container py-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Attendance Records</CardTitle>
            <CardDescription>
              View all attendance records with athlete information (from September 2025 onwards)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="text-destructive text-center py-4">
                Error loading attendance records: {error.message}
              </div>
            )}

            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Athlete</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Coach</TableHead>
                      <TableHead>Beach</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceRecords && attendanceRecords.length > 0 ? (
                      attendanceRecords.map((record) => (
                        <TableRow key={record.Id}>
                          <TableCell className="font-medium">
                            {record.athlete_name}
                          </TableCell>
                          <TableCell>{record.Date || "-"}</TableCell>
                          <TableCell>{record.status || "-"}</TableCell>
                          <TableCell>{record.coach_name || "-"}</TableCell>
                          <TableCell>{record.praia || "-"}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {record.notas || "-"}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No attendance records found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <AppFooter />
    </div>
  );
};

export default AttendanceRecords;
