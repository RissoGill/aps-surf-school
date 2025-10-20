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

      // Filter payments from September 2025 to September 2026
      const months2025 = ["September", "October", "November", "December"];
      const months2026 = ["January", "February", "March", "April", "May", "June", "July", "August", "September"];

      const filteredData = (data || []).filter(payment => {
        const year = payment.year;
        const month = payment.month;

        if (year === 2025) {
          return months2025.includes(month);
        } else if (year === 2026) {
          return months2026.includes(month);
        }
        return false;
      });

      return filteredData.map(payment => ({
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

  // Calculate summary statistics for selected athlete
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
                  <Euro className="h-6 w-6 text-success mx-auto mb-2" />
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
                <CardTitle>Payment Records</CardTitle>
                <CardDescription>Payment history for {selectedAthlete.first_name} {selectedAthlete.last_name}</CardDescription>
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