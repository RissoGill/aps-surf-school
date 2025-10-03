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
  treinador: string | null;
  praia: string | null;
  notas: string | null;
  athlete_name: string;
}

const AttendanceRecords = () => {
  const { data: attendanceRecords, isLoading, error } = useQuery({
    queryKey: ["attendance-records"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("Attendance")
        .select(`
          Id,
          Date,
          status,
          treinador,
          praia,
          notas,
          Athlete_id
        `)
        .order("Date", { ascending: false });

      if (error) throw error;

      // Fetch athlete names for each record
      const recordsWithNames = await Promise.all(
        (data || []).map(async (record) => {
          if (record.Athlete_id) {
            const { data: athlete } = await supabase
              .from("Atletas")
              .select("first_name, last_name")
              .eq("Athlete_Id", record.Athlete_id)
              .maybeSingle();

            return {
              ...record,
              athlete_name: athlete
                ? `${athlete.first_name || ""} ${athlete.last_name || ""}`.trim()
                : "Unknown Athlete",
            };
          }
          return {
            ...record,
            athlete_name: "Unknown Athlete",
          };
        })
      );

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
            <CardTitle>Attendance Records</CardTitle>
            <CardDescription>
              View all attendance records with athlete information
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
                      <TableHead>Trainer</TableHead>
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
                          <TableCell>{record.treinador || "-"}</TableCell>
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
