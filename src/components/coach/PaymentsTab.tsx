import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Euro, Calendar, TrendingUp } from "lucide-react";
import { format } from "date-fns";

interface CoachPayment {
  id: string;
  coach_id: string;
  payment_date: string;
  amount: number;
  payment_month: string;
  payment_year: number;
  notes: string | null;
}

interface PaymentsTabProps {
  coachId: string;
}

export const PaymentsTab = ({ coachId }: PaymentsTabProps) => {
  const { data: payments, isLoading } = useQuery({
    queryKey: ['coach-payments', coachId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coach_payments')
        .select('*')
        .eq('coach_id', coachId)
        .order('payment_date', { ascending: false });
      
      if (error) throw error;
      return data as CoachPayment[];
    },
  });

  const currentYear = new Date().getFullYear();
  
  const totalAllTime = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
  const totalThisYear = payments?.filter(p => p.payment_year === currentYear)
    .reduce((sum, p) => sum + Number(p.amount), 0) || 0;
  
  const lastPayment = payments?.[0];
  const avgMonthly = payments && payments.length > 0 
    ? totalAllTime / payments.length 
    : 0;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <Euro className="h-4 w-4" />
              Total All Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalAllTime.toFixed(2)}€</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              This Year ({currentYear})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalThisYear.toFixed(2)}€</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Average Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgMonthly.toFixed(2)}€</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Last Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lastPayment ? (
              <>
                <div className="text-2xl font-bold">{Number(lastPayment.amount).toFixed(2)}€</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {format(new Date(lastPayment.payment_date), 'dd/MM/yyyy')}
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">No payments yet</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>All payments received</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment Date</TableHead>
                  <TableHead>For Month/Year</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments && payments.length > 0 ? (
                  payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        {format(new Date(payment.payment_date), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {payment.payment_month} {payment.payment_year}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-primary">
                        {Number(payment.amount).toFixed(2)}€
                      </TableCell>
                      <TableCell className="max-w-md">
                        {payment.notes || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No payments found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};