import { useNavigate } from "react-router-dom";
import { Euro, TrendingUp, TrendingDown, Calculator } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import AppHeader from "@/components/shared/AppHeader";
import AppFooter from "@/components/shared/AppFooter";
import { ExpensesCard } from "@/components/admin/ExpensesCard";
import { ExpenseReportsCard } from "@/components/admin/ExpenseReportsCard";
import { CoachPaymentsCard } from "@/components/admin/CoachPaymentsCard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState, useMemo } from "react";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const AccountingManagement = () => {
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
      const session = JSON.parse(adminSessionStr);
      setUserRole(session.role || session.user_role || null);
      setSessionValid(true);
    } catch {
      localStorage.removeItem('adminSession');
      navigate("/login/administration");
    }
  }, [navigate, t]);

  const { data: statsData, isLoading } = useQuery({
    queryKey: ['accounting-stats'],
    enabled: sessionValid,
    queryFn: async () => {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      const [{ data: allExpenses }, { data: allCoachPayments }] = await Promise.all([
        supabase.from('expenses').select('amount, expense_date, created_at').limit(10000),
        supabase.from('coach_payments').select('amount, payment_date').limit(10000),
      ]);

      // Expenses since September 2025
      const expensesSinceSept = (allExpenses || []).filter((e: any) => {
        const d = new Date(e.expense_date);
        return (d.getFullYear() > 2025) || (d.getFullYear() === 2025 && d.getMonth() + 1 >= 9);
      });
      const totalExpensesSinceSept = expensesSinceSept.reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);

      // Coach payments (salaries) since September 2025
      const coachSinceSept = (allCoachPayments || []).filter((cp: any) => {
        const d = new Date(cp.payment_date);
        return (d.getFullYear() > 2025) || (d.getFullYear() === 2025 && d.getMonth() + 1 >= 9);
      });
      const totalCoachSinceSept = coachSinceSept.reduce((sum: number, cp: any) => sum + Number(cp.amount || 0), 0);

      // Expenses current month
      const expensesCurrentMonth = (allExpenses || []).filter((e: any) => {
        const d = new Date(e.expense_date);
        return d.getFullYear() === currentYear && d.getMonth() + 1 === currentMonth;
      });
      const totalExpensesCurrentMonth = expensesCurrentMonth.reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);

      // Coach payments current month
      const coachCurrentMonth = (allCoachPayments || []).filter((cp: any) => {
        const d = new Date(cp.payment_date);
        return d.getFullYear() === currentYear && d.getMonth() + 1 === currentMonth;
      });
      const totalCoachCurrentMonth = coachCurrentMonth.reduce((sum: number, cp: any) => sum + Number(cp.amount || 0), 0);

      // Revenue this month (from payments)
      const monthNameToNumber: Record<string, number> = {
        'january': 1, 'jan': 1, 'february': 2, 'feb': 2, 'march': 3, 'mar': 3,
        'april': 4, 'apr': 4, 'may': 5, 'june': 6, 'jun': 6, 'july': 7, 'jul': 7,
        'august': 8, 'aug': 8, 'september': 9, 'sep': 9, 'sept': 9, 'october': 10, 'oct': 10,
        'november': 11, 'nov': 11, 'december': 12, 'dec': 12,
        'janeiro': 1, 'fevereiro': 2, 'fev': 2, 'marco': 3, 'março': 3,
        'abril': 4, 'abr': 4, 'maio': 5, 'junho': 6, 'julho': 7,
        'agosto': 8, 'ago': 8, 'setembro': 9, 'set': 9, 'outubro': 10, 'out': 10,
        'novembro': 11, 'dezembro': 12, 'dez': 12,
      };

      const { data: monthPayments } = await supabase
        .from('payments')
        .select('amount_paid, status, month, year')
        .eq('year', currentYear)
        .limit(10000);

      const totalReceivedThisMonth = (monthPayments || [])
        .filter((p: any) => {
          const monthNum = monthNameToNumber[(p.month || '').trim().toLowerCase()] || 0;
          if (monthNum !== currentMonth) return false;
          const status = (p.status || '').toLowerCase().trim();
          return status.startsWith('paid') || status.startsWith('partial');
        })
        .reduce((sum: number, p: any) => sum + Number(p.amount_paid || 0), 0);

      const combinedExpensesSinceSept = totalExpensesSinceSept + totalCoachSinceSept;
      const combinedExpensesCurrentMonth = totalExpensesCurrentMonth + totalCoachCurrentMonth;
      const monthlyBalance = totalReceivedThisMonth - combinedExpensesCurrentMonth;

      return {
        totalExpensesSinceSept: combinedExpensesSinceSept,
        totalExpensesCurrentMonth: combinedExpensesCurrentMonth,
        totalReceivedThisMonth,
        monthlyBalance,
      };
    },
  });

  // Annual chart data query
  const monthNameToNumber: Record<string, number> = {
    'january': 1, 'jan': 1, 'february': 2, 'feb': 2, 'march': 3, 'mar': 3,
    'april': 4, 'apr': 4, 'may': 5, 'june': 6, 'jun': 6, 'july': 7, 'jul': 7,
    'august': 8, 'aug': 8, 'september': 9, 'sep': 9, 'sept': 9, 'october': 10, 'oct': 10,
    'november': 11, 'nov': 11, 'december': 12, 'dec': 12,
    'janeiro': 1, 'fevereiro': 2, 'fev': 2, 'marco': 3, 'março': 3,
    'abril': 4, 'abr': 4, 'maio': 5, 'junho': 6, 'julho': 7,
    'agosto': 8, 'ago': 8, 'setembro': 9, 'set': 9, 'outubro': 10, 'out': 10,
    'novembro': 11, 'dezembro': 12, 'dez': 12,
  };

  const { data: chartQueryData, isLoading: chartLoading } = useQuery({
    queryKey: ['annual-chart-data'],
    enabled: sessionValid,
    queryFn: async () => {
      const [{ data: seasonExpenses }, { data: payments2025 }, { data: payments2026 }, { data: coachPayments }] = await Promise.all([
        supabase.from('expenses').select('amount, expense_date')
          .gte('expense_date', '2025-09-01').lte('expense_date', '2026-08-31').limit(10000),
        supabase.from('payments').select('amount_paid, status, month, year').eq('year', 2025).limit(10000),
        supabase.from('payments').select('amount_paid, status, month, year').eq('year', 2026).limit(10000),
        supabase.from('coach_payments').select('amount, payment_date')
          .gte('payment_date', '2025-09-01').lte('payment_date', '2026-08-31').limit(10000),
      ]);
      return { seasonExpenses: seasonExpenses || [], allPayments: [...(payments2025 || []), ...(payments2026 || [])], coachPayments: coachPayments || [] };
    },
  });

  const seasonMonths = [
    { month: 9, year: 2025, label: "Set" },
    { month: 10, year: 2025, label: "Out" },
    { month: 11, year: 2025, label: "Nov" },
    { month: 12, year: 2025, label: "Dez" },
    { month: 1, year: 2026, label: "Jan" },
    { month: 2, year: 2026, label: "Fev" },
    { month: 3, year: 2026, label: "Mar" },
    { month: 4, year: 2026, label: "Abr" },
    { month: 5, year: 2026, label: "Mai" },
    { month: 6, year: 2026, label: "Jun" },
    { month: 7, year: 2026, label: "Jul" },
    { month: 8, year: 2026, label: "Ago" },
  ];

  const chartData = useMemo(() => {
    if (!chartQueryData) return [];
    return seasonMonths.map(sm => {
      const expTotal = chartQueryData.seasonExpenses
        .filter((e: any) => { const d = new Date(e.expense_date); return d.getFullYear() === sm.year && d.getMonth() + 1 === sm.month; })
        .reduce((s: number, e: any) => s + Number(e.amount || 0), 0);

      const coachTotal = chartQueryData.coachPayments
        .filter((cp: any) => { const d = new Date(cp.payment_date); return d.getFullYear() === sm.year && d.getMonth() + 1 === sm.month; })
        .reduce((s: number, cp: any) => s + Number(cp.amount || 0), 0);

      const revTotal = chartQueryData.allPayments
        .filter((p: any) => {
          const mn = monthNameToNumber[(p.month || '').trim().toLowerCase()] || 0;
          if (mn !== sm.month || p.year !== sm.year) return false;
          const st = (p.status || '').toLowerCase().trim();
          return st.startsWith('paid') || st.startsWith('partial');
        })
        .reduce((s: number, p: any) => s + Number(p.amount_paid || 0), 0);

      return { label: sm.label, revenue: revTotal, expenses: expTotal + coachTotal };
    });
  }, [chartQueryData]);

  const chartConfig = {
    revenue: { label: t('admin.stats.chartRevenue'), color: "hsl(var(--primary))" },
    expenses: { label: t('admin.stats.chartExpenses'), color: "hsl(var(--destructive))" },
  };

  if (!sessionValid) return null;

  const stats = [
    {
      label: t('admin.stats.totalExpensesSept'),
      value: statsData?.totalExpensesSinceSept ?? 0,
      icon: Euro,
      color: 'text-destructive',
    },
    {
      label: t('admin.stats.expensesCurrentMonth'),
      value: statsData?.totalExpensesCurrentMonth ?? 0,
      icon: TrendingDown,
      color: 'text-destructive',
    },
    {
      label: t('admin.stats.totalReceivedMonth'),
      value: statsData?.totalReceivedThisMonth ?? 0,
      icon: TrendingUp,
      color: 'text-primary',
    },
    {
      label: t('admin.stats.monthlyBalance'),
      value: statsData?.monthlyBalance ?? 0,
      icon: Calculator,
      color: (statsData?.monthlyBalance ?? 0) >= 0 ? 'text-primary' : 'text-destructive',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title={t('admin.management.accounting')} showBack backTo="/dashboard/administration" />

      <main className="mobile-container py-6">
        {/* Financial Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {stats.map((stat, idx) => (
            <Card key={idx} className="shadow-sm h-full">
              <CardContent className="p-4 h-full">
                {isLoading ? (
                  <Skeleton className="h-12 w-full" />
                ) : (
                  <div className="flex flex-col items-center text-center h-full justify-between">
                    <div className="flex items-center gap-2 mb-1">
                      <stat.icon className={`h-4 w-4 ${stat.color}`} />
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                    <p className={`text-lg font-bold ${stat.color}`}>
                      €{stat.value.toFixed(2)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Annual Season Chart */}
        <Card className="shadow-sm mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">{t('admin.stats.seasonTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            {chartLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : (
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <BarChart data={chartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={(v) => `€${v}`} tickLine={false} axisLine={false} width={60} />
                  <ChartTooltip content={<ChartTooltipContent formatter={(value) => `€${Number(value).toFixed(2)}`} />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill="var(--color-expenses)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Expenses Management */}
        <ExpensesCard />

        {/* Coach Payments */}
        <CoachPaymentsCard userRole={userRole} />

        {/* Expense Reports */}
        <ExpenseReportsCard />
      </main>

      <AppFooter />
    </div>
  );
};

export default AccountingManagement;
