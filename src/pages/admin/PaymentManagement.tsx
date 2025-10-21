import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Euro, Search, CheckCircle, AlertCircle, Clock, CreditCard } from "lucide-react";
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

interface Athlete {
  athlete_id: string;
  first_name: string;
  last_name: string;
}

const PaymentManagement = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);

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
              <CreditCard className="h-6 w-6 text-primary" />
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
                  <p className="text-lg font-bold text-foreground">€{outstanding.toFixed(2)}</p>
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
                          <TableHead>Amount Due</TableHead>
                          <TableHead>Amount Paid</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.map((payment) => {
                          const status = getPaymentStatus(payment);
                          const StatusIcon = status.icon;
                          
                          return (
                            <TableRow key={payment.payment_id}>
                              <TableCell className="font-medium">{payment.month} {payment.year}</TableCell>
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
          </>
        )}
      </main>

      <SponsorBanner />
      <AppFooter />
    </div>
  );
};

export default PaymentManagement;