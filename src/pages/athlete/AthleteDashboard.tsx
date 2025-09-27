import { useState } from "react";
import { Trophy, Calendar, Clock, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import AppHeader from "@/components/shared/AppHeader";
import SponsorBanner from "@/components/shared/SponsorBanner";
import AppFooter from "@/components/shared/AppFooter";

const AthleteDashboard = () => {
  const [selectedMonth, setSelectedMonth] = useState({ month: 8, year: 2024 }); // September = month 8 (0-indexed)

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
      <AppHeader title="Athlete Dashboard" showBack backTo="/" />
      
      <main className="mobile-container py-6">
        {/* Athlete Info Header */}
        <Card className="shadow-medium mb-6">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="h-8 w-8 text-success" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Emma Johnson</h2>
              <Badge className="bg-primary/10 text-primary mb-2">Intermediate Level</Badge>
              <p className="text-sm text-muted-foreground">Member since March 2024</p>
            </div>
          </CardContent>
        </Card>

        {/* Tabs Navigation */}
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="personal" className="text-xs">Personal</TabsTrigger>
            <TabsTrigger value="training" className="text-xs">Training</TabsTrigger>
            <TabsTrigger value="attendance" className="text-xs">Attendance</TabsTrigger>
          </TabsList>

          {/* Personal Data Tab */}
          <TabsContent value="personal" className="space-y-4">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="text-lg">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Date of Birth</p>
                    <p className="font-medium">March 15, 2010</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Health Number</p>
                    <p className="font-medium">APS-2024-058</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Address</p>
                    <p className="font-medium">123 Ocean View Drive, Beach City</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    <p className="font-medium">(555) 123-4567</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Level</p>
                    <Badge className="bg-primary/10 text-primary">Intermediate</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="text-lg">Emergency Contacts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Mother</h4>
                  <div className="text-sm space-y-1">
                    <p><span className="text-muted-foreground">Name:</span> Sarah Johnson</p>
                    <p><span className="text-muted-foreground">Phone:</span> (555) 123-4567</p>
                    <p><span className="text-muted-foreground">Email:</span> sarah.johnson@email.com</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Father</h4>
                  <div className="text-sm space-y-1">
                    <p><span className="text-muted-foreground">Name:</span> Mike Johnson</p>
                    <p><span className="text-muted-foreground">Phone:</span> (555) 987-6543</p>
                    <p><span className="text-muted-foreground">Email:</span> mike.johnson@email.com</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Training Info Tab */}
          <TabsContent value="training" className="space-y-4">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Training Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Weekly Sessions</p>
                  <p className="font-medium">3 sessions per week</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground mb-3">Training Days</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-2 bg-accent/50 rounded-md">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="font-medium">Monday 18:00</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-accent/50 rounded-md">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="font-medium">Wednesday 18:00</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-accent/50 rounded-md">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="font-medium">Friday 18:00</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Transportation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-success/10 text-success">Service Provided</Badge>
                  </div>
                  <div className="text-sm space-y-2">
                    <div>
                      <p className="text-muted-foreground">Pickup</p>
                      <p className="font-medium">Home - Monday, Wednesday, Friday at 17:30</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Drop-off</p>
                      <p className="font-medium">Home - Monday, Wednesday, Friday at 19:30</p>
                    </div>
                  </div>
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
                <CardDescription>Your training session record</CardDescription>
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

            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Monthly Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-success">12</p>
                    <p className="text-xs text-muted-foreground">Present</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-warning">1</p>
                    <p className="text-xs text-muted-foreground">Justified</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-destructive">0</p>
                    <p className="text-xs text-muted-foreground">Absent</p>
                  </div>
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

export default AthleteDashboard;