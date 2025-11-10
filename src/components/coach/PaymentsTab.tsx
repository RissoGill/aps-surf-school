import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Euro, Calendar, TrendingUp, Receipt } from "lucide-react";
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <Skeleton className="h-4 w-24 mb-3" />
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Euro className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">All Time</span>
            </div>
            <div className="text-3xl font-bold text-primary">{totalAllTime.toFixed(2)}€</div>
            <p className="text-xs text-muted-foreground mt-1">Total paid</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">This Year</span>
            </div>
            <div className="text-3xl font-bold text-blue-600">{totalThisYear.toFixed(2)}€</div>
            <p className="text-xs text-muted-foreground mt-1">{currentYear}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Average</span>
            </div>
            <div className="text-3xl font-bold text-green-600">{avgMonthly.toFixed(2)}€</div>
            <p className="text-xs text-muted-foreground mt-1">Per payment</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Receipt className="h-5 w-5 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Last Payment</span>
            </div>
            {lastPayment ? (
              <>
                <div className="text-3xl font-bold text-purple-600">{Number(lastPayment.amount).toFixed(2)}€</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(lastPayment.payment_date), 'dd/MM/yyyy')}
                </p>
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
          <h4 className="font-medium text-foreground">Payment History</h4>
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