import { useNavigate } from "react-router-dom";
import { Settings, Users, Euro, Calendar, UserPlus, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import AppHeader from "@/components/shared/AppHeader";
import SponsorBanner from "@/components/shared/SponsorBanner";
import AppFooter from "@/components/shared/AppFooter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo, useEffect } from "react";

const AdministrationDashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
      const { data, error } = await supabase
        .from('payments')
        .select(`
          amount_paid, 
          amount_due, 
          payment_date, 
          status, 
          month, 
          year,
          athlete_id,
          atletas!inner(surf_level)
        `);
      
      if (error) throw error;
      
      const allPayments = (data || []).map((payment: any) => ({
        ...payment,
        surf_level: payment.atletas?.surf_level
      }));
      
      // Get current month and year
      const now = new Date();
      const currentMonth = now.toLocaleString('default', { month: 'long' });
      const currentYear = now.getFullYear();
      
      // Helper to normalize month names for comparison
      const normalizeMonth = (month: string) => month?.trim().toLowerCase();
      
      // Helper to normalize surf_level for comparison
      const normalizeSurfLevel = (level: string | null | undefined) => 
        level?.trim().toLowerCase() || '';
      
      // Filter for current month payments
      const currentMonthPayments = allPayments.filter((payment: any) => 
        normalizeMonth(payment.month) === normalizeMonth(currentMonth) && payment.year === currentYear
      );
      
      // Current month paid sum - sum all amount_paid for current month
      const currentMonthPaid = currentMonthPayments
        .reduce((sum: number, payment: any) => sum + (payment.amount_paid || 0), 0);
      
      // Current month outstanding for Learning level
      const currentMonthOutstandingLearning = currentMonthPayments
        .filter((payment: any) => normalizeSurfLevel(payment.surf_level) === 'learning')
        .reduce((sum: number, payment: any) => {
          const due = payment.amount_due || 0;
          const paid = payment.amount_paid || 0;
          const remaining = due - paid;
          return sum + (remaining > 0 ? remaining : 0);
        }, 0);
      
      // Current month outstanding for Competition level
      const currentMonthOutstandingCompetition = currentMonthPayments
        .filter((payment: any) => normalizeSurfLevel(payment.surf_level) === 'competition')
        .reduce((sum: number, payment: any) => {
          const due = payment.amount_due || 0;
          const paid = payment.amount_paid || 0;
          const remaining = due - paid;
          return sum + (remaining > 0 ? remaining : 0);
        }, 0);
      
      // Filter for payments from September 2025 onwards
      const paymentsFromSept = allPayments.filter((payment: any) => {
        // Filter by year and month fields
        if (payment.year && payment.month) {
          // Month name to number mapping (case-insensitive)
          const monthMap: { [key: string]: number } = {
            'january': 1, 'february': 2, 'march': 3, 'april': 4,
            'may': 5, 'june': 6, 'july': 7, 'august': 8,
            'september': 9, 'october': 10, 'november': 11, 'december': 12
          };
          
          const monthNum = monthMap[normalizeMonth(payment.month)];
          if (!monthNum) return false;
          
          const paymentSerial = payment.year * 12 + monthNum;
          const septemberSerial = 2025 * 12 + 9; // September 2025
          
          return paymentSerial >= septemberSerial;
        }
        return false;
      });
      
      // Annual fees received from Sept 2025 onwards
      const annualFeesReceived = paymentsFromSept
        .reduce((sum: number, payment: any) => sum + (payment.amount_paid || 0), 0);
      
      // Get current month serial number for comparison
      const currentMonthSerial = now.getFullYear() * 12 + (now.getMonth() + 1);
      
      // Month name to number mapping (case-insensitive)
      const monthNameToNumber: { [key: string]: number } = {
        'january': 1, 'february': 2, 'march': 3, 'april': 4,
        'may': 5, 'june': 6, 'july': 7, 'august': 8,
        'september': 9, 'october': 10, 'november': 11, 'december': 12
      };
      
      // Outstanding fees from September 2025 onwards for Learning level (only current and past months)
      const septemberOnwardsOutstandingLearning = paymentsFromSept
        .filter((payment: any) => {
          const paymentMonthNumber = monthNameToNumber[normalizeMonth(payment.month)];
          if (!paymentMonthNumber) return false;
          const paymentSerial = payment.year * 12 + paymentMonthNumber;
          return paymentSerial <= currentMonthSerial && normalizeSurfLevel(payment.surf_level) === 'learning';
        })
        .reduce((sum: number, payment: any) => {
          const due = payment.amount_due || 0;
          const paid = payment.amount_paid || 0;
          const remaining = due - paid;
          return sum + (remaining > 0 ? remaining : 0);
        }, 0);
      
      // Outstanding fees from September 2025 onwards for Competition level (only current and past months)
      const septemberOnwardsOutstandingCompetition = paymentsFromSept
        .filter((payment: any) => {
          const paymentMonthNumber = monthNameToNumber[normalizeMonth(payment.month)];
          if (!paymentMonthNumber) return false;
          const paymentSerial = payment.year * 12 + paymentMonthNumber;
          return paymentSerial <= currentMonthSerial && normalizeSurfLevel(payment.surf_level) === 'competition';
        })
        .reduce((sum: number, payment: any) => {
          const due = payment.amount_due || 0;
          const paid = payment.amount_paid || 0;
          const remaining = due - paid;
          return sum + (remaining > 0 ? remaining : 0);
        }, 0);
      
      return { 
        currentMonthPaid, 
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

  const quickStats = [
    { label: "Total Athletes", value: athletes?.length.toString() || "0", color: "primary" },
    { label: "Active Coaches", value: coachesCount.toString(), color: "success" },
    { label: "Current Month", value: `€${paymentsData?.currentMonthPaid.toFixed(2) || "0.00"}`, color: "success" },
    { label: "Outstanding Learning (Month)", value: `€${paymentsData?.currentMonthOutstandingLearning.toFixed(2) || "0.00"}`, color: "destructive" },
    { label: "Outstanding Competition (Month)", value: `€${paymentsData?.currentMonthOutstandingCompetition.toFixed(2) || "0.00"}`, color: "destructive" },
    { label: "Annual Fees (Sept+)", value: `€${paymentsData?.annualFeesReceived.toFixed(2) || "0.00"}`, color: "primary" },
    { label: "Outstanding Learning (Sept+)", value: `€${paymentsData?.septemberOnwardsOutstandingLearning.toFixed(2) || "0.00"}`, color: "warning" },
    { label: "Outstanding Competition (Sept+)", value: `€${paymentsData?.septemberOnwardsOutstandingCompetition.toFixed(2) || "0.00"}`, color: "warning" }
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
          {quickStats.map((stat, index) => {
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

        {/* Recent Activity */}
        <Card className="shadow-soft mt-6">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Recent Activity</CardTitle>
            <CardDescription>Latest system changes and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { action: "New athlete enrolled", details: "Sofia Martinez - Beginner level", time: "2 hours ago" },
                { action: "Payment received", details: "Emma Johnson - September fee", time: "4 hours ago" },
                { action: "Attendance updated", details: "Coach Maria updated 5 records", time: "6 hours ago" },
                { action: "Coach added", details: "New coach profile: Alex Thompson", time: "1 day ago" }
              ].map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border border-border rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.details}</p>
                    <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>


        {/* Training Days by Coach */}
        {isLoading ? (
          <Card className="shadow-soft mb-6">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        ) : Object.keys(trainingDaysByCoachByMonth).length > 0 && (
          <div className="mb-6">
            <h3 className="text-xl font-bold text-foreground mb-4">Training Days by Coach</h3>
            <div className="space-y-6">
              {Object.entries(trainingDaysByCoachByMonth).sort(([a], [b]) => a.localeCompare(b)).map(([coach, monthData]) => (
                <Card key={coach} className="shadow-soft">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      {coach}
                    </CardTitle>
                    <CardDescription>Training session breakdown</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Monthly breakdown */}
                      <div>
                        <h4 className="text-sm font-semibold mb-3 text-muted-foreground">By Month</h4>
                        {Object.keys(monthData).length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">No monthly data</p>
                        ) : (
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {Object.entries(monthData).map(([month, count]) => {
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
                        <h4 className="text-sm font-semibold mb-3 text-muted-foreground">By Year</h4>
                        {!trainingDaysByCoachByYear[coach] || Object.keys(trainingDaysByCoachByYear[coach]).length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">No yearly data</p>
                        ) : (
                          <div className="space-y-2">
                            {Object.entries(trainingDaysByCoachByYear[coach]).map(([year, count]) => (
                              <div key={year} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                                <span className="text-sm font-medium">{year}</span>
                                <Badge variant="secondary">{count} days</Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>

      <SponsorBanner />
      <AppFooter />
    </div>
  );
};

export default AdministrationDashboard;