import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { User, Plus, Trash2, Edit, Euro } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
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
        .select('coach_id, first_name, last_name, email')
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
      toast({
        title: "Success",
        description: `Payment ${editingPayment ? 'updated' : 'added'} successfully`,
      });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
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

  // Filter payments by selected coach
  const filteredPayments = payments?.filter(
    p => selectedCoachFilter === "all" || p.coach_id === selectedCoachFilter
  );

  // Calculate totals by coach
  const paymentsByCoach = coaches?.map(coach => {
    const coachPayments = payments?.filter(p => p.coach_id === coach.coach_id) || [];
    const total = coachPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const currentYear = new Date().getFullYear();
    const yearTotal = coachPayments
      .filter(p => p.payment_year === currentYear)
      .reduce((sum, p) => sum + Number(p.amount), 0);
    
    return {
      coach,
      total,
      yearTotal,
      count: coachPayments.length,
    };
  });

  return (
    <Card className="shadow-lg">
      <CardHeader className="border-b border-border/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Euro className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Coach Payments</CardTitle>
              <CardDescription>Manage payments to coaches</CardDescription>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Payment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingPayment ? 'Edit' : 'Add'} Payment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="coach">Coach *</Label>
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
                        {formData.payment_date ? format(formData.payment_date, "PPP") : <span>Pick a date</span>}
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
                  <Label htmlFor="month">Payment For Month *</Label>
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
                  <Label htmlFor="year">Payment For Year *</Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.payment_year}
                    onChange={(e) => setFormData({ ...formData, payment_year: parseInt(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Payment method, etc.)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Bank transfer - First installment..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 pt-4">
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

      <CardContent className="p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {paymentsByCoach?.slice(0, 3).map(({ coach, total, yearTotal, count }) => (
            <Card key={coach.coach_id} className="bg-muted/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {coach.first_name} {coach.last_name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-primary">{total.toFixed(2)}€</div>
                  <div className="text-xs text-muted-foreground">Total all time</div>
                  <div className="text-sm">
                    <span className="font-semibold">{yearTotal.toFixed(2)}€</span>
                    <span className="text-muted-foreground"> this year</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{count} payment{count !== 1 ? 's' : ''}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filter */}
        <div className="mb-4">
          <Label>Filter by Coach</Label>
          <Select value={selectedCoachFilter} onValueChange={setSelectedCoachFilter}>
            <SelectTrigger className="w-64">
              <SelectValue />
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
        </div>

        {/* Payments Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Coach</TableHead>
                <TableHead>Payment Date</TableHead>
                <TableHead>For Month/Year</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading payments...
                  </TableCell>
                </TableRow>
              ) : filteredPayments && filteredPayments.length > 0 ? (
                filteredPayments.map((payment) => {
                  const coach = coaches?.find(c => c.coach_id === payment.coach_id);
                  return (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        {coach ? `${coach.first_name} ${coach.last_name}` : payment.coach_id}
                      </TableCell>
                      <TableCell>{format(new Date(payment.payment_date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {payment.payment_month} {payment.payment_year}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-primary">
                        {Number(payment.amount).toFixed(2)}€
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {payment.notes || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
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
                              if (confirm('Are you sure you want to delete this payment?')) {
                                deleteMutation.mutate(payment.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
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
      </CardContent>
    </Card>
  );
};