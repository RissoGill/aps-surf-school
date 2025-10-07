import { useState, useEffect } from "react";
import { Heart, CreditCard, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import AppHeader from "@/components/shared/AppHeader";
import SponsorBanner from "@/components/shared/SponsorBanner";
import AppFooter from "@/components/shared/AppFooter";

const GuardianDashboard = () => {
  const { toast } = useToast();
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [guardianEmail, setGuardianEmail] = useState<string | null>(null);

  // Use demo guardian email for demo mode
  useEffect(() => {
    // For demo purposes, use an existing guardian email from the database
    setGuardianEmail('mmmarques82@gmail.com');
  }, []);

  // Fetch athletes linked to this guardian
  const { data: athletes, isLoading: athletesLoading } = useQuery({
    queryKey: ['guardian-athletes', guardianEmail],
    queryFn: async () => {
      if (!guardianEmail) return [];
      
      const { data, error } = await supabase
        .from('Atletas')
        .select('*')
        .or(`mother_email.eq.${guardianEmail},father_email.eq.${guardianEmail}`);
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to load athlete data",
          variant: "destructive",
        });
        throw error;
      }
      
      return data || [];
    },
    enabled: !!guardianEmail,
  });

  // Fetch payments for all guardian's athletes
  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ['guardian-payments', athletes],
    queryFn: async () => {
      if (!athletes || athletes.length === 0) return [];
      
      const athleteIds = athletes.map(a => a.Athlete_Id);
      
      const { data, error } = await supabase
        .from('Payments')
        .select('*')
        .in('athlete_id', athleteIds)
        .order('year', { ascending: false })
        .order('month', { ascending: false });
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to load payment data",
          variant: "destructive",
        });
        throw error;
      }
      
      return data || [];
    },
    enabled: !!athletes && athletes.length > 0,
  });

  // Filter payments by selected year if set
  const filteredPayments = selectedYear 
    ? payments?.filter(p => p.year === selectedYear) 
    : payments;

  // Get unique years for filtering
  const availableYears = Array.from(new Set(payments?.map(p => p.year) || [])).sort((a, b) => b - a);

  const getPaymentStatus = (payment: any) => {
    if (payment.status?.toLowerCase() === "paid" || payment.amount_paid >= payment.amount_due) {
      return { status: "Paid", color: "bg-success/10 text-success", icon: CheckCircle };
    } else if (payment.amount_paid > 0 && payment.amount_paid < payment.amount_due) {
      return { status: "Partial", color: "bg-warning/10 text-warning", icon: AlertCircle };
    } else {
      return { status: "Pending", color: "bg-destructive/10 text-destructive", icon: AlertCircle };
    }
  };

  const totalDue = filteredPayments?.reduce((sum, p) => sum + (p.amount_due || 0), 0) || 0;
  const totalPaid = filteredPayments?.reduce((sum, p) => sum + (p.amount_paid || 0), 0) || 0;
  const totalOutstanding = totalDue - totalPaid;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const getMonthName = (monthStr: string) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return months[parseInt(monthStr) - 1] || monthStr;
  };

  const isLoading = athletesLoading || paymentsLoading;
  const athlete = athletes?.[0]; // For now, display first athlete

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-surface flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!guardianEmail) {
    return (
      <div className="min-h-screen bg-gradient-surface">
        <AppHeader title="Guardian Dashboard" showBack backTo="/" />
        <main className="mobile-container py-6">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">Please log in to view your dashboard.</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!athlete) {
    return (
      <div className="min-h-screen bg-gradient-surface">
        <AppHeader title="Guardian Dashboard" showBack backTo="/" />
        <main className="mobile-container py-6">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No athlete found linked to your account.</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-surface">
      <AppHeader title="Guardian Dashboard" showBack backTo="/" />
      
      <main className="mobile-container py-6">
        {/* Child Info Header */}
        <Card className="shadow-medium mb-6">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-warning" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                {athlete.first_name} {athlete.last_name}
              </h2>
              <Badge className="bg-primary/10 text-primary mb-2">
                {athlete.surf_level || 'Beginner'} Level
              </Badge>
              <p className="text-sm text-muted-foreground">
                {athlete.trainings_per_week || 0} sessions per week
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tabs Navigation */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="payments" className="text-xs">Payments</TabsTrigger>
            <TabsTrigger value="attendance" className="text-xs">Attendance</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="text-lg">Payment Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-accent/50 rounded-lg">
                    <p className="text-lg font-bold text-foreground">{formatCurrency(totalDue)}</p>
                    <p className="text-xs text-muted-foreground">Total Due</p>
                  </div>
                  <div className="p-3 bg-success/10 rounded-lg">
                    <p className="text-lg font-bold text-success">{formatCurrency(totalPaid)}</p>
                    <p className="text-xs text-muted-foreground">Total Paid</p>
                  </div>
                  <div className="p-3 bg-destructive/10 rounded-lg">
                    <p className="text-lg font-bold text-destructive">{formatCurrency(totalOutstanding)}</p>
                    <p className="text-xs text-muted-foreground">Outstanding</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="text-lg">Recent Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredPayments?.slice(0, 3).map((payment) => {
                    const statusInfo = getPaymentStatus(payment);
                    const StatusIcon = statusInfo.icon;
                    
                    return (
                      <div key={payment.payment_id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div>
                          <p className="font-medium">{getMonthName(payment.month)} {payment.year}</p>
                          <p className="text-sm text-muted-foreground">{formatCurrency(payment.amount_due)}</p>
                        </div>
                        <Badge className={statusInfo.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusInfo.status}
                        </Badge>
                      </div>
                    );
                  })}
                  {(!filteredPayments || filteredPayments.length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-4">No payment records found</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-4">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-3 bg-accent/50 rounded-lg">
                    <p className="text-lg font-bold text-foreground">{formatCurrency(totalDue)}</p>
                    <p className="text-xs text-muted-foreground">Total Due</p>
                  </div>
                  <div className="text-center p-3 bg-success/10 rounded-lg">
                    <p className="text-lg font-bold text-success">{formatCurrency(totalPaid)}</p>
                    <p className="text-xs text-muted-foreground">Total Paid</p>
                  </div>
                  <div className="text-center p-3 bg-destructive/10 rounded-lg">
                    <p className="text-lg font-bold text-destructive">{formatCurrency(totalOutstanding)}</p>
                    <p className="text-xs text-muted-foreground">Outstanding</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Payment History</CardTitle>
                  <select
                    className="text-sm border rounded px-2 py-1"
                    value={selectedYear || ''}
                    onChange={(e) => setSelectedYear(e.target.value ? parseInt(e.target.value) : null)}
                  >
                    <option value="">All Years</option>
                    {availableYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <CardDescription>All payment records sorted by date</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredPayments?.map((payment) => {
                    const statusInfo = getPaymentStatus(payment);
                    const StatusIcon = statusInfo.icon;
                    
                    return (
                      <div 
                        key={payment.payment_id} 
                        className="p-4 border rounded-lg border-border"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{getMonthName(payment.month)} {payment.year}</h4>
                          <Badge className={statusInfo.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusInfo.status}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Amount Due: <span className="font-medium">{formatCurrency(payment.amount_due)}</span></p>
                          <p>Amount Paid: <span className="font-medium text-success">{formatCurrency(payment.amount_paid || 0)}</span></p>
                          {payment.payment_date && (
                            <p>Payment Date: <span className="font-medium">{payment.payment_date}</span></p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {(!filteredPayments || filteredPayments.length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-4">No payment records found</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance" className="space-y-4">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Attendance Records</CardTitle>
                <CardDescription>Training session attendance history</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center py-4">
                  Attendance tracking coming soon
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <SponsorBanner />
      <AppFooter />
    </div>
  );
};

export default GuardianDashboard;