import { useState } from "react";
import { Heart, CreditCard, AlertCircle, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import AppHeader from "@/components/shared/AppHeader";
import SponsorBanner from "@/components/shared/SponsorBanner";
import AppFooter from "@/components/shared/AppFooter";

const GuardianDashboard = () => {
  const [selectedMonth, setSelectedMonth] = useState({ month: 8, year: 2024 }); // September = month 8 (0-indexed)
  
  const payments = [
    { month: "September 2024", amount: 180, dueDate: "Sep 5", status: "Paid", paidDate: "Sep 3" },
    { month: "August 2024", amount: 180, dueDate: "Aug 5", status: "Paid", paidDate: "Aug 2" },
    { month: "October 2024", amount: 180, dueDate: "Oct 5", status: "Unpaid", paidDate: null },
  ];

  const getPaymentStatus = (payment: any) => {
    const today = new Date();
    const dueDate = new Date(payment.dueDate + ", 2024");
    
    if (payment.status === "Paid") {
      return { status: "Paid", color: "bg-success/10 text-success", icon: CheckCircle };
    } else if (today > dueDate) {
      return { status: "Overdue", color: "bg-destructive/10 text-destructive", icon: AlertCircle };
    } else {
      return { status: "Unpaid", color: "bg-warning/10 text-warning", icon: AlertCircle };
    }
  };

  const totalOutstanding = payments
    .filter(p => p.status === "Unpaid")
    .reduce((sum, p) => sum + p.amount, 0);

  const getMonthName = (month: number, year: number) => {
    const date = new Date(year, month);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setSelectedMonth(prev => {
      const newMonth = direction === 'prev' ? prev.month - 1 : prev.month + 1;
      if (newMonth < 0) {
        return { month: 11, year: prev.year - 1 };
      } else if (newMonth > 11) {
        return { month: 0, year: prev.year + 1 };
      }
      return { month: newMonth, year: prev.year };
    });
  };

  const getAttendanceForMonth = (month: number, year: number) => {
    // Mock data - in real app, this would filter by selected month
    if (month === 8 && year === 2024) { // September 2024
      return [
        { date: "Sep 18", status: "Present", coach: "Coach Maria" },
        { date: "Sep 16", status: "Present", coach: "Coach John" },
        { date: "Sep 13", status: "Justified", coach: "Coach Maria" },
        { date: "Sep 11", status: "Present", coach: "Coach John" },
        { date: "Sep 9", status: "Present", coach: "Coach Maria" }
      ];
    } else if (month === 7 && year === 2024) { // August 2024
      return [
        { date: "Aug 21", status: "Present", coach: "Coach Maria" },
        { date: "Aug 19", status: "Present", coach: "Coach John" },
        { date: "Aug 16", status: "Absent", coach: "Coach Maria" },
        { date: "Aug 14", status: "Present", coach: "Coach John" },
      ];
    } else {
      return [
        { date: `${getMonthName(month, year).split(' ')[0].slice(0,3)} 15`, status: "Present", coach: "Coach Maria" },
        { date: `${getMonthName(month, year).split(' ')[0].slice(0,3)} 12`, status: "Present", coach: "Coach John" },
      ];
    }
  };

  return (
    <div className="min-h-screen bg-gradient-surface">
      <AppHeader title="Guardian Dashboard" showBack backTo="/" />
      
      <main className="mobile-container py-6">
        {/* Child Info Header */}
        <Card className="shadow-medium mb-6">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-warning" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Emma Johnson</h2>
              <Badge className="bg-primary/10 text-primary mb-2">Intermediate Level</Badge>
              <p className="text-sm text-muted-foreground">Your Child's Progress</p>
            </div>
          </CardContent>
        </Card>

        {/* Tabs Navigation */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="payments" className="text-xs">Payments</TabsTrigger>
            <TabsTrigger value="attendance" className="text-xs">Attendance</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div>
                      <p className="font-medium">Training Session</p>
                      <p className="text-sm text-muted-foreground">Yesterday at 18:00</p>
                    </div>
                    <Badge className="bg-success/10 text-success">Present</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div>
                      <p className="font-medium">September Payment</p>
                      <p className="text-sm text-muted-foreground">Processed on Sep 3</p>
                    </div>
                    <Badge className="bg-success/10 text-success">Paid</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div>
                      <p className="font-medium">Next Training</p>
                      <p className="text-sm text-muted-foreground">Tomorrow at 18:00</p>
                    </div>
                    <Badge className="bg-primary/10 text-primary">Scheduled</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-success">92%</p>
                    <p className="text-xs text-muted-foreground">Attendance Rate</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">24</p>
                    <p className="text-xs text-muted-foreground">Sessions This Month</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-4">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-accent/50 rounded-lg">
                    <p className="text-lg font-bold text-foreground">$180</p>
                    <p className="text-xs text-muted-foreground">Monthly Fee</p>
                  </div>
                  <div className="text-center p-3 bg-destructive/10 rounded-lg">
                    <p className="text-lg font-bold text-destructive">${totalOutstanding}</p>
                    <p className="text-xs text-muted-foreground">Outstanding</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>Payments are due on the 5th of each month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {payments.map((payment, index) => {
                    const statusInfo = getPaymentStatus(payment);
                    const StatusIcon = statusInfo.icon;
                    
                    return (
                      <div 
                        key={index} 
                        className={`p-4 border rounded-lg ${
                          statusInfo.status === "Overdue" ? "border-destructive bg-destructive/5" : "border-border"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{payment.month}</h4>
                          <Badge className={statusInfo.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusInfo.status}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Amount: <span className="font-medium">${payment.amount}</span></p>
                          <p>Due Date: <span className="font-medium">{payment.dueDate}</span></p>
                          {payment.paidDate && (
                            <p>Paid On: <span className="font-medium text-success">{payment.paidDate}</span></p>
                          )}
                        </div>
                        
                        {payment.status === "Unpaid" && (
                          <Button 
                            className="w-full mt-3 touch-friendly"
                            variant={statusInfo.status === "Overdue" ? "destructive" : "default"}
                          >
                            Pay Now - ${payment.amount}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance" className="space-y-4">
            <Card className="shadow-soft">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <CardTitle>{getMonthName(selectedMonth.month, selectedMonth.year)} Attendance</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => navigateMonth('prev')}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => navigateMonth('next')}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription>Emma's training session record</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {getAttendanceForMonth(selectedMonth.month, selectedMonth.year).map((session, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div>
                        <p className="font-medium">{session.date}</p>
                        <p className="text-sm text-muted-foreground">{session.coach}</p>
                      </div>
                      <Badge className={
                        session.status === "Present" 
                          ? "bg-success/10 text-success" 
                          : session.status === "Justified"
                          ? "bg-warning/10 text-warning"
                          : "bg-destructive/10 text-destructive"
                      }>
                        {session.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <SponsorBanner />
      <AppFooter />
    </div>
  );
};

export default GuardianDashboard;