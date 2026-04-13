import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { History, Plus, ChevronDown, ChevronUp, Pencil, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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

  // Edit balance state
  const [isEditBalanceOpen, setIsEditBalanceOpen] = useState(false);
  const [editBalanceForm, setEditBalanceForm] = useState({
    newBalance: "",
    reference: ""
  });
  const [isEditBalanceSubmitting, setIsEditBalanceSubmitting] = useState(false);

  // Edit state for super_admin
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PriorBalancePayment | null>(null);
  const [editForm, setEditForm] = useState({
    amount: "",
    payment_date: "",
    invoice_number: "",
    entity: "",
    notes: ""
  });
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  // Delete state
  const [deletePaymentId, setDeletePaymentId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
  
  // Check if user can edit payments (super_admin only)
  const canEditPayments = userRole === 'super_admin';

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
      // 1. Fetch current prior_balance from database (avoid stale props)
      const { data: currentAthlete, error: fetchError } = await supabase
        .from('atletas')
        .select('prior_balance')
        .eq('athlete_id', athleteId)
        .single();
      
      if (fetchError) throw fetchError;
      
      const currentBalance = Number(currentAthlete?.prior_balance) || 0;

      // 2. Insert payment record
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

      // 3. Update athlete's prior_balance using CURRENT value from DB
      const newBalance = currentBalance - amount;
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

  // Start editing a payment
  const handleStartEdit = (payment: PriorBalancePayment) => {
    setEditingPayment(payment);
    setEditForm({
      amount: payment.amount.toString(),
      payment_date: payment.payment_date,
      invoice_number: payment.invoice_number || "",
      entity: payment.entity || "",
      notes: payment.notes || ""
    });
    setIsEditDialogOpen(true);
  };

  // Submit edited payment
  const handleSubmitEdit = async () => {
    if (!editingPayment) return;

    const newAmount = parseFloat(editForm.amount);
    
    // Validations
    if (isNaN(newAmount) || newAmount <= 0) {
      toast({
        title: t('admin.paymentManagement.validationError'),
        description: t('admin.priorBalancePayments.invalidAmount'),
        variant: "destructive"
      });
      return;
    }

    if (!editForm.payment_date) {
      toast({
        title: t('admin.paymentManagement.validationError'),
        description: t('admin.priorBalancePayments.dateRequired'),
        variant: "destructive"
      });
      return;
    }

    setIsEditSubmitting(true);

    try {
      // 1. Fetch current prior_balance from database (avoid stale props)
      const { data: currentAthlete, error: fetchError } = await supabase
        .from('atletas')
        .select('prior_balance')
        .eq('athlete_id', athleteId)
        .single();
      
      if (fetchError) throw fetchError;
      
      const currentBalance = Number(currentAthlete?.prior_balance) || 0;

      const oldAmount = Number(editingPayment.amount);
      const difference = oldAmount - newAmount;

      // 2. Update payment record
      const { error: updatePaymentError } = await supabase
        .from('prior_balance_payments')
        .update({
          amount: newAmount,
          payment_date: editForm.payment_date,
          notes: editForm.notes || null,
          invoice_number: editForm.invoice_number || null,
          entity: editForm.entity || null
        })
        .eq('id', editingPayment.id);

      if (updatePaymentError) throw updatePaymentError;

      // 3. Adjust athlete's prior_balance using CURRENT value from DB
      // If new amount is higher, balance decreases (paid more)
      // If new amount is lower, balance increases (paid less)
      const newPriorBalance = currentBalance + difference;
      const { error: updateAthleteError } = await supabase
        .from('atletas')
        .update({ prior_balance: newPriorBalance })
        .eq('athlete_id', athleteId);

      if (updateAthleteError) throw updateAthleteError;

      // 3. Success
      toast({
        title: t('admin.paymentManagement.success'),
        description: t('admin.priorBalancePayments.paymentUpdated'),
      });

      // 4. Close dialog and reset
      setIsEditDialogOpen(false);
      setEditingPayment(null);
      setEditForm({
        amount: "",
        payment_date: "",
        invoice_number: "",
        entity: "",
        notes: ""
      });

      // 5. Refresh data
      refetchPayments();
      queryClient.invalidateQueries({ queryKey: ['athletes-search'] });
      onBalanceUpdated();

    } catch (error: any) {
      console.error('Error updating prior balance payment:', error);
      toast({
        title: t('admin.paymentManagement.error'),
        description: error.message || t('admin.priorBalancePayments.paymentFailed'),
        variant: "destructive"
      });
    } finally {
      setIsEditSubmitting(false);
    }
  };

  // Handle delete payment
  const handleDeletePayment = async () => {
    if (!deletePaymentId) return;
    
    setIsDeleting(true);
    
    try {
      // Find the payment to delete
      const paymentToDelete = priorBalancePayments.find(p => p.id === deletePaymentId);
      if (!paymentToDelete) throw new Error("Payment not found");
      
      // 1. Fetch current prior_balance from database (avoid stale props)
      const { data: currentAthlete, error: fetchError } = await supabase
        .from('atletas')
        .select('prior_balance')
        .eq('athlete_id', athleteId)
        .single();
      
      if (fetchError) throw fetchError;
      
      const currentBalance = Number(currentAthlete?.prior_balance) || 0;
      
      // 2. Delete the payment record
      const { error: deleteError } = await supabase
        .from('prior_balance_payments')
        .delete()
        .eq('id', deletePaymentId);
      
      if (deleteError) throw deleteError;
      
      // 3. Restore the amount to the athlete's prior_balance using CURRENT value from DB
      const restoredBalance = currentBalance + Number(paymentToDelete.amount);
      const { error: updateError } = await supabase
        .from('atletas')
        .update({ prior_balance: restoredBalance })
        .eq('athlete_id', athleteId);
      
      if (updateError) throw updateError;
      
      // 3. Success
      toast({
        title: t('admin.paymentManagement.success'),
        description: t('admin.priorBalancePayments.paymentDeleted'),
      });
      
      // 4. Refresh data
      refetchPayments();
      queryClient.invalidateQueries({ queryKey: ['athletes-search'] });
      onBalanceUpdated();
      
    } catch (error: any) {
      console.error('Error deleting prior balance payment:', error);
      toast({
        title: t('admin.paymentManagement.error'),
        description: error.message || t('admin.priorBalancePayments.paymentFailed'),
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setDeletePaymentId(null);
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

  const handleOpenEditBalance = () => {
    setEditBalanceForm({
      newBalance: priorBalance.toFixed(2),
      reference: ""
    });
    setIsEditBalanceOpen(true);
  };

  const handleSubmitEditBalance = async () => {
    const newBalance = parseFloat(editBalanceForm.newBalance);
    
    if (isNaN(newBalance) || newBalance < 0) {
      toast({
        title: t('admin.paymentManagement.validationError'),
        description: t('admin.priorBalancePayments.invalidAmount'),
        variant: "destructive"
      });
      return;
    }

    setIsEditBalanceSubmitting(true);

    try {
      const { error } = await supabase
        .from('atletas')
        .update({ prior_balance: newBalance })
        .eq('athlete_id', athleteId);

      if (error) throw error;

      toast({
        title: t('admin.paymentManagement.success'),
        description: t('admin.priorBalancePayments.balanceUpdated'),
      });

      setIsEditBalanceOpen(false);
      queryClient.invalidateQueries({ queryKey: ['athletes-search'] });
      onBalanceUpdated();

    } catch (error: any) {
      console.error('Error updating prior balance:', error);
      toast({
        title: t('admin.paymentManagement.error'),
        description: error.message || t('admin.priorBalancePayments.balanceUpdateFailed'),
        variant: "destructive"
      });
    } finally {
      setIsEditBalanceSubmitting(false);
    }
  };
    <Card className="shadow-soft">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header with icon and values */}
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

          {/* Register Payment Button - separate line */}
          {canEdit && priorBalance > 0 && (
            <div className="mt-3">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full gap-1">
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
            </div>
          )}

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
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-success">
                        €{Number(payment.amount).toFixed(2)}
                      </span>
                      {canEditPayments && (
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0"
                            onClick={() => handleStartEdit(payment)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            onClick={() => setDeletePaymentId(payment.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
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

      {/* Edit Payment Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('admin.priorBalancePayments.editPayment')}</DialogTitle>
            <DialogDescription>
              {t('admin.priorBalancePayments.editPaymentDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="edit_amount">{t('admin.priorBalancePayments.amount')}</Label>
              <Input
                id="edit_amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={editForm.amount}
                onChange={(e) => setEditForm(prev => ({ ...prev, amount: e.target.value }))}
              />
            </div>

            {/* Payment Date */}
            <div className="space-y-2">
              <Label htmlFor="edit_payment_date">{t('admin.priorBalancePayments.paymentDate')}</Label>
              <Input
                id="edit_payment_date"
                type="date"
                value={editForm.payment_date}
                onChange={(e) => setEditForm(prev => ({ ...prev, payment_date: e.target.value }))}
              />
            </div>

            {/* Invoice Number */}
            <div className="space-y-2">
              <Label htmlFor="edit_invoice_number">{t('admin.paymentManagement.invoiceNumber')}</Label>
              <Input
                id="edit_invoice_number"
                placeholder={t('admin.paymentManagement.invoiceNumberPlaceholder')}
                value={editForm.invoice_number}
                onChange={(e) => setEditForm(prev => ({ ...prev, invoice_number: e.target.value }))}
              />
            </div>

            {/* Entity */}
            <div className="space-y-2">
              <Label htmlFor="edit_entity">{t('admin.paymentManagement.entity')}</Label>
              <Input
                id="edit_entity"
                placeholder={t('admin.paymentManagement.entityPlaceholder')}
                value={editForm.entity}
                onChange={(e) => setEditForm(prev => ({ ...prev, entity: e.target.value }))}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="edit_notes">{t('admin.paymentManagement.notes')}</Label>
              <Textarea
                id="edit_notes"
                placeholder={t('admin.priorBalancePayments.notesPlaceholder')}
                value={editForm.notes}
                onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSubmitEdit} disabled={isEditSubmitting}>
              {isEditSubmitting ? t('common.loading') : t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletePaymentId} onOpenChange={(open) => !open && setDeletePaymentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.priorBalancePayments.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.priorBalancePayments.deleteConfirmDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeletePayment}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? t('common.loading') : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default PriorBalanceCard;