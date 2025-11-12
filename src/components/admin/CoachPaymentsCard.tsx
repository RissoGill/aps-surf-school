import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface CoachPayment {
  id: string;
  coach_id: string;
  payment_date: string;
  amount: number;
  payment_month: string;
  payment_year: number;
  notes: string | null;
  created_at: string;
}

interface Coach {
  coach_id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: boolean;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const CoachPaymentsCard = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<CoachPayment | null>(null);
  const [selectedCoachFilter, setSelectedCoachFilter] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>("all");
  
  const [formData, setFormData] = useState({
    coach_id: "",
    payment_date: new Date(),
    amount: "",
    payment_month: "",
    payment_year: new Date().getFullYear(),
    notes: "",
  });

  // Fetch all coaches
  const { data: coaches } = useQuery({
    queryKey: ['coaches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coach')
        .select('coach_id, first_name, last_name, email, status')
        .order('first_name');
      
      if (error) throw error;
      return data as Coach[];
    },
  });

  // Fetch all coach payments
  const { data: payments, isLoading } = useQuery({
    queryKey: ['coach-payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coach_payments')
        .select('*')
        .order('payment_date', { ascending: false });
      
      if (error) throw error;
      return data as CoachPayment[];
    },
  });

  // Add/Update payment mutation
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingPayment) {
        const { error } = await supabase
          .from('coach_payments')
          .update(data)
          .eq('id', editingPayment.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('coach_payments')
          .insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach-payments'] });
      queryClient.invalidateQueries({ queryKey: ['all-payments-summary'] });
      toast({
        title: "Success",
        description: `Payment ${editingPayment ? 'updated' : 'added'} successfully`,
      });
      handleCloseDialog();
    },
    onError: (error: any) => {
      const isRLSError = error.message?.toLowerCase().includes('row-level security') || 
                         error.message?.toLowerCase().includes('policy');
      toast({
        title: "Error",
        description: isRLSError 
          ? "Permission denied. Your session may have expired. Please refresh the page or log in again."
          : error.message,
        variant: "destructive",
      });
    },
  });

  // Delete payment mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('coach_payments')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach-payments'] });
      queryClient.invalidateQueries({ queryKey: ['all-payments-summary'] });
      toast({
        title: "Success",
        description: "Payment deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingPayment(null);
    setFormData({
      coach_id: "",
      payment_date: new Date(),
      amount: "",
      payment_month: "",
      payment_year: new Date().getFullYear(),
      notes: "",
    });
  };

  const handleEdit = (payment: CoachPayment) => {
    setEditingPayment(payment);
    setFormData({
      coach_id: payment.coach_id,
      payment_date: new Date(payment.payment_date),
      amount: payment.amount.toString(),
      payment_month: payment.payment_month,
      payment_year: payment.payment_year,
      notes: payment.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.coach_id || !formData.amount || !formData.payment_month) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    saveMutation.mutate({
      coach_id: formData.coach_id,
      payment_date: format(formData.payment_date, 'yyyy-MM-dd'),
      amount: parseFloat(formData.amount),
      payment_month: formData.payment_month,
      payment_year: formData.payment_year,
      notes: formData.notes || null,
    });
  };

  // Create coach name map
  const getCoachName = (coachId: string) => {
    const coach = coaches?.find(c => c.coach_id === coachId);
    if (coach) {
      return [coach.first_name, coach.last_name].filter(Boolean).join(' ').trim() || coachId;
    }
    return coachId;
  };

  // Get unique years from payments
  const availableYears = useMemo(() => {
    const years = new Set(payments?.map(p => p.payment_year) || []);
    return Array.from(years).sort((a, b) => b - a);
  }, [payments]);

  // Calculate key statistics
  const stats = useMemo(() => {
    if (!payments?.length) {
      console.debug('No payments data available');
      return { sinceSeptember: 0, currentMonth: 0, average: 0 };
    }
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = MONTHS[now.getMonth()];
    const septemberIndex = 8; // September is index 8
    
    console.debug('Current date:', now);
    console.debug('Current month:', currentMonth);
    console.debug('Total payments:', payments.length);
    
    // Total from September onwards (Sept current year or Sept previous year for academic year)
    const sinceSeptember = payments
      .filter(p => {
        const paymentYear = Number(p.payment_year);
        const monthIndex = MONTHS.indexOf(p.payment_month);
        
        // Academic year: Sept previous year to Aug current year, or Sept current year onwards
        if (paymentYear > currentYear) return true;
        if (paymentYear === currentYear) {
          return monthIndex >= septemberIndex;
        }
        // Include previous year Sept-Dec if we're in Jan-Aug
        if (paymentYear === currentYear - 1 && now.getMonth() < septemberIndex) {
          return monthIndex >= septemberIndex;
        }
        return false;
      })
      .reduce((sum, p) => sum + Number(p.amount), 0);
    
    console.debug('Since September total:', sinceSeptember);
    
    // Current month total
    const currentMonthTotal = payments
      .filter(p => {
        const matches = Number(p.payment_year) === currentYear && p.payment_month === currentMonth;
        return matches;
      })
      .reduce((sum, p) => sum + Number(p.amount), 0);
    
    console.debug('Current month total:', currentMonthTotal);
    
    // Average per coach
    const totalPayments = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const uniqueCoaches = new Set(payments.map(p => p.coach_id)).size;
    const averagePerCoach = uniqueCoaches > 0 ? totalPayments / uniqueCoaches : 0;
    
    console.debug('Average per coach:', averagePerCoach, '(', uniqueCoaches, 'coaches)');
    
    return {
      sinceSeptember,
      currentMonth: currentMonthTotal,
      average: averagePerCoach,
    };
  }, [payments]);

  // Monthly breakdown for selected year
  const monthlyBreakdown = useMemo(() => {
    const breakdown: Record<string, { payments: CoachPayment[], total: number }> = {};
    
    MONTHS.forEach(month => {
      breakdown[month] = { payments: [], total: 0 };
    });
    
    payments?.forEach(payment => {
      if (payment.payment_year === selectedYear) {
        const month = payment.payment_month;
        if (breakdown[month]) {
          breakdown[month].payments.push(payment);
          breakdown[month].total += Number(payment.amount);
        }
      }
    });
    
    return breakdown;
  }, [payments, selectedYear]);

  // Filter payments for history tab
  const filteredPayments = useMemo(() => {
    return payments?.filter(p => {
      const coachMatch = selectedCoachFilter === "all" || p.coach_id === selectedCoachFilter;
      const monthMatch = selectedMonthFilter === "all" || p.payment_month === selectedMonthFilter;
      return coachMatch && monthMatch;
    });
  }, [payments, selectedCoachFilter, selectedMonthFilter]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold">Coach Payments</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Payment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingPayment ? 'Edit' : 'Add'} Payment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Coach Name *</Label>
                  <Select
                    value={formData.coach_id}
                    onValueChange={(value) => setFormData({ ...formData, coach_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select coach" />
                    </SelectTrigger>
                    <SelectContent>
                      {coaches?.map((coach) => (
                        <SelectItem key={coach.coach_id} value={coach.coach_id}>
                          {coach.first_name} {coach.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Payment Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.payment_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.payment_date ? format(formData.payment_date, "dd/MM/yyyy") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.payment_date}
                        onSelect={(date) => date && setFormData({ ...formData, payment_date: date })}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (€) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="350.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Payment For Month *</Label>
                  <Select
                    value={formData.payment_month}
                    onValueChange={(value) => setFormData({ ...formData, payment_month: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((month) => (
                        <SelectItem key={month} value={month}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Payment method, notes..."
                    rows={2}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button onClick={handleSubmit} className="flex-1">
                    {editingPayment ? 'Update' : 'Add'} Payment
                  </Button>
                  <Button variant="outline" onClick={handleCloseDialog}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Tabs */}
        <Tabs defaultValue="monthly" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="monthly">By Month</TabsTrigger>
            <TabsTrigger value="history">Payment History</TabsTrigger>
          </TabsList>

          {/* By Month Tab */}
          <TabsContent value="monthly" className="space-y-4 mt-4">
            <div className="flex items-center gap-3">
              <Label className="text-sm">Year:</Label>
              <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {MONTHS.map(month => {
                const data = monthlyBreakdown[month];
                const hasPayments = data.payments.length > 0;
                
                return (
                  <Card key={month} className={cn(!hasPayments && "opacity-50")}>
                    <CardContent className="p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">{month.slice(0, 3)}</p>
                      <p className="text-sm font-semibold">{data.total.toFixed(0)}€</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Payment History Tab */}
          <TabsContent value="history" className="space-y-4 mt-4">
            <div className="flex flex-wrap gap-3">
              <Select value={selectedCoachFilter} onValueChange={setSelectedCoachFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Coaches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Coaches</SelectItem>
                  {coaches?.map((coach) => (
                    <SelectItem key={coach.coach_id} value={coach.coach_id}>
                      {coach.first_name} {coach.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedMonthFilter} onValueChange={setSelectedMonthFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {MONTHS.map(month => (
                    <SelectItem key={month} value={month}>{month}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Coach</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>For Month</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : filteredPayments && filteredPayments.length > 0 ? (
                    filteredPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">
                          <span className="block truncate max-w-[180px]" title={getCoachName(payment.coach_id)}>
                            {getCoachName(payment.coach_id)}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(payment.payment_date), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {payment.payment_month.slice(0, 3)} {payment.payment_year}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {Number(payment.amount).toFixed(2)}€
                        </TableCell>
                        <TableCell>
                          <span className="block truncate max-w-[200px] text-sm text-muted-foreground">
                            {payment.notes || '-'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(payment)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm('Delete this payment?')) {
                                  deleteMutation.mutate(payment.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No payments found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};