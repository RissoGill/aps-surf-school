import { useNavigate } from "react-router-dom";
import { Settings, Users, DollarSign, Calendar, UserPlus, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import AppHeader from "@/components/shared/AppHeader";
import SponsorBanner from "@/components/shared/SponsorBanner";
import AppFooter from "@/components/shared/AppFooter";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";

const AdministrationDashboard = () => {
  const navigate = useNavigate();

  // Fetch athletes with attendance data
  const { data: athletes, isLoading } = useQuery({
    queryKey: ['admin-athletes-attendance'],
    queryFn: async () => {
      const [athletesRes, coachesRes] = await Promise.all([
        supabase.from('atletas').select('*'),
        supabase.from('coach').select('coach_id, first_name, last_name')
      ]);

      if (athletesRes.error) throw athletesRes.error;

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

      // Build coach name map
      const coachNameById: Record<string, string> = {};
      (coachesRes.data || []).forEach((c: any) => {
        const key = String(c?.coach_id || '').trim().toLowerCase();
        if (!key) return;
        const full = [c?.first_name, c?.last_name].filter(Boolean).join(' ').trim();
        coachNameById[key] = full || c?.first_name || 'Unknown Coach';
      });

      // Filter attendance: valid status and from Sept 2025
      const validStatuses = new Set(['present', 'absent', 'justified']);
      const filteredAttendance = (attendanceData || []).filter((att: any) => {
        if (!att?.date) return false;
        const status = typeof att?.status === 'string' ? att.status.trim().toLowerCase() : '';
        if (!validStatuses.has(status)) return false;
        const recordDate = new Date(att.date);
        const septemberCutoff = new Date('2025-09-01');
        return recordDate >= septemberCutoff;
      });

      // Group attendance by athlete
      const attendanceByAthlete: Record<string, any[]> = {};
      filteredAttendance.forEach((att: any) => {
        const key = String(att.athlete_id || '').trim().toLowerCase();
        if (!attendanceByAthlete[key]) attendanceByAthlete[key] = [];
        attendanceByAthlete[key].push({
          id: att.id,
          date: att.date,
          status: att.status,
          coach: att?.coach_id ? (coachNameById[String(att.coach_id).trim().toLowerCase()] || "Unknown Coach") : null,
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

      return athletesWithAttendance;
    },
  });

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
      icon: DollarSign,
      color: "warning",
      action: "Payment Settings"
    },
    {
      title: "Attendance Overview",
      description: "View and edit attendance records for all athletes",
      icon: Calendar,
      color: "secondary",
      action: "View Attendance"
    }
  ];

  const quickStats = [
    { label: "Total Athletes", value: "48", color: "primary" },
    { label: "Active Coaches", value: "6", color: "success" },
    { label: "Outstanding Payments", value: "$2,340", color: "destructive" },
    { label: "This Month Sessions", value: "156", color: "warning" }
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
          {quickStats.map((stat, index) => (
            <Card key={index} className="shadow-soft">
              <CardContent className="p-4 text-center">
                <p className={`text-2xl font-bold text-${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Admin Actions */}
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-foreground mb-4">Management Tools</h3>
          
          {adminActions.map((action, index) => (
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
                  default:
                    break;
                }
              }}
            >
              <CardContent className="p-0">
                <div className="flex items-center p-4">
                  <div className={`w-12 h-12 rounded-full bg-${action.color}/10 flex items-center justify-center mr-4 flex-shrink-0`}>
                    <action.icon className={`h-6 w-6 text-${action.color}`} />
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
          ))}
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