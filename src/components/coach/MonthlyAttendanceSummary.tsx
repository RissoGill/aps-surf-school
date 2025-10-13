import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ChevronDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";

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
    .map(([key, summary]) => ({ key, ...summary }));

  // State for selected month - default to most recent
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(
    sortedSummaries[0]?.key || ''
  );
  const [isExpanded, setIsExpanded] = useState(false); // Only show details when expanded

  const handleMonthChange = (value: string) => {
    setSelectedMonthKey(value);
    setIsExpanded(false); // Collapse when changing month
  };

  if (sortedSummaries.length === 0) {
    return null;
  }

  // Find the selected month summary
  const selectedSummary = sortedSummaries.find(s => s.key === selectedMonthKey) || sortedSummaries[0];

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
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Monthly Summary
          </CardTitle>
          <Select value={selectedMonthKey} onValueChange={handleMonthChange}>
            <SelectTrigger className="w-[180px] h-8 text-sm">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent className="bg-card z-50">
              {sortedSummaries.map((summary) => (
                <SelectItem key={summary.key} value={summary.key}>
                  {summary.month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <div className="space-y-2">
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full flex items-center justify-between p-0 h-auto hover:bg-transparent"
              >
                <div className="flex items-center justify-between w-full">
                  <p className="text-sm font-medium text-foreground">{selectedSummary.month}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {selectedSummary.total} total
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {isExpanded ? 'Hide details' : 'View details'}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        isExpanded ? 'transform rotate-180' : ''
                      }`}
                    />
                  </div>
                </div>
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <div className="flex flex-wrap gap-2 pt-2">
                {Object.entries(selectedSummary.statusCounts)
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
            </CollapsibleContent>
          </div>
        </Collapsible>
      </CardContent>
    </Card>
  );
};
