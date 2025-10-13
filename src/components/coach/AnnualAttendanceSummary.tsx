import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";

interface AttendanceRecord {
  id: string;
  date: string | null;
  status: string | null;
  trainer: string | null;
  beach_location: string | null;
  notes: string | null;
}

interface AnnualAttendanceSummaryProps {
  attendance: AttendanceRecord[];
}

interface AnnualSummary {
  year: number;
  statusCounts: Record<string, number>;
  total: number;
}

export const AnnualAttendanceSummary = ({ attendance }: AnnualAttendanceSummaryProps) => {
  // Group attendance by year - keep original status for display, but count separately
  const annualSummaries = attendance.reduce((acc, record) => {
    if (!record.date) return acc;

    const originalStatus = record.status && record.status.trim() ? record.status.trim() : 'Unmarked';
    const date = new Date(record.date);
    const year = date.getFullYear();

    if (!acc[year]) {
      acc[year] = {
        year,
        statusCounts: {},
        total: 0
      };
    }

    // Count original status for display
    acc[year].statusCounts[originalStatus] = (acc[year].statusCounts[originalStatus] || 0) + 1;
    
    // Also add to Present count if status is Absent (for statistics)
    if (originalStatus === 'Absent') {
      acc[year].statusCounts['Present'] = (acc[year].statusCounts['Present'] || 0) + 1;
    }
    
    acc[year].total += 1;

    return acc;
  }, {} as Record<number, AnnualSummary>);

  // Sort by year descending (most recent first)
  const sortedSummaries = Object.values(annualSummaries)
    .sort((a, b) => b.year - a.year);

  if (sortedSummaries.length === 0) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Present": return "bg-success/10 text-success";
      case "Absent": return "bg-destructive/10 text-destructive";
      case "Justified": return "bg-warning/10 text-warning";
      default: return "bg-secondary/10 text-secondary-foreground";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "Present": return "Present";
      case "Absent": return "Not Present";
      case "Justified": return "Justified";
      default: return status;
    }
  };

  return (
    <Card className="shadow-soft">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Annual Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sortedSummaries.map((summary, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">{summary.year}</p>
              <Badge variant="outline" className="text-xs">
                {summary.total} total
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(summary.statusCounts)
                .filter(([status]) => ["Present", "Absent", "Justified"].includes(status))
                .map(([status, count]) => (
                  <Badge 
                    key={status} 
                    className={`${getStatusColor(status)} text-xs`}
                    variant="secondary"
                  >
                    {getStatusLabel(status)}: {count}
                  </Badge>
                ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
