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

interface MonthlyAttendanceSummaryProps {
  attendance: AttendanceRecord[];
}

interface MonthlySummary {
  month: string;
  year: number;
  statusCounts: Record<string, number>;
  total: number;
}

export const MonthlyAttendanceSummary = ({ attendance }: MonthlyAttendanceSummaryProps) => {
  // Group attendance by month
  const monthlySummaries = attendance.reduce((acc, record) => {
    if (!record.date) return acc;

    const statusKey = record.status && record.status.trim() ? record.status.trim() : 'Unmarked';
    const date = new Date(record.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    if (!acc[monthKey]) {
      acc[monthKey] = {
        month: monthName,
        year: date.getFullYear(),
        statusCounts: {},
        total: 0
      };
    }

    acc[monthKey].statusCounts[statusKey] = (acc[monthKey].statusCounts[statusKey] || 0) + 1;
    acc[monthKey].total += 1;

    return acc;
  }, {} as Record<string, MonthlySummary>);

  // Sort by year-month descending (most recent first)
  const sortedSummaries = Object.entries(monthlySummaries)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([_, summary]) => summary);

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
          Monthly Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sortedSummaries.map((summary, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">{summary.month}</p>
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
