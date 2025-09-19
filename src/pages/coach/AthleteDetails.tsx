import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Calendar, Clock, MapPin, User, Phone, Mail, Car, Camera, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import AppHeader from "@/components/shared/AppHeader";
import SponsorBanner from "@/components/shared/SponsorBanner";
import AppFooter from "@/components/shared/AppFooter";

// Mock athlete data
const athleteData = {
  id: "1",
  name: "Emma Johnson",
  dateOfBirth: "March 15, 2010",
  healthNumber: "APS-2024-058",
  address: "123 Ocean View Drive, Beach City",
  phone: "(555) 123-4567",
  level: "Intermediate",
  mother: {
    name: "Sarah Johnson",
    phone: "(555) 123-4567",
    email: "sarah.johnson@email.com"
  },
  father: {
    name: "Mike Johnson", 
    phone: "(555) 987-6543",
    email: "mike.johnson@email.com"
  },
  training: {
    weeklyCount: 3,
    schedule: "Mon 18:00, Wed 18:00, Fri 18:00",
    days: ["Monday", "Wednesday", "Friday"]
  },
  transportation: {
    provided: true,
    pickup: {
      address: "123 Ocean View Drive",
      days: "Mon, Wed, Fri",
      time: "17:30"
    },
    dropoff: {
      address: "123 Ocean View Drive", 
      days: "Mon, Wed, Fri",
      time: "19:30"
    }
  }
};

const mockAttendance = [
  { date: "2024-09-18", status: "Present", coach: "Coach Maria", beach: "Main Beach", observations: "Great progress on turns" },
  { date: "2024-09-16", status: "Present", coach: "Coach John", beach: "North Beach", observations: "Working on balance" },
  { date: "2024-13", status: "Justified", coach: "Coach Maria", beach: "-", observations: "Family vacation" },
  { date: "2024-09-11", status: "Present", coach: "Coach John", beach: "Main Beach", observations: "Excellent session" },
];

const AthleteDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [attendance, setAttendance] = useState(mockAttendance);
  const [editingAttendance, setEditingAttendance] = useState<string | null>(null);

  const coaches = ["Coach Maria", "Coach John", "Coach Alex", "Coach Sarah"];
  const beaches = ["Main Beach", "North Beach", "South Beach", "Training Pool"];
  const statusOptions = ["Present", "Justified absence", "Absent"];

  const handleSaveAttendance = (date: string) => {
    setEditingAttendance(null);
    toast({
      title: "Attendance Saved",
      description: "Attendance record has been updated successfully.",
    });
  };

  const updateAttendanceField = (date: string, field: string, value: string) => {
    setAttendance(prev => prev.map(record => 
      record.date === date ? { ...record, [field]: value } : record
    ));
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Beginner": return "bg-warning/10 text-warning";
      case "Intermediate": return "bg-primary/10 text-primary";
      case "Advanced": return "bg-success/10 text-success";
      default: return "bg-secondary/10 text-secondary-foreground";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Present": return "bg-success/10 text-success";
      case "Justified absence": return "bg-warning/10 text-warning";
      case "Absent": return "bg-destructive/10 text-destructive";
      default: return "bg-secondary/10 text-secondary-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-surface">
      <AppHeader title="Athlete Details" showBack backTo="/dashboard/coach" />
      
      <main className="mobile-container py-6">
        {/* Athlete Header */}
        <Card className="shadow-medium mb-6">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">{athleteData.name}</h2>
            <Badge className={getLevelColor(athleteData.level)}>{athleteData.level}</Badge>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="personal" className="text-xs">Personal</TabsTrigger>
            <TabsTrigger value="training" className="text-xs">Training</TabsTrigger>
            <TabsTrigger value="attendance" className="text-xs">Attendance</TabsTrigger>
          </TabsList>

          {/* Personal Data (Read-only) */}
          <TabsContent value="personal" className="space-y-4">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
                <CardDescription>Read-only athlete data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Date of Birth</p>
                    <p className="font-medium">{athleteData.dateOfBirth}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Health Number</p>
                    <p className="font-medium">{athleteData.healthNumber}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Address</p>
                    <p className="font-medium">{athleteData.address}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    <p className="font-medium">{athleteData.phone}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Level</p>
                    <Badge className={getLevelColor(athleteData.level)}>{athleteData.level}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-4">
              {/* Mother */}
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Phone className="h-5 w-5" />
                    Mother
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p><span className="text-muted-foreground">Name:</span> {athleteData.mother.name}</p>
                  <p><span className="text-muted-foreground">Phone:</span> {athleteData.mother.phone}</p>
                  <p><span className="text-muted-foreground">Email:</span> {athleteData.mother.email}</p>
                </CardContent>
              </Card>

              {/* Father */}
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Phone className="h-5 w-5" />
                    Father
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p><span className="text-muted-foreground">Name:</span> {athleteData.father.name}</p>
                  <p><span className="text-muted-foreground">Phone:</span> {athleteData.father.phone}</p>
                  <p><span className="text-muted-foreground">Email:</span> {athleteData.father.email}</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Training Info (Read-only) */}
          <TabsContent value="training" className="space-y-4">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Training Schedule
                </CardTitle>
                <CardDescription>Read-only training information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Weekly Sessions</p>
                  <p className="font-medium">{athleteData.training.weeklyCount} sessions per week</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground mb-3">Training Days</p>
                  <div className="space-y-2">
                    {athleteData.training.days.map((day, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 bg-accent/50 rounded-md">
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="font-medium">{day} 18:00</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
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
                      <p className="font-medium">{athleteData.transportation.pickup.address} - {athleteData.transportation.pickup.days} at {athleteData.transportation.pickup.time}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Drop-off</p>
                      <p className="font-medium">{athleteData.transportation.dropoff.address} - {athleteData.transportation.dropoff.days} at {athleteData.transportation.dropoff.time}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attendance (COACH EDITABLE) */}
          <TabsContent value="attendance" className="space-y-4">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  September 2024 Attendance
                </CardTitle>
                <CardDescription className="text-primary font-medium">
                  ✏️ Editable by Coach
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {attendance.map((session, index) => (
                    <div key={index} className="border border-border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{session.date}</h4>
                        {editingAttendance === session.date ? (
                          <Button 
                            size="sm" 
                            onClick={() => handleSaveAttendance(session.date)}
                            className="touch-friendly"
                          >
                            <Save className="h-4 w-4 mr-1" />
                            Save
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setEditingAttendance(session.date)}
                            className="touch-friendly"
                          >
                            Edit
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Status</p>
                          {editingAttendance === session.date ? (
                            <Select
                              value={session.status}
                              onValueChange={(value) => updateAttendanceField(session.date, 'status', value)}
                            >
                              <SelectTrigger className="touch-friendly">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {statusOptions.map(status => (
                                  <SelectItem key={status} value={status}>{status}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge className={getStatusColor(session.status)}>
                              {session.status}
                            </Badge>
                          )}
                        </div>

                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Coach</p>
                          {editingAttendance === session.date ? (
                            <Select
                              value={session.coach}
                              onValueChange={(value) => updateAttendanceField(session.date, 'coach', value)}
                            >
                              <SelectTrigger className="touch-friendly">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {coaches.map(coach => (
                                  <SelectItem key={coach} value={coach}>{coach}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <p className="font-medium">{session.coach}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Beach Location</p>
                        {editingAttendance === session.date ? (
                          <Select
                            value={session.beach}
                            onValueChange={(value) => updateAttendanceField(session.date, 'beach', value)}
                          >
                            <SelectTrigger className="touch-friendly">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {beaches.map(beach => (
                                <SelectItem key={beach} value={beach}>{beach}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="font-medium">{session.beach}</p>
                        )}
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Coach Observations</p>
                        {editingAttendance === session.date ? (
                          <Textarea
                            value={session.observations}
                            onChange={(e) => updateAttendanceField(session.date, 'observations', e.target.value)}
                            placeholder="Add your observations about this session..."
                            className="touch-friendly"
                          />
                        ) : (
                          <p className="text-sm bg-muted/50 p-2 rounded">{session.observations}</p>
                        )}
                      </div>

                      {editingAttendance === session.date && (
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1 touch-friendly">
                            <Camera className="h-4 w-4 mr-1" />
                            Upload Photo
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1 touch-friendly">
                            <Camera className="h-4 w-4 mr-1" />
                            Upload Video
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
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

export default AthleteDetails;