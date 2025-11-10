import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Euro, Calendar, TrendingUp, Receipt, Search, ArrowUpDown, ArrowUp, ArrowDown, FileText } from "lucide-react";
import { format } from "date-fns";
import { useState, useMemo } from "react";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [filterYear, setFilterYear] = useState<string>("all");
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [sortField, setSortField] = useState<"payment_date" | "amount">("payment_date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

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

  // Get unique years and months for filters
  const availableYears = useMemo(() => {
    if (!payments) return [];
    const years = [...new Set(payments.map(p => p.payment_year))];
    return years.sort((a, b) => b - a);
  }, [payments]);

  const availableMonths = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Filter and sort payments
  const filteredAndSortedPayments = useMemo(() => {
    if (!payments) return [];
    
    let filtered = payments.filter(payment => {
      const matchesSearch = !searchTerm || 
        payment.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.payment_month.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesYear = filterYear === "all" || payment.payment_year === parseInt(filterYear);
      const matchesMonth = filterMonth === "all" || payment.payment_month === filterMonth;
      
      return matchesSearch && matchesYear && matchesMonth;
    });

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortField === "payment_date") {
        comparison = new Date(a.payment_date).getTime() - new Date(b.payment_date).getTime();
      } else {
        comparison = Number(a.amount) - Number(b.amount);
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [payments, searchTerm, filterYear, filterMonth, sortField, sortDirection]);

  const handleSort = (field: "payment_date" | "amount") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const SortIcon = ({ field }: { field: "payment_date" | "amount" }) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 ml-1 opacity-40" />;
    return sortDirection === "asc" ? 
      <ArrowUp className="h-4 w-4 ml-1" /> : 
      <ArrowDown className="h-4 w-4 ml-1" />;
  };

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
          <CardDescription>
            {filteredAndSortedPayments.length} payment{filteredAndSortedPayments.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by notes or month..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {availableYears.map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {availableMonths.map(month => (
                  <SelectItem key={month} value={month}>{month}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/70 transition-colors select-none"
                      onClick={() => handleSort("payment_date")}
                    >
                      <div className="flex items-center font-semibold">
                        Payment Date
                        <SortIcon field="payment_date" />
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold">For Month/Year</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/70 transition-colors select-none text-right"
                      onClick={() => handleSort("amount")}
                    >
                      <div className="flex items-center justify-end font-semibold">
                        Amount
                        <SortIcon field="amount" />
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedPayments.length > 0 ? (
                    filteredAndSortedPayments.map((payment, index) => (
                      <TableRow 
                        key={payment.id}
                        className={`hover:bg-muted/50 transition-colors ${
                          index === 0 && filterYear === "all" && filterMonth === "all" && !searchTerm
                            ? "bg-primary/5"
                            : ""
                        }`}
                      >
                        <TableCell className="font-medium whitespace-nowrap">
                          {format(new Date(payment.payment_date), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge variant="outline" className="font-normal">
                            {payment.payment_month} {payment.payment_year}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold text-primary text-right whitespace-nowrap">
                          {Number(payment.amount).toFixed(2)}€
                        </TableCell>
                        <TableCell className="max-w-md">
                          <span className="text-sm text-muted-foreground">
                            {payment.notes || '-'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32">
                        <div className="flex flex-col items-center justify-center text-center py-6">
                          <FileText className="h-12 w-12 text-muted-foreground/50 mb-3" />
                          <p className="text-sm font-medium text-foreground mb-1">No payments found</p>
                          <p className="text-xs text-muted-foreground">
                            {searchTerm || filterYear !== "all" || filterMonth !== "all"
                              ? "Try adjusting your filters or search term"
                              : "Payment records will appear here once added"}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};