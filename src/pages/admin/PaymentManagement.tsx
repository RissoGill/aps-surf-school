import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Euro, Search, CheckCircle, AlertCircle, Clock, CreditCard, Edit2, Save, X, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import AppHeader from "@/components/shared/AppHeader";
import SponsorBanner from "@/components/shared/SponsorBanner";
import AppFooter from "@/components/shared/AppFooter";
import { z } from "zod";
import { useLanguage } from "@/i18n/LanguageContext";
import PriorBalanceCard from "@/components/admin/PriorBalanceCard";

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
  notes: string | null;
  invoice_number: string | null;
  entity: string | null;
  athlete_name?: string;
}

interface Athlete {
  athlete_id: string;
  first_name: string;
  last_name: string;
  prior_balance: number | null;
}

interface AdminSession {
  id?: string;
  userId?: string;
  adminId?: string;
  admin_id?: string;
  email?: string;
  role?: string;
  admin_role?: string;
}

// Validation schema for payment edits
const paymentEditSchema = z.object({
  amount_due: z.number().min(0, "Amount due must be positive"),
  amount_paid: z.number().min(0, "Amount paid must be positive"),
  payment_date: z.string().nullable(),
  plan_type: z.string().nullable(),
  notes: z.string().nullable()
});

const PaymentManagement = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('admin');
  const [editForm, setEditForm] = useState<{
    amount_due: string;
    amount_paid: string;
    status: string;
    payment_date: string;
    plan_type: string;
    notes: string;
    invoice_number: string;
    entity: string;
  }>({
    amount_due: "",
    amount_paid: "",
    status: "",
    payment_date: "",
    plan_type: "",
    notes: "",
    invoice_number: "",
    entity: ""
  });

  const getNormalizedAdminSession = (): (AdminSession & { resolvedUserId?: string; resolvedRole: string }) | null => {
    try {
      const rawSession = JSON.parse(localStorage.getItem('adminSession') || '{}') as AdminSession | null;

      if (!rawSession || typeof rawSession !== 'object') {
        return null;
      }

      const resolvedUserId = [rawSession.id, rawSession.userId, rawSession.adminId, rawSession.admin_id, rawSession.email]
        .find((value): value is string => typeof value === 'string' && value.trim().length > 0)
        ?.trim();

      const resolvedRole = [rawSession.role, rawSession.admin_role]
        .find((value): value is string => typeof value === 'string' && value.trim().length > 0)
        ?.trim() || 'admin';

      const normalizedSession = {
        ...rawSession,
        resolvedUserId,
        resolvedRole,
        ...(resolvedUserId ? {
          id: resolvedUserId,
          userId: resolvedUserId,
          adminId: resolvedUserId,
          admin_id: resolvedUserId,
          email: rawSession.email || resolvedUserId,
        } : {}),
        role: resolvedRole,
        admin_role: rawSession.admin_role || resolvedRole,
      };

      localStorage.setItem('adminSession', JSON.stringify(normalizedSession));
      return normalizedSession;
    } catch (error) {
      console.error('Error parsing admin session:', error);
      return null;
    }
  };

  // Session validation on mount - using legacy localStorage auth
  useEffect(() => {
    const adminSessionStr = localStorage.getItem('adminSession');
    if (!adminSessionStr) {
      toast({ title: t('login.sessionExpired'), variant: "destructive" });
      navigate("/login/administration");
      return;
    }

    const adminSession = getNormalizedAdminSession();
    if (!adminSession?.resolvedUserId) {
      toast({ title: t('login.sessionExpired'), variant: "destructive" });
      navigate("/login/administration");
      return;
    }

    setUserRole(adminSession.resolvedRole);
  }, [navigate, t, toast]);

  const translateMonth = (month: string): string => {
    if (!month) return "";

    const normalized = month
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "");

    const monthKeyMap: Record<string, string> = {
      january: "january", jan: "january", janeiro: "january",
      february: "february", feb: "february", fevereiro: "february",
      march: "march", mar: "march", marco: "march",
      april: "april", apr: "april", abril: "april",
      may: "may", mai: "may", maio: "may",
      june: "june", jun: "june", junho: "june",
      july: "july", jul: "july", julho: "july",
      august: "august", aug: "august", agosto: "august",
      september: "september", sep: "september", sept: "september", setembro: "september",
      october: "october", oct: "october", outubro: "october",
      november: "november", nov: "november", novembro: "november",
      december: "december", dec: "december", dezembro: "december"
    };

    const canonical = monthKeyMap[normalized] || normalized;
    const translationKey = `admin.paymentManagement.months.${canonical}`;
    const translated = t(translationKey);

    return translated !== translationKey ? translated : month;
  };


  // Fetch all athletes for search
  const { data: athletes } = useQuery({
    queryKey: ['athletes-search'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('atletas')
        .select('athlete_id, first_name, last_name, prior_balance')
        .order('first_name')
        .limit(10000);
      
      if (error) throw error;
      return data as Athlete[];
    }
  });

  // Sync selectedAthlete with fresh query data (e.g. after prior_balance update)
  useEffect(() => {
    if (selectedAthlete && athletes) {
      const updated = athletes.find(a => a.athlete_id === selectedAthlete.athlete_id);
      if (updated && updated.prior_balance !== selectedAthlete.prior_balance) {
        setSelectedAthlete(updated);
      }
    }
  }, [athletes, selectedAthlete]);

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
        .order('month', { ascending: false })
        .limit(10000);

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

  // Detect pack payment without pack record - check LATEST payment only
  const packPayments = payments?.filter(p => 
    p.plan_type && 
    ['pack1', 'pack5', 'pack10'].includes(p.plan_type) && 
    p.payment_date
  ).sort((a, b) => {
    // Sort by payment_date descending (latest first)
    const dateA = new Date(a.payment_date!).getTime();
    const dateB = new Date(b.payment_date!).getTime();
    return dateB - dateA;
  }) || [];
  
  const latestPackPayment = packPayments[0];
  
  const needsPackCreation = latestPackPayment && !packRecords?.some(
    pack => pack.payment_id === latestPackPayment.payment_id
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
      plan_type: payment.plan_type || "",
      notes: payment.notes || "",
      invoice_number: payment.invoice_number || "",
      entity: payment.entity || ""
    });
  };

  const handleEditCancel = () => {
    setEditingPaymentId(null);
    setEditForm({
      amount_due: "",
      amount_paid: "",
      status: "",
      payment_date: "",
      plan_type: "",
      notes: "",
      invoice_number: "",
      entity: ""
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
      const adminSession = getNormalizedAdminSession();
      console.log('adminSession contents:', JSON.stringify(adminSession));
      const userId = adminSession?.resolvedUserId || adminSession?.id || adminSession?.userId || adminSession?.adminId || adminSession?.admin_id || adminSession?.email;
      const role = adminSession?.resolvedRole || adminSession?.role || adminSession?.admin_role || userRole || 'admin';
      console.log('Resolved userId:', userId, 'role:', role);

      if (!userId) {
        toast({
          title: t('login.sessionExpired'),
          description: t('login.sessionExpired'),
          variant: "destructive"
        });
        navigate("/login/administration");
        return;
      }

      const { data: functionResult, error: functionError } = await supabase.functions.invoke('create-pack', {
        body: { athleteId, planType, paymentDate, paymentId, role, userId }
      });

      if (functionError || !functionResult?.ok) {
        const errorMsg = functionResult?.error || functionError?.message || 'Unknown error';
        console.error('Pack creation via Edge Function failed:', errorMsg);
        toast({
          title: t('admin.paymentManagement.packCreationFailed'),
          description: errorMsg.slice(0, 150),
          variant: "destructive"
        });
        return;
      }

      console.info('Pack created via Edge Function:', functionResult.packId);
      
      // Invalidate all relevant queries
      await queryClient.invalidateQueries({ queryKey: ['pack-balance', athleteId] });
      await queryClient.invalidateQueries({ queryKey: ['athlete-packs', athleteId] });
      await queryClient.invalidateQueries({ queryKey: ['athlete-payments', athleteId] });
      await queryClient.invalidateQueries({ queryKey: ['atletas'] });
      
      toast({
        title: t('admin.paymentManagement.success'),
        description: t('admin.paymentManagement.packCreatedSuccess')
      });

    } catch (error: any) {
      console.error('Pack creation failed:', error);
      toast({
        title: t('admin.paymentManagement.packCreationFailed'),
        description: error?.message?.slice(0, 150) || 'Unknown error',
        variant: "destructive"
      });
    }
  };

  const parseAmount = (value: string): number => {
    if (!value || value.trim() === "") return 0;
    const normalized = value.trim().replace(/[^0-9.,]/g, "").replace(",", ".");
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? 0 : parsed;
  };

  const handleEditSave = async (paymentId: string) => {
    try {
      // Validate input
      const validated = paymentEditSchema.parse({
        amount_due: parseAmount(editForm.amount_due),
        amount_paid: parseAmount(editForm.amount_paid),
        payment_date: editForm.payment_date || null,
        plan_type: editForm.plan_type || null,
        notes: editForm.notes || null
      });

      // Auto-calculate status based on amounts
      const amountDue = validated.amount_due;
      const amountPaid = validated.amount_paid;
      let calculatedStatus: "Paid" | "Unpaid" | "Partial";
      
      // If both are 0, consider it as Paid (no amount due, no amount owed)
      if (amountDue === 0 && amountPaid === 0) {
        calculatedStatus = "Paid";
      } else if (amountPaid === 0) {
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
          plan_type: validated.plan_type,
          notes: validated.notes,
          invoice_number: editForm.invoice_number || null,
          entity: editForm.entity || null
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
        title: t('admin.paymentManagement.success'),
        description: validated.plan_type && ['pack1', 'pack5', 'pack10'].includes(validated.plan_type)
          ? t('admin.paymentManagement.paymentAndPackSuccess')
          : t('admin.paymentManagement.paymentUpdatedSuccess')
      });

      handleEditCancel();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: t('admin.paymentManagement.validationError'),
          description: error.errors[0].message,
          variant: "destructive"
        });
      } else {
        toast({
          title: t('admin.paymentManagement.error'),
          description: t('admin.paymentManagement.updateFailed'),
          variant: "destructive"
        });
      }
    }
  };

  // Calculate payment status
  const getPaymentStatus = (payment: Payment) => {
    const amountDue = payment.amount_due || 0;
    const amountPaid = payment.amount_paid || 0;

    // If both are 0, consider it as Paid (no amount due, no amount owed)
    if (amountDue === 0 && amountPaid === 0) {
      return { label: t('admin.paymentManagement.paid'), color: "bg-success/10 text-success", icon: CheckCircle };
    } else if (amountPaid === 0) {
      return { label: t('admin.paymentManagement.unpaid'), color: "bg-destructive/10 text-destructive", icon: AlertCircle };
    } else if (amountPaid >= amountDue) {
      return { label: t('admin.paymentManagement.paid'), color: "bg-success/10 text-success", icon: CheckCircle };
    } else {
      return { label: t('admin.paymentManagement.partial'), color: "bg-warning/10 text-warning", icon: Clock };
    }
  };

  // Calculate current season outstanding (Sep 2025 onwards)
  const calculateCurrentSeasonOutstanding = () => {
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

  // Get prior balance from selected athlete
  const priorBalance = selectedAthlete?.prior_balance || 0;

  // Calculate total outstanding (prior balance + current season)
  const calculateTotalOutstanding = () => {
    return priorBalance + calculateCurrentSeasonOutstanding();
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

  const currentSeasonOutstanding = calculateCurrentSeasonOutstanding();
  const totalOutstanding = calculateTotalOutstanding();
  const nextPayment = calculateNextPayment();

  return (
    <div className="min-h-screen bg-gradient-surface">
      <AppHeader title={t('admin.paymentManagement.title')} showBack backTo="/dashboard/administration" />
      
      <main className="mobile-container py-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">{t('admin.paymentManagement.title')}</h2>
          <p className="text-muted-foreground">{t('admin.paymentManagement.subtitle')}</p>
        </div>

        {/* Search Bar */}
        <Card className="shadow-soft mb-6">
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Euro className="h-6 w-6 text-primary" />
              {t('admin.paymentManagement.searchTitle')}
            </CardTitle>
            <CardDescription>{t('admin.paymentManagement.searchDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder={t('admin.paymentManagement.searchPlaceholder')}
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
                  <p className="font-medium">{t('admin.paymentManagement.selectedAthlete')}</p>
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
                  {t('admin.paymentManagement.clear')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Records - Only show when athlete selected */}
        {selectedAthlete && (
          <>
            {/* Financial Summary Cards */}
            <div className="space-y-4 mb-6">
              {/* Row 1: Prior Balance (full width) */}
              <PriorBalanceCard
                athleteId={selectedAthlete.athlete_id}
                priorBalance={priorBalance}
                userRole={userRole}
                onBalanceUpdated={() => {
                  queryClient.invalidateQueries({ queryKey: ['athletes-search'] });
                  queryClient.invalidateQueries({ queryKey: ['athlete-payments', selectedAthlete?.athlete_id] });
                }}
              />

              {/* Row 2: Total Outstanding + Next Payment */}
              <div className="grid grid-cols-2 gap-4">
                {/* Total Outstanding */}
                <Card className="shadow-soft">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-muted">
                        <AlertCircle className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className={`text-xl font-medium ${totalOutstanding > 0 ? 'text-destructive' : 'text-success'}`}>
                          €{totalOutstanding.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t('admin.paymentManagement.totalOutstanding')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Next Payment */}
                <Card className="shadow-soft">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-muted">
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xl font-medium text-foreground">
                          €{nextPayment.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t('admin.paymentManagement.nextPayment')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Pack Creation Alert */}
            {needsPackCreation && latestPackPayment && (
              <Alert className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t('admin.paymentManagement.packPaymentAlert')}</AlertTitle>
                <AlertDescription className="flex items-center justify-between">
                  <span>
                    {t('admin.paymentManagement.packPaymentDescription')
                      .replace('{planType}', latestPackPayment.plan_type)
                      .replace('{paymentId}', latestPackPayment.payment_id)
                      .replace('{date}', latestPackPayment.payment_date || '')}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="ml-4"
                    onClick={async () => {
                      await handlePackCreation(
                        selectedAthlete!.athlete_id,
                        latestPackPayment.plan_type!,
                        latestPackPayment.payment_date!,
                        latestPackPayment.payment_id
                      );
                    }}
                  >
                    {t('admin.paymentManagement.createPackRecord')}
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Payments Table */}
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle>{t('admin.paymentManagement.paymentRecords')}</CardTitle>
                <CardDescription>
                  {t('admin.paymentManagement.paymentHistory').replace('{athleteName}', `${selectedAthlete.first_name} ${selectedAthlete.last_name}`)}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">{t('admin.paymentManagement.loadingPayments')}</div>
                ) : payments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">{t('admin.paymentManagement.noPayments')}</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('admin.paymentManagement.period')}</TableHead>
                          <TableHead>{t('admin.paymentManagement.planType')}</TableHead>
                          <TableHead>{t('admin.paymentManagement.amountDue')}</TableHead>
                          <TableHead>{t('admin.paymentManagement.amountPaid')}</TableHead>
                          <TableHead>{t('admin.paymentManagement.status')}</TableHead>
                          <TableHead>{t('admin.paymentManagement.date')}</TableHead>
                          {userRole !== 'reports_viewer' && (
                            <>
                              <TableHead>{t('admin.paymentManagement.invoiceNumber')}</TableHead>
                              <TableHead>{t('admin.paymentManagement.entity')}</TableHead>
                            </>
                          )}
                          <TableHead>{t('admin.paymentManagement.notes')}</TableHead>
                          <TableHead>{t('admin.paymentManagement.actions')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.map((payment) => {
                          const status = getPaymentStatus(payment);
                          const StatusIcon = status.icon;
                          const isEditing = editingPaymentId === payment.payment_id;
                          
                          return (
                            <TableRow key={payment.payment_id}>
                              <TableCell className="font-medium">{translateMonth(payment.month)} {payment.year}</TableCell>
                              
                              {/* Plan Type */}
                              <TableCell>
                                {isEditing ? (
                                                                  <Select
                                                                    value={editForm.plan_type || ''}
                                                                    onValueChange={(value) => setEditForm({ ...editForm, plan_type: value })}
                                                                  >
                                                                    <SelectTrigger className="w-32">
                                                                      <SelectValue placeholder={t('admin.paymentManagement.selectPlan')} />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                      <SelectItem value="month">{t('admin.paymentManagement.month')}</SelectItem>
                                                                      <SelectItem value="pack1">{t('admin.paymentManagement.pack1')}</SelectItem>
                                                                      <SelectItem value="pack5">{t('admin.paymentManagement.pack5')}</SelectItem>
                                                                      <SelectItem value="pack10">{t('admin.paymentManagement.pack10')}</SelectItem>
                                                                      <SelectItem value="daily">{t('admin.paymentManagement.daily')}</SelectItem>
                                                                    </SelectContent>
                                                                  </Select>
                                ) : (
                                  payment.plan_type
                                    ? (['month', 'pack1', 'pack5', 'pack10', 'daily'].includes(payment.plan_type)
                                        ? t(`admin.paymentManagement.${payment.plan_type}`)
                                        : payment.plan_type)
                                    : '-'
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
                  {isEditing && <span className="ml-1 text-[10px]">({t('admin.paymentManagement.auto')})</span>}
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
                              
                              {/* Invoice Number - Admin only */}
                              {userRole !== 'reports_viewer' && (
                                <TableCell>
                                  {isEditing ? (
                                    <Input
                                      value={editForm.invoice_number}
                                      onChange={(e) => setEditForm({ ...editForm, invoice_number: e.target.value })}
                                      placeholder={t('admin.paymentManagement.invoiceNumberPlaceholder')}
                                      className="w-32"
                                    />
                                  ) : (
                                    payment.invoice_number || '-'
                                  )}
                                </TableCell>
                              )}
                              
                              {/* Entity - Admin only */}
                              {userRole !== 'reports_viewer' && (
                                <TableCell>
                                  {isEditing ? (
                                    <Input
                                      value={editForm.entity}
                                      onChange={(e) => setEditForm({ ...editForm, entity: e.target.value })}
                                      placeholder={t('admin.paymentManagement.entityPlaceholder')}
                                      className="w-32"
                                    />
                                  ) : (
                                    payment.entity || '-'
                                  )}
                                </TableCell>
                              )}
                              
                               {/* Notes */}
                               <TableCell className="min-w-[260px] max-w-xl align-top">
                                 {isEditing ? (
                                   <Textarea
                                     value={editForm.notes}
                                     onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                                     placeholder={t('admin.paymentManagement.addNotes')}
                                     className="min-h-[120px] text-base w-full resize-y"
                                     rows={3}
                                   />
                                 ) : (
                                   <div className="text-sm text-foreground whitespace-pre-wrap">
                                     {payment.notes || '-'}
                                   </div>
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
                                  userRole !== 'reports_viewer' && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleEditStart(payment)}
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </Button>
                                  )
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