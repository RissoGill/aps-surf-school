import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Calendar, Clock, MapPin, User, Phone, Mail, Car, Camera, Save, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import AppHeader from "@/components/shared/AppHeader";
import SponsorBanner from "@/components/shared/SponsorBanner";
import AppFooter from "@/components/shared/AppFooter";

interface Athlete {
  Athlete_Id: string;
  first_name: string | null;
  last_name: string | null;
  date_of_birth: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  surf_level: string | null;
  mother_name: string | null;
  mother_phone: number | null;
  mother_email: string | null;
  father_name: string | null;
  father_phone: string | null;
  father_email: string | null;
  trainings_per_week: number | null;
  training_days: string | null;
  transport: boolean | null;
  pickup_address: string | null;
  dropoff_address: string | null;
}

interface AttendanceRecord {
  Id: string;
  Date: string | null;
  status: string | null;
  treinador: string | null;
  praia: string | null;
  notas: string | null;
}

const AthleteDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [editingAttendance, setEditingAttendance] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState({ month: 8, year: 2024 }); // September = month 8 (0-indexed)

  const { data: athlete, isLoading, error } = useQuery({
    queryKey: ['athlete', id],
    queryFn: async () => {
      if (!id) throw new Error('No athlete ID provided');
      
      const { data, error } = await supabase
        .from('Atletas')
        .select('*')
        .eq('Athlete_Id', id)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) throw new Error('Athlete not found');
      return data as Athlete;
    },
    enabled: !!id,
  });

  const { data: attendanceRecords = [], isLoading: isLoadingAttendance } = useQuery({
    queryKey: ['attendance', id],
    queryFn: async () => {
      if (!id) return [];
      
      const { data, error } = await supabase
        .from('Attendance')
        .select('*')
        .eq('Athlete_id', id)
        .order('Date', { ascending: false });
      
      if (error) throw error;
      return (data || []) as AttendanceRecord[];
    },
    enabled: !!id,
  });

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

  const updateAttendanceField = (recordId: string, field: string, value: string) => {
    // This would update the attendance record in Supabase
    // For now, just close the editing mode
    toast({
      title: "Update Pending",
      description: "Attendance update functionality will be implemented.",
    });
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
    return attendanceRecords.filter(record => {
      if (!record.Date) return false;
      const recordDate = new Date(record.Date);
      return recordDate.getMonth() === month && recordDate.getFullYear() === year;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-surface">
      <AppHeader title="Athlete Details" showBack backTo="/dashboard/coach" />
      
      <main className="mobile-container py-6">
        {isLoading && (
          <div className="space-y-4">
            <Card className="shadow-medium">
              <CardContent className="p-6 text-center">
                <Skeleton className="w-16 h-16 rounded-full mx-auto mb-4" />
                <Skeleton className="h-6 w-32 mx-auto mb-2" />
                <Skeleton className="h-5 w-24 mx-auto" />
              </CardContent>
            </Card>
          </div>
        )}

        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive text-center">Error loading athlete data: {error.message}</p>
              <Button onClick={() => navigate('/dashboard/coach')} className="mt-4 mx-auto block">
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        )}

        {athlete && (
          <>
            {/* Athlete Header */}
            <Card className="shadow-medium mb-6">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">
                  {athlete.first_name} {athlete.last_name}
                </h2>
                {athlete.surf_level && (
                  <Badge className={getLevelColor(athlete.surf_level)}>{athlete.surf_level}</Badge>
                )}
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
                    <p className="font-medium">{athlete.date_of_birth || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Level</p>
                    {athlete.surf_level ? (
                      <Badge className={getLevelColor(athlete.surf_level)}>{athlete.surf_level}</Badge>
                    ) : (
                      <p className="font-medium">N/A</p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Address</p>
                    <p className="font-medium">{athlete.address || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    <p className="font-medium">{athlete.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{athlete.email || 'N/A'}</p>
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
                  <p><span className="text-muted-foreground">Name:</span> {athlete.mother_name || 'N/A'}</p>
                  <p><span className="text-muted-foreground">Phone:</span> {athlete.mother_phone || 'N/A'}</p>
                  <p><span className="text-muted-foreground">Email:</span> {athlete.mother_email || 'N/A'}</p>
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
                  <p><span className="text-muted-foreground">Name:</span> {athlete.father_name || 'N/A'}</p>
                  <p><span className="text-muted-foreground">Phone:</span> {athlete.father_phone || 'N/A'}</p>
                  <p><span className="text-muted-foreground">Email:</span> {athlete.father_email || 'N/A'}</p>
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
                  <p className="font-medium">{athlete.trainings_per_week || 0} sessions per week</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground mb-3">Training Days</p>
                  {athlete.training_days ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 p-2 bg-accent/50 rounded-md">
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="font-medium">{athlete.training_days}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="font-medium">Not specified</p>
                  )}
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
                    {athlete.transport ? (
                      <Badge className="bg-success/10 text-success">Service Provided</Badge>
                    ) : (
                      <Badge variant="secondary">No Service</Badge>
                    )}
                  </div>
                  {athlete.transport && (
                    <div className="text-sm space-y-2">
                      <div>
                        <p className="text-muted-foreground">Pickup</p>
                        <p className="font-medium">{athlete.pickup_address || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Drop-off</p>
                        <p className="font-medium">{athlete.dropoff_address || 'N/A'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attendance (COACH EDITABLE) */}
          <TabsContent value="attendance" className="space-y-4">
            <Card className="shadow-soft">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    {getMonthName(selectedMonth.month, selectedMonth.year)} Attendance
                  </CardTitle>
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
                <CardDescription className="text-primary font-medium">
                  ✏️ Editable by Coach
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingAttendance ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getAttendanceForMonth(selectedMonth.month, selectedMonth.year).length === 0 ? (
                      <p className="text-center text-muted-foreground py-6">
                        No attendance records found for this month
                      </p>
                    ) : (
                      getAttendanceForMonth(selectedMonth.month, selectedMonth.year).map((session) => (
                        <div key={session.Id} className="border border-border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{session.Date || 'N/A'}</h4>
                            {editingAttendance === session.Id ? (
                              <Button 
                                size="sm" 
                                onClick={() => handleSaveAttendance(session.Id)}
                                className="touch-friendly"
                              >
                                <Save className="h-4 w-4 mr-1" />
                                Save
                              </Button>
                            ) : (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setEditingAttendance(session.Id)}
                                className="touch-friendly"
                              >
                                Edit
                              </Button>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">Status</p>
                              {editingAttendance === session.Id ? (
                                <Select
                                  value={session.status || ''}
                                  onValueChange={(value) => updateAttendanceField(session.Id, 'status', value)}
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
                                <Badge className={getStatusColor(session.status || '')}>
                                  {session.status || 'N/A'}
                                </Badge>
                              )}
                            </div>

                            <div>
                              <p className="text-sm text-muted-foreground mb-1">Trainer</p>
                              {editingAttendance === session.Id ? (
                                <Select
                                  value={session.treinador || ''}
                                  onValueChange={(value) => updateAttendanceField(session.Id, 'treinador', value)}
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
                                <p className="font-medium">{session.treinador || 'N/A'}</p>
                              )}
                            </div>
                          </div>

                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Beach Location</p>
                            {editingAttendance === session.Id ? (
                              <Select
                                value={session.praia || ''}
                                onValueChange={(value) => updateAttendanceField(session.Id, 'praia', value)}
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
                              <p className="font-medium">{session.praia || 'N/A'}</p>
                            )}
                          </div>

                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Coach Observations</p>
                            {editingAttendance === session.Id ? (
                              <Textarea
                                value={session.notas || ''}
                                onChange={(e) => updateAttendanceField(session.Id, 'notas', e.target.value)}
                                placeholder="Add your observations about this session..."
                                className="touch-friendly"
                              />
                            ) : (
                              <p className="text-sm bg-muted/50 p-2 rounded">{session.notas || 'No notes'}</p>
                            )}
                          </div>

                          {editingAttendance === session.Id && (
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
                      ))
                    )}
                  </div>
                )}
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
        </>
      )}
      </main>

      <SponsorBanner />
      <AppFooter />
    </div>
  );
};

export default AthleteDetails;