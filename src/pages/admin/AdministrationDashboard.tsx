import { useNavigate } from "react-router-dom";
import { Settings, Users, DollarSign, Calendar, UserPlus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AppHeader from "@/components/shared/AppHeader";
import SponsorBanner from "@/components/shared/SponsorBanner";
import AppFooter from "@/components/shared/AppFooter";

const AdministrationDashboard = () => {
  const navigate = useNavigate();

  const adminActions = [
    {
      title: "Manage Users",
      description: "Add, edit, and remove coaches, athletes, and guardians",
      icon: Users,
      color: "primary",
      action: "View Users"
    },
    {
      title: "Athlete Management", 
      description: "Full CRUD access to athlete profiles and data",
      icon: UserPlus,
      color: "success",
      action: "Manage Athletes"
    },
    {
      title: "Payment Administration",
      description: "Set fees, mark payments, and view financial reports",
      icon: DollarSign,
      color: "warning",
      action: "Payment Settings"
    },
    {
      title: "Attendance Overview",
      description: "View and edit attendance records for all athletes",
      icon: Calendar,
      color: "secondary",
      action: "View Attendance"
    }
  ];

  const quickStats = [
    { label: "Total Athletes", value: "48", color: "primary" },
    { label: "Active Coaches", value: "6", color: "success" },
    { label: "Outstanding Payments", value: "$2,340", color: "destructive" },
    { label: "This Month Sessions", value: "156", color: "warning" }
  ];

  return (
    <div className="min-h-screen bg-gradient-surface">
      <AppHeader title="Administration" showBack backTo="/" />
      
      <main className="mobile-container py-6">
        {/* Admin Header */}
        <Card className="shadow-medium mb-6">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings className="h-8 w-8 text-secondary-foreground" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Admin Dashboard</h2>
              <p className="text-muted-foreground">Complete school management access</p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {quickStats.map((stat, index) => (
            <Card key={index} className="shadow-soft">
              <CardContent className="p-4 text-center">
                <p className={`text-2xl font-bold text-${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Admin Actions */}
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-foreground mb-4">Management Tools</h3>
          
          {adminActions.map((action, index) => (
            <Card 
              key={index} 
              className="shadow-soft hover:shadow-medium transition-shadow cursor-pointer"
              onClick={() => {
                switch(action.title) {
                  case "Manage Users":
                    navigate("/admin/users");
                    break;
                  case "Athlete Management":
                    navigate("/admin/athletes");
                    break;
                  case "Payment Administration":
                    navigate("/admin/payments");
                    break;
                  default:
                    break;
                }
              }}
            >
              <CardContent className="p-0">
                <div className="flex items-center p-4">
                  <div className={`w-12 h-12 rounded-full bg-${action.color}/10 flex items-center justify-center mr-4 flex-shrink-0`}>
                    <action.icon className={`h-6 w-6 text-${action.color}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground mb-1">{action.title}</h4>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="ml-4 touch-friendly"
                  >
                    {action.action}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity */}
        <Card className="shadow-soft mt-6">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Recent Activity</CardTitle>
            <CardDescription>Latest system changes and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { action: "New athlete enrolled", details: "Sofia Martinez - Beginner level", time: "2 hours ago" },
                { action: "Payment received", details: "Emma Johnson - September fee", time: "4 hours ago" },
                { action: "Attendance updated", details: "Coach Maria updated 5 records", time: "6 hours ago" },
                { action: "Coach added", details: "New coach profile: Alex Thompson", time: "1 day ago" }
              ].map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border border-border rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.details}</p>
                    <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

      <SponsorBanner />
      <AppFooter />
    </div>
  );
};

export default AdministrationDashboard;