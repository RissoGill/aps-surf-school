import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/i18n/LanguageContext";
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
import html2pdf from "html2pdf.js";
import { escapeHtml } from "@/utils/htmlSanitize";

type ReportType = "financial" | "personal" | "overall" | "attendance" | "coach_payments" | "pro_account";

interface ReportData {
  title: string;
  type: ReportType;
  startDate: Date;
  endDate: Date;
  generatedAt: Date;
  data: any[];
}

export const ReportsCard = () => {
  const { t } = useLanguage();
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
  const [proAthletes, setProAthletes] = useState<any[]>([]);

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
    
    const fetchProAthletes = async () => {
      const { data, error } = await supabase
        .from("atletas")
        .select("athlete_id, first_name, last_name, pro_prior_balance, pro_prior_balance_date")
        .eq("is_active", true)
        .ilike("surf_level", "competition")
        .order("first_name");
      
      if (!error && data) {
        setProAthletes(data);
      }
    };

    fetchAthletes();
    fetchCoaches();
    fetchProAthletes();
  }, []);

  const generateReport = async () => {
    if (!reportType || !startDate || !endDate) {
      toast.error(t('shared.reports.selectTypeAndDates'));
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
              atletas:athlete_id (first_name, last_name, surf_level, is_active)
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
          let filteredPayments = (payments || []).filter((p: any) => p.atletas?.is_active === true);
          
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
              atletas:athlete_id (first_name, last_name, surf_level, is_active),
              coach:coach_id (first_name, last_name)
            `)
            .gte("date", startStr)
            .lte("date", endStr)
            .in("status", ["Present", "Present ", "Absent", "Justified"]); // Filter only valid attendance statuses
          
          if (selectedAthlete && selectedAthlete !== "all") {
            attendanceQuery = attendanceQuery.eq("athlete_id", selectedAthlete);
          }
          
          const { data: attendance, error: attendanceError } = await attendanceQuery
            .order("date", { ascending: false })
            .limit(10000); // Increase limit to handle large date ranges with all athletes
          
          if (attendanceError) throw attendanceError;
          
          // Filter out records where athlete data is missing, incomplete, or inactive
          const filteredAttendance = (attendance || []).filter((att: any) => {
            const firstName = att.atletas?.first_name;
            const isActive = att.atletas?.is_active;
            // Only include records where athlete is active and has at least a first name
            return isActive === true && firstName && firstName.trim() !== '';
          });
          
          data = filteredAttendance;
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
          // First get active athlete IDs
          const { data: activeAthletes } = await supabase
            .from("atletas")
            .select("athlete_id")
            .eq("is_active", true);
          
          const activeAthleteIds = (activeAthletes || []).map(a => a.athlete_id);

          const [paymentsRes, attendanceRes, athletesRes] = await Promise.all([
            supabase.from("payments").select("*").gte("payment_date", startStr).lte("payment_date", endStr).in("athlete_id", activeAthleteIds),
            supabase.from("attendance").select("*").gte("date", startStr).lte("date", endStr).in("status", ["Present", "Present ", "Absent", "Justified"]).in("athlete_id", activeAthleteIds).limit(10000),
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

        case "pro_account":
          // Fetch competition athletes
          let proAthletesQuery = supabase
            .from("atletas")
            .select("athlete_id, first_name, last_name, pro_prior_balance, pro_prior_balance_date")
            .eq("is_active", true)
            .ilike("surf_level", "competition");
          
          if (selectedAthlete && selectedAthlete !== "all") {
            proAthletesQuery = proAthletesQuery.eq("athlete_id", selectedAthlete);
          }
          
          const { data: proAthletesData, error: proAthletesError } = await proAthletesQuery.order("first_name");
          if (proAthletesError) throw proAthletesError;
          
          const proAthleteIds = (proAthletesData || []).map(a => a.athlete_id);
          
          let proEntries: any[] = [];
          if (proAthleteIds.length > 0) {
            const { data: proEntriesData, error: proEntriesError } = await supabase
              .from("pro_account_entries")
              .select("*")
              .in("athlete_id", proAthleteIds)
              .gte("entry_date", startStr)
              .lte("entry_date", endStr)
              .order("entry_date", { ascending: true });
            
            if (proEntriesError) throw proEntriesError;
            proEntries = proEntriesData || [];
          }
          
          data = [{
            athletes: proAthletesData || [],
            entries: proEntries
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

      toast.success(t('shared.reports.success'));
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error(t('shared.reports.error'));
    } finally {
      setIsGenerating(false);
    }
  };

  const viewReport = async () => {
    if (!reportData) return;

    // Open new tab immediately to prevent popup blockers
    const viewer = window.open('', '_blank');

    if (!viewer) {
      toast.error(t('shared.reports.popupBlocked'));
      return;
    }

    try {
      const htmlContent = generateReportHTML(reportData);
      viewer.document.open();
      viewer.document.write(htmlContent);
      viewer.document.close();
    } catch (error) {
      console.error('Error opening report:', error);
      viewer.close();
      toast.error(t('shared.reports.failedToOpen'));
    }
  };
  const downloadReport = async () => {
    if (!reportData) return;

    const htmlContent = generateReportHTML(reportData);
    const element = document.createElement('div');
    element.innerHTML = htmlContent;

    const opt = {
      margin: 10,
      filename: `${reportData.type}_report_${format(reportData.generatedAt, "yyyy-MM-dd")}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };

    try {
      await html2pdf().from(element).set(opt).save();
      toast.success(t('shared.reports.pdfDownloaded'));
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error(t('shared.reports.failedToDownload'));
    }
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
                <li>${escapeHtml(level)}: ${stats.count} athletes, €${stats.outstanding.toFixed(2)} outstanding</li>
              `).join('')}
            </ul>
          </div>
        </div>
      `;
      
      tableRows = (data as any[]).map(payment => {
        const displayDate = escapeHtml(payment.payment_date || `${payment.month} ${payment.year}`);
        const outstanding = (parseFloat(payment.amount_due || 0) - parseFloat(payment.amount_paid || 0)).toFixed(2);
        return `
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;">${escapeHtml(payment.athlete_id)}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${escapeHtml(payment.atletas?.first_name)} ${escapeHtml(payment.atletas?.last_name)}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${escapeHtml(payment.atletas?.surf_level) || "N/A"}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${displayDate}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">€${payment.amount_paid || 0}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">€${payment.amount_due || 0}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">€${outstanding}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${escapeHtml(payment.status)}</td>
        </tr>
      `}).join("");
    } else if (type === "attendance") {
      const validAttendance = (data as any[]).filter(att => 
        att.atletas?.first_name && att.atletas?.first_name.trim() !== ''
      );
      tableRows = validAttendance.map(att => `
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;">${escapeHtml(att.date)}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${escapeHtml(att.atletas?.first_name)} ${escapeHtml(att.atletas?.last_name)}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${escapeHtml(att.coach?.first_name)} ${escapeHtml(att.coach?.last_name)}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${escapeHtml(att.status)}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${escapeHtml(att.beach_location)}</td>
        </tr>
      `).join("");
    } else if (type === "personal") {
      tableRows = (data as any[]).map(athlete => `
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;">${escapeHtml(athlete.athlete_id)}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${escapeHtml(athlete.first_name)} ${escapeHtml(athlete.last_name)}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${escapeHtml(athlete.email)}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${escapeHtml(athlete.phone)}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${escapeHtml(athlete.surf_level)}</td>
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
          <td style="border: 1px solid #ddd; padding: 8px;">${escapeHtml(payment.coach?.first_name)} ${escapeHtml(payment.coach?.last_name)}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${format(new Date(payment.payment_date), "PPP")}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${escapeHtml(payment.payment_month)}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${payment.payment_year}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">€${Number(payment.amount).toFixed(2)}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${escapeHtml(payment.notes) || "-"}</td>
        </tr>
      `).join("");
      tableRows += `
        <tr style="background-color: #f0f0f0; font-weight: bold;">
          <td colspan="4" style="border: 1px solid #ddd; padding: 8px; text-align: right;">Total:</td>
          <td style="border: 1px solid #ddd; padding: 8px;">€${totalAmount.toFixed(2)}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">-</td>
        </tr>
      `;
    } else if (type === "pro_account") {
      const proData = (data as any[])[0] || { athletes: [], entries: [] };
      const athletesList = proData.athletes || [];
      const entries = proData.entries || [];
      
      let grandTotalBalance = 0;
      
      tableRows = "";
      
      athletesList.forEach((athlete: any) => {
        const athleteEntries = entries.filter((e: any) => e.athlete_id === athlete.athlete_id);
        const priorBalance = Number(athlete.pro_prior_balance || 0);
        
        const totalCredits = athleteEntries
          .filter((e: any) => e.type === "prize_money" || e.type === "other")
          .reduce((sum: number, e: any) => sum + Number(e.amount), 0);
        const totalDebits = athleteEntries
          .filter((e: any) => e.type === "expense")
          .reduce((sum: number, e: any) => sum + Number(e.amount), 0);
        const athleteBalance = priorBalance + totalCredits - totalDebits;
        grandTotalBalance += athleteBalance;
        
        // Athlete header row
        tableRows += `
          <tr style="background-color: #e8f5f3;">
            <td colspan="5" style="border: 1px solid #ddd; padding: 10px; font-weight: bold; color: #31A896;">
              ${escapeHtml(athlete.first_name)} ${escapeHtml(athlete.last_name)} (${escapeHtml(athlete.athlete_id)})
            </td>
            <td style="border: 1px solid #ddd; padding: 10px; font-weight: bold; text-align: right;">
              Prior Balance: €${priorBalance.toFixed(2)}
            </td>
          </tr>
        `;
        
        if (athleteEntries.length === 0) {
          tableRows += `
            <tr>
              <td colspan="6" style="border: 1px solid #ddd; padding: 8px; text-align: center; color: #999; font-style: italic;">
                No entries in this period
              </td>
            </tr>
          `;
        } else {
          athleteEntries.forEach((entry: any) => {
            const isCredit = entry.type === "prize_money" || entry.type === "other";
            const amountColor = isCredit ? "color: #16a34a;" : "color: #dc2626;";
            const sign = isCredit ? "+" : "-";
            tableRows += `
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${escapeHtml(entry.entry_date)}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${isCredit ? "Credit" : "Expense"}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${escapeHtml(entry.category)}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${escapeHtml(entry.description) || "-"}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${escapeHtml(entry.invoice_number) || "-"}</td>
                <td style="border: 1px solid #ddd; padding: 8px; ${amountColor} font-weight: bold; text-align: right;">
                  ${sign}€${Number(entry.amount).toFixed(2)}
                </td>
              </tr>
            `;
          });
        }
        
        // Athlete subtotal row
        const balanceColor = athleteBalance >= 0 ? "color: #16a34a;" : "color: #dc2626;";
        tableRows += `
          <tr style="background-color: #f0f0f0; font-weight: bold;">
            <td colspan="3" style="border: 1px solid #ddd; padding: 8px; text-align: right;">
              Credits: €${totalCredits.toFixed(2)}
            </td>
            <td colspan="2" style="border: 1px solid #ddd; padding: 8px; text-align: right;">
              Expenses: €${totalDebits.toFixed(2)}
            </td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right; ${balanceColor}">
              Balance: €${athleteBalance.toFixed(2)}
            </td>
          </tr>
          <tr><td colspan="6" style="border: none; padding: 4px;"></td></tr>
        `;
      });
      
      // Grand total
      const grandColor = grandTotalBalance >= 0 ? "color: #16a34a;" : "color: #dc2626;";
      summarySection = `
        <div style="background-color: #f5f5f5; padding: 15px; margin-bottom: 20px; border-radius: 5px;">
          <h2 style="color: #31A896; margin-top: 0;">Summary</h2>
          <p><strong>Athletes:</strong> ${athletesList.length}</p>
          <p><strong>Total Entries:</strong> ${entries.length}</p>
          <p style="${grandColor}"><strong>Grand Total Balance:</strong> €${grandTotalBalance.toFixed(2)}</p>
        </div>
      `;
    }

    const tableHeaders = 
      type === "financial" ? "<tr><th>Athlete ID</th><th>Name</th><th>Surf Level</th><th>Date</th><th>Paid</th><th>Due</th><th>Outstanding</th><th>Status</th></tr>" :
      type === "attendance" ? "<tr><th>Date</th><th>Athlete</th><th>Coach</th><th>Status</th><th>Location</th></tr>" :
      type === "personal" ? "<tr><th>Athlete ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Level</th></tr>" :
      type === "coach_payments" ? "<tr><th>Coach Name</th><th>Payment Date</th><th>Month</th><th>Year</th><th>Amount</th><th>Notes</th></tr>" :
      type === "pro_account" ? "<tr><th>Date</th><th>Type</th><th>Category</th><th>Description</th><th>Invoice</th><th>Amount</th></tr>" :
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
            <h4 className="font-medium text-foreground mb-1">{t('shared.reports.title')}</h4>
            <p className="text-sm text-muted-foreground">{t('shared.reports.description')}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('shared.reports.reportType')}</label>
            <Select value={reportType} onValueChange={(value) => {
              setReportType(value as ReportType);
              setSelectedAthlete("");
              setSelectedCoach("");
            }}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder={t('shared.reports.selectReportType')} />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="financial">{t('shared.reports.financial')}</SelectItem>
                <SelectItem value="personal">{t('shared.reports.personal')}</SelectItem>
                <SelectItem value="overall">{t('shared.reports.overall')}</SelectItem>
                <SelectItem value="attendance">{t('shared.reports.attendance')}</SelectItem>
                <SelectItem value="coach_payments">{t('shared.reports.coachPayments')}</SelectItem>
                <SelectItem value="pro_account">{t('shared.reports.proAccount')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(reportType === "financial" || reportType === "attendance" || reportType === "personal") && (
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('shared.reports.athlete')} ({t('shared.reports.optional')})</label>
              <Select value={selectedAthlete} onValueChange={setSelectedAthlete}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder={t('shared.reports.allAthletes')} />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50 max-h-[300px]">
                  <SelectItem value="all">{t('shared.reports.allAthletes')}</SelectItem>
                  {athletes.map((athlete) => (
                    <SelectItem key={athlete.athlete_id} value={athlete.athlete_id}>
                      {athlete.first_name} {athlete.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {reportType === "pro_account" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('shared.reports.athlete')} ({t('shared.reports.optional')})</label>
              <Select value={selectedAthlete} onValueChange={setSelectedAthlete}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder={t('shared.reports.allAthletes')} />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50 max-h-[300px]">
                  <SelectItem value="all">{t('shared.reports.allAthletes')}</SelectItem>
                  {proAthletes.map((athlete) => (
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
                    {t('shared.reports.outstandingOnly')}
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="currentMonth" 
                    checked={filterByCurrentMonth}
                    onCheckedChange={(checked) => setFilterByCurrentMonth(checked as boolean)}
                  />
                  <label htmlFor="currentMonth" className="text-sm font-medium cursor-pointer">
                    {t('shared.reports.currentMonth')}
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('shared.reports.surfLevel')} ({t('shared.reports.optional')})</label>
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
              <label className="text-sm font-medium">{t('shared.reports.coach')} ({t('shared.reports.optional')})</label>
              <Select value={selectedCoach} onValueChange={setSelectedCoach}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder={t('shared.reports.allCoaches')} />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50 max-h-[300px]">
                  <SelectItem value="all">{t('shared.reports.allCoaches')}</SelectItem>
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
            <label className="text-sm font-medium">{t('shared.reports.startDate')}</label>
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
                  {startDate ? format(startDate, "PPP") : t('shared.reports.pickStartDate')}
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
            <label className="text-sm font-medium">{t('shared.reports.endDate')}</label>
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
                  {endDate ? format(endDate, "PPP") : t('shared.reports.pickEndDate')}
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
          {isGenerating ? t('shared.reports.generating') : t('shared.reports.generate')}
        </Button>

        {reportData && (
          <div className="flex flex-col gap-2 pt-4 border-t">
            <Button onClick={downloadReport} variant="default" className="w-full">
              <Download className="mr-2 h-4 w-4" />
              {t('shared.reports.downloadPDF')}
            </Button>
            <Button onClick={viewReport} variant="outline" className="w-full">
              <Eye className="mr-2 h-4 w-4" />
              {t('shared.reports.viewPDF')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
