import { useNavigate } from "react-router-dom";
import { Settings, Users, Euro, Calendar, UserPlus, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AppHeader from "@/components/shared/AppHeader";
import SponsorBanner from "@/components/shared/SponsorBanner";
import AppFooter from "@/components/shared/AppFooter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo, useEffect, useState } from "react";

const AdministrationDashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedCoach, setSelectedCoach] = useState<string>("");

  useEffect(() => {
    const channel = supabase
      .channel('admin-attendance-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-athletes-attendance'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  // Fetch payment data
  const { data: paymentsData } = useQuery({
    queryKey: ['all-payments-summary'],
    queryFn: async () => {
      const { data: paymentsRaw, error: paymentsError } = await supabase
        .from('payments')
        .select(`
          amount_paid,
          amount_due,
          payment_date,
          status,
          month,
          year,
          athlete_id
        `);
      
      if (paymentsError) throw paymentsError;
      
      // Fetch surf levels separately (no FK defined between payments and atletas)
      const { data: atletasRows } = await supabase
        .from('atletas')
        .select('athlete_id, surf_level');
      
      const levelByAthleteId: Record<string, string | null> = {};
      (atletasRows || []).forEach((a: any) => {
        const key = String(a.athlete_id || '').trim().toLowerCase();
        if (key) levelByAthleteId[key] = a?.surf_level ?? null;
      });
      
      const allPayments = (paymentsRaw || []).map((payment: any) => {
        const aid = String(payment.athlete_id || '').trim().toLowerCase();
        return {
          ...payment,
          surf_level: levelByAthleteId[aid] ?? null,
        };
      });
      
      // Get current month and year
      const now = new Date();
      const currentMonthNumber = now.getMonth() + 1; // 1-12
      const currentYear = now.getFullYear();
      const currentMonthName = now.toLocaleString('en-US', { month: 'long' });
      
      // Fetch current month total with dedicated server-filtered query
      const { data: monthRows, error: monthErr } = await supabase
        .from('payments')
        .select('amount_paid, status, month, year')
        .eq('year', currentYear)
        .ilike('month', currentMonthName)
        .or('status.ilike.Paid%,status.ilike.Partial%');
      
      if (monthErr) console.error('Month query error:', monthErr);
      
      const totalReceivedThisMonth = (monthRows || [])
        .reduce((sum, r) => sum + Number(r.amount_paid || 0), 0);
      
      console.info('TRTM month sum', {
        month: currentMonthName,
        year: currentYear,
        count: monthRows?.length || 0,
        totalReceivedThisMonth,
        sample: monthRows?.slice(0, 3)
      });
      
      // Helper to normalize month names for comparison
      const normalizeMonth = (month: string) => month?.trim().toLowerCase();
      
      // Helper to normalize surf_level for comparison
      const normalizeSurfLevel = (level: string | null | undefined) => 
        level?.trim().toLowerCase() || '';

      // Helper to normalize status robustly (trim + collapse spaces)
      const normalizeStatus = (status: string | null | undefined) =>
        (status ?? '')
          .toString()
          .toLowerCase()
          .replace(/\s+/g, ' ')
          .trim();
      
      // Month name to number mapping (case-insensitive)
  const monthNameToNumber: { [key: string]: number } = {
        // English full + abbr
        'january': 1, 'jan': 1,
        'february': 2, 'feb': 2,
        'march': 3, 'mar': 3,
        'april': 4, 'apr': 4,
        'may': 5,
        'june': 6, 'jun': 6,
        'july': 7, 'jul': 7,
        'august': 8, 'aug': 8,
        'september': 9, 'sep': 9, 'sept': 9,
        'october': 10, 'oct': 10,
        'november': 11, 'nov': 11,
        'december': 12, 'dec': 12,
        // Portuguese full + abbr
        'janeiro': 1,
        'fevereiro': 2, 'fev': 2,
        'marco': 3, 'março': 3,
        'abril': 4, 'abr': 4,
        'maio': 5,
        'junho': 6,
        'julho': 7,
        'agosto': 8, 'ago': 8,
        'setembro': 9, 'set': 9,
        'outubro': 10, 'out': 10,
        'novembro': 11,
        'dezembro': 12, 'dez': 12,
      };
      

      // Current month outstanding for Learning and Pre-Competition (server-side query)
      const { data: currentMonthLearningRows } = await supabase
        .from('payments')
        .select('amount_due, amount_paid, athlete_id')
        .eq('year', currentYear)
        .ilike('month', currentMonthName);
      
      const currentMonthOutstandingLearning = (currentMonthLearningRows || [])
        .filter((p: any) => {
          const aid = String(p.athlete_id || '').trim().toLowerCase();
          const level = levelByAthleteId[aid]?.toLowerCase() || '';
          return level === 'learning' || level === 'pre-competition';
        })
        .reduce((sum: number, p: any) => {
          const remaining = (p.amount_due || 0) - (p.amount_paid || 0);
          return sum + (remaining > 0 ? remaining : 0);
        }, 0);
      
      // Current month outstanding for Competition (server-side query)
      const currentMonthOutstandingCompetition = (currentMonthLearningRows || [])
        .filter((p: any) => {
          const aid = String(p.athlete_id || '').trim().toLowerCase();
          const level = levelByAthleteId[aid]?.toLowerCase() || '';
          return level === 'competition';
        })
        .reduce((sum: number, p: any) => {
          const remaining = (p.amount_due || 0) - (p.amount_paid || 0);
          return sum + (remaining > 0 ? remaining : 0);
        }, 0);
      
      // Annual fees received from September 2025 onwards (server-side query)
      const { data: sept2025OnwardsRows } = await supabase
        .from('payments')
        .select('amount_paid, amount_due, month, year, athlete_id')
        .gte('year', 2025);
      
      const annualFeesReceived = (sept2025OnwardsRows || [])
        .filter((p: any) => {
          if (p.year > 2025) return true;
          if (p.year === 2025) {
            const monthNum = monthNameToNumber[normalizeMonth(p.month)] || 0;
            return monthNum >= 9; // September onwards
          }
          return false;
        })
        .reduce((sum: number, p: any) => sum + (p.amount_paid || 0), 0);
      
      // Outstanding from September 2025 onwards for Learning/Pre-Competition (only past/current months)
      const currentMonthSerial = currentYear * 12 + currentMonthNumber;
      
      const septemberOnwardsOutstandingLearning = (sept2025OnwardsRows || [])
        .filter((p: any) => {
          // Only include September 2025 onwards
          if (p.year < 2025) return false;
          if (p.year === 2025) {
            const monthNum = monthNameToNumber[normalizeMonth(p.month)] || 0;
            if (monthNum < 9) return false;
          }
          
          // Only current and past months
          const monthNum = monthNameToNumber[normalizeMonth(p.month)] || 0;
          const paymentSerial = (p.year || 0) * 12 + monthNum;
          if (paymentSerial > currentMonthSerial) return false;
          
          // Filter by surf level
          const aid = String(p.athlete_id || '').trim().toLowerCase();
          const level = levelByAthleteId[aid]?.toLowerCase() || '';
          return level === 'learning' || level === 'pre-competition';
        })
        .reduce((sum: number, p: any) => {
          const remaining = (p.amount_due || 0) - (p.amount_paid || 0);
          return sum + (remaining > 0 ? remaining : 0);
        }, 0);
      
      // Outstanding from September 2025 onwards for Competition (only past/current months)
      const septemberOnwardsOutstandingCompetition = (sept2025OnwardsRows || [])
        .filter((p: any) => {
          // Only include September 2025 onwards
          if (p.year < 2025) return false;
          if (p.year === 2025) {
            const monthNum = monthNameToNumber[normalizeMonth(p.month)] || 0;
            if (monthNum < 9) return false;
          }
          
          // Only current and past months
          const monthNum = monthNameToNumber[normalizeMonth(p.month)] || 0;
          const paymentSerial = (p.year || 0) * 12 + monthNum;
          if (paymentSerial > currentMonthSerial) return false;
          
          // Filter by surf level
          const aid = String(p.athlete_id || '').trim().toLowerCase();
          const level = levelByAthleteId[aid]?.toLowerCase() || '';
          return level === 'competition';
        })
        .reduce((sum: number, p: any) => {
          const remaining = (p.amount_due || 0) - (p.amount_paid || 0);
          return sum + (remaining > 0 ? remaining : 0);
        }, 0);
      
      console.info('Financial summary (DB-filtered)', {
        totalReceivedThisMonth,
        currentMonthOutstandingLearning,
        currentMonthOutstandingCompetition,
        annualFeesReceived,
        septemberOnwardsOutstandingLearning,
        septemberOnwardsOutstandingCompetition
      });
      
      return { 
        totalReceivedThisMonth, 
        currentMonthOutstandingLearning,
        currentMonthOutstandingCompetition,
        annualFeesReceived,
        septemberOnwardsOutstandingLearning,
        septemberOnwardsOutstandingCompetition
      };
    }
  });

  // Fetch athletes with attendance data
  const { data: queryData, isLoading } = useQuery({
    queryKey: ['admin-athletes-attendance'],
    queryFn: async () => {
      const [athletesRes, coachesRes] = await Promise.all([
        supabase.from('atletas').select('*'),
        supabase.from('coach').select('coach_id, first_name, last_name')
      ]);

      if (athletesRes.error) throw athletesRes.error;
      if (coachesRes.error) throw coachesRes.error;

      console.log('Coaches fetched:', coachesRes.data?.length, coachesRes.data);

      // Fetch attendance with pagination
      const pageSize = 1000;
      const { count: attendanceCount } = await supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true });

      const total = attendanceCount ?? 0;
      let attendanceData: any[] = [];

      if (total > 0) {
        const pagePromises: any[] = [];
        for (let from = 0; from < total; from += pageSize) {
          const to = Math.min(from + pageSize - 1, total - 1);
          pagePromises.push(
            supabase
              .from('attendance')
              .select('*')
              .order('date', { ascending: false })
              .range(from, to)
          );
        }
        const results = await Promise.all(pagePromises);
        attendanceData = results.flatMap((r: any) => r.data || []);
      }

      // Build coach name map (case-insensitive)
      const coachNameById: Record<string, string> = {};
      (coachesRes.data || []).forEach((c: any) => {
        if (!c?.coach_id) return;
        const key = String(c.coach_id).trim().toLowerCase();
        const full = [c?.first_name, c?.last_name].filter(Boolean).join(' ').trim();
        coachNameById[key] = full || c?.first_name || 'Unknown Coach';
      });
      
      console.log('Coach name map:', coachNameById);

      // Filter attendance: from Sept 2025 onwards (removed status filter to include incomplete records)
      const filteredAttendance = (attendanceData || []).filter((att: any) => {
        if (!att?.date) return false;
        const recordDate = new Date(att.date);
        const septemberCutoff = new Date('2025-09-01');
        return recordDate >= septemberCutoff;
      });

      console.log('Filtered attendance from Sept 2025:', filteredAttendance.length);
      console.log('October 2025 records:', filteredAttendance.filter((a: any) => a.date?.startsWith('2025-10')).length);

      // Group attendance by athlete
      const attendanceByAthlete: Record<string, any[]> = {};
      filteredAttendance.forEach((att: any) => {
        const key = String(att.athlete_id || '').trim().toLowerCase();
        if (!attendanceByAthlete[key]) attendanceByAthlete[key] = [];
        attendanceByAthlete[key].push({
          id: att.id,
          date: att.date,
          status: att.status,
          coach: att?.coach_id 
            ? (coachNameById[String(att.coach_id).trim().toLowerCase()] || `Coach ${att.coach_id}`) 
            : 'Not Assigned',
          beach_location: att?.beach_location ?? null,
          notes: att?.notes ?? null,
          athlete_id: att?.athlete_id ?? null,
        });
      });

      const athletesWithAttendance = (athletesRes.data || []).map((athlete: any) => {
        const aid = String(athlete.athlete_id || '').trim().toLowerCase();
        const list = attendanceByAthlete[aid] || [];
        return { ...athlete, attendance: list };
      });

      return {
        athletes: athletesWithAttendance,
        coachesCount: coachesRes.data?.length || 0
      };
    },
  });

  const athletes = queryData?.athletes;
  const coachesCount = queryData?.coachesCount || 0;

  // Calculate training days by coach by month
  const trainingDaysByCoachByMonth = useMemo(() => {
    if (!athletes) return {};

    const byCoachByMonth: Record<string, Record<string, Set<string>>> = {};
    
    for (const athlete of athletes) {
      for (const record of athlete.attendance) {
        if (!record.coach || !record.date) continue;
        
        const coachName = record.coach;
        const yearMonth = record.date.slice(0, 7);
        
        if (!byCoachByMonth[coachName]) {
          byCoachByMonth[coachName] = {};
        }
        if (!byCoachByMonth[coachName][yearMonth]) {
          byCoachByMonth[coachName][yearMonth] = new Set();
        }
        byCoachByMonth[coachName][yearMonth].add(record.date);
      }
    }

    const result: Record<string, Record<string, number>> = {};
    Object.entries(byCoachByMonth).forEach(([coach, monthData]) => {
      result[coach] = {};
      Object.keys(monthData).sort().reverse().forEach(ym => {
        result[coach][ym] = monthData[ym].size;
      });
    });
    
    return result;
  }, [athletes]);

  // Calculate training days by coach by year
  const trainingDaysByCoachByYear = useMemo(() => {
    if (!athletes) return {};

    const byCoachByYear: Record<string, Record<string, Set<string>>> = {};
    
    for (const athlete of athletes) {
      for (const record of athlete.attendance) {
        if (!record.coach || !record.date) continue;
        
        const coachName = record.coach;
        const year = record.date.slice(0, 4);
        
        if (!byCoachByYear[coachName]) {
          byCoachByYear[coachName] = {};
        }
        if (!byCoachByYear[coachName][year]) {
          byCoachByYear[coachName][year] = new Set();
        }
        byCoachByYear[coachName][year].add(record.date);
      }
    }

    const result: Record<string, Record<string, number>> = {};
    Object.entries(byCoachByYear).forEach(([coach, yearData]) => {
      result[coach] = {};
      Object.keys(yearData).sort().reverse().forEach(y => {
        result[coach][y] = yearData[y].size;
      });
    });
    
    return result;
  }, [athletes]);

  const adminActions = [
    {
      title: "Manage Users",
      description: "Add, edit, and remove coaches, athletes, and guardians",
      icon: Users,
      color: "primary",
      action: "View Users"
    },
    {
      title: "Athlete Management", 
      description: "Full CRUD access to athlete profiles and data",
      icon: UserPlus,
      color: "success",
      action: "Manage Athletes"
    },
    {
      title: "Payment Administration",
      description: "Set fees, mark payments, and view financial reports",
      icon: Euro,
      color: "warning",
      action: "Payment Settings"
    },
    {
      title: "Attendance Management",
      description: "Search athletes and manage their attendance records",
      icon: Calendar,
      color: "secondary",
      action: "Manage Attendance"
    }
  ];

  const fmt = (n: number | undefined) => (typeof n === 'number' && isFinite(n) ? n.toFixed(2) : '0.00');

  const quickStats = [
    { label: "Total Received from September", value: `€${fmt(paymentsData?.annualFeesReceived)}` , color: "primary" },
    { label: "Total Received This Month", value: `€${fmt(paymentsData?.totalReceivedThisMonth)}` , color: "success" },
    { label: "Outstanding Learning/Pre-Comp (Month)", value: `€${fmt(paymentsData?.currentMonthOutstandingLearning)}` , color: "destructive" },
    { label: "Outstanding Competition (Month)", value: `€${fmt(paymentsData?.currentMonthOutstandingCompetition)}` , color: "destructive" },
    { label: "Outstanding Learning/Pre-Comp (Sept+)", value: `€${fmt(paymentsData?.septemberOnwardsOutstandingLearning)}` , color: "warning" },
    { label: "Outstanding Competition (Sept+)", value: `€${fmt(paymentsData?.septemberOnwardsOutstandingCompetition)}` , color: "warning" },
    { 
      label: "Total Learning Athletes", 
      value: (athletes?.filter((a: any) => a.is_active !== false && a.surf_level?.trim().toLowerCase() === 'learning').length || 0).toString(), 
      color: "success",
      span: "col-span-1"
    },
    { 
      label: "Total Pre-Competition Athletes", 
      value: (athletes?.filter((a: any) => a.is_active !== false && a.surf_level?.trim().toLowerCase() === 'pre-competition').length || 0).toString(), 
      color: "success",
      span: "col-span-1"
    },
    { 
      label: "Total Competition Athletes", 
      value: (athletes?.filter((a: any) => a.is_active !== false && a.surf_level?.trim().toLowerCase() === 'competition').length || 0).toString(), 
      color: "success",
      span: "col-span-1"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-surface">
      <AppHeader title="Administration" showBack backTo="/" />
      
      <main className="mobile-container py-6">
        {/* Admin Header */}
        <Card className="shadow-medium mb-6">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings className="h-8 w-8 text-secondary-foreground" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Admin Dashboard</h2>
              <p className="text-muted-foreground">Complete school management access</p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {quickStats.slice(0, -3).map((stat, index) => {
            const colorClass = 
              stat.color === "primary" ? "text-primary" :
              stat.color === "success" ? "text-success" :
              stat.color === "destructive" ? "text-destructive" :
              stat.color === "warning" ? "text-warning" :
              stat.color === "secondary" ? "text-secondary" :
              "text-foreground";
            
            return (
              <Card key={index} className="shadow-soft">
                <CardContent className="p-4 text-center">
                  <p className={`text-2xl font-bold ${colorClass}`}>{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Athletes Level Stats - 3 in a row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {quickStats.slice(-3).map((stat, index) => {
            const colorClass = 
              stat.color === "primary" ? "text-primary" :
              stat.color === "success" ? "text-success" :
              stat.color === "destructive" ? "text-destructive" :
              stat.color === "warning" ? "text-warning" :
              stat.color === "secondary" ? "text-secondary" :
              "text-foreground";
            
            return (
              <Card key={index} className="shadow-soft">
                <CardContent className="p-4 text-center">
                  <p className={`text-2xl font-bold ${colorClass}`}>{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Admin Actions */}
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-foreground mb-4">Management Tools</h3>
          
          {adminActions.map((action, index) => {
            const bgColorClass = 
              action.color === "primary" ? "bg-primary/10" :
              action.color === "success" ? "bg-success/10" :
              action.color === "warning" ? "bg-warning/10" :
              action.color === "secondary" ? "bg-secondary/10" :
              "bg-primary/10";
            
            const textColorClass = 
              action.color === "primary" ? "text-primary" :
              action.color === "success" ? "text-success" :
              action.color === "warning" ? "text-warning" :
              action.color === "secondary" ? "text-secondary" :
              "text-primary";
            
            return (
              <Card 
                key={index} 
                className="shadow-soft hover:shadow-medium transition-shadow cursor-pointer"
                onClick={() => {
                  switch(action.title) {
                    case "Manage Users":
                      navigate("/admin/users");
                      break;
                    case "Athlete Management":
                      navigate("/admin/athletes");
                      break;
                    case "Payment Administration":
                      navigate("/admin/payments");
                      break;
                    case "Attendance Management":
                      navigate("/admin/attendance");
                      break;
                    default:
                      break;
                  }
                }}
              >
                <CardContent className="p-0">
                  <div className="flex items-center p-4">
                    <div className={`w-12 h-12 rounded-full ${bgColorClass} flex items-center justify-center mr-4 flex-shrink-0`}>
                      <action.icon className={`h-6 w-6 ${textColorClass}`} />
                    </div>
                  
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground mb-1">{action.title}</h4>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="ml-4 touch-friendly"
                    >
                      {action.action}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Coach Attendance Management */}
        {isLoading ? (
          <Card className="shadow-soft mt-6">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        ) : Object.keys(trainingDaysByCoachByMonth).length > 0 && (
          <Card className="shadow-soft mt-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                    <User className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold">Coach Attendance Management</CardTitle>
                    <CardDescription>View training session breakdown by coach</CardDescription>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <Select value={selectedCoach} onValueChange={setSelectedCoach}>
                  <SelectTrigger className="w-full md:w-64 bg-background">
                    <SelectValue placeholder="Choose Coach" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    {Object.keys(trainingDaysByCoachByMonth).sort((a, b) => a.localeCompare(b)).map((coach) => (
                      <SelectItem key={coach} value={coach}>
                        {coach}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            {selectedCoach && (
              <CardContent>
                <div className="border border-border rounded-lg p-4">
                  <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    {selectedCoach}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Monthly breakdown */}
                    <div>
                      <h5 className="text-sm font-semibold mb-3 text-muted-foreground">By Month</h5>
                      {Object.keys(trainingDaysByCoachByMonth[selectedCoach]).length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No monthly data</p>
                      ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {Object.entries(trainingDaysByCoachByMonth[selectedCoach]).map(([month, count]) => {
                            const [year, monthNum] = month.split('-');
                            const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleString('default', { month: 'short' });
                            return (
                              <div key={month} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                                <span className="text-sm font-medium">{monthName} {year}</span>
                                <Badge variant="secondary">{count} days</Badge>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    
                    {/* Yearly breakdown */}
                    <div>
                      <h5 className="text-sm font-semibold mb-3 text-muted-foreground">By Year</h5>
                      {!trainingDaysByCoachByYear[selectedCoach] || Object.keys(trainingDaysByCoachByYear[selectedCoach]).length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No yearly data</p>
                      ) : (
                        <div className="space-y-2">
                          {Object.entries(trainingDaysByCoachByYear[selectedCoach]).map(([year, count]) => (
                            <div key={year} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                              <span className="text-sm font-medium">{year}</span>
                              <Badge variant="secondary">{count} days</Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        )}
      </main>

      <SponsorBanner />
      <AppFooter />
    </div>
  );
};

export default AdministrationDashboard;