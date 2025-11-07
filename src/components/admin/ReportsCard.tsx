import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Download, Eye, FileText } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import surfHeroImage from "@/assets/surf-hero.jpg";

type ReportType = "financial" | "personal" | "overall" | "attendance";

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
          const { data: payments, error: paymentsError } = await supabase
            .from("payments")
            .select(`
              *,
              atletas:athlete_id (first_name, last_name, surf_level)
            `)
            .gte("payment_date", startStr)
            .lte("payment_date", endStr)
            .order("payment_date", { ascending: false });
          
          if (paymentsError) throw paymentsError;
          data = payments || [];
          break;

        case "attendance":
          const { data: attendance, error: attendanceError } = await supabase
            .from("attendance")
            .select(`
              *,
              atletas:athlete_id (first_name, last_name, surf_level),
              coach:coach_id (first_name, last_name)
            `)
            .gte("date", startStr)
            .lte("date", endStr)
            .order("date", { ascending: false });
          
          if (attendanceError) throw attendanceError;
          data = attendance || [];
          break;

        case "personal":
          const { data: athletes, error: athletesError } = await supabase
            .from("atletas")
            .select("*")
            .eq("is_active", true);
          
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
    
    if (type === "financial") {
      tableRows = (data as any[]).map(payment => `
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;">${payment.athlete_id}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${payment.atletas?.first_name || ""} ${payment.atletas?.last_name || ""}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${payment.payment_date || ""}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">€${payment.amount_paid || 0}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">€${payment.amount_due || 0}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${payment.status || ""}</td>
        </tr>
      `).join("");
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
    }

    const tableHeaders = 
      type === "financial" ? "<tr><th>Athlete ID</th><th>Name</th><th>Date</th><th>Paid</th><th>Due</th><th>Status</th></tr>" :
      type === "attendance" ? "<tr><th>Date</th><th>Athlete</th><th>Coach</th><th>Status</th><th>Location</th></tr>" :
      type === "personal" ? "<tr><th>Athlete ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Level</th></tr>" :
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
            border-bottom: 2px solid #0ea5e9;
            padding-bottom: 20px;
          }
          .logo {
            max-width: 200px;
            margin-bottom: 20px;
          }
          h1 {
            color: #0ea5e9;
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
            background-color: #0ea5e9;
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
          <img src="${surfHeroImage}" alt="Surf School Logo" class="logo" />
          <h1>${title}</h1>
          <div class="meta">
            <p>Period: ${format(startDate, "PPP")} - ${format(endDate, "PPP")}</p>
            <p>Generated: ${format(generatedAt, "PPP 'at' p")}</p>
          </div>
        </div>
        
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
            <CardTitle className="text-2xl font-bold">Generate Reports</CardTitle>
            <CardDescription>Create financial, personal, overall, and attendance reports</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Report Type</label>
            <Select value={reportType} onValueChange={(value) => setReportType(value as ReportType)}>
              <SelectTrigger>
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="financial">Financial Report</SelectItem>
                <SelectItem value="personal">Personal/Athletes Report</SelectItem>
                <SelectItem value="overall">Overall Summary</SelectItem>
                <SelectItem value="attendance">Attendance Report</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Date Range</label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "flex-1 justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "flex-1 justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "End date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <Button 
          onClick={generateReport} 
          disabled={!reportType || !startDate || !endDate || isGenerating}
          className="w-full"
        >
          {isGenerating ? "Generating..." : "Generate Report"}
        </Button>

        {reportData && (
          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={viewReport} variant="outline" className="flex-1">
              <Eye className="mr-2 h-4 w-4" />
              View Report
            </Button>
            <Button onClick={downloadReport} variant="default" className="flex-1">
              <Download className="mr-2 h-4 w-4" />
              Download Report
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
