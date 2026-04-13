import { useNavigate } from "react-router-dom";
import { Euro, Landmark, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import AppHeader from "@/components/shared/AppHeader";
import AppFooter from "@/components/shared/AppFooter";
import { CoachPaymentsCard } from "@/components/admin/CoachPaymentsCard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";

const RevenueManagement = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [sessionValid, setSessionValid] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const adminSessionStr = localStorage.getItem('adminSession');
    if (!adminSessionStr) {
      toast({ title: t('login.sessionExpired'), description: t('login.pleaseLoginAgain'), variant: "destructive" });
      navigate("/login/administration");
      return;
    }
    try {
      const adminSession = JSON.parse(adminSessionStr);
      setSessionValid(true);
      setUserRole(adminSession.role || 'admin');
    } catch {
      localStorage.removeItem('adminSession');
      navigate("/login/administration");
    }
  }, [navigate, t]);

  const { data: paymentsData, isLoading } = useQuery({
    queryKey: ['all-payments-summary'],
    enabled: sessionValid,
    queryFn: async () => {
      const { data: paymentsRaw, error: paymentsError } = await supabase
        .from('payments')
        .select('amount_paid, amount_due, payment_date, status, month, year, athlete_id')
        .limit(10000);
      if (paymentsError) throw paymentsError;

      const { data: atletasRows } = await supabase
        .from('atletas')
        .select('athlete_id, surf_level, is_active, prior_balance')
        .limit(10000);

      const levelByAthleteId: Record<string, string | null> = {};
      const isActiveByAthleteId: Record<string, boolean> = {};
      (atletasRows || []).forEach((a: any) => {
        const key = String(a.athlete_id || '').trim().toLowerCase();
        if (key) {
          levelByAthleteId[key] = a?.surf_level ?? null;
          isActiveByAthleteId[key] = a?.is_active !== false;
        }
      });

      const now = new Date();
      const currentMonthNumber = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      const normalizeMonth = (month: string) => month?.trim().toLowerCase();
      const normalizeStatus = (status: string | null | undefined) =>
        (status ?? '').toString().toLowerCase().replace(/\s+/g, ' ').trim();

      const monthNameToNumber: { [key: string]: number } = {
        'january': 1, 'jan': 1, 'february': 2, 'feb': 2, 'march': 3, 'mar': 3,
        'april': 4, 'apr': 4, 'may': 5, 'june': 6, 'jun': 6, 'july': 7, 'jul': 7,
        'august': 8, 'aug': 8, 'september': 9, 'sep': 9, 'sept': 9, 'october': 10, 'oct': 10,
        'november': 11, 'nov': 11, 'december': 12, 'dec': 12,
        'janeiro': 1, 'fevereiro': 2, 'fev': 2, 'marco': 3, 'março': 3,
        'abril': 4, 'abr': 4, 'maio': 5, 'junho': 6, 'julho': 7,
        'agosto': 8, 'ago': 8, 'setembro': 9, 'set': 9, 'outubro': 10, 'out': 10,
        'novembro': 11, 'dezembro': 12, 'dez': 12,
      };

      // Current month payments
      const { data: monthRows } = await supabase
        .from('payments')
        .select('amount_paid, amount_due, status, month, year, athlete_id')
        .eq('year', currentYear)
        .limit(10000);

      const currentMonthPayments = (monthRows || []).filter((p: any) => {
        const monthNum = monthNameToNumber[normalizeMonth(p.month)] || 0;
        return monthNum === currentMonthNumber;
      });

      const totalReceivedThisMonth = currentMonthPayments
        .filter((p: any) => {
          const status = normalizeStatus(p.status);
          return status.startsWith('paid') || status.startsWith('partial');
        })
        .reduce((sum: number, r: any) => sum + Number(r.amount_paid || 0), 0);

      const currentMonthOutstandingLearning = currentMonthPayments
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

      const currentMonthOutstandingCompetition = currentMonthPayments
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

      // Annual from Sept 2025
      const { data: sept2025OnwardsRows } = await supabase
        .from('payments')
        .select('amount_paid, amount_due, month, year, athlete_id')
        .gte('year', 2025)
        .limit(10000);

      const currentMonthSerial = currentYear * 12 + currentMonthNumber;

      const annualFeesReceived = (sept2025OnwardsRows || [])
        .filter((p: any) => {
          if (p.year < 2025) return false;
          if (p.year === 2025) {
            const monthNum = monthNameToNumber[normalizeMonth(p.month)] || 0;
            if (monthNum < 9) return false;
          }
          const monthNum = monthNameToNumber[normalizeMonth(p.month)] || 0;
          const paymentSerial = (p.year || 0) * 12 + monthNum;
          if (paymentSerial > currentMonthSerial) return false;
          return true;
        })
        .reduce((sum: number, p: any) => sum + (p.amount_paid || 0), 0);

      // Prior balances
      let priorBalanceLearning = 0;
      let priorBalanceCompetition = 0;
      (atletasRows || []).forEach((a: any) => {
        const isActive = a?.is_active !== false;
        if (!isActive) return;
        const balance = Number(a.prior_balance || 0);
        if (balance <= 0) return;
        const level = (a?.surf_level || '').toLowerCase();
        if (level === 'learning' || level === 'pre-competition') priorBalanceLearning += balance;
        else if (level === 'competition') priorBalanceCompetition += balance;
      });

      const septemberOnwardsOutstandingLearning = (sept2025OnwardsRows || [])
        .filter((p: any) => {
          if (p.year < 2025) return false;
          if (p.year === 2025) {
            const monthNum = monthNameToNumber[normalizeMonth(p.month)] || 0;
            if (monthNum < 9) return false;
          }
          const monthNum = monthNameToNumber[normalizeMonth(p.month)] || 0;
          const paymentSerial = (p.year || 0) * 12 + monthNum;
          if (paymentSerial >= currentMonthSerial) return false;
          const aid = String(p.athlete_id || '').trim().toLowerCase();
          const isActive = isActiveByAthleteId[aid] ?? true;
          if (!isActive) return false;
          const level = levelByAthleteId[aid]?.toLowerCase() || '';
          return level === 'learning' || level === 'pre-competition';
        })
        .reduce((sum: number, p: any) => {
          const remaining = (p.amount_due || 0) - (p.amount_paid || 0);
          return sum + (remaining > 0 ? remaining : 0);
        }, 0) + priorBalanceLearning;

      const septemberOnwardsOutstandingCompetition = (sept2025OnwardsRows || [])
        .filter((p: any) => {
          if (p.year < 2025) return false;
          if (p.year === 2025) {
            const monthNum = monthNameToNumber[normalizeMonth(p.month)] || 0;
            if (monthNum < 9) return false;
          }
          const monthNum = monthNameToNumber[normalizeMonth(p.month)] || 0;
          const paymentSerial = (p.year || 0) * 12 + monthNum;
          if (paymentSerial >= currentMonthSerial) return false;
          const aid = String(p.athlete_id || '').trim().toLowerCase();
          const isActive = isActiveByAthleteId[aid] ?? true;
          if (!isActive) return false;
          const level = levelByAthleteId[aid]?.toLowerCase() || '';
          return level === 'competition';
        })
        .reduce((sum: number, p: any) => {
          const remaining = (p.amount_due || 0) - (p.amount_paid || 0);
          return sum + (remaining > 0 ? remaining : 0);
        }, 0) + priorBalanceCompetition;

      return {
        totalReceivedThisMonth,
        currentMonthOutstandingLearning,
        currentMonthOutstandingCompetition,
        annualFeesReceived,
        septemberOnwardsOutstandingLearning,
        septemberOnwardsOutstandingCompetition,
      };
    }
  });

  const fmt = (n: number | undefined) => (typeof n === 'number' && isFinite(n) ? n.toFixed(2) : '0.00');

  const financialStats = [
    { label: t('admin.stats.totalReceived'), value: `€${fmt(paymentsData?.annualFeesReceived)}`, color: "primary" },
    { label: t('admin.stats.totalReceivedMonth'), value: `€${fmt(paymentsData?.totalReceivedThisMonth)}`, color: "success" },
    { label: t('admin.stats.outstandingLearningMonth'), value: `€${fmt(paymentsData?.currentMonthOutstandingLearning)}`, color: "destructive" },
    { label: t('admin.stats.outstandingCompetitionMonth'), value: `€${fmt(paymentsData?.currentMonthOutstandingCompetition)}`, color: "destructive" },
    { label: t('admin.stats.outstandingLearningSept'), value: `€${fmt(paymentsData?.septemberOnwardsOutstandingLearning)}`, color: "warning" },
    { label: t('admin.stats.outstandingCompetitionSept'), value: `€${fmt(paymentsData?.septemberOnwardsOutstandingCompetition)}`, color: "warning" },
  ];

  const revenueActions = [
    {
      title: t('admin.management.payments'),
      description: t('admin.management.paymentsDesc'),
      icon: Euro,
      color: "warning",
      path: "/admin/payments",
    },
    {
      title: t('proAccount.title'),
      description: t('proAccount.dashboardDesc'),
      icon: Landmark,
      color: "primary",
      path: "/admin/pro-accounts",
    },
  ];

  if (!sessionValid) {
    return (
      <div className="min-h-screen bg-gradient-surface">
        <AppHeader title={t('admin.management.revenueManagement')} showBack backTo="/dashboard/administration" />
        <main className="mobile-container py-6">
          <div className="flex items-center justify-center min-h-[60vh]">
            <Skeleton className="h-8 w-48 mx-auto" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-surface">
      <AppHeader title={t('admin.management.revenueManagement')} showBack backTo="/dashboard/administration" />

      <main className="mobile-container py-6">
        {/* Financial Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {financialStats.map((stat, index) => {
            const colorClass =
              stat.color === "primary" ? "text-primary" :
              stat.color === "success" ? "text-success" :
              stat.color === "destructive" ? "text-destructive" :
              stat.color === "warning" ? "text-warning" :
              "text-foreground";

            return (
              <Card key={index} className="shadow-soft">
                <CardContent className="p-4 text-center">
                  {isLoading ? (
                    <Skeleton className="h-8 w-20 mx-auto mb-1" />
                  ) : (
                    <p className={`text-2xl font-medium ${colorClass}`}>{stat.value}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Management Cards */}
        <div className="space-y-4">
          {revenueActions.map((action, index) => {
            const bgColorClass =
              action.color === "primary" ? "bg-primary/10" :
              action.color === "warning" ? "bg-warning/10" :
              "bg-primary/10";
            const textColorClass =
              action.color === "primary" ? "text-primary" :
              action.color === "warning" ? "text-warning" :
              "text-primary";

            return (
              <Card
                key={index}
                className="shadow-soft hover:shadow-medium transition-shadow cursor-pointer"
                onClick={() => navigate(action.path)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-full ${bgColorClass} flex items-center justify-center flex-shrink-0`}>
                      <action.icon className={`h-6 w-6 ${textColorClass}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground mb-1">{action.title}</h4>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button variant="default" size="sm" className="w-full sm:w-auto touch-friendly">
                      {userRole === 'reports_viewer' ? t('admin.management.view') : action.title}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          <CoachPaymentsCard userRole={userRole} />
        </div>
      </main>

      <AppFooter />
    </div>
  );
};

export default RevenueManagement;
