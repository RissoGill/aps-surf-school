import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronDown, ChevronUp, User, MapPin } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

interface AttendanceRecord {
  id: string;
  date: string | null;
  status: string | null;
  coach: string | null;
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
  const { t } = useLanguage();
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [isExpanded, setIsExpanded] = useState(false);

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

  // Set default selected year to most recent
  if (!selectedYear && sortedSummaries.length > 0) {
    setSelectedYear(sortedSummaries[0].year.toString());
  }

  // Filter attendance records for selected year
  const selectedYearRecords = attendance.filter(record => {
    if (!record.date || !selectedYear) return false;
    const recordDate = new Date(record.date);
    return recordDate.getFullYear() === parseInt(selectedYear);
  }).sort((a, b) => {
    if (!a.date || !b.date) return 0;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    setIsExpanded(false);
  };

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
      case "Present": return t('coach.annualSummary.present');
      case "Absent": return t('coach.annualSummary.notPresent');
      case "Justified": return t('coach.annualSummary.justified');
      default: return status;
    }
  };

  return (
    <Card className="shadow-soft">
        <CardHeader>
          <h4 className="font-medium text-foreground">
            {t('coach.annualSummary.title')}
          </h4>
        </CardHeader>
      <CardContent className="space-y-3">
        {sortedSummaries.map((summary, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">{summary.year}</p>
              <Badge variant="default" className="text-xs font-normal bg-primary">
                {summary.total} {t('coach.annualSummary.total')}
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center font-normal">
              <div>
                <p className="text-2xl font-normal text-success">
                  {summary.statusCounts['Present'] || 0}
                </p>
                <p className="text-xs text-muted-foreground">{t('coach.annualSummary.present')}</p>
              </div>
              <div>
                <p className="text-2xl font-normal text-warning">
                  {summary.statusCounts['Justified'] || 0}
                </p>
                <p className="text-xs text-muted-foreground">{t('coach.annualSummary.justified')}</p>
              </div>
              <div>
                <p className="text-2xl font-normal text-destructive">
                  {summary.statusCounts['Absent'] || 0}
                </p>
                <p className="text-xs text-muted-foreground">{t('coach.annualSummary.notPresent')}</p>
              </div>
            </div>
          </div>
        ))}

        {/* Year selector and details */}
        <div className="pt-4 border-t space-y-3">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">{t('coach.annualSummary.viewDetailsFor')}</label>
            <Select value={selectedYear} onValueChange={handleYearChange}>
              <SelectTrigger className="w-32 bg-background">
                <SelectValue placeholder={t('coach.annualSummary.selectYear')} />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                {sortedSummaries.map((summary) => (
                  <SelectItem key={summary.year} value={summary.year.toString()}>
                    {summary.year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedYear && (
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-2" />
                      {t('coach.annualSummary.hideRecords')}
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-2" />
                      {t('coach.annualSummary.showRecords').replace('{count}', selectedYearRecords.length.toString())}
                    </>
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 pt-3">
                {selectedYearRecords.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-4">
                    {t('coach.annualSummary.noRecords').replace('{year}', selectedYear)}
                  </p>
                ) : (
                  selectedYearRecords.map((record) => (
                    <div key={record.id} className="border border-border rounded-lg p-3 space-y-2 bg-card">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{record.date || 'N/A'}</p>
                        <Badge className={getStatusColor(record.status || '')}>
                          {getStatusLabel(record.status || 'Unknown')}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">{t('coach.annualSummary.coach')}</span> 
                          <span className="font-medium">{record.coach || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">{t('coach.annualSummary.beach')}</span> 
                          <span className="font-medium">{record.beach_location || 'N/A'}</span>
                        </div>
                        {record.notes && (
                          <div className="col-span-2 mt-1 p-2 bg-muted/50 rounded">
                            <span className="font-medium">{t('coach.annualSummary.notes')}</span> {record.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
