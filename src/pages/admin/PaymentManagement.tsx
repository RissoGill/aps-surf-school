import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Euro, Search, CheckCircle, AlertCircle, Clock, CreditCard, Edit2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import AppHeader from "@/components/shared/AppHeader";
import SponsorBanner from "@/components/shared/SponsorBanner";
import AppFooter from "@/components/shared/AppFooter";
import { z } from "zod";

interface Payment {
  payment_id: string;
  athlete_id: string;
  year: number;
  month: string;
  amount_due: number;
  amount_paid: number;
  status: string;
  payment_date: string | null;
  plan_type: string | null;
  athlete_name?: string;
}

interface Athlete {
  athlete_id: string;
  first_name: string;
  last_name: string;
}

// Validation schema for payment edits
const paymentEditSchema = z.object({
  amount_due: z.number().min(0, "Amount due must be positive"),
  amount_paid: z.number().min(0, "Amount paid must be positive"),
  payment_date: z.string().nullable(),
  plan_type: z.string().nullable()
});

const PaymentManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    amount_due: string;
    amount_paid: string;
    status: string;
    payment_date: string;
    plan_type: string;
  }>({
    amount_due: "",
    amount_paid: "",
    status: "",
    payment_date: "",
    plan_type: ""
  });

  // Fetch all athletes for search
  const { data: athletes } = useQuery({
    queryKey: ['athletes-search'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('atletas')
        .select('athlete_id, first_name, last_name')
        .order('first_name');
      
      if (error) throw error;
      return data as Athlete[];
    }
  });

  // Fetch payments for selected athlete
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['athlete-payments', selectedAthlete?.athlete_id],
    queryFn: async () => {
      if (!selectedAthlete) return [];

      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('athlete_id', selectedAthlete.athlete_id)
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (error) throw error;

      // Robust filter: September 2025 through September 2026 (inclusive)
      const monthMap: Record<string, number> = {
        january: 1, jan: 1, janeiro: 1,
        february: 2, feb: 2, fevereiro: 2,
        march: 3, mar: 3, marco: 3, 'março': 3,
        april: 4, apr: 4, abril: 4,
        may: 5, mai: 5, maio: 5,
        june: 6, jun: 6, junho: 6,
        july: 7, jul: 7, julho: 7,
        august: 8, aug: 8, agosto: 8,
        september: 9, sep: 9, sept: 9, setembro: 9,
        october: 10, oct: 10, outubro: 10,
        november: 11, nov: 11, novembro: 11,
        december: 12, dec: 12, dezembro: 12,
      };

      const normalize = (s?: string) =>
        (s || '')
          .trim()
          .toLowerCase()
          .normalize('NFD')
          .replace(/\p{Diacritic}/gu, '');

      const toSerial = (y: number, m: number) => y * 12 + m;
      const startSerial = toSerial(2025, 9); // Sep 2025
      const endSerial = toSerial(2026, 9);   // Sep 2026

      const filteredData = (data || []).filter((p: any) => {
        const y = Number(p.year);
        const mName = normalize(p.month);
        const m = monthMap[mName];
        if (!y || !m) return false;
        const serial = toSerial(y, m);
        return serial >= startSerial && serial <= endSerial;
      });

      // Sort chronologically: Sep 2025 → Sep 2026
      const sortedData = filteredData.sort((a: any, b: any) => {
        const yA = Number(a.year);
        const yB = Number(b.year);
        const mA = monthMap[normalize(a.month)] || 0;
        const mB = monthMap[normalize(b.month)] || 0;
        const serialA = toSerial(yA, mA);
        const serialB = toSerial(yB, mB);
        return serialA - serialB; // Ascending order (earliest first)
      });

      return sortedData.map(payment => ({
        ...payment,
        athlete_name: `${selectedAthlete.first_name} ${selectedAthlete.last_name}`
      })) as Payment[];
    },
    enabled: !!selectedAthlete
  });

  // Check if selected athlete has a pack payment without pack record
  const { data: packRecords } = useQuery({
    queryKey: ['athlete-packs', selectedAthlete?.athlete_id],
    queryFn: async () => {
      if (!selectedAthlete) return [];
      const { data, error } = await supabase
        .from('packs')
        .select('*')
        .eq('athlete_id', selectedAthlete.athlete_id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedAthlete
  });

  // Detect pack payment without pack record
  const packPayment = payments?.find(p => 
    p.plan_type && 
    ['pack1', 'pack5', 'pack10'].includes(p.plan_type) && 
    p.payment_date
  );
  
  const needsPackCreation = packPayment && !packRecords?.some(
    pack => pack.payment_id === packPayment.payment_id
  );

  // Filter athletes based on search
  const filteredAthletes = athletes?.filter(athlete => 
    `${athlete.first_name} ${athlete.last_name}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  ) || [];

  const handleAthleteSelect = (athlete: Athlete) => {
    setSelectedAthlete(athlete);
    setSearchTerm(`${athlete.first_name} ${athlete.last_name}`);
  };

  const handleEditStart = (payment: Payment) => {
    setEditingPaymentId(payment.payment_id);
    setEditForm({
      amount_due: payment.amount_due.toString(),
      amount_paid: payment.amount_paid.toString(),
      status: payment.status,
      payment_date: payment.payment_date || "",
      plan_type: payment.plan_type || ""
    });
  };

  const handleEditCancel = () => {
    setEditingPaymentId(null);
    setEditForm({
      amount_due: "",
      amount_paid: "",
      status: "",
      payment_date: "",
      plan_type: ""
    });
  };

  // Helper to generate stable pack ID
  const generatePackId = (athleteId: string, totalTokens: string, dateISO: string) => {
    const ymd = dateISO.replace(/-/g, '');
    return `pack${totalTokens}-${athleteId}-${ymd}`;
  };

  const handlePackCreation = async (
    athleteId: string,
    planType: string,
    paymentDate: string,
    paymentId: string
  ) => {
    try {
      // Extract total tokens from plan type (pack1 -> 1, pack5 -> 5, pack10 -> 10)
      const tokenMatch = planType.match(/pack(\d+)/);
      if (!tokenMatch) return; // Not a pack plan

      const totalTokens = tokenMatch[1];

      // Check for existing active pack and get its balance
      const { data: existingPack } = await supabase
        .from('packs')
        .select('*')
        .eq('athlete_id', athleteId)
        .eq('active', true)
        .order('purchase_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      let carriedOverTokens = 0;
      
      // Calculate negative balance to carry forward
      if (existingPack) {
        const existingTotal = parseInt(existingPack.total_tokens) || 0;
        const existingUsed = parseInt(existingPack.used_tokens) || 0;
        const balance = existingTotal - existingUsed;
        
        if (balance < 0) {
          carriedOverTokens = Math.abs(balance);
          
          toast({
            title: "Negative Balance Carried Forward",
            description: `Previous pack had -${Math.abs(balance)} sessions. This will be deducted from the new pack.`,
            variant: "default"
          });
        }

        // Deactivate the old pack
        await supabase
          .from('packs')
          .update({ active: false })
          .eq('id', existingPack.id);
      }

      // Insert new pack record with generated ID
      const packId = generatePackId(athleteId, totalTokens, paymentDate);
      const { error: insertError } = await supabase
        .from('packs')
        .insert({
          id: packId,
          athlete_id: athleteId,
          total_tokens: totalTokens,
          used_tokens: carriedOverTokens > 0 ? carriedOverTokens.toString() : '0',
          purchase_date: paymentDate,
          active: true,
          payment_id: paymentId
        });

      if (insertError) {
        console.error('Pack insert failed:', {
          error: insertError,
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          athleteId,
          packId
        });
        throw insertError;
      }

      console.info('Pack created successfully:', { packId, athleteId, totalTokens, paymentId });

      // Update athlete's plan_type to match the pack
      const { error: updateError } = await supabase
        .from('atletas')
        .update({ plan_type: planType })
        .eq('athlete_id', athleteId);

      if (updateError) {
        console.error('Athlete plan_type update error:', updateError);
      }

      // Invalidate all relevant queries for immediate UI update
      await queryClient.invalidateQueries({ 
        queryKey: ['pack-balance', athleteId] 
      });
      await queryClient.invalidateQueries({ 
        queryKey: ['athlete-packs', athleteId] 
      });
      await queryClient.invalidateQueries({ 
        queryKey: ['atletas'] 
      });

    } catch (error: any) {
      console.error('Pack creation failed:', {
        error,
        message: error?.message,
        code: error?.code,
        athleteId
      });
      
      const errorMessage = error?.message || 'Unknown error occurred';
      const isRLSError = error?.code === '42501' || errorMessage.includes('policy');
      
      toast({
        title: isRLSError ? "Permission Error" : "Pack Creation Failed",
        description: isRLSError 
          ? "Insufficient permissions to create pack record. Please check RLS policies." 
          : `Failed to create pack record: ${errorMessage.slice(0, 100)}`,
        variant: "destructive"
      });
    }
  };

  const handleEditSave = async (paymentId: string) => {
    try {
      // Validate input
      const validated = paymentEditSchema.parse({
        amount_due: parseFloat(editForm.amount_due),
        amount_paid: parseFloat(editForm.amount_paid),
        payment_date: editForm.payment_date || null,
        plan_type: editForm.plan_type || null
      });

      // Auto-calculate status based on amounts
      const amountDue = validated.amount_due;
      const amountPaid = validated.amount_paid;
      let calculatedStatus: "Paid" | "Unpaid" | "Partial";
      
      if (amountPaid === 0) {
        calculatedStatus = "Unpaid";
      } else if (amountPaid >= amountDue) {
        calculatedStatus = "Paid";
      } else {
        calculatedStatus = "Partial";
      }

      // Update in Supabase
      const { error } = await supabase
        .from('payments')
        .update({
          amount_due: validated.amount_due,
          amount_paid: validated.amount_paid,
          status: calculatedStatus,
          payment_date: validated.payment_date,
          plan_type: validated.plan_type
        })
        .eq('payment_id', paymentId);

      if (error) throw error;

      // Check if this is a pack payment and handle pack creation
      if (validated.plan_type && ['pack1', 'pack5', 'pack10'].includes(validated.plan_type)) {
        await handlePackCreation(
          selectedAthlete!.athlete_id,
          validated.plan_type,
          validated.payment_date || new Date().toISOString().split('T')[0],
          paymentId
        );
      }

      // Refresh data
      await queryClient.invalidateQueries({ 
        queryKey: ['athlete-payments', selectedAthlete?.athlete_id] 
      });

      toast({
        title: "Success",
        description: validated.plan_type && ['pack1', 'pack5', 'pack10'].includes(validated.plan_type)
          ? "Payment and pack record created successfully"
          : "Payment updated successfully"
      });

      handleEditCancel();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update payment",
          variant: "destructive"
        });
      }
    }
  };

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

  // Calculate Outstanding (current + past unpaid months only)
  const calculateOutstanding = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentSerial = currentYear * 12 + currentMonth;
    
    const monthMap: Record<string, number> = {
      january: 1, jan: 1, janeiro: 1,
      february: 2, feb: 2, fevereiro: 2,
      march: 3, mar: 3, marco: 3, 'março': 3,
      april: 4, apr: 4, abril: 4,
      may: 5, mai: 5, maio: 5,
      june: 6, jun: 6, junho: 6,
      july: 7, jul: 7, julho: 7,
      august: 8, aug: 8, agosto: 8,
      september: 9, sep: 9, sept: 9, setembro: 9,
      october: 10, oct: 10, outubro: 10,
      november: 11, nov: 11, novembro: 11,
      december: 12, dec: 12, dezembro: 12,
    };

    const normalize = (s?: string) =>
      (s || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '');
    
    return payments
      .filter(p => {
        const y = Number(p.year);
        const mName = normalize(p.month);
        const m = monthMap[mName] || 0;
        const serial = y * 12 + m;
        
        // Only include current month and past months
        return serial <= currentSerial;
      })
      .reduce((sum, p) => {
        const due = p.amount_due || 0;
        const paid = p.amount_paid || 0;
        const remaining = due - paid;
        return sum + (remaining > 0 ? remaining : 0);
      }, 0);
  };

  // Calculate Next Payment (following month)
  const calculateNextPayment = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12
    const nextSerial = (currentYear * 12 + currentMonth) + 1; // Next month
    
    const monthMap: Record<string, number> = {
      january: 1, jan: 1, janeiro: 1,
      february: 2, feb: 2, fevereiro: 2,
      march: 3, mar: 3, marco: 3, 'março': 3,
      april: 4, apr: 4, abril: 4,
      may: 5, mai: 5, maio: 5,
      june: 6, jun: 6, junho: 6,
      july: 7, jul: 7, julho: 7,
      august: 8, aug: 8, agosto: 8,
      september: 9, sep: 9, sept: 9, setembro: 9,
      october: 10, oct: 10, outubro: 10,
      november: 11, nov: 11, novembro: 11,
      december: 12, dec: 12, dezembro: 12,
    };

    const normalize = (s?: string) =>
      (s || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '');
    
    const nextPayment = payments.find(p => {
      const y = Number(p.year);
      const mName = normalize(p.month);
      const m = monthMap[mName] || 0;
      const serial = y * 12 + m;
      return serial === nextSerial;
    });
    
    return nextPayment?.amount_due || 0;
  };

  const outstanding = calculateOutstanding();
  const nextPayment = calculateNextPayment();

  return (
    <div className="min-h-screen bg-gradient-surface">
      <AppHeader title="Payment Management" showBack backTo="/dashboard/administration" />
      
      <main className="mobile-container py-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">Payment Management</h2>
          <p className="text-muted-foreground">Search for an athlete to view their payments</p>
        </div>

        {/* Search Bar */}
        <Card className="shadow-soft mb-6">
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Euro className="h-6 w-6 text-primary" />
              Athlete Payment Search
            </CardTitle>
            <CardDescription>Search for an athlete to view and manage their payment records</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search athlete by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 touch-friendly"
              />
              
              {/* Search Results Dropdown */}
              {searchTerm && !selectedAthlete && filteredAthletes.length > 0 && (
                <Card className="absolute z-10 w-full mt-1 max-h-60 overflow-y-auto">
                  <CardContent className="p-2">
                    {filteredAthletes.map((athlete) => (
                      <Button
                        key={athlete.athlete_id}
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => handleAthleteSelect(athlete)}
                      >
                        {athlete.first_name} {athlete.last_name}
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Clear Selection */}
            {selectedAthlete && (
              <div className="flex items-center justify-between bg-muted p-3 rounded-lg">
                <div>
                  <p className="font-medium">Selected Athlete:</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedAthlete.first_name} {selectedAthlete.last_name}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedAthlete(null);
                    setSearchTerm("");
                  }}
                >
                  Clear
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Records - Only show when athlete selected */}
        {selectedAthlete && (
          <>
            {/* Financial Summary Cards */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Card className="shadow-soft">
                <CardContent className="p-4 text-center">
                  <AlertCircle className="h-6 w-6 text-destructive mx-auto mb-2" />
                  <p className="text-lg font-bold text-destructive">€{outstanding.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Outstanding</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Current & past unpaid</p>
                </CardContent>
              </Card>
              
              <Card className="shadow-soft">
                <CardContent className="p-4 text-center">
                  <Clock className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-lg font-bold text-foreground">€{nextPayment.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Next Payment</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Due by 5th of month</p>
                </CardContent>
              </Card>
            </div>

            {/* Pack Creation Alert */}
            {needsPackCreation && packPayment && (
              <Alert className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Pack Payment Without Pack Record</AlertTitle>
                <AlertDescription className="flex items-center justify-between">
                  <span>
                    Found a {packPayment.plan_type} payment ({packPayment.payment_id}) from {packPayment.payment_date} 
                    but no corresponding pack record exists.
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="ml-4"
                    onClick={async () => {
                      try {
                        await handlePackCreation(
                          selectedAthlete!.athlete_id,
                          packPayment.plan_type!,
                          packPayment.payment_date!,
                          packPayment.payment_id
                        );
                        await queryClient.invalidateQueries({ 
                          queryKey: ['athlete-packs', selectedAthlete?.athlete_id] 
                        });
                        toast({
                          title: "Success",
                          description: "Pack record created successfully"
                        });
                      } catch (error) {
                        // Error toast already shown in handlePackCreation
                        console.error('Pack creation failed:', error);
                      }
                    }}
                  >
                    Create Pack Record
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Payments Table */}
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle>Payment Records</CardTitle>
                <CardDescription>Payment history for {selectedAthlete.first_name} {selectedAthlete.last_name} (September 2025 - September 2026)</CardDescription>
              </CardHeader>
              
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading payments...</div>
                ) : payments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No payment records found</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Period</TableHead>
                          <TableHead>Plan Type</TableHead>
                          <TableHead>Amount Due</TableHead>
                          <TableHead>Amount Paid</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.map((payment) => {
                          const status = getPaymentStatus(payment);
                          const StatusIcon = status.icon;
                          const isEditing = editingPaymentId === payment.payment_id;
                          
                          return (
                            <TableRow key={payment.payment_id}>
                              <TableCell className="font-medium">{payment.month} {payment.year}</TableCell>
                              
                              {/* Plan Type */}
                              <TableCell>
                                {isEditing ? (
                                  <Select
                                    value={editForm.plan_type || ''}
                                    onValueChange={(value) => setEditForm({ ...editForm, plan_type: value })}
                                  >
                                    <SelectTrigger className="w-32">
                                      <SelectValue placeholder="Select plan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="month">Month</SelectItem>
                                      <SelectItem value="pack1">Pack 1</SelectItem>
                                      <SelectItem value="pack5">Pack 5</SelectItem>
                                      <SelectItem value="pack10">Pack 10</SelectItem>
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  payment.plan_type || '-'
                                )}
                              </TableCell>
                              
                              {/* Amount Due */}
                              <TableCell>
                                {isEditing ? (
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={editForm.amount_due}
                                    onChange={(e) => setEditForm({ ...editForm, amount_due: e.target.value })}
                                    className="w-24"
                                  />
                                ) : (
                                  `€${(payment.amount_due || 0).toFixed(2)}`
                                )}
                              </TableCell>
                              
                              {/* Amount Paid */}
                              <TableCell>
                                {isEditing ? (
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={editForm.amount_paid}
                                    onChange={(e) => setEditForm({ ...editForm, amount_paid: e.target.value })}
                                    className="w-24"
                                  />
                                ) : (
                                  `€${(payment.amount_paid || 0).toFixed(2)}`
                                )}
                              </TableCell>
                              
              {/* Status */}
              <TableCell>
                <Badge className={status.color}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {status.label}
                  {isEditing && <span className="ml-1 text-[10px]">(auto)</span>}
                </Badge>
              </TableCell>
                              
                              {/* Payment Date */}
                              <TableCell>
                                {isEditing ? (
                                  <Input
                                    type="date"
                                    value={editForm.payment_date || ''}
                                    onChange={(e) => setEditForm({ ...editForm, payment_date: e.target.value || null })}
                                    className="w-36"
                                  />
                                ) : (
                                  payment.payment_date 
                                    ? new Date(payment.payment_date).toLocaleDateString()
                                    : '-'
                                )}
                              </TableCell>
                              
                              {/* Actions */}
                              <TableCell>
                                {isEditing ? (
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => handleEditSave(payment.payment_id)}
                                    >
                                      <Save className="h-4 w-4" color="white" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={handleEditCancel}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleEditStart(payment)}
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                )}
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
          </>
        )}
      </main>

      <SponsorBanner />
      <AppFooter />
    </div>
  );
};

export default PaymentManagement;