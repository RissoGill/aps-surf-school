import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, Calendar, Clock, MapPin, ChevronLeft, ChevronRight, LogOut, Image as ImageIcon, Video, Play, Download, User, Phone, Plane } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import AppHeader from "@/components/shared/AppHeader";
import SponsorBanner from "@/components/shared/SponsorBanner";
import AppFooter from "@/components/shared/AppFooter";
import { AnnualAttendanceSummary } from "@/components/coach/AnnualAttendanceSummary";
import { AthleteChampionshipsTab } from "@/components/athlete/AthleteChampionshipsTab";

interface Athlete {
  athlete_id: string;
  first_name: string | null;
  last_name: string | null;
  date_of_birth: string | null;
  address: string | null;
  phone: string | null;
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
  auth_uid: string | null;
}

interface AttendanceRecord {
  id: string;
  date: string | null;
  status: string | null;
  coach: string | null;
  beach_location: string | null;
  notes: string | null;
  photos: string[] | null;
  videos: string[] | null;
}

const AthleteDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedMonth, setSelectedMonth] = useState({ month: new Date().getMonth(), year: new Date().getFullYear() });
  const [userAuthId, setUserAuthId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Check authentication from localStorage
  useEffect(() => {
    const athleteSessionStr = localStorage.getItem('athleteSession');
    
    if (!athleteSessionStr) {
      navigate("/login/athlete");
      return;
    }
    
    try {
      const athleteSession = JSON.parse(athleteSessionStr);
      // Set athlete_id as userAuthId for compatibility with existing queries
      setUserAuthId(athleteSession.athlete_id);
      setUserEmail(athleteSession.email);
    } catch (error) {
      console.error('Error parsing athlete session:', error);
      navigate("/login/athlete");
    }
  }, [navigate]);

  // Fetch athlete data based on athlete_id from session
  const { data: athlete, isLoading: isLoadingAthlete } = useQuery({
    queryKey: ['athlete', userAuthId, userEmail],
    queryFn: async () => {
      if (!userAuthId) return null;

      // Query by athlete_id
      const { data, error } = await supabase
        .from('atletas')
        .select('*')
        .eq('athlete_id', userAuthId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching athlete:', error);
        toast({
          title: "Error",
          description: "Failed to load athlete profile",
          variant: "destructive",
        });
        throw error;
      }

      if (!data) {
        console.warn('No athlete found for athlete_id:', userAuthId);
      }

      return data as Athlete | null;
    },
    enabled: !!userAuthId,
  });

  const athleteId = athlete?.athlete_id;

// Real-time subscription for attendance updates
useEffect(() => {
  if (!athleteId) return;

  const channel = supabase
    .channel('athlete-attendance-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'attendance'
      },
      (payload) => {
        const changedAthleteId = (payload.new as any)?.athlete_id ?? (payload.old as any)?.athlete_id;
        if (changedAthleteId === athleteId) {
          queryClient.invalidateQueries({ queryKey: ['attendance', athleteId] });
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'campeonatos_atletas',
        filter: `athlete_id=eq.${athleteId}`
      },
      () => {
        queryClient.invalidateQueries({ queryKey: ['athlete-championship-registrations', athleteId] });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [athleteId, queryClient]);

  const { data: attendanceRecords = [], isLoading: isLoadingAttendance } = useQuery({
    queryKey: ['attendance', athleteId],
    queryFn: async () => {
      if (!athleteId) {
        console.log('No athleteId available for attendance query');
        return [];
      }
      
      console.log('Fetching attendance for athlete:', athleteId);
      
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('athlete_id', athleteId)
        .order('date', { ascending: false });
      
      console.log('Attendance query result:', { data, error, count: data?.length || 0 });
      
      if (error) {
        console.error('Error fetching attendance:', error);
        throw error;
      }
      
      // Only include attendance records that have a status
      const filteredData = (data || []).filter((record: any) => {
        const hasStatus = record.status && record.status.trim() !== '';
        console.log('Record status check:', record.id, record.status, hasStatus);
        return hasStatus;
      });
      
      console.log('Filtered attendance records:', filteredData.length, 'of', data?.length || 0);
      
      return filteredData as AttendanceRecord[];
    },
    enabled: !!athleteId,
  });

  // Fetch estagios for athlete
  const { data: estagios = [], isLoading: isLoadingEstagios } = useQuery({
    queryKey: ['athlete-estagios', athleteId],
    queryFn: async () => {
      if (!athleteId) return [];
      
      // Get estagio registrations for this athlete
      const { data: registrations, error: regError } = await supabase
        .from('estagio_atletas')
        .select('estagios_id')
        .eq('athlete_id', athleteId);
      
      if (regError) throw regError;
      if (!registrations || registrations.length === 0) return [];
      
      const estagioIds = registrations.map(r => r.estagios_id);
      
      // Get estagio details
      const { data, error } = await supabase
        .from('estagio')
        .select('*')
        .in('id', estagioIds)
        .order('data_inicio', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!athleteId,
  });

  const handleLogout = () => {
    localStorage.removeItem('athleteSession');
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out",
    });
    navigate("/login/athlete");
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
      if (!record.date) return false;
      const recordDate = new Date(record.date);
      return recordDate.getMonth() === month && recordDate.getFullYear() === year;
    });
  };

  const getStatusColor = (status: string | null) => {
    if (!status) return "bg-secondary/10 text-secondary-foreground";
    const normalizedStatus = status.toLowerCase();
    if (normalizedStatus.includes("present")) return "bg-success/10 text-success";
    if (normalizedStatus.includes("justified")) return "bg-warning/10 text-warning";
    if (normalizedStatus.includes("absent")) return "bg-destructive/10 text-destructive";
    return "bg-secondary/10 text-secondary-foreground";
  };

  const calculateMonthlySummary = () => {
    const currentMonthRecords = getAttendanceForMonth(selectedMonth.month, selectedMonth.year);
    const present = currentMonthRecords.filter(r => r.status === "Present").length;
    const justified = currentMonthRecords.filter(r => r.status === "Justified").length;
    const absent = currentMonthRecords.filter(r => r.status === "Absent").length;
    return { present, justified, absent };
  };
  return (
    <div className="min-h-screen bg-gradient-surface">
      <AppHeader title="Athlete Dashboard" showBack backTo="/" />
      
      {/* Logout Button */}
      <div className="mobile-container pt-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleLogout}
          className="ml-auto flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
      
      <main className="mobile-container py-6">
        {/* Athlete Info Header */}
        <Card className="shadow-medium mb-6">
          <CardContent className="p-6">
            {isLoadingAthlete ? (
              <div className="text-center">
                <Skeleton className="w-16 h-16 rounded-full mx-auto mb-4" />
                <Skeleton className="h-6 w-32 mx-auto mb-2" />
                <Skeleton className="h-5 w-24 mx-auto" />
              </div>
            ) : athlete ? (
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-elegant">
                  <Trophy className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  {athlete.first_name} {athlete.last_name}
                </h2>
                {athlete.surf_level && (
                  <Badge className="bg-gradient-primary text-white border-none mb-2 shadow-soft">{athlete.surf_level}</Badge>
                )}
                <p className="text-muted-foreground">ID: {athlete.athlete_id}</p>
              </div>
            ) : userAuthId ? (
              <div className="text-center">
                <div className="w-20 h-20 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="h-10 w-10 text-warning" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Profile Not Linked</h3>
                <p className="text-muted-foreground mb-3">
                  Your account is not yet linked to an athlete profile.
                </p>
                <p className="text-sm text-muted-foreground">
                  Please contact your coach or administrator to link your account.
                </p>
              </div>
            ) : (
              <p className="text-center text-muted-foreground">Loading...</p>
            )}
          </CardContent>
        </Card>

        {/* Tabs Navigation */}
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="w-full h-auto flex flex-wrap justify-start gap-1 bg-muted/50 p-2 mb-6">
            <TabsTrigger 
              value="personal" 
              className="data-[state=active]:bg-view data-[state=active]:text-view-foreground text-xs font-semibold px-3 py-2 flex-1 min-w-[90px]"
            >
              <User className="h-3 w-3 mr-1 inline sm:hidden" />
              Personal
            </TabsTrigger>
            <TabsTrigger 
              value="training" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs font-semibold px-3 py-2 flex-1 min-w-[90px]"
            >
              <Clock className="h-3 w-3 mr-1 inline sm:hidden" />
              Training
            </TabsTrigger>
            <TabsTrigger 
              value="attendance" 
              className="data-[state=active]:bg-attendance data-[state=active]:text-attendance-foreground text-xs font-semibold px-3 py-2 flex-1 min-w-[90px]"
            >
              <Calendar className="h-3 w-3 mr-1 inline sm:hidden" />
              Attendance
            </TabsTrigger>
            <TabsTrigger 
              value="championships" 
              className="data-[state=active]:bg-registrations data-[state=active]:text-registrations-foreground text-xs font-semibold px-3 py-2 flex-1 min-w-[100px]"
            >
              <Trophy className="h-3 w-3 mr-1 inline sm:hidden" />
              <span className="hidden sm:inline">Championships</span>
              <span className="sm:hidden">Champs</span>
            </TabsTrigger>
            <TabsTrigger 
              value="media" 
              className="data-[state=active]:bg-success data-[state=active]:text-success-foreground text-xs font-semibold px-3 py-2 flex-1 min-w-[90px]"
            >
              <ImageIcon className="h-3 w-3 mr-1 inline sm:hidden" />
              Media
            </TabsTrigger>
            <TabsTrigger 
              value="estagios" 
              className="data-[state=active]:bg-estagios data-[state=active]:text-estagios-foreground text-xs font-semibold px-3 py-2 flex-1 min-w-[90px]"
            >
              <Plane className="h-3 w-3 mr-1 inline sm:hidden" />
              Estágios
            </TabsTrigger>
          </TabsList>

          {/* Personal Data Tab */}
          <TabsContent value="personal" className="space-y-4">
            <Card className="shadow-soft border-l-4 border-l-primary">
              <CardHeader className="bg-primary/5">
                <CardTitle className="text-2xl font-bold">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingAthlete ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : athlete ? (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">Date of Birth</p>
                      <p className="font-medium">{athlete.date_of_birth || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Phone</p>
                      <p className="font-medium">{athlete.phone || 'N/A'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground mb-1">Address</p>
                      <p className="font-medium">{athlete.address || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Level</p>
                      {athlete.surf_level ? (
                        <Badge className="bg-gradient-primary text-white border-none">{athlete.surf_level}</Badge>
                      ) : (
                        <p className="font-medium">N/A</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">No data available</p>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-soft border-l-4 border-l-success">
              <CardHeader className="bg-success/5">
                <CardTitle className="text-2xl font-bold">Emergency Contacts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingAthlete ? (
                  <Skeleton className="h-32 w-full" />
                ) : athlete ? (
                  <>
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <Phone className="h-5 w-5 text-success" />
                        Mother
                      </h4>
                      <div className="text-sm space-y-1">
                        <p><span className="text-muted-foreground">Name:</span> <span className="font-medium">{athlete.mother_name || 'N/A'}</span></p>
                        <p><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{athlete.mother_phone || 'N/A'}</span></p>
                        <p><span className="text-muted-foreground">Email:</span> <span className="font-medium">{athlete.mother_email || 'N/A'}</span></p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <Phone className="h-5 w-5 text-success" />
                        Father
                      </h4>
                      <div className="text-sm space-y-1">
                        <p><span className="text-muted-foreground">Name:</span> <span className="font-medium">{athlete.father_name || 'N/A'}</span></p>
                        <p><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{athlete.father_phone || 'N/A'}</span></p>
                        <p><span className="text-muted-foreground">Email:</span> <span className="font-medium">{athlete.father_email || 'N/A'}</span></p>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-center text-muted-foreground">No data available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Training Info Tab */}
          <TabsContent value="training" className="space-y-4">
            <Card className="shadow-soft border-l-4 border-l-primary">
              <CardHeader className="bg-primary/5">
                <CardTitle className="flex items-center gap-2 text-2xl font-bold">
                  <Calendar className="h-6 w-6 text-primary" />
                  Training Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingAthlete ? (
                  <Skeleton className="h-32 w-full" />
                ) : athlete ? (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Weekly Sessions</p>
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center shadow-soft">
                          <span className="text-xl font-bold text-white">{athlete.trainings_per_week || 0}</span>
                        </div>
                        <p className="font-medium">sessions per week</p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground mb-3">Training Days</p>
                      {athlete.training_days ? (
                        <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                          <Clock className="h-5 w-5 text-primary" />
                          <span className="font-medium text-foreground">{athlete.training_days}</span>
                        </div>
                      ) : (
                        <p className="font-medium">Not specified</p>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-center text-muted-foreground">No data available</p>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-soft border-l-4 border-l-warning">
              <CardHeader className="bg-warning/5">
                <CardTitle className="flex items-center gap-2 text-2xl font-bold">
                  <MapPin className="h-6 w-6 text-warning" />
                  Transportation
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingAthlete ? (
                  <Skeleton className="h-24 w-full" />
                ) : athlete ? (
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
                        <div className="p-2 bg-warning/5 rounded-md border border-warning/20">
                          <p className="text-muted-foreground text-xs">Pickup Address</p>
                          <p className="font-medium">{athlete.pickup_address || 'N/A'}</p>
                        </div>
                        <div className="p-2 bg-warning/5 rounded-md border border-warning/20">
                          <p className="text-muted-foreground text-xs">Drop-off Address</p>
                          <p className="font-medium">{athlete.dropoff_address || 'N/A'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">No data available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance" className="space-y-4">
            <Card className="shadow-soft border-l-4 border-l-primary">
              <CardHeader className="bg-primary/5">
                <div className="flex items-center justify-between mb-2">
                  <CardTitle className="flex items-center gap-2 text-2xl font-bold">
                    <Calendar className="h-6 w-6 text-primary" />
                    {getMonthName(selectedMonth.month, selectedMonth.year)}
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
                <CardDescription>Your training session record</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingAttendance ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getAttendanceForMonth(selectedMonth.month, selectedMonth.year).length === 0 ? (
                      <p className="text-center text-muted-foreground py-6">
                        No attendance records for this month
                      </p>
                    ) : (
                      getAttendanceForMonth(selectedMonth.month, selectedMonth.year).map((record) => (
                        <div key={record.id} className="border border-border rounded-lg p-3 space-y-2 hover:bg-accent/5 transition-colors">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-foreground">{record.date || 'N/A'}</p>
                            <Badge className={getStatusColor(record.status)}>
                              {record.status || 'Unknown'}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3 text-muted-foreground" />
                              <span className="text-muted-foreground">Coach:</span> 
                              <span className="font-medium">{record.coach || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span className="text-muted-foreground">Beach:</span> 
                              <span className="font-medium">{record.beach_location || 'N/A'}</span>
                            </div>
                            {record.notes && (
                              <div className="col-span-2 mt-1 p-2 bg-muted/50 rounded text-xs">
                                <span className="font-medium">Notes:</span> {record.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">Monthly Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingAttendance ? (
                  <Skeleton className="h-20 w-full" />
                ) : (
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-success">{calculateMonthlySummary().present}</p>
                      <p className="text-xs text-muted-foreground">Present</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-warning">{calculateMonthlySummary().justified}</p>
                      <p className="text-xs text-muted-foreground">Justified</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-destructive">{calculateMonthlySummary().absent}</p>
                      <p className="text-xs text-muted-foreground">Not Present</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {!isLoadingAttendance && attendanceRecords.length > 0 && (
              <AnnualAttendanceSummary attendance={attendanceRecords} />
            )}
          </TabsContent>

          {/* Championships Tab */}
          <TabsContent value="championships" className="space-y-4">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl font-bold">
                  <Trophy className="h-6 w-6" />
                  My Championships
                </CardTitle>
                <CardDescription>
                  View all championships you are registered for
                </CardDescription>
              </CardHeader>
              <CardContent>
                {athleteId ? (
                  <AthleteChampionshipsTab athleteId={athleteId} />
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Loading championship information...
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Media Tab */}
          <TabsContent value="media" className="space-y-4">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl font-bold">
                  <ImageIcon className="h-6 w-6" />
                  Photos & Videos
                </CardTitle>
                <CardDescription>Media shared by your coaches</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingAttendance ? (
                  <div className="grid grid-cols-2 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-32 w-full rounded-lg" />
                    ))}
                  </div>
                ) : (() => {
                  const allPhotos: Array<{ url: string; date: string | null; coach: string | null }> = [];
                  const allVideos: Array<{ url: string; date: string | null; coach: string | null }> = [];
                  
                  attendanceRecords.forEach(record => {
                    if (record.photos && Array.isArray(record.photos)) {
                      record.photos.forEach(url => {
                        allPhotos.push({ url, date: record.date, coach: record.coach });
                      });
                    }
                    if (record.videos && Array.isArray(record.videos)) {
                      record.videos.forEach(url => {
                        allVideos.push({ url, date: record.date, coach: record.coach });
                      });
                    }
                  });

                  const hasMedia = allPhotos.length > 0 || allVideos.length > 0;

                  return !hasMedia ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground">No photos or videos yet</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Your coaches will upload media from training sessions
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Photos Section */}
                      {allPhotos.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                            <ImageIcon className="h-4 w-4" />
                            Photos ({allPhotos.length})
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {allPhotos.map((photo, idx) => (
                              <Card key={idx} className="overflow-hidden">
                                <div className="relative group">
                                  <a href={photo.url} target="_blank" rel="noopener noreferrer">
                                    <img
                                      src={photo.url}
                                      alt={`Training photo from ${photo.date || 'session'}`}
                                      className="w-full h-48 object-cover hover:opacity-90 transition-opacity"
                                    />
                                  </a>
                                </div>
                                <CardContent className="p-3 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                      {photo.date && (
                                        <p className="text-xs font-medium text-foreground flex items-center gap-1">
                                          <Calendar className="h-3 w-3" />
                                          {new Date(photo.date).toLocaleDateString('pt-PT', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric'
                                          })}
                                        </p>
                                      )}
                                      {photo.coach && (
                                        <p className="text-xs text-muted-foreground truncate">
                                          Coach: {photo.coach}
                                        </p>
                                      )}
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-8 w-8 p-0"
                                      asChild
                                    >
                                      <a href={photo.url} download target="_blank" rel="noopener noreferrer">
                                        <Download className="h-4 w-4" />
                                      </a>
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Videos Section */}
                      {allVideos.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                            <Video className="h-4 w-4" />
                            Videos ({allVideos.length})
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {allVideos.map((video, idx) => (
                              <Card key={idx} className="overflow-hidden">
                                <a href={video.url} target="_blank" rel="noopener noreferrer" className="block">
                                  <div className="relative w-full h-48 bg-secondary/10 flex items-center justify-center">
                                    <div className="absolute inset-0 flex items-center justify-center z-10">
                                      <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                        <Play className="h-8 w-8 text-primary ml-1" />
                                      </div>
                                    </div>
                                    <video
                                      src={video.url}
                                      className="w-full h-full object-cover"
                                      preload="metadata"
                                    />
                                  </div>
                                </a>
                                <CardContent className="p-3 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                      {video.date && (
                                        <p className="text-xs font-medium text-foreground flex items-center gap-1">
                                          <Calendar className="h-3 w-3" />
                                          {new Date(video.date).toLocaleDateString('pt-PT', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric'
                                          })}
                                        </p>
                                      )}
                                      {video.coach && (
                                        <p className="text-xs text-muted-foreground truncate">
                                          Coach: {video.coach}
                                        </p>
                                      )}
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-8 w-8 p-0"
                                      asChild
                                    >
                                      <a href={video.url} download target="_blank" rel="noopener noreferrer">
                                        <Download className="h-4 w-4" />
                                      </a>
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Estágios Tab */}
          <TabsContent value="estagios">
            <Card className="shadow-soft border-l-4 border-l-estagios">
              <CardHeader className="bg-estagios/5">
                <CardTitle className="flex items-center gap-2 text-2xl font-bold">
                  <Plane className="h-6 w-6 text-estagios" />
                  Estágios
                </CardTitle>
                <CardDescription>Training camps and internships you are registered for</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingEstagios ? (
                  <div className="text-center py-4">
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : estagios.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    You are not registered for any estágios yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {estagios.map((estagio: any) => (
                      <div key={estagio.id} className="border border-border rounded-lg p-4 bg-card hover:bg-accent/5 transition-colors">
                        <h3 className="font-semibold text-lg mb-2">{estagio.nome_estagio}</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {estagio.local && (
                            <div className="col-span-2">
                              <span className="text-muted-foreground">Location:</span>
                              <p className="font-medium">{estagio.local}</p>
                            </div>
                          )}
                          {estagio.data_inicio && (
                            <div>
                              <span className="text-muted-foreground">Start:</span>
                              <p className="font-medium">
                                {new Date(estagio.data_inicio).toLocaleDateString('pt-PT')}
                              </p>
                            </div>
                          )}
                          {estagio.data_fim && (
                            <div>
                              <span className="text-muted-foreground">End:</span>
                              <p className="font-medium">
                                {new Date(estagio.data_fim).toLocaleDateString('pt-PT')}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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