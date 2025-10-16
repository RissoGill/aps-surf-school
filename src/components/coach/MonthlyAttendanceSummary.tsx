import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ChevronDown, MapPin } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";

interface AttendanceRecord {
  id: string;
  date: string | null;
  status: string | null;
  coach: string | null;
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
  // Group attendance by month - keep original status for display, but count separately
  const monthlySummaries = attendance.reduce((acc, record) => {
    if (!record.date) return acc;

    const originalStatus = record.status && record.status.trim() ? record.status.trim() : 'Unmarked';
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

    // Count original status for display
    acc[monthKey].statusCounts[originalStatus] = (acc[monthKey].statusCounts[originalStatus] || 0) + 1;
    
    // Also add to Present count if status is Absent (for statistics)
    if (originalStatus === 'Absent') {
      acc[monthKey].statusCounts['Present'] = (acc[monthKey].statusCounts['Present'] || 0) + 1;
    }
    
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
  
  // Filter attendance records for the selected month
  const selectedMonthRecords = attendance.filter(record => {
    if (!record.date) return false;
    const date = new Date(record.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    return monthKey === selectedMonthKey;
  });

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
                    <Badge variant="default" className="text-xs font-bold bg-primary">
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
              <div className="space-y-3 pt-3">
                {/* Status Summary Badges */}
                <div className="flex flex-wrap gap-2">
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
                
                {/* Attendance Records Details */}
                <div className="space-y-2">
                  {selectedMonthRecords.map((record) => {
                    const formattedDate = record.date ? new Date(record.date).toLocaleDateString('pt-PT', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    }) : '-';
                    
                    return (
                      <Card key={record.id} className="bg-accent/30">
                        <CardContent className="p-3">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Date:</span>
                              <p className="font-medium">{formattedDate}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Status:</span>
                              <p className="font-medium">{record.status || 'Not set'}</p>
                            </div>
                            {record.coach && (
                              <div>
                                <span className="text-muted-foreground">Coach:</span>
                                <p className="font-medium">{record.coach}</p>
                              </div>
                            )}
                            {record.beach_location && (
                              <div className="flex items-start gap-1">
                                <MapPin className="h-3 w-3 mt-0.5 text-muted-foreground" />
                                <div>
                                  <span className="text-muted-foreground">Beach:</span>
                                  <p className="font-medium">{record.beach_location}</p>
                                </div>
                              </div>
                            )}
                            {record.notes && (
                              <div className="col-span-2">
                                <span className="text-muted-foreground">Notes:</span>
                                <p className="font-medium">{record.notes}</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      </CardContent>
    </Card>
  );
};
