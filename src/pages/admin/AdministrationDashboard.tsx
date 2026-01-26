import { useNavigate } from "react-router-dom";
import { Settings, Users, Euro, Calendar, UserPlus, User, RefreshCw } from "lucide-react";
import { ReportsCard } from "@/components/admin/ReportsCard";
import { CoachPaymentsCard } from "@/components/admin/CoachPaymentsCard";
import AlertsManagementCard from "@/components/admin/AlertsManagementCard";
import CoachMessagesManagementCard from "@/components/admin/CoachMessagesManagementCard";
import CoachTrainingManagement from "@/components/admin/CoachTrainingManagement";
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
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";

const AdministrationDashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const [selectedCoach, setSelectedCoach] = useState<string>("");
  const [sessionValid, setSessionValid] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem('adminSession');
    toast({
      title: t('login.signedOut'),
      description: t('login.redirectingToLogin'),
    });
    navigate("/login/administration");
  };

  // Session validation on mount - using localStorage for legacy auth
  useEffect(() => {
    const adminSessionStr = localStorage.getItem('adminSession');
    
    if (!adminSessionStr) {
      toast({
        title: t('login.sessionExpired'),
        description: t('login.pleaseLoginAgain'),
        variant: "destructive",
      });
      navigate("/login/administration");
      return;
    }

    try {
      const adminSession = JSON.parse(adminSessionStr);
      setSessionValid(true);
      setCurrentUser(adminSession.email || adminSession.id || 'Unknown');
      setUserRole(adminSession.role || 'admin');
      console.log('Admin session validated:', adminSession.id, adminSession.role);
    } catch (error) {
      console.error('Failed to parse admin session:', error);
      localStorage.removeItem('adminSession');
      navigate("/login/administration");
    }
  }, [navigate, t]);

  useEffect(() => {
    if (!sessionValid) return;

    const channel = supabase
      .channel('admin-dashboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-athletes-attendance'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'coach_payments' }, () => {
        queryClient.invalidateQueries({ queryKey: ['all-payments-summary'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient, sessionValid]);

  // Fetch payment data
  const { data: paymentsData } = useQuery({
    queryKey: ['all-payments-summary'],
    enabled: sessionValid,
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
      
      // Fetch surf levels and active status separately (no FK defined between payments and atletas)
      const { data: atletasRows } = await supabase
        .from('atletas')
        .select('athlete_id, surf_level, is_active');
      
      const levelByAthleteId: Record<string, string | null> = {};
      const isActiveByAthleteId: Record<string, boolean> = {};
      (atletasRows || []).forEach((a: any) => {
        const key = String(a.athlete_id || '').trim().toLowerCase();
        if (key) {
          levelByAthleteId[key] = a?.surf_level ?? null;
          isActiveByAthleteId[key] = a?.is_active !== false;
        }
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
      
      // Fetch current month total - query by year only, filter by month client-side
      const { data: monthRows, error: monthErr } = await supabase
        .from('payments')
        .select('amount_paid, amount_due, status, month, year, athlete_id')
        .eq('year', currentYear);
      
      if (monthErr) {
        console.error('Month query error:', monthErr);
      }
      
      console.info('Month rows sample', monthRows?.slice(0, 3));
      
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
      
      // Month name to number mapping (case-insensitive) - moved up for use in month filtering
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
      
      // Filter to current month client-side and calculate total received
      const currentMonthPayments = (monthRows || []).filter((p: any) => {
        const monthNum = monthNameToNumber[normalizeMonth(p.month)] || 0;
        return monthNum === currentMonthNumber;
      });
      
      const totalReceivedThisMonth = currentMonthPayments
        .filter((p: any) => {
          const status = normalizeStatus(p.status);
          return status.startsWith('paid') || status.startsWith('partial');
        })
        .reduce((sum, r) => sum + Number(r.amount_paid || 0), 0);
      
      console.info('TRTM month sum (client-filtered)', {
        month: currentMonthName,
        monthNumber: currentMonthNumber,
        year: currentYear,
        totalRows: monthRows?.length || 0,
        matchedCurrentMonth: currentMonthPayments.length,
        totalReceivedThisMonth,
        sample: currentMonthPayments.slice(0, 3)
      });
      

      // Current month outstanding for Learning and Pre-Competition - use monthRows (already fetched by year)
      const currentMonthOutstandingRows = currentMonthPayments; // Already filtered to current month
      
      const currentMonthOutstandingLearning = currentMonthOutstandingRows
        .filter((p: any) => {
          const aid = String(p.athlete_id || '').trim().toLowerCase();
          const isActive = isActiveByAthleteId[aid] ?? true;
          if (!isActive) return false;
          const level = levelByAthleteId[aid]?.toLowerCase() || '';
          return level === 'learning' || level === 'pre-competition';
        })
        .reduce((sum: number, p: any) => {
          const remaining = (p.amount_due || 0) - (p.amount_paid || 0);
          return sum + (remaining > 0 ? remaining : 0);
        }, 0);
      
      // Current month outstanding for Competition - reuse same currentMonthOutstandingRows
      const currentMonthOutstandingCompetition = currentMonthOutstandingRows
        .filter((p: any) => {
          const aid = String(p.athlete_id || '').trim().toLowerCase();
          const isActive = isActiveByAthleteId[aid] ?? true;
          if (!isActive) return false;
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
      
      // Note: currentMonthSerial will be defined on line 209, so we calculate it here
      const currentMonthSerial = currentYear * 12 + currentMonthNumber;
      
      const annualFeesReceived = (sept2025OnwardsRows || [])
        .filter((p: any) => {
          // Only include September 2025 onwards
          if (p.year < 2025) return false;
          if (p.year === 2025) {
            const monthNum = monthNameToNumber[normalizeMonth(p.month)] || 0;
            if (monthNum < 9) return false; // Before September
          }
          
          // Only include months up to the current month (exclude future months)
          const monthNum = monthNameToNumber[normalizeMonth(p.month)] || 0;
          const paymentSerial = (p.year || 0) * 12 + monthNum;
          if (paymentSerial > currentMonthSerial) return false;
          
          return true;
        })
        .reduce((sum: number, p: any) => sum + (p.amount_paid || 0), 0);
      
      // Outstanding from September 2025 onwards for Learning/Pre-Competition (only past/current months)
      // Note: currentMonthSerial is now defined above
      
      const septemberOnwardsOutstandingLearning = (sept2025OnwardsRows || [])
        .filter((p: any) => {
          // Only include September 2025 onwards
          if (p.year < 2025) return false;
          if (p.year === 2025) {
            const monthNum = monthNameToNumber[normalizeMonth(p.month)] || 0;
            if (monthNum < 9) return false;
          }
          
          // Only past months (exclude current month)
          const monthNum = monthNameToNumber[normalizeMonth(p.month)] || 0;
          const paymentSerial = (p.year || 0) * 12 + monthNum;
          if (paymentSerial >= currentMonthSerial) return false;
          
          // Filter by active status
          const aid = String(p.athlete_id || '').trim().toLowerCase();
          const isActive = isActiveByAthleteId[aid] ?? true;
          if (!isActive) return false;
          
          // Filter by surf level
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
          
          // Only past months (exclude current month)
          const monthNum = monthNameToNumber[normalizeMonth(p.month)] || 0;
          const paymentSerial = (p.year || 0) * 12 + monthNum;
          if (paymentSerial >= currentMonthSerial) return false;
          
          // Filter by active status
          const aid = String(p.athlete_id || '').trim().toLowerCase();
          const isActive = isActiveByAthleteId[aid] ?? true;
          if (!isActive) return false;
          
          // Filter by surf level
          const level = levelByAthleteId[aid]?.toLowerCase() || '';
          return level === 'competition';
        })
        .reduce((sum: number, p: any) => {
          const remaining = (p.amount_due || 0) - (p.amount_paid || 0);
          return sum + (remaining > 0 ? remaining : 0);
        }, 0);
      
      // Fetch all coach payments
      const { data: coachPaymentsRows, error: coachPaymentsError } = await supabase
        .from('coach_payments')
        .select('amount, payment_date, payment_year, payment_month');
      
      console.info('Coach payments fetch result:', {
        rowCount: coachPaymentsRows?.length || 0,
        error: coachPaymentsError,
        sample: coachPaymentsRows?.slice(0, 3)
      });
      
      if (coachPaymentsError) {
        console.error('coach_payments fetch error:', coachPaymentsError);
      }
      
      // Helper to derive a record date from payment_date or payment_year/payment_month
      const toRecordDate = (p: any): Date | null => {
        // Prefer payment_date if available
        if (p.payment_date) {
          try {
            const d = new Date(p.payment_date);
            if (!isNaN(d.getTime())) return d;
          } catch {}
        }
        
        // Fallback to payment_year + payment_month
        const year = Number(p.payment_year);
        const monthStr = normalizeMonth(p.payment_month || '');
        const monthNum = monthNameToNumber[monthStr] || 0;
        
        if (!year || !monthNum) return null;
        return new Date(year, monthNum - 1, 1);
      };
      
      // Build rows with computed record date
      const coachRows = (coachPaymentsRows || [])
        .map((p: any) => ({ ...p, _recordDate: toRecordDate(p) }))
        .filter((p: any) => p._recordDate);
      
      // Count how many used payment_date vs fallback
      const usedPaymentDate = coachRows.filter((p: any) => p.payment_date).length;
      const usedFallback = coachRows.length - usedPaymentDate;
      
      console.info('Coach payments record date derivation:', {
        totalRows: coachPaymentsRows?.length || 0,
        validRows: coachRows.length,
        usedPaymentDate,
        usedFallback,
        sample: coachRows.slice(0, 3)
      });
      
      // Fixed Sept+ cutoff: 2025-09-01
      const septCutoff = new Date('2025-09-01');
      
      // Calculate total paid to coaches from Sept+ onwards
      const coachPaymentsFromSept = coachRows.filter((p: any) => 
        p._recordDate >= septCutoff && p._recordDate <= now
      );
      
      const totalPaidToCoaches = coachPaymentsFromSept
        .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
      
      console.info('Total paid to coaches (Sept+) calculation:', {
        septCutoff: septCutoff.toISOString(),
        now: now.toISOString(),
        matchingRecords: coachPaymentsFromSept.length,
        totalAmount: totalPaidToCoaches,
        records: coachPaymentsFromSept
      });
      
      // Calculate coach payments made this month
      const currentMonthStart = new Date(currentYear, currentMonthNumber - 1, 1);
      const currentMonthEnd = new Date(currentYear, currentMonthNumber, 0, 23, 59, 59);
      
      const coachPaymentsThisMonthRecords = coachRows.filter((p: any) => 
        p._recordDate >= currentMonthStart && p._recordDate <= currentMonthEnd
      );
      
      const coachPaymentsThisMonth = coachPaymentsThisMonthRecords
        .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
      
      console.info('Coach payments this month calculation:', {
        currentMonthStart: currentMonthStart.toISOString(),
        currentMonthEnd: currentMonthEnd.toISOString(),
        matchingRecords: coachPaymentsThisMonthRecords.length,
        totalAmount: coachPaymentsThisMonth,
        records: coachPaymentsThisMonthRecords
      });
      
      console.info('Financial summary (DB-filtered)', {
        totalReceivedThisMonth,
        currentMonthOutstandingLearning,
        currentMonthOutstandingCompetition,
        annualFeesReceived,
        septemberOnwardsOutstandingLearning,
        septemberOnwardsOutstandingCompetition,
        totalPaidToCoaches,
        coachPaymentsThisMonth
      });
      
      return { 
        totalReceivedThisMonth, 
        currentMonthOutstandingLearning,
        currentMonthOutstandingCompetition,
        annualFeesReceived,
        septemberOnwardsOutstandingLearning,
        septemberOnwardsOutstandingCompetition,
        totalPaidToCoaches,
        coachPaymentsThisMonth
      };
    }
  });

  // Fetch athletes with attendance data
  const { data: queryData, isLoading } = useQuery({
    queryKey: ['admin-athletes-attendance'],
    enabled: sessionValid,
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

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-athletes-attendance'] });
    queryClient.invalidateQueries({ queryKey: ['all-payments-summary'] });
    toast({
      title: t('admin.dashboard.refreshing'),
      description: t('admin.dashboard.loadingLatest'),
    });
  };

  const adminActions = [
    {
      title: t('admin.management.users'),
      description: t('admin.management.usersDesc'),
      icon: Users,
      color: "primary",
      action: t('admin.management.viewUsers')
    },
    {
      title: t('admin.management.athletes'), 
      description: t('admin.management.athletesDesc'),
      icon: UserPlus,
      color: "success",
      action: t('admin.management.manageAthletes')
    },
    {
      title: t('admin.management.payments'),
      description: t('admin.management.paymentsDesc'),
      icon: Euro,
      color: "warning",
      action: t('admin.management.paymentSettings')
    },
    {
      title: t('admin.management.attendance'),
      description: t('admin.management.attendanceDesc'),
      icon: Calendar,
      color: "secondary",
      action: t('admin.management.manageAttendance')
    }
  ];

  const fmt = (n: number | undefined) => (typeof n === 'number' && isFinite(n) ? n.toFixed(2) : '0.00');

  const quickStats = [
    { label: t('admin.stats.totalReceived'), value: `€${fmt(paymentsData?.annualFeesReceived)}` , color: "primary" },
    { label: t('admin.stats.totalReceivedMonth'), value: `€${fmt(paymentsData?.totalReceivedThisMonth)}` , color: "success" },
    { label: t('admin.stats.outstandingLearningMonth'), value: `€${fmt(paymentsData?.currentMonthOutstandingLearning)}` , color: "destructive" },
    { label: t('admin.stats.outstandingCompetitionMonth'), value: `€${fmt(paymentsData?.currentMonthOutstandingCompetition)}` , color: "destructive" },
    { label: t('admin.stats.outstandingLearningSept'), value: `€${fmt(paymentsData?.septemberOnwardsOutstandingLearning)}` , color: "warning" },
    { label: t('admin.stats.outstandingCompetitionSept'), value: `€${fmt(paymentsData?.septemberOnwardsOutstandingCompetition)}` , color: "warning" },
    { label: t('admin.stats.totalPaidCoaches'), value: `€${fmt(paymentsData?.totalPaidToCoaches)}` , color: "primary" },
    { label: t('admin.stats.coachPaymentsMonth'), value: `€${fmt(paymentsData?.coachPaymentsThisMonth)}` , color: "primary" },
    { 
      label: t('admin.stats.totalLearning'), 
      value: (athletes?.filter((a: any) => a.is_active !== false && a.surf_level?.trim().toLowerCase() === 'learning').length || 0).toString(), 
      color: "success",
      span: "col-span-1"
    },
    { 
      label: t('admin.stats.totalPreCompetition'), 
      value: (athletes?.filter((a: any) => a.is_active !== false && a.surf_level?.trim().toLowerCase() === 'pre-competition').length || 0).toString(), 
      color: "success",
      span: "col-span-1"
    },
    { 
      label: t('admin.stats.totalCompetition'), 
      value: (athletes?.filter((a: any) => a.is_active !== false && a.surf_level?.trim().toLowerCase() === 'competition').length || 0).toString(), 
      color: "success",
      span: "col-span-1"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-surface">
      <AppHeader title="Administration" showBack backTo="/" />
      
      {!sessionValid ? (
        <main className="mobile-container py-6">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4">
              <Skeleton className="h-8 w-48 mx-auto" />
              <Skeleton className="h-4 w-64 mx-auto" />
            </div>
          </div>
        </main>
      ) : (
        <>
          <div className="bg-muted/50 border-b px-4 py-2 text-sm">
            <div className="mobile-container flex items-center justify-between">
              <span>
                {t('admin.dashboard.loggedInAs')}: <strong className="text-foreground">{currentUser}</strong> 
                <Badge variant="secondary" className="ml-2 text-xs">{userRole}</Badge>
              </span>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={async () => {
                  await supabase.auth.signOut();
                  navigate("/login/administration");
                }}
              >
                {t('admin.dashboard.signOut')}
              </Button>
            </div>
          </div>
          
          <main className="mobile-container py-6">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">{t('admin.dashboard.title')}</h2>
                <p className="text-muted-foreground">{t('admin.dashboard.subtitle')}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('admin.dashboard.refresh')}
          </Button>
        </div>
        {/* Admin Header */}
        <Card className="shadow-medium mb-6">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings className="h-8 w-8 text-secondary-foreground" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">{t('admin.dashboard.adminDashboard')}</h2>
              <p className="text-muted-foreground">{t('admin.dashboard.completeAccess')}</p>
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
                  <p className={`text-2xl font-medium ${colorClass}`}>{stat.value}</p>
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
                  <p className={`text-2xl font-medium ${colorClass}`}>{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Admin Actions - Show for all roles */}
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-foreground mb-4 text-center">{t('admin.management.title')}</h3>
          
          {adminActions
            .filter(action => {
              // Only super_admin and reports_viewer can see "Manage Users"
              if (action.title === t('admin.management.users')) {
                return userRole === 'super_admin' || userRole === 'reports_viewer';
              }
              return true;
            })
            .map((action, index) => {
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
                  if (action.title === t('admin.management.users')) {
                    navigate("/admin/users");
                  } else if (action.title === t('admin.management.athletes')) {
                    navigate("/admin/athletes");
                  } else if (action.title === t('admin.management.payments')) {
                    navigate("/admin/payments");
                  } else if (action.title === t('admin.management.attendance')) {
                    navigate("/admin/attendance");
                  }
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-full ${bgColorClass} flex items-center justify-center flex-shrink-0`}>
                      <action.icon className={`h-6 w-6 ${textColorClass}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground mb-1 whitespace-normal break-words">{action.title}</h4>
                      <p className="text-sm text-muted-foreground whitespace-normal break-words">{action.description}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button 
                      variant="default" 
                      size="sm"
                      className="w-full sm:w-auto touch-friendly"
                    >
                      {userRole === 'reports_viewer' ? t('admin.management.view') : action.action}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Coach Training Management - Enhanced */}
        <div className="mt-6">
          <CoachTrainingManagement 
            userRole={userRole}
            athletes={athletes || []}
          />
        </div>

        {/* Alerts Management Card */}
        <div className="mt-6">
          <AlertsManagementCard userRole={userRole} currentUser={currentUser} />
        </div>

        {/* Coach Messages Management Card */}
        <div className="mt-6">
          <CoachMessagesManagementCard />
        </div>

        {/* Coach Payments Card */}
        <div className="mt-6">
          <CoachPaymentsCard userRole={userRole} />
        </div>

        {/* Reports Card */}
        <div className="mt-6">
          <ReportsCard />
        </div>
      </main>

      <SponsorBanner />
      <AppFooter />
      </>
      )}
    </div>
  );
};

export default AdministrationDashboard;