import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, Download, Eye, FileText } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import apsLogoImage from "@/assets/aps-logo.png";

type ReportType = "financial" | "personal" | "overall" | "attendance" | "coach_payments";

interface ReportData {
  title: string;
  type: ReportType;
  startDate: Date;
  endDate: Date;
  generatedAt: Date;
  data: any[];
}

export const ReportsCard = () => {
  const [reportType, setReportType] = useState<ReportType | "">("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [selectedAthlete, setSelectedAthlete] = useState<string>("");
  const [athletes, setAthletes] = useState<any[]>([]);
  const [coaches, setCoaches] = useState<any[]>([]);
  const [selectedCoach, setSelectedCoach] = useState<string>("");
  const [showOnlyOutstanding, setShowOnlyOutstanding] = useState(false);
  const [filterByCurrentMonth, setFilterByCurrentMonth] = useState(false);
  const [selectedSurfLevels, setSelectedSurfLevels] = useState<string[]>([]);

  useEffect(() => {
    const fetchAthletes = async () => {
      const { data, error } = await supabase
        .from("atletas")
        .select("athlete_id, first_name, last_name")
        .eq("is_active", true)
        .order("first_name");
      
      if (!error && data) {
        setAthletes(data);
      }
    };
    
    const fetchCoaches = async () => {
      const { data, error } = await supabase
        .from("coach")
        .select("coach_id, first_name, last_name")
        .order("first_name");
      
      if (!error && data) {
        setCoaches(data);
      }
    };
    
    fetchAthletes();
    fetchCoaches();
  }, []);

  const generateReport = async () => {
    if (!reportType || !startDate || !endDate) {
      toast.error("Please select report type and date range");
      return;
    }

    setIsGenerating(true);
    try {
      let data: any[] = [];
      const startStr = format(startDate, "yyyy-MM-dd");
      const endStr = format(endDate, "yyyy-MM-dd");

      switch (reportType) {
        case "financial":
          // Generate month/year combinations from date range
          const months = [];
          let currentDate = new Date(startDate);
          
          // If filtering by current month, only use current month
          if (filterByCurrentMonth) {
            const now = new Date();
            const monthName = format(now, "MMMM");
            const year = now.getFullYear();
            months.push({ month: monthName, year });
          } else {
            while (currentDate <= endDate) {
              const monthName = format(currentDate, "MMMM");
              const year = currentDate.getFullYear();
              months.push({ month: monthName, year });
              currentDate.setMonth(currentDate.getMonth() + 1);
            }
          }
          
          let paymentsQuery = supabase
            .from("payments")
            .select(`
              *,
              atletas:athlete_id (first_name, last_name, surf_level)
            `);
          
          // Build OR condition: match by payment_date range OR by month/year when payment_date is null
          if (filterByCurrentMonth) {
            const now = new Date();
            const currentMonth = format(now, "MMMM");
            const currentYear = now.getFullYear();
            paymentsQuery = paymentsQuery.or(
              `and(payment_date.gte.${format(now, "yyyy-MM")}-01,payment_date.lte.${format(now, "yyyy-MM")}-31),and(payment_date.is.null,month.eq.${currentMonth},year.eq.${currentYear})`
            );
          } else {
            const dateConditions = [
              `and(payment_date.gte.${startStr},payment_date.lte.${endStr})`,
              ...months.map(m => `and(payment_date.is.null,month.eq.${m.month},year.eq.${m.year})`)
            ].join(',');
            paymentsQuery = paymentsQuery.or(dateConditions);
          }
          
          if (selectedAthlete && selectedAthlete !== "all") {
            paymentsQuery = paymentsQuery.eq("athlete_id", selectedAthlete);
          }
          
          const { data: payments, error: paymentsError } = await paymentsQuery;
          
          if (paymentsError) throw paymentsError;
          
          // Filter in-memory for outstanding and surf levels
          let filteredPayments = payments || [];
          
          if (showOnlyOutstanding) {
            filteredPayments = filteredPayments.filter((p: any) => {
              const outstanding = (parseFloat(p.amount_due || 0) - parseFloat(p.amount_paid || 0));
              return outstanding > 0;
            });
          }
          
          if (selectedSurfLevels.length > 0) {
            filteredPayments = filteredPayments.filter((p: any) => {
              const surfLevel = p.atletas?.surf_level?.toLowerCase().trim();
              return selectedSurfLevels.some(level => 
                surfLevel === level.toLowerCase().trim()
              );
            });
          }
          
          data = filteredPayments;
          break;

        case "attendance":
          let attendanceQuery = supabase
            .from("attendance")
            .select(`
              *,
              atletas:athlete_id (first_name, last_name, surf_level),
              coach:coach_id (first_name, last_name)
            `)
            .gte("date", startStr)
            .lte("date", endStr);
          
          if (selectedAthlete && selectedAthlete !== "all") {
            attendanceQuery = attendanceQuery.eq("athlete_id", selectedAthlete);
          }
          
          const { data: attendance, error: attendanceError } = await attendanceQuery.order("date", { ascending: false });
          
          if (attendanceError) throw attendanceError;
          data = attendance || [];
          break;

        case "personal":
          let athletesQuery = supabase
            .from("atletas")
            .select("*")
            .eq("is_active", true);

          if (selectedAthlete && selectedAthlete !== "all") {
            athletesQuery = athletesQuery.eq("athlete_id", selectedAthlete);
          }
          
          const { data: athletes, error: athletesError } = await athletesQuery;
          
          if (athletesError) throw athletesError;
          data = athletes || [];
          break;

        case "overall":
          const [paymentsRes, attendanceRes, athletesRes] = await Promise.all([
            supabase.from("payments").select("*").gte("payment_date", startStr).lte("payment_date", endStr),
            supabase.from("attendance").select("*").gte("date", startStr).lte("date", endStr),
            supabase.from("atletas").select("*").eq("is_active", true)
          ]);

          data = [{
            payments: paymentsRes.data || [],
            attendance: attendanceRes.data || [],
            athletes: athletesRes.data || []
          }];
          break;

        case "coach_payments":
          let coachPaymentsQuery = supabase
            .from("coach_payments")
            .select(`
              *,
              coach:coach_id (first_name, last_name, email)
            `)
            .gte("payment_date", startStr)
            .lte("payment_date", endStr);
          
          if (selectedCoach && selectedCoach !== "all") {
            coachPaymentsQuery = coachPaymentsQuery.eq("coach_id", selectedCoach);
          }
          
          const { data: coachPayments, error: coachPaymentsError } = 
            await coachPaymentsQuery.order("payment_date", { ascending: false });
          
          if (coachPaymentsError) throw coachPaymentsError;
          data = coachPayments || [];
          break;
      }

      setReportData({
        title: reportType.charAt(0).toUpperCase() + reportType.slice(1) + " Report",
        type: reportType,
        startDate,
        endDate,
        generatedAt: new Date(),
        data
      });

      toast.success("Report generated successfully");
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Failed to generate report");
    } finally {
      setIsGenerating(false);
    }
  };

  const viewReport = () => {
    if (!reportData) return;

    const reportWindow = window.open("", "_blank");
    if (!reportWindow) return;

    const htmlContent = generateReportHTML(reportData);
    reportWindow.document.write(htmlContent);
    reportWindow.document.close();
  };

  const downloadReport = () => {
    if (!reportData) return;

    const htmlContent = generateReportHTML(reportData);
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportData.type}_report_${format(reportData.generatedAt, "yyyy-MM-dd")}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Report downloaded");
  };

  const generateReportHTML = (report: ReportData): string => {
    const { title, startDate, endDate, generatedAt, data, type } = report;

    let tableRows = "";
    let summarySection = "";
    
    if (type === "financial") {
      // Calculate summary statistics
      const totalOutstanding = (data as any[]).reduce((sum, p) => 
        sum + (parseFloat(p.amount_due || 0) - parseFloat(p.amount_paid || 0)), 0
      );
      const totalAthletes = data.length;
      
      // Group by surf level
      const surfLevelBreakdown = (data as any[]).reduce((acc: any, p) => {
        const level = p.atletas?.surf_level || "Unknown";
        if (!acc[level]) {
          acc[level] = { count: 0, outstanding: 0 };
        }
        acc[level].count++;
        acc[level].outstanding += (parseFloat(p.amount_due || 0) - parseFloat(p.amount_paid || 0));
        return acc;
      }, {});
      
      summarySection = `
        <div style="background-color: #f5f5f5; padding: 15px; margin-bottom: 20px; border-radius: 5px;">
          <h2 style="color: #31A896; margin-top: 0;">Summary Statistics</h2>
          <p><strong>Total Athletes:</strong> ${totalAthletes}</p>
          <p><strong>Total Outstanding:</strong> €${totalOutstanding.toFixed(2)}</p>
          <div style="margin-top: 10px;">
            <strong>Breakdown by Surf Level:</strong>
            <ul style="margin: 5px 0;">
              ${Object.entries(surfLevelBreakdown).map(([level, stats]: [string, any]) => `
                <li>${level}: ${stats.count} athletes, €${stats.outstanding.toFixed(2)} outstanding</li>
              `).join('')}
            </ul>
          </div>
        </div>
      `;
      
      tableRows = (data as any[]).map(payment => {
        const displayDate = payment.payment_date || `${payment.month} ${payment.year}`;
        const outstanding = (parseFloat(payment.amount_due || 0) - parseFloat(payment.amount_paid || 0)).toFixed(2);
        return `
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;">${payment.athlete_id}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${payment.atletas?.first_name || ""} ${payment.atletas?.last_name || ""}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${payment.atletas?.surf_level || "N/A"}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${displayDate}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">€${payment.amount_paid || 0}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">€${payment.amount_due || 0}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">€${outstanding}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${payment.status || ""}</td>
        </tr>
      `}).join("");
    } else if (type === "attendance") {
      tableRows = (data as any[]).map(att => `
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;">${att.date}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${att.atletas?.first_name || ""} ${att.atletas?.last_name || ""}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${att.coach?.first_name || ""} ${att.coach?.last_name || ""}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${att.status || ""}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${att.beach_location || ""}</td>
        </tr>
      `).join("");
    } else if (type === "personal") {
      tableRows = (data as any[]).map(athlete => `
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;">${athlete.athlete_id}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${athlete.first_name || ""} ${athlete.last_name || ""}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${athlete.email || ""}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${athlete.phone || ""}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${athlete.surf_level || ""}</td>
        </tr>
      `).join("");
    } else if (type === "overall") {
      const overallData = (data as any[])[0] || {};
      tableRows = `
        <tr><td colspan="2" style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">Financial Summary</td></tr>
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;">Total Payments</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${overallData.payments?.length || 0}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;">Total Amount Received</td>
          <td style="border: 1px solid #ddd; padding: 8px;">€${overallData.payments?.reduce((sum: number, p: any) => sum + (parseFloat(p.amount_paid) || 0), 0).toFixed(2)}</td>
        </tr>
        <tr><td colspan="2" style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">Attendance Summary</td></tr>
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;">Total Sessions</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${overallData.attendance?.length || 0}</td>
        </tr>
        <tr><td colspan="2" style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">Athletes Summary</td></tr>
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;">Active Athletes</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${overallData.athletes?.length || 0}</td>
        </tr>
      `;
    } else if (type === "coach_payments") {
      const totalAmount = (data as any[]).reduce((sum, p) => sum + Number(p.amount), 0);
      tableRows = (data as any[]).map(payment => `
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;">${payment.coach?.first_name || ""} ${payment.coach?.last_name || ""}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${format(new Date(payment.payment_date), "PPP")}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${payment.payment_month}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${payment.payment_year}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">€${Number(payment.amount).toFixed(2)}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${payment.notes || "-"}</td>
        </tr>
      `).join("");
      tableRows += `
        <tr style="background-color: #f0f0f0; font-weight: bold;">
          <td colspan="4" style="border: 1px solid #ddd; padding: 8px; text-align: right;">Total:</td>
          <td style="border: 1px solid #ddd; padding: 8px;">€${totalAmount.toFixed(2)}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">-</td>
        </tr>
      `;
    }

    const tableHeaders = 
      type === "financial" ? "<tr><th>Athlete ID</th><th>Name</th><th>Surf Level</th><th>Date</th><th>Paid</th><th>Due</th><th>Outstanding</th><th>Status</th></tr>" :
      type === "attendance" ? "<tr><th>Date</th><th>Athlete</th><th>Coach</th><th>Status</th><th>Location</th></tr>" :
      type === "personal" ? "<tr><th>Athlete ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Level</th></tr>" :
      type === "coach_payments" ? "<tr><th>Coach Name</th><th>Payment Date</th><th>Month</th><th>Year</th><th>Amount</th><th>Notes</th></tr>" :
      "";

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 40px;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #31A896;
            padding-bottom: 20px;
          }
          .logo {
            max-width: 200px;
            margin-bottom: 20px;
          }
          h1 {
            color: #31A896;
            margin: 0;
          }
          .meta {
            color: #666;
            font-size: 14px;
            margin-top: 10px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th {
            background-color: #31A896;
            color: white;
            padding: 12px;
            text-align: left;
            border: 1px solid #ddd;
          }
          td {
            padding: 8px;
            border: 1px solid #ddd;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            color: #666;
            font-size: 12px;
            border-top: 1px solid #ddd;
            padding-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="${apsLogoImage}" alt="APS Logo" class="logo" />
          <h1>${title}</h1>
          <div class="meta">
            <p>Period: ${format(startDate, "PPP")} - ${format(endDate, "PPP")}</p>
            <p>Generated: ${format(generatedAt, "PPP 'at' p")}</p>
          </div>
        </div>
        
        ${summarySection}
        
        <table>
          ${tableHeaders}
          ${tableRows}
        </table>

        <div class="footer">
          <p>© ${new Date().getFullYear()} Surf School Management System</p>
          <p>This is an automatically generated report</p>
        </div>
      </body>
      </html>
    `;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-1">Generate Reports</h4>
            <p className="text-sm text-muted-foreground">Create financial, personal, overall, attendance, and coach payments reports</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Report Type</label>
            <Select value={reportType} onValueChange={(value) => {
              setReportType(value as ReportType);
              setSelectedAthlete("");
              setSelectedCoach("");
            }}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="financial">Financial Report</SelectItem>
                <SelectItem value="personal">Personal/Athletes Report</SelectItem>
                <SelectItem value="overall">Overall Summary</SelectItem>
                <SelectItem value="attendance">Attendance Report</SelectItem>
                <SelectItem value="coach_payments">Coach Payments Report</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(reportType === "financial" || reportType === "attendance" || reportType === "personal") && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Athlete (Optional)</label>
              <Select value={selectedAthlete} onValueChange={setSelectedAthlete}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="All athletes" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50 max-h-[300px]">
                  <SelectItem value="all">All athletes</SelectItem>
                  {athletes.map((athlete) => (
                    <SelectItem key={athlete.athlete_id} value={athlete.athlete_id}>
                      {athlete.first_name} {athlete.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {reportType === "financial" && (
            <div className="space-y-4 p-4 border rounded-md bg-muted/30">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="outstanding" 
                    checked={showOnlyOutstanding}
                    onCheckedChange={(checked) => setShowOnlyOutstanding(checked as boolean)}
                  />
                  <label htmlFor="outstanding" className="text-sm font-medium cursor-pointer">
                    Show only outstanding payments
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="currentMonth" 
                    checked={filterByCurrentMonth}
                    onCheckedChange={(checked) => setFilterByCurrentMonth(checked as boolean)}
                  />
                  <label htmlFor="currentMonth" className="text-sm font-medium cursor-pointer">
                    Filter by current month only
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Filter by Surf Level (Optional)</label>
                <div className="space-y-2">
                  {['Learning', 'Pre-Competition', 'Competition'].map((level) => (
                    <div key={level} className="flex items-center space-x-2">
                      <Checkbox 
                        id={level} 
                        checked={selectedSurfLevels.includes(level)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedSurfLevels([...selectedSurfLevels, level]);
                          } else {
                            setSelectedSurfLevels(selectedSurfLevels.filter(l => l !== level));
                          }
                        }}
                      />
                      <label htmlFor={level} className="text-sm cursor-pointer">
                        {level}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {reportType === "coach_payments" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Coach (Optional)</label>
              <Select value={selectedCoach} onValueChange={setSelectedCoach}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="All coaches" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50 max-h-[300px]">
                  <SelectItem value="all">All coaches</SelectItem>
                  {coaches.map((coach) => (
                    <SelectItem key={coach.coach_id} value={coach.coach_id}>
                      {coach.first_name} {coach.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Start Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Pick start date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-popover z-50" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">End Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : "Pick end date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-popover z-50" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <Button 
          onClick={generateReport} 
          disabled={!reportType || !startDate || !endDate || isGenerating}
          variant="default"
          className="w-full"
        >
          {isGenerating ? "Generating..." : "Generate Report"}
        </Button>

        {reportData && (
          <div className="flex flex-col gap-2 pt-4 border-t">
            <Button onClick={downloadReport} variant="default" className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Download Report
            </Button>
            <Button onClick={viewReport} variant="outline" className="w-full">
              <Eye className="mr-2 h-4 w-4" />
              View Report
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
