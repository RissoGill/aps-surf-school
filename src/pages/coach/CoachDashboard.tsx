import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, User, Calendar, Plus, MapPin, LogOut, Upload, X, Image as ImageIcon, Video } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import AppHeader from "@/components/shared/AppHeader";
import SponsorBanner from "@/components/shared/SponsorBanner";
import AppFooter from "@/components/shared/AppFooter";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AthleteProfileCard } from "@/components/coach/AthleteProfileCard";
import { MonthlyAttendanceSummary } from "@/components/coach/MonthlyAttendanceSummary";
import { AnnualAttendanceSummary } from "@/components/coach/AnnualAttendanceSummary";

interface AttendanceRecord {
  id: string;
  date: string | null;
  status: string | null;
  trainer: string | null;
  beach_location: string | null;
  notes: string | null;
  athlete_id: string | null;
}

interface Athlete {
  athlete_id: string;
  first_name: string | null;
  last_name: string | null;
  surf_level: string | null;
  training_days: string | null;
  trainings_per_week: number | null;
  email: string | null;
  phone: string | null;
  mother_name: string | null;
  mother_phone: number | null;
  mother_email: string | null;
  father_name: string | null;
  father_phone: string | null;
  father_email: string | null;
  date_of_birth: string | null;
  address: string | null;
  transport: boolean | null;
  pickup_address: string | null;
  dropoff_address: string | null;
  photo_url: string | null;
  attendance: AttendanceRecord[];
}

const CoachDashboard = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);
  const [newAttendance, setNewAttendance] = useState({
    date: new Date().toISOString().split('T')[0],
    status: "",
    treinador: "",
    praia: "",
    notas: ""
  });
  const [uploadedPhotos, setUploadedPhotos] = useState<File[]>([]);
  const [uploadedVideos, setUploadedVideos] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [coachData, setCoachData] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const searchRef = useRef<HTMLDivElement>(null);

  // Check authentication and fetch coach data
  useEffect(() => {
    const fetchCoachProfile = async (u: { id: string; email?: string | null }) => {
      try {
        // Try by auth_uid first
        const { data: coachByUid, error: uidErr } = await supabase
          .from('Coach')
          .select('*')
          .eq('auth_uid', u.id.toString())
          .maybeSingle();
        if (uidErr) console.warn('Coach by uid error:', uidErr);

        let profile = coachByUid;

        // Fallback by email (exact match), in case auth_uid not linked yet
        if (!profile && u.email) {
          const { data: coachByEmail, error: emailErr } = await supabase
            .from('Coach')
            .select('*')
            .eq('email', u.email)
            .maybeSingle();
          if (emailErr) console.warn('Coach by email error:', emailErr);
          profile = coachByEmail || null;
        }

        setCoachData(profile || null);
        console.log('Coach profile resolved:', profile);
      } catch (err) {
        console.error('Unexpected coach fetch error:', err);
        setCoachData(null);
      }
    };

    // 1) Listen first (per best practices)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate('/login/coach');
        return;
      }
      // Defer supabase calls outside callback to avoid deadlocks
      setTimeout(() => fetchCoachProfile(session.user), 0);
    });

    // 2) Then check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate('/login/coach');
        return;
      }
      fetchCoachProfile(session.user);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Real-time subscription for attendance updates
  useEffect(() => {
    const channel = supabase
      .channel('attendance-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Attendance'
        },
        () => {
          // Invalidate and refetch athletes data when new attendance is added
          queryClient.invalidateQueries({ queryKey: ['athletes-with-attendance'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'Attendance'
        },
        () => {
          // Invalidate and refetch athletes data when attendance is updated
          queryClient.invalidateQueries({ queryKey: ['athletes-with-attendance'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const { data: athletes, isLoading } = useQuery({
    queryKey: ['athletes-with-attendance'],
    queryFn: async () => {
      // Fetch all athletes
      const { data: athletesData, error: athletesError } = await supabase
        .from('Atletas')
        .select('*')
        .order('first_name', { ascending: true });
      
      if (athletesError) {
        console.error('Error fetching athletes:', athletesError);
        throw athletesError;
      }

      // Fetch all attendance records from Supabase with pagination to bypass 1000-row limit
      const pageSize = 1000;

      // Get total rows count first
      const { count: attendanceCount, error: countError } = await supabase
        .from('Attendance')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.error('Error counting attendance:', countError);
        throw countError;
      }

      const total = attendanceCount ?? 0;
      let attendanceData: any[] = [];

      if (total === 0) {
        attendanceData = [];
      } else {
        const pagePromises: any[] = [];
        for (let from = 0; from < total; from += pageSize) {
          const to = Math.min(from + pageSize - 1, total - 1);
          pagePromises.push(
            supabase
              .from('Attendance')
              .select('*')
              .order('date', { ascending: false })
              .range(from, to)
          );
        }
        const results = await Promise.all(pagePromises);
        const pageError = results.find((r: any) => r.error)?.error;
        if (pageError) {
          console.error('Error fetching paginated attendance:', pageError);
          throw pageError;
        }
        attendanceData = results.flatMap((r: any) => r.data || []);
      }

      console.log('Attendance total count:', total, 'Loaded:', attendanceData.length);

      console.log('Fetched athletes:', athletesData?.length);
      console.log('Fetched attendance records:', attendanceData?.length);

      // Only include attendance records that have a status
      const filteredAttendance = (attendanceData || []).filter((att: any) => {
        return att.status && att.status.trim() !== '';
      });

      console.log('Attendance records with status:', filteredAttendance.length);

      // Group attendance by athlete_id (case-insensitive, trimmed) for reliable mapping
      const attendanceByAthlete: Record<string, AttendanceRecord[]> = {};
      filteredAttendance.forEach((att: any) => {
        const key = String(att.athlete_id || '').trim().toLowerCase();
        if (!attendanceByAthlete[key]) attendanceByAthlete[key] = [];
        attendanceByAthlete[key].push({
          id: att.id,
          date: att.date,
          status: att.status,
          trainer: att?.trainer ?? null,
          beach_location: att?.beach_location ?? null,
          notes: att?.notes ?? null,
          athlete_id: att?.athlete_id ?? null,
        });
      });

      // Sort each athlete's attendance by date desc
      Object.values(attendanceByAthlete).forEach((list) => {
        list.sort((a, b) => {
          const at = a.date ? new Date(a.date).getTime() : 0;
          const bt = b.date ? new Date(b.date).getTime() : 0;
          return bt - at;
        });
      });

      const athletesWithAttendance = athletesData.map((athlete: any) => {
        const aid = String(athlete.athlete_id || '').trim().toLowerCase();
        const list = attendanceByAthlete[aid] || [];
        console.log(`Athlete ${athlete.athlete_id} has ${list.length} attendance records`);
        return {
          ...athlete,
          attendance: [...list],
        } as Athlete;
      });

      return athletesWithAttendance as Athlete[];
    },
  });

  const handleSaveAttendance = async () => {
    if (!selectedAthleteId || !newAttendance.status) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Upload photos and videos to storage
      const photoUrls: string[] = [];
      const videoUrls: string[] = [];

      // Upload photos
      for (const photo of uploadedPhotos) {
        const fileExt = photo.name.split('.').pop();
        const fileName = `${selectedAthleteId}/${Date.now()}-${Math.random()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('attendance-media')
          .upload(fileName, photo);

        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('attendance-media')
          .getPublicUrl(fileName);
        
        photoUrls.push(publicUrl);
      }

      // Upload videos
      for (const video of uploadedVideos) {
        const fileExt = video.name.split('.').pop();
        const fileName = `${selectedAthleteId}/${Date.now()}-${Math.random()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('attendance-media')
          .upload(fileName, video);

        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('attendance-media')
          .getPublicUrl(fileName);
        
        videoUrls.push(publicUrl);
      }

      // Insert attendance record with media URLs
      const { error } = await supabase
        .from('Attendance')
        .insert({
          id: `${selectedAthleteId}-${newAttendance.date}-${Date.now()}`,
          athlete_id: selectedAthleteId,
          date: newAttendance.date,
          status: newAttendance.status,
          trainer: newAttendance.treinador || null,
          beach_location: newAttendance.praia || null,
          notes: newAttendance.notas || null,
          photos: photoUrls.length > 0 ? photoUrls : null,
          videos: videoUrls.length > 0 ? videoUrls : null,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Attendance recorded successfully",
      });

      setIsDialogOpen(false);
      setNewAttendance({
        date: new Date().toISOString().split('T')[0],
        status: "",
        treinador: "",
        praia: "",
        notas: ""
      });
      setUploadedPhotos([]);
      setUploadedVideos([]);
      queryClient.invalidateQueries({ queryKey: ['athletes-with-attendance'] });
    } catch (error: any) {
      console.error('Attendance save error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save attendance",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const filteredAthletes = useMemo(() => {
    if (!athletes) return [];
    if (!searchQuery) return athletes;
    
    return athletes.filter(athlete => {
      const fullName = `${athlete.first_name} ${athlete.last_name}`.toLowerCase();
      return fullName.includes(searchQuery.toLowerCase());
    });
  }, [athletes, searchQuery]);

  const handleSelectAthlete = (athlete: Athlete) => {
    setSearchQuery(`${athlete.first_name} ${athlete.last_name}`);
    setShowDropdown(false);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Beginner": return "bg-warning/10 text-warning";
      case "Intermediate": return "bg-primary/10 text-primary";
      case "Advanced": return "bg-success/10 text-success";
      default: return "bg-secondary/10 text-secondary-foreground";
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login/coach");
  };

  const coachDisplayName = useMemo(() => {
    if (!coachData) return undefined;
    const c: any = coachData;
    const idRaw = String(c.coach_id ?? '').trim();
    const idValLower = idRaw.toLowerCase();
    const build = (a?: string | null, b?: string | null) => [a, b].filter(Boolean).join(' ').trim();
    let name = build(c.first_name, c.last_name);
    if (!name) name = build(c.firstName, c.lastName);
    if (!name) name = build(c.firstname, c.lastname);
    if (!name && typeof c.name === 'string') name = c.name.trim();

    // Fallback to known coach_id -> name mapping
    if ((!name || !name.trim()) && idRaw) {
      const map: Record<string, string> = {
        T01: "Nuno Telmo",
        T02: "David",
        T03: "Danilo",
        T04: "Gustavo",
        T05: "Aaron",
        T06: "Zé",
        T07: "Francisco"
      };
      const mapped = map[idRaw.toUpperCase()];
      if (mapped) return mapped;
    }

    if (name) {
      const n = name.trim();
      // avoid showing IDs by mistake
      if (n.toLowerCase() === idValLower || /^[A-Za-z]*\d+$/.test(n)) return undefined;
      return n;
    }
    return undefined;
  }, [coachData]);

  return (
    <div className="min-h-screen bg-gradient-surface">
      <AppHeader title="Coach Dashboard" showBack backTo="/" />
      
      <main className="mobile-container py-6">
        {/* Welcome Section */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {`Welcome Back, ${
                coachDisplayName ||
                (() => {
                  const map: Record<string, string> = {
                    T01: 'Nuno Telmo',
                    T02: 'David',
                    T03: 'Danilo',
                    T04: 'Gustavo',
                    T05: 'Aaron',
                    T06: 'Zé',
                    T07: 'Francisco'
                  };
                  const idFromData = (coachData?.coach_id ? String(coachData.coach_id).trim().toUpperCase() : '');
                  const prefix = (user?.email ? user.email.split('@')[0] : '').trim();
                  const idFromEmail = prefix ? prefix.toUpperCase() : '';
                  const candidate = idFromData || idFromEmail;
                  if (candidate && map[candidate]) return map[candidate];
                  if (!prefix) return 'Coach';
                  if (/^[A-Za-z]*\d+$/.test(prefix)) return 'Coach';
                  return prefix;
                })()
              }`}
            </h2>
            <p className="text-muted-foreground">
              Manage your athletes and track their progress
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="flex-shrink-0">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="shadow-soft">
            <CardContent className="p-4 text-center">
              <User className="h-6 w-6 text-primary mx-auto mb-2" />
              {isLoading ? (
                <Skeleton className="h-8 w-12 mx-auto mb-1" />
              ) : (
                <p className="text-2xl font-bold text-foreground">{athletes?.length || 0}</p>
              )}
              <p className="text-sm text-muted-foreground">Total Athletes</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-soft">
            <CardContent className="p-4 text-center">
              <Calendar className="h-6 w-6 text-success mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">-</p>
              <p className="text-sm text-muted-foreground">Today's Sessions</p>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <div ref={searchRef} className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search athletes by name..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            className="pl-10 touch-friendly shadow-soft"
          />
          
          {/* Autocomplete Dropdown */}
          {showDropdown && searchQuery && filteredAthletes.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredAthletes.slice(0, 5).map((athlete) => (
                <button
                  key={athlete.athlete_id}
                  onClick={() => handleSelectAthlete(athlete)}
                  className="w-full px-4 py-3 text-left hover:bg-accent transition-colors flex items-center gap-3 border-b border-border last:border-b-0"
                >
                  <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {athlete.first_name} {athlete.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {athlete.athlete_id} {athlete.surf_level && `• ${athlete.surf_level}`}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Athletes List - Only shown when searching */}
        {searchQuery && (
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Athletes & Attendance
            </CardTitle>
            <CardDescription>
              View athletes and their attendance records
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-0">
            {isLoading ? (
              <div className="space-y-0">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-4 border-b border-border">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Skeleton className="h-5 w-32 mb-2" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredAthletes.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-muted-foreground">
                  {searchQuery ? "No athletes found matching your search" : "No athletes found"}
                </p>
              </div>
            ) : (
              <div className="space-y-0">
                {filteredAthletes.map((athlete) => (
                  <Collapsible key={athlete.athlete_id} open={athlete.attendance.length > 0} className="border-b border-border last:border-b-0">
                    <div className="p-4 space-y-4">
                      {/* Athlete Profile Information */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <AthleteProfileCard athlete={athlete} getLevelColor={getLevelColor} />
                        </div>
                        <div className="flex-shrink-0">
                          <Dialog open={isDialogOpen && selectedAthleteId === athlete.athlete_id} onOpenChange={(open) => {
                            setIsDialogOpen(open);
                            if (open) setSelectedAthleteId(athlete.athlete_id);
                          }}>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" className="touch-friendly">
                                <Plus className="h-4 w-4 mr-1" />
                                Add
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Record Attendance for {athlete.first_name} {athlete.last_name}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label>Date</Label>
                                  <Input
                                    type="date"
                                    value={newAttendance.date}
                                    onChange={(e) => setNewAttendance({ ...newAttendance, date: e.target.value })}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Status *</Label>
                                  <Select value={newAttendance.status} onValueChange={(value) => setNewAttendance({ ...newAttendance, status: value })}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Present">Present</SelectItem>
                                      <SelectItem value="Absent">Absent</SelectItem>
                                      <SelectItem value="Late">Late</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label>Trainer</Label>
                                  <Input
                                    value={newAttendance.treinador}
                                    onChange={(e) => setNewAttendance({ ...newAttendance, treinador: e.target.value })}
                                    placeholder="Enter trainer name"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Beach Location</Label>
                                  <Input
                                    value={newAttendance.praia}
                                    onChange={(e) => setNewAttendance({ ...newAttendance, praia: e.target.value })}
                                    placeholder="Enter beach name"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Notes</Label>
                                  <Textarea
                                    value={newAttendance.notas}
                                    onChange={(e) => setNewAttendance({ ...newAttendance, notas: e.target.value })}
                                    placeholder="Enter any notes"
                                  />
                                </div>
                                
                                {/* Photo Upload */}
                                <div className="space-y-2">
                                  <Label className="flex items-center gap-2">
                                    <ImageIcon className="h-4 w-4" />
                                    Photos
                                  </Label>
                                  <div className="space-y-2">
                                    <Input
                                      type="file"
                                      accept="image/*"
                                      multiple
                                      onChange={(e) => {
                                        const files = Array.from(e.target.files || []);
                                        setUploadedPhotos(prev => [...prev, ...files]);
                                      }}
                                      className="cursor-pointer"
                                    />
                                    {uploadedPhotos.length > 0 && (
                                      <div className="flex flex-wrap gap-2">
                                        {uploadedPhotos.map((file, idx) => (
                                          <div key={idx} className="relative group">
                                            <div className="flex items-center gap-2 bg-secondary px-3 py-2 rounded-md">
                                              <ImageIcon className="h-4 w-4" />
                                              <span className="text-sm truncate max-w-[150px]">{file.name}</span>
                                              <button
                                                type="button"
                                                onClick={() => setUploadedPhotos(prev => prev.filter((_, i) => i !== idx))}
                                                className="text-muted-foreground hover:text-destructive"
                                              >
                                                <X className="h-4 w-4" />
                                              </button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Video Upload */}
                                <div className="space-y-2">
                                  <Label className="flex items-center gap-2">
                                    <Video className="h-4 w-4" />
                                    Videos
                                  </Label>
                                  <div className="space-y-2">
                                    <Input
                                      type="file"
                                      accept="video/*"
                                      multiple
                                      onChange={(e) => {
                                        const files = Array.from(e.target.files || []);
                                        setUploadedVideos(prev => [...prev, ...files]);
                                      }}
                                      className="cursor-pointer"
                                    />
                                    {uploadedVideos.length > 0 && (
                                      <div className="flex flex-wrap gap-2">
                                        {uploadedVideos.map((file, idx) => (
                                          <div key={idx} className="relative group">
                                            <div className="flex items-center gap-2 bg-secondary px-3 py-2 rounded-md">
                                              <Video className="h-4 w-4" />
                                              <span className="text-sm truncate max-w-[150px]">{file.name}</span>
                                              <button
                                                type="button"
                                                onClick={() => setUploadedVideos(prev => prev.filter((_, i) => i !== idx))}
                                                className="text-muted-foreground hover:text-destructive"
                                              >
                                                <X className="h-4 w-4" />
                                              </button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                <Button onClick={handleSaveAttendance} className="w-full" disabled={isUploading}>
                                  {isUploading ? (
                                    <>
                                      <Upload className="h-4 w-4 mr-2 animate-spin" />
                                      Uploading...
                                    </>
                                  ) : (
                                    "Save Attendance"
                                  )}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>

                       {/* Monthly Summary */}
                      {athlete.attendance.length > 0 && (
                        <div className="pt-4 space-y-4">
                          <MonthlyAttendanceSummary attendance={athlete.attendance} />
                          <AnnualAttendanceSummary attendance={athlete.attendance} />
                        </div>
                      )}

                      {/* Attendance History Section */}
                      {athlete.attendance.length > 0 && (
                        <div className="pt-4 border-t border-border">
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="w-full">
                              <Calendar className="h-4 w-4 mr-2" />
                              <span className="text-sm font-medium">
                                {athlete.attendance.length} attendance record(s) - Click to expand
                              </span>
                            </Button>
                          </CollapsibleTrigger>
                        </div>
                      )}

                      <CollapsibleContent forceMount>
                        <div className="mt-3 space-y-2">
                          {athlete.attendance.map((record) => {
                            const formattedDate = record.date ? new Date(record.date).toLocaleDateString('pt-PT', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            }) : '-';
                            
                            return (
                            <Card key={record.id} className="bg-accent/30">
                              <CardContent className="p-3">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Date:</span>
                                    <p className="font-medium">{formattedDate}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Status:</span>
                                    <p className="font-medium">{record.status || 'Not set'}</p>
                                  </div>
                                  {record.trainer && (
                                    <div>
                                      <span className="text-muted-foreground">Trainer:</span>
                                      <p className="font-medium">{record.trainer}</p>
                                    </div>
                                  )}
                                  {record.beach_location && (
                                    <div className="flex items-start gap-1">
                                      <MapPin className="h-3 w-3 mt-0.5 text-muted-foreground" />
                                      <div>
                                        <span className="text-muted-foreground">Beach:</span>
                                        <p className="font-medium">{record.beach_location}</p>
                                      </div>
                                    </div>
                                  )}
                                  {record.notes && (
                                    <div className="col-span-2">
                                      <span className="text-muted-foreground">Notes:</span>
                                      <p className="font-medium">{record.notes}</p>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                            );
                          })}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        )}
      </main>

      <SponsorBanner />
      <AppFooter />
    </div>
  );
};

export default CoachDashboard;