import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DollarSign, Search, CheckCircle, AlertCircle, Clock, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import AppHeader from "@/components/shared/AppHeader";
import SponsorBanner from "@/components/shared/SponsorBanner";
import AppFooter from "@/components/shared/AppFooter";

// Mock payment data
const mockPayments = [
  {
    id: 1,
    athleteName: "Emma Johnson",
    guardianName: "Sarah Johnson",
    month: "September 2024",
    amount: 180,
    dueDate: "2024-09-05",
    status: "Paid",
    paidDate: "2024-09-03",
    method: "Credit Card"
  },
  {
    id: 2,
    athleteName: "Liam Smith",
    guardianName: "Lisa Smith", 
    month: "September 2024",
    amount: 160,
    dueDate: "2024-09-05",
    status: "Overdue",
    paidDate: null,
    method: null
  },
  {
    id: 3,
    athleteName: "Sofia Rodriguez",
    guardianName: "Carmen Rodriguez",
    month: "September 2024", 
    amount: 200,
    dueDate: "2024-09-05",
    status: "Paid",
    paidDate: "2024-09-01",
    method: "Bank Transfer"
  },
  {
    id: 4,
    athleteName: "Emma Johnson",
    guardianName: "Sarah Johnson",
    month: "October 2024",
    amount: 180,
    dueDate: "2024-10-05",
    status: "Pending",
    paidDate: null,
    method: null
  }
];

const PaymentManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [payments, setPayments] = useState(mockPayments);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.athleteName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         payment.guardianName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "All" || payment.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusInfo = (payment: any) => {
    const today = new Date();
    const dueDate = new Date(payment.dueDate);
    
    if (payment.status === "Paid") {
      return { 
        status: "Paid", 
        color: "bg-success/10 text-success", 
        icon: CheckCircle 
      };
    } else if (today > dueDate) {
      return { 
        status: "Overdue", 
        color: "bg-destructive/10 text-destructive", 
        icon: AlertCircle 
      };
    } else {
      return { 
        status: "Pending", 
        color: "bg-warning/10 text-warning", 
        icon: Clock 
      };
    }
  };

  const markAsPaid = (paymentId: number) => {
    setPayments(payments.map(payment => 
      payment.id === paymentId 
        ? { 
            ...payment, 
            status: "Paid", 
            paidDate: new Date().toISOString().split('T')[0],
            method: "Manual Entry"
          }
        : payment
    ));
    
    toast({
      title: "Payment Marked as Paid",
      description: "Payment status has been updated successfully.",
    });
  };

  const totalPending = payments
    .filter(p => p.status === "Pending" || p.status === "Overdue")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalOverdue = payments
    .filter(p => p.status === "Overdue")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPaidThisMonth = payments
    .filter(p => p.status === "Paid" && p.month.includes("September"))
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="min-h-screen bg-gradient-surface">
      <AppHeader title="Payment Management" showBack backTo="/dashboard/administration" />
      
      <main className="mobile-container py-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">Payments</h2>
          <p className="text-base text-muted-foreground font-medium">{filteredPayments.length} payment records</p>
        </div>

        {/* Search and Filter */}
        <div className="space-y-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by athlete or guardian name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 touch-friendly"
            />
          </div>
          
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Statuses</SelectItem>
              <SelectItem value="Paid">Paid</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="shadow-soft">
            <CardContent className="p-4 text-center">
              <DollarSign className="h-6 w-6 text-success mx-auto mb-2" />
              <p className="text-lg font-bold text-foreground">${totalPaidThisMonth}</p>
              <p className="text-xs text-muted-foreground">Collected This Month</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-soft">
            <CardContent className="p-4 text-center">
              <AlertCircle className="h-6 w-6 text-destructive mx-auto mb-2" />
              <p className="text-lg font-bold text-foreground">${totalOverdue}</p>
              <p className="text-xs text-muted-foreground">Overdue Amount</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-soft col-span-2">
            <CardContent className="p-4 text-center">
              <Clock className="h-6 w-6 text-warning mx-auto mb-2" />
              <p className="text-xl font-bold text-foreground">${totalPending}</p>
              <p className="text-sm text-muted-foreground">Total Outstanding</p>
            </CardContent>
          </Card>
        </div>

        {/* Payments List */}
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Records
            </CardTitle>
            <CardDescription>Manage monthly payments and track status</CardDescription>
          </CardHeader>
          
          <CardContent className="p-0">
            {filteredPayments.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-muted-foreground">No payments found</p>
              </div>
            ) : (
              <div className="space-y-0">
                {filteredPayments.map((payment) => {
                  const statusInfo = getStatusInfo(payment);
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <div 
                      key={payment.id} 
                      className={`p-4 border-b border-border last:border-b-0 ${
                        statusInfo.status === "Overdue" ? "bg-destructive/5" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-medium text-foreground">{payment.athleteName}</h3>
                          <p className="text-sm text-muted-foreground">Guardian: {payment.guardianName}</p>
                          <p className="text-xs text-muted-foreground">{payment.month}</p>
                        </div>
                        
                        <div className="text-right">
                          <p className="font-bold text-foreground">${payment.amount}</p>
                          <Badge className={statusInfo.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusInfo.status}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="text-xs text-muted-foreground space-y-1 mb-3">
                        <p>Due Date: {new Date(payment.dueDate).toLocaleDateString()}</p>
                        {payment.paidDate && (
                          <p className="text-success">
                            Paid: {new Date(payment.paidDate).toLocaleDateString()}
                            {payment.method && ` via ${payment.method}`}
                          </p>
                        )}
                      </div>
                      
                      {payment.status !== "Paid" && (
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            className="flex-1 touch-friendly"
                            variant={statusInfo.status === "Overdue" ? "destructive" : "default"}
                            onClick={() => markAsPaid(payment.id)}
                          >
                            Mark as Paid
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 touch-friendly"
                          >
                            Send Reminder
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <SponsorBanner />
      <AppFooter />
    </div>
  );
};

export default PaymentManagement;