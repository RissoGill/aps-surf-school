import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, Calendar, Clock, MapPin, ChevronLeft, ChevronRight, LogOut, Image as ImageIcon, Video, Play, Download } from "lucide-react";
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
  trainer: string | null;
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
        .from('Atletas')
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
          event: 'INSERT',
          schema: 'public',
          table: 'Attendance',
          filter: `athlete_id=eq.${athleteId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['attendance', athleteId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'Attendance',
          filter: `athlete_id=eq.${athleteId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['attendance', athleteId] });
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
      if (!athleteId) return [];
      
      const { data, error } = await supabase
        .from('Attendance')
        .select('*')
        .eq('athlete_id', athleteId)
        .order('date', { ascending: false });
      
      if (error) throw error;
      
      // Only include attendance records that have a status
      const filteredData = (data || []).filter((record: any) => {
        return record.status && record.status.trim() !== '';
      });
      
      return filteredData as AttendanceRecord[];
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
                <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="h-8 w-8 text-success" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">
                  {athlete.first_name} {athlete.last_name}
                </h2>
                {athlete.surf_level && (
                  <Badge className="bg-primary/10 text-primary mb-2">{athlete.surf_level}</Badge>
                )}
                <p className="text-sm text-muted-foreground">ID: {athlete.athlete_id}</p>
              </div>
            ) : userAuthId ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="h-8 w-8 text-warning" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Profile Not Linked</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Your account is not yet linked to an athlete profile.
                </p>
                <p className="text-xs text-muted-foreground">
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
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="personal" className="text-xs">Personal</TabsTrigger>
            <TabsTrigger value="training" className="text-xs">Training</TabsTrigger>
            <TabsTrigger value="attendance" className="text-xs">Attendance</TabsTrigger>
            <TabsTrigger value="championships" className="text-xs">Championships</TabsTrigger>
            <TabsTrigger value="media" className="text-xs">Media</TabsTrigger>
          </TabsList>

          {/* Personal Data Tab */}
          <TabsContent value="personal" className="space-y-4">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="text-lg">Personal Information</CardTitle>
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
                      <p className="text-muted-foreground">Date of Birth</p>
                      <p className="font-medium">{athlete.date_of_birth || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Phone</p>
                      <p className="font-medium">{athlete.phone || 'N/A'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Address</p>
                      <p className="font-medium">{athlete.address || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Level</p>
                      {athlete.surf_level ? (
                        <Badge className="bg-primary/10 text-primary">{athlete.surf_level}</Badge>
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

            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="text-lg">Emergency Contacts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingAthlete ? (
                  <Skeleton className="h-32 w-full" />
                ) : athlete ? (
                  <>
                    <div>
                      <h4 className="font-medium mb-2">Mother</h4>
                      <div className="text-sm space-y-1">
                        <p><span className="text-muted-foreground">Name:</span> {athlete.mother_name || 'N/A'}</p>
                        <p><span className="text-muted-foreground">Phone:</span> {athlete.mother_phone || 'N/A'}</p>
                        <p><span className="text-muted-foreground">Email:</span> {athlete.mother_email || 'N/A'}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Father</h4>
                      <div className="text-sm space-y-1">
                        <p><span className="text-muted-foreground">Name:</span> {athlete.father_name || 'N/A'}</p>
                        <p><span className="text-muted-foreground">Phone:</span> {athlete.father_phone || 'N/A'}</p>
                        <p><span className="text-muted-foreground">Email:</span> {athlete.father_email || 'N/A'}</p>
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
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
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
                      <p className="font-medium">{athlete.trainings_per_week || 0} sessions per week</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground mb-3">Training Days</p>
                      {athlete.training_days ? (
                        <div className="flex items-center gap-3 p-2 bg-accent/50 rounded-md">
                          <Clock className="h-4 w-4 text-primary" />
                          <span className="font-medium">{athlete.training_days}</span>
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

            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
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
                ) : (
                  <p className="text-center text-muted-foreground">No data available</p>
                )}
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
                        <div key={record.id} className="border border-border rounded-lg p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{record.date || 'N/A'}</p>
                            <Badge className={getStatusColor(record.status)}>
                              {record.status || 'Unknown'}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                            <div>
                              <span className="font-medium">Trainer:</span> {record.trainer || 'N/A'}
                            </div>
                            <div>
                              <span className="font-medium">Beach:</span> {record.beach_location || 'N/A'}
                            </div>
                            {record.notes && (
                              <div className="col-span-2">
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
                <CardTitle>Monthly Summary</CardTitle>
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
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
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
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
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
                  const allPhotos: Array<{ url: string; date: string | null; trainer: string | null }> = [];
                  const allVideos: Array<{ url: string; date: string | null; trainer: string | null }> = [];
                  
                  attendanceRecords.forEach(record => {
                    if (record.photos && Array.isArray(record.photos)) {
                      record.photos.forEach(url => {
                        allPhotos.push({ url, date: record.date, trainer: record.trainer });
                      });
                    }
                    if (record.videos && Array.isArray(record.videos)) {
                      record.videos.forEach(url => {
                        allVideos.push({ url, date: record.date, trainer: record.trainer });
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
                                      {photo.trainer && (
                                        <p className="text-xs text-muted-foreground truncate">
                                          Coach: {photo.trainer}
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
                                      {video.trainer && (
                                        <p className="text-xs text-muted-foreground truncate">
                                          Coach: {video.trainer}
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
        </Tabs>
      </main>

      <SponsorBanner />
      <AppFooter />
    </div>
  );
};

export default AthleteDashboard;