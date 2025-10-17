import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, Search, CheckCircle, AlertCircle, Clock, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import AppHeader from "@/components/shared/AppHeader";
import SponsorBanner from "@/components/shared/SponsorBanner";
import AppFooter from "@/components/shared/AppFooter";

interface Payment {
  payment_id: string;
  athlete_id: string;
  year: number;
  month: string;
  amount_due: number;
  amount_paid: number;
  status: string;
  payment_date: string | null;
  athlete_name?: string;
}

const PaymentManagement = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch payments with athlete names
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['admin-payments'],
    queryFn: async () => {
      const [paymentsRes, athletesRes] = await Promise.all([
        supabase
          .from('payments')
          .select('*')
          .order('year', { ascending: false })
          .order('month', { ascending: false }),
        supabase
          .from('atletas')
          .select('athlete_id, first_name, last_name')
      ]);

      if (paymentsRes.error) throw paymentsRes.error;
      if (athletesRes.error) throw athletesRes.error;

      // Create athlete name map
      const athleteMap = new Map(
        (athletesRes.data || []).map(a => [
          String(a.athlete_id || '').trim().toUpperCase(),
          `${a.first_name || ''} ${a.last_name || ''}`.trim()
        ])
      );

      // Map payments with athlete names
      return (paymentsRes.data || []).map(payment => {
        const athleteKey = String(payment.athlete_id || '').trim().toUpperCase();
        return {
          ...payment,
          athlete_name: athleteMap.get(athleteKey) || payment.athlete_id || 'Unknown'
        } as Payment;
      });
    }
  });

  // Filter payments by search query
  const filteredPayments = payments.filter(payment =>
    payment.athlete_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate payment status
  const getPaymentStatus = (payment: Payment) => {
    const amountDue = payment.amount_due || 0;
    const amountPaid = payment.amount_paid || 0;

    if (amountPaid === 0) {
      return { label: "Unpaid", color: "bg-destructive/10 text-destructive", icon: AlertCircle };
    } else if (amountPaid >= amountDue) {
      return { label: "Paid", color: "bg-success/10 text-success", icon: CheckCircle };
    } else {
      return { label: "Partial", color: "bg-warning/10 text-warning", icon: Clock };
    }
  };

  // Calculate summary statistics
  const totalPaid = payments
    .reduce((sum, p) => sum + (p.amount_paid || 0), 0);

  const totalDue = payments
    .reduce((sum, p) => sum + (p.amount_due || 0), 0);

  const totalOutstanding = totalDue - totalPaid;

  return (
    <div className="min-h-screen bg-gradient-surface">
      <AppHeader title="Payment Management" showBack backTo="/dashboard/administration" />
      
      <main className="mobile-container py-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">Payments</h2>
          <p className="text-muted-foreground">{filteredPayments.length} payment records</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by athlete name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 touch-friendly"
            />
          </div>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="shadow-soft">
            <CardContent className="p-4 text-center">
              <DollarSign className="h-6 w-6 text-success mx-auto mb-2" />
              <p className="text-lg font-bold text-foreground">€{totalPaid.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Total Paid</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-soft">
            <CardContent className="p-4 text-center">
              <AlertCircle className="h-6 w-6 text-destructive mx-auto mb-2" />
              <p className="text-lg font-bold text-foreground">€{totalOutstanding.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Outstanding</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-soft col-span-2">
            <CardContent className="p-4 text-center">
              <Clock className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-xl font-bold text-foreground">€{totalDue.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">Total Amount Due</p>
            </CardContent>
          </Card>
        </div>

        {/* Payments Table */}
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl font-bold">
              <CreditCard className="h-6 w-6" />
              Payment Records
            </CardTitle>
            <CardDescription>View and manage athlete payments</CardDescription>
          </CardHeader>
          
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading payments...</div>
            ) : filteredPayments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No payments found</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Athlete</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Amount Due</TableHead>
                      <TableHead>Amount Paid</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.map((payment) => {
                      const status = getPaymentStatus(payment);
                      const StatusIcon = status.icon;
                      
                      return (
                        <TableRow key={payment.payment_id}>
                          <TableCell className="font-medium">{payment.athlete_name}</TableCell>
                          <TableCell>{payment.month} {payment.year}</TableCell>
                          <TableCell>€{(payment.amount_due || 0).toFixed(2)}</TableCell>
                          <TableCell>€{(payment.amount_paid || 0).toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge className={status.color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {payment.payment_date 
                              ? new Date(payment.payment_date).toLocaleDateString()
                              : '-'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <SponsorBanner />
      <AppFooter />
    </div>
  );
};

export default PaymentManagement;