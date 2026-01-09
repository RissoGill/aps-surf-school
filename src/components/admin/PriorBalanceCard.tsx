import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { History, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface PriorBalancePayment {
  id: string;
  athlete_id: string;
  amount: number;
  payment_date: string;
  notes: string | null;
  invoice_number: string | null;
  entity: string | null;
  created_at: string;
  created_by: string | null;
}

interface PriorBalanceCardProps {
  athleteId: string;
  priorBalance: number;
  userRole: string;
  onBalanceUpdated: () => void;
}

const PriorBalanceCard = ({ 
  athleteId, 
  priorBalance, 
  userRole,
  onBalanceUpdated 
}: PriorBalanceCardProps) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    payment_date: new Date().toISOString().split('T')[0],
    invoice_number: "",
    entity: "",
    notes: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch prior balance payments history
  const { data: priorBalancePayments = [], refetch: refetchPayments } = useQuery({
    queryKey: ['prior-balance-payments', athleteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prior_balance_payments')
        .select('*')
        .eq('athlete_id', athleteId)
        .order('payment_date', { ascending: false });
      
      if (error) throw error;
      return data as PriorBalancePayment[];
    },
    enabled: !!athleteId
  });

  // Calculate total paid from prior balance
  const totalPaidFromPriorBalance = priorBalancePayments.reduce(
    (sum, p) => sum + Number(p.amount), 
    0
  );

  // Check if user can edit (not reports_viewer)
  const canEdit = userRole !== 'reports_viewer';

  const handlePayFullAmount = () => {
    setPaymentForm(prev => ({
      ...prev,
      amount: priorBalance.toFixed(2)
    }));
  };

  const handleSubmitPayment = async () => {
    const amount = parseFloat(paymentForm.amount);
    
    // Validations
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: t('admin.paymentManagement.validationError'),
        description: t('admin.priorBalancePayments.invalidAmount'),
        variant: "destructive"
      });
      return;
    }

    if (amount > priorBalance) {
      toast({
        title: t('admin.paymentManagement.validationError'),
        description: t('admin.priorBalancePayments.amountExceedsBalance'),
        variant: "destructive"
      });
      return;
    }

    if (!paymentForm.payment_date) {
      toast({
        title: t('admin.paymentManagement.validationError'),
        description: t('admin.priorBalancePayments.dateRequired'),
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Insert payment record
      const { error: insertError } = await supabase
        .from('prior_balance_payments')
        .insert({
          athlete_id: athleteId,
          amount: amount,
          payment_date: paymentForm.payment_date,
          notes: paymentForm.notes || null,
          invoice_number: paymentForm.invoice_number || null,
          entity: paymentForm.entity || null,
          created_by: userRole
        });

      if (insertError) throw insertError;

      // 2. Update athlete's prior_balance
      const newBalance = priorBalance - amount;
      const { error: updateError } = await supabase
        .from('atletas')
        .update({ prior_balance: newBalance })
        .eq('athlete_id', athleteId);

      if (updateError) throw updateError;

      // 3. Success
      toast({
        title: t('admin.paymentManagement.success'),
        description: t('admin.priorBalancePayments.paymentRegistered'),
      });

      // 4. Reset form and close dialog
      setPaymentForm({
        amount: "",
        payment_date: new Date().toISOString().split('T')[0],
        invoice_number: "",
        entity: "",
        notes: ""
      });
      setIsDialogOpen(false);

      // 5. Refresh data
      refetchPayments();
      queryClient.invalidateQueries({ queryKey: ['athletes-search'] });
      onBalanceUpdated();

    } catch (error: any) {
      console.error('Error registering prior balance payment:', error);
      toast({
        title: t('admin.paymentManagement.error'),
        description: error.message || t('admin.priorBalancePayments.paymentFailed'),
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <Card className="shadow-soft">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header with icon and values */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-muted">
                <History className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className={`text-xl font-medium ${priorBalance > 0 ? 'text-destructive' : 'text-success'}`}>
                  €{priorBalance.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('admin.paymentManagement.priorBalance')}
                </p>
              </div>
            </div>

            {/* Register Payment Button */}
            {canEdit && priorBalance > 0 && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Plus className="h-4 w-4" />
                    {t('admin.priorBalancePayments.registerPayment')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>{t('admin.priorBalancePayments.registerPayment')}</DialogTitle>
                    <DialogDescription>
                      {t('admin.priorBalancePayments.dialogDescription')}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid gap-4 py-4">
                    {/* Amount */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="amount">{t('admin.priorBalancePayments.amount')}</Label>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          onClick={handlePayFullAmount}
                          className="text-xs h-7"
                        >
                          {t('admin.priorBalancePayments.payFullAmount')} (€{priorBalance.toFixed(2)})
                        </Button>
                      </div>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={priorBalance}
                        placeholder="0.00"
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                      />
                    </div>

                    {/* Payment Date */}
                    <div className="space-y-2">
                      <Label htmlFor="payment_date">{t('admin.priorBalancePayments.paymentDate')}</Label>
                      <Input
                        id="payment_date"
                        type="date"
                        value={paymentForm.payment_date}
                        onChange={(e) => setPaymentForm(prev => ({ ...prev, payment_date: e.target.value }))}
                      />
                    </div>

                    {/* Invoice Number */}
                    <div className="space-y-2">
                      <Label htmlFor="invoice_number">{t('admin.paymentManagement.invoiceNumber')}</Label>
                      <Input
                        id="invoice_number"
                        placeholder={t('admin.paymentManagement.invoiceNumberPlaceholder')}
                        value={paymentForm.invoice_number}
                        onChange={(e) => setPaymentForm(prev => ({ ...prev, invoice_number: e.target.value }))}
                      />
                    </div>

                    {/* Entity */}
                    <div className="space-y-2">
                      <Label htmlFor="entity">{t('admin.paymentManagement.entity')}</Label>
                      <Input
                        id="entity"
                        placeholder={t('admin.paymentManagement.entityPlaceholder')}
                        value={paymentForm.entity}
                        onChange={(e) => setPaymentForm(prev => ({ ...prev, entity: e.target.value }))}
                      />
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                      <Label htmlFor="notes">{t('admin.paymentManagement.notes')}</Label>
                      <Textarea
                        id="notes"
                        placeholder={t('admin.priorBalancePayments.notesPlaceholder')}
                        value={paymentForm.notes}
                        onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                        rows={2}
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      {t('common.cancel')}
                    </Button>
                    <Button onClick={handleSubmitPayment} disabled={isSubmitting}>
                      {isSubmitting ? t('common.loading') : t('common.save')}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Total Paid Info */}
          {totalPaidFromPriorBalance > 0 && (
            <p className="text-xs text-muted-foreground">
              {t('admin.priorBalancePayments.totalPaid')}: €{totalPaidFromPriorBalance.toFixed(2)}
            </p>
          )}

          {/* Payment History Collapsible */}
          {priorBalancePayments.length > 0 && (
            <Collapsible open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between p-0 h-8">
                  <span className="text-xs text-muted-foreground">
                    {t('admin.priorBalancePayments.history')} ({priorBalancePayments.length})
                  </span>
                  {isHistoryOpen ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 pt-2">
                {priorBalancePayments.map((payment) => (
                  <div 
                    key={payment.id} 
                    className="flex items-center justify-between text-xs p-2 bg-muted/50 rounded-md"
                  >
                    <div className="flex-1">
                      <span className="font-medium">{formatDate(payment.payment_date)}</span>
                      {payment.invoice_number && (
                        <span className="text-muted-foreground ml-2">
                          • {payment.invoice_number}
                        </span>
                      )}
                      {payment.notes && (
                        <p className="text-muted-foreground mt-0.5 truncate max-w-[180px]">
                          {payment.notes}
                        </p>
                      )}
                    </div>
                    <span className="font-medium text-success">
                      €{Number(payment.amount).toFixed(2)}
                    </span>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* No payments yet message */}
          {priorBalancePayments.length === 0 && priorBalance > 0 && (
            <p className="text-xs text-muted-foreground italic">
              {t('admin.priorBalancePayments.noPaymentsYet')}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PriorBalanceCard;
