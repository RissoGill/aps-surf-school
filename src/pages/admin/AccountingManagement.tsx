import { useNavigate } from "react-router-dom";
import { Euro, TrendingUp, TrendingDown, Calculator } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import AppHeader from "@/components/shared/AppHeader";
import AppFooter from "@/components/shared/AppFooter";
import { ExpensesCard } from "@/components/admin/ExpensesCard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";

const AccountingManagement = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [sessionValid, setSessionValid] = useState(false);

  useEffect(() => {
    const adminSessionStr = localStorage.getItem('adminSession');
    if (!adminSessionStr) {
      toast({ title: t('login.sessionExpired'), description: t('login.pleaseLoginAgain'), variant: "destructive" });
      navigate("/login/administration");
      return;
    }
    try {
      JSON.parse(adminSessionStr);
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

      // Expenses since September 2025
      const { data: allExpenses } = await supabase
        .from('expenses')
        .select('amount, expense_date, created_at');

      const expensesSinceSept = (allExpenses || []).filter((e: any) => {
        const d = new Date(e.expense_date);
        return (d.getFullYear() > 2025) || (d.getFullYear() === 2025 && d.getMonth() + 1 >= 9);
      });

      const totalExpensesSinceSept = expensesSinceSept.reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);

      // Expenses entered/created in current month (using created_at)
      const expensesCurrentMonth = (allExpenses || []).filter((e: any) => {
        const createdAt = new Date(e.created_at);
        return createdAt.getFullYear() === currentYear && createdAt.getMonth() + 1 === currentMonth;
      });

      const totalExpensesCurrentMonth = expensesCurrentMonth.reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);

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
        .eq('year', currentYear);

      const totalReceivedThisMonth = (monthPayments || [])
        .filter((p: any) => {
          const monthNum = monthNameToNumber[(p.month || '').trim().toLowerCase()] || 0;
          if (monthNum !== currentMonth) return false;
          const status = (p.status || '').toLowerCase().trim();
          return status.startsWith('paid') || status.startsWith('partial');
        })
        .reduce((sum: number, p: any) => sum + Number(p.amount_paid || 0), 0);

      const monthlyBalance = totalReceivedThisMonth - totalExpensesCurrentMonth;

      return {
        totalExpensesSinceSept,
        totalExpensesCurrentMonth,
        totalReceivedThisMonth,
        monthlyBalance,
      };
    },
  });

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
            <Card key={idx} className="shadow-sm">
              <CardContent className="p-4">
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

        {/* Expenses Management */}
        <ExpensesCard />
      </main>

      <AppFooter />
    </div>
  );
};

export default AccountingManagement;
