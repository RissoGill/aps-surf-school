import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, User, Calendar, Plus, MapPin, LogOut, Upload, X, Image as ImageIcon, Video, Waves, ChevronDown, ChevronRight, Wind, Euro, RefreshCw, Filter, Download, FileText, Clock, Eye } from "lucide-react";
import html2pdf from "html2pdf.js";
import { format } from "date-fns";
import apsLogoImage from "@/assets/aps-logo.png";
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
import { toast } from "sonner";
import AppHeader from "@/components/shared/AppHeader";
import SponsorBanner from "@/components/shared/SponsorBanner";
import AppFooter from "@/components/shared/AppFooter";
import { Collapsible } from "@/components/ui/collapsible";
import { AthleteProfileCard } from "@/components/coach/AthleteProfileCard";
import { MonthlyAttendanceSummary } from "@/components/coach/MonthlyAttendanceSummary";
import { AnnualAttendanceSummary } from "@/components/coach/AnnualAttendanceSummary";
import { AttendanceMediaGallery } from "@/components/coach/AttendanceMediaGallery";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChampionshipsTab } from "@/components/coach/ChampionshipsTab";
import { EstagiosTab } from "@/components/coach/EstagiosTab";
import { BulkAttendanceRegistration } from "@/components/coach/BulkAttendanceRegistration";
import { PackBalanceAlert } from "@/components/shared/PackBalanceAlert";
import { PaymentsTab } from "@/components/coach/PaymentsTab";

interface AttendanceRecord {
  id: string;
  date: string | null;
  status: string | null;
  coach: string | null;
  coach_id?: string | null;
  beach_location: string | null;
  notes: string | null;
  athlete_id: string | null;
  photos?: string[];
  videos?: string[];
  shift?: string | null;
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
  plan_type: string | null;
  attendance: AttendanceRecord[];
}

const CoachDashboard = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);
  const [newAttendance, setNewAttendance] = useState({
    date: new Date().toISOString().split('T')[0],
    status: "",
    coach: "",
    praia: "",
    notas: "",
    shift: ""
  });
  const [uploadedPhotos, setUploadedPhotos] = useState<File[]>([]);
  const [uploadedVideos, setUploadedVideos] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [coachData, setCoachData] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Training history filters
  const [historyDateRange, setHistoryDateRange] = useState<{start: string, end: string}>({
    start: '', 
    end: new Date().toISOString().split('T')[0]
  });
  const [historyAthleteFilter, setHistoryAthleteFilter] = useState<string>('all');
  const [historyBeachFilter, setHistoryBeachFilter] = useState<string>('all');
  const [historySearchQuery, setHistorySearchQuery] = useState<string>('');

  // Check authentication and fetch coach data using Supabase Auth, with legacy fallback
  useEffect(() => {
    const loadFromAuth = async (userId: string) => {
      const { data, error } = await supabase
        .from('coach')
        .select('coach_id, first_name, last_name, email, coach_user_id')
        .eq('auth_uid', userId)
        .maybeSingle();
      if (error || !data) {
        console.error('Coach profile not found for auth user:', error);
        return false;
      }
      setCoachData(data);
      localStorage.setItem('coach_session', JSON.stringify(data));
      return true;
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        loadFromAuth(session.user.id);
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        const ok = await loadFromAuth(session.user.id);
        if (!ok) {
          // Try legacy fallback
          const coachSession = localStorage.getItem('coach_session');
          if (coachSession) {
            try {
              const parsed = JSON.parse(coachSession);
              setCoachData(parsed);
              return;
            } catch {}
          }
          navigate('/login/coach');
        }
        return;
      }

      // No Supabase session: fallback to legacy localStorage
      const coachSession = localStorage.getItem('coach_session');
      if (coachSession) {
        try {
          const parsed = JSON.parse(coachSession);
          setCoachData(parsed);
          return;
        } catch {}
      }
      navigate('/login/coach');
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, supabase]);

  // Close dropdown when clicking outside - No longer needed since results are below card
  // Removed: useEffect for click outside handler

  // Real-time subscription for attendance updates
  useEffect(() => {
    const channel = supabase
      .channel('attendance-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'attendance'
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
          table: 'attendance'
        },
        () => {
          // Invalidate and refetch athletes data when attendance is updated
          queryClient.invalidateQueries({ queryKey: ['athletes-with-attendance'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'attendance'
        },
        () => {
          // Invalidate and refetch when attendance is deleted
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
        .from('atletas')
        .select('*')
        .order('first_name', { ascending: true });
      
      // Fetch coaches to map coach_id -> coach name
      const { data: coachesData, error: coachesError } = await supabase
        .from('coach')
        .select('coach_id, first_name, last_name');
      if (coachesError) {
        console.warn('Error fetching coaches:', coachesError);
      }
      
      if (athletesError) {
        console.error('Error fetching athletes:', athletesError);
        throw athletesError;
      }

      // Fetch all attendance records from Supabase with pagination to bypass 1000-row limit
      const pageSize = 1000;

      // Get total rows count first
      const { count: attendanceCount, error: countError } = await supabase
        .from('attendance')
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
              .from('attendance')
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

      // Include attendance records that have a valid date and valid status (Present, Absent, Justified)
      const validStatuses = new Set(['present', 'absent', 'justified']);
      const filteredAttendance = (attendanceData || []).filter((att: any) => {
        if (!att?.date) return false;
        const status = typeof att?.status === 'string' ? att.status.trim().toLowerCase() : '';
        return validStatuses.has(status);
      });

      // Build coach_id -> coach name map (first + last name, fallback to first name)
      const coachNameById: Record<string, string> = {};
      (coachesData || []).forEach((c: any) => {
        const key = String(c?.coach_id || '').trim().toLowerCase();
        if (!key) return;
        const full = [c?.first_name, c?.last_name].filter(Boolean).join(' ').trim();
        coachNameById[key] = full || c?.first_name || 'Unknown Coach';
      });

      console.log('Attendance records with date:', filteredAttendance.length);

      // Group attendance by athlete_id (case-insensitive, trimmed) for reliable mapping
      const attendanceByAthlete: Record<string, AttendanceRecord[]> = {};
      filteredAttendance.forEach((att: any) => {
        const key = String(att.athlete_id || '').trim().toLowerCase();
        if (!attendanceByAthlete[key]) attendanceByAthlete[key] = [];
        attendanceByAthlete[key].push({
          id: att.id,
          date: att.date,
          status: att.status,
          coach: att?.coach_id ? (coachNameById[String(att.coach_id).trim().toLowerCase()] || "Unknown Coach") : null,
          coach_id: att?.coach_id ?? null,
          beach_location: att?.beach_location ?? null,
          notes: att?.notes ?? null,
          athlete_id: att?.athlete_id ?? null,
          photos: att?.photos ?? [],
          videos: att?.videos ?? [],
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

  const handleSaveAttendance = async (athleteId: string) => {
    if (!athleteId || !newAttendance.date) {
      toast({
        title: "Error",
        description: "Please fill in the date before uploading",
        variant: "destructive",
      });
      return;
    }

    if (!newAttendance.shift) {
      toast({
        title: "Error",
        description: "Please select a shift (Morning or Afternoon)",
        variant: "destructive",
      });
      return;
    }

    if (!coachData?.coach_id) {
      toast({
        title: "Error",
        description: "Coach profile not loaded. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Check for duplicate attendance records - case-insensitive
      const { data: allRecords, error: duplicateCheckError } = await supabase
        .from('attendance')
        .select('id, shift')
        .eq('athlete_id', athleteId)
        .eq('date', newAttendance.date);

      if (duplicateCheckError) {
        console.error('Error checking duplicates:', duplicateCheckError);
      }

      // Filter with case-insensitive, trimmed comparison to match database trigger
      const normalizedShift = newAttendance.shift.trim().toLowerCase();
      const existingRecords = allRecords?.filter(r => 
        r.shift?.trim().toLowerCase() === normalizedShift
      ) || [];

      if (existingRecords.length > 0) {
        toast({
          title: "Duplicate Attendance",
          description: "Attendance for this athlete and shift already exists on this date.",
          variant: "destructive",
        });
        setIsUploading(false);
        return;
      }

      // Upload photos and videos to storage
      const photoUrls: string[] = [];
      const videoUrls: string[] = [];

      // Upload photos
      for (const photo of uploadedPhotos) {
        const fileExt = photo.name.split('.').pop();
        const fileName = `${athleteId}/${Date.now()}-${Math.random()}.${fileExt}`;
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
        const fileName = `${athleteId}/${Date.now()}-${Math.random()}.${fileExt}`;
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
      let insertError: any = null;
      const record = {
        id: `${athleteId}-${newAttendance.date}-${newAttendance.shift}-${Date.now()}`,
        athlete_id: athleteId,
        date: newAttendance.date,
        status: 'Present',
        shift: newAttendance.shift,
        coach_id: coachData?.coach_id || null,
        beach_location: newAttendance.praia || null,
        notes: null,
        photos: photoUrls.length > 0 ? photoUrls : null,
        videos: videoUrls.length > 0 ? videoUrls : null,
      } as any;

      const { error } = await supabase.from('attendance').insert(record);
      insertError = error;

      if (insertError) {
        // Check if it's a duplicate error
        const errorMsg = insertError.message || '';
        if (errorMsg.includes('Attendance for this athlete and shift already exists on this date') || insertError.code === 'P0001') {
          toast({
            title: "Duplicate Attendance",
            description: "Attendance for this athlete and shift already exists on this date.",
            variant: "destructive",
          });
          setIsUploading(false);
          return;
        }

        // Fallback via edge function (service role) to bypass RLS for legacy logins
        const { data, error: invokeError } = await supabase.functions.invoke('attendance-admin', {
          body: record,
        });

        if (invokeError) {
          throw new Error(`Failed to save attendance: ${invokeError.message}`);
        }

        if (data?.duplicate) {
          toast({
            title: "Duplicate Attendance",
            description: "Attendance for this athlete and shift already exists on this date.",
            variant: "destructive",
          });
          setIsUploading(false);
          return;
        }

        if (!data?.success) {
          const info = data || {};
          throw new Error(info.error || 'Failed to save attendance');
        }
      }

      // If athlete has Pack plan, increment used_tokens (allow negative balance)
      const { data: athleteCheckData } = await supabase
        .from('atletas')
        .select('plan_type')
        .eq('athlete_id', athleteId)
        .single();

      if (athleteCheckData?.plan_type === 'Pack') {
        const { data: packData } = await supabase
          .from('packs')
          .select('*')
          .eq('athlete_id', athleteId)
          .eq('active', true)
          .order('purchase_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (packData) {
          const newUsedTokens = (parseInt(packData.used_tokens || '0') + 1).toString();
          await supabase
            .from('packs')
            .update({ used_tokens: newUsedTokens })
            .eq('id', packData.id);
        }
      }

      toast({
        title: "Success",
        description: "Attendance recorded successfully",
      });

      setIsDialogOpen(false);
      setNewAttendance({
        date: new Date().toISOString().split('T')[0],
        status: "",
        coach: "",
        praia: "",
        notas: "",
        shift: ""
      });
      setUploadedPhotos([]);
      setUploadedVideos([]);
      queryClient.invalidateQueries({ queryKey: ['athletes-with-attendance'], refetchType: 'all' });
    } catch (error: any) {
      console.error('Attendance save error:', error);
      toast({
        title: "Error",
        description: (error?.message || '').includes('row-level security') ? 'Permission denied. Please log in via email/password or contact admin.' : (error.message || "Failed to save attendance"),
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
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Sign out error', e);
    } finally {
      localStorage.removeItem('coach_session');
      navigate("/login/coach");
    }
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['athletes'] });
    queryClient.invalidateQueries({ queryKey: ['attendance'] });
    toast({
      title: "Refreshing data...",
      description: "Loading the latest information",
    });
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

  const EXCLUDED_DATES_BY_COACH: Record<string, Set<string>> = {
    T01: new Set(['2025-09-01']),
  };

  const isExcludedDateForCoach = (record?: { date?: string | null; coach_id?: string | null }) => {
    if (!record?.date) return false;
    const cid = String(record.coach_id ?? '').trim().toUpperCase();
    const excluded = EXCLUDED_DATES_BY_COACH[cid];
    if (!excluded) return false;
    const d = String(record.date).slice(0, 10);
    return excluded.has(d);
  };

  // Calculate total training days for this coach
  const totalTrainingSessions = useMemo(() => {
    if (!athletes) return 0;

    const coachId = coachData?.coach_id?.toString().trim().toUpperCase();
    const firstName = coachData?.first_name?.toString().trim().toLowerCase();
    const lastName = coachData?.last_name?.toString().trim().toLowerCase();
    const fullName = [coachData?.first_name, coachData?.last_name].filter(Boolean).join(' ').trim().toLowerCase();

    const coachMatchesCoach = (coachName?: string | null, recordCoachId?: string | null) => {
      // Prefer strict coach_id match when available
      if (coachId && recordCoachId) {
        const rec = String(recordCoachId).trim().toUpperCase();
        if (rec === coachId) return true;
      }
      // Fallback to name matching
      const coach = (coachName || '').trim();
      if (!coach) return false;
      const tUpper = coach.toUpperCase();
      const tLower = coach.toLowerCase();
      const tokens = tLower.split(/[^a-z0-9]+/).filter(Boolean);
      return (
        (firstName && tokens.includes(firstName)) ||
        (lastName && tokens.includes(lastName)) ||
        (fullName && tLower === fullName)
      );
    };

    const uniqueDates = new Set<string>();
    for (const athlete of athletes) {
      for (const record of athlete.attendance) {
        if (!record.date) continue;
        if (!coachMatchesCoach(record.coach, record.coach_id)) continue;
        if (isExcludedDateForCoach(record)) continue;
        uniqueDates.add(record.date);
      }
    }

    return uniqueDates.size;
  }, [athletes, coachData]);

  // Calculate current month training days for this coach
  const currentMonthTrainingSessions = useMemo(() => {
    if (!athletes) return 0;

    const coachId = coachData?.coach_id?.toString().trim().toUpperCase();
    const firstName = coachData?.first_name?.toString().trim().toLowerCase();
    const lastName = coachData?.last_name?.toString().trim().toLowerCase();
    const fullName = [coachData?.first_name, coachData?.last_name].filter(Boolean).join(' ').trim().toLowerCase();

    const coachMatchesCoach = (coachName?: string | null, recordCoachId?: string | null) => {
      if (coachId && recordCoachId) {
        const rec = String(recordCoachId).trim().toUpperCase();
        if (rec === coachId) return true;
      }
      const coach = (coachName || '').trim();
      if (!coach) return false;
      const tLower = coach.toLowerCase();
      const tokens = tLower.split(/[^a-z0-9]+/).filter(Boolean);
      return (
        (firstName && tokens.includes(firstName)) ||
        (lastName && tokens.includes(lastName)) ||
        (fullName && tLower === fullName)
      );
    };

    const now = new Date();
    const currentYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const uniqueDates = new Set<string>();
    for (const athlete of athletes) {
      for (const record of athlete.attendance) {
        if (!record.date) continue;
        if (!coachMatchesCoach(record.coach, record.coach_id)) continue;
        if (isExcludedDateForCoach(record)) continue;
        if (record.date.slice(0, 7) === currentYm) {
          uniqueDates.add(record.date);
        }
      }
    }
    return uniqueDates.size;
  }, [athletes, coachData]);

  // Calculate training days by month for the logged-in coach only
  const trainingDaysByMonth = useMemo(() => {
    if (!athletes || !coachData) return {};

    const coachId = coachData?.coach_id?.toString().trim().toUpperCase();
    const firstName = coachData?.first_name?.toString().trim().toLowerCase();
    const lastName = coachData?.last_name?.toString().trim().toLowerCase();
    const fullName = [coachData?.first_name, coachData?.last_name].filter(Boolean).join(' ').trim().toLowerCase();

    const coachMatchesCoach = (coachName?: string | null, recordCoachId?: string | null) => {
      if (coachId && recordCoachId) {
        const rec = String(recordCoachId).trim().toUpperCase();
        if (rec === coachId) return true;
      }
      const coach = (coachName || '').trim();
      if (!coach) return false;
      const tLower = coach.toLowerCase();
      const tokens = tLower.split(/[^a-z0-9]+/).filter(Boolean);
      return (
        (firstName && tokens.includes(firstName)) ||
        (lastName && tokens.includes(lastName)) ||
        (fullName && tLower === fullName)
      );
    };

    const byMonth: Record<string, Set<string>> = {};
    for (const athlete of athletes) {
      for (const record of athlete.attendance) {
        if (!record.date) continue;
        if (!coachMatchesCoach(record.coach, record.coach_id)) continue;
        if (isExcludedDateForCoach(record)) continue;
        const yearMonth = record.date.slice(0, 7);
        if (!byMonth[yearMonth]) {
          byMonth[yearMonth] = new Set();
        }
        byMonth[yearMonth].add(record.date);
      }
    }

    const result: Record<string, number> = {};
    Object.keys(byMonth).sort().reverse().forEach(ym => {
      result[ym] = byMonth[ym].size;
    });
    return result;
  }, [athletes, coachData]);

  // Calculate training days by year for the logged-in coach only
  const trainingDaysByYear = useMemo(() => {
    if (!athletes || !coachData) return {};

    const coachId = coachData?.coach_id?.toString().trim().toUpperCase();
    const firstName = coachData?.first_name?.toString().trim().toLowerCase();
    const lastName = coachData?.last_name?.toString().trim().toLowerCase();
    const fullName = [coachData?.first_name, coachData?.last_name].filter(Boolean).join(' ').trim().toLowerCase();

    const coachMatchesCoach = (coachName?: string | null, recordCoachId?: string | null) => {
      if (coachId && recordCoachId) {
        const rec = String(recordCoachId).trim().toUpperCase();
        if (rec === coachId) return true;
      }
      const coach = (coachName || '').trim();
      if (!coach) return false;
      const tLower = coach.toLowerCase();
      const tokens = tLower.split(/[^a-z0-9]+/).filter(Boolean);
      return (
        (firstName && tokens.includes(firstName)) ||
        (lastName && tokens.includes(lastName)) ||
        (fullName && tLower === fullName)
      );
    };

    const byYear: Record<string, Set<string>> = {};
    for (const athlete of athletes) {
      for (const record of athlete.attendance) {
        if (!record.date) continue;
        if (!coachMatchesCoach(record.coach, record.coach_id)) continue;
        if (isExcludedDateForCoach(record)) continue;
        
        const year = record.date.slice(0, 4);
        if (!byYear[year]) {
          byYear[year] = new Set();
        }
        byYear[year].add(record.date);
      }
    }

    const result: Record<string, number> = {};
    Object.keys(byYear).sort().reverse().forEach(y => {
      result[y] = byYear[y].size;
    });
    return result;
  }, [athletes, coachData]);

  // Track individual dates by month for dropdown
  const trainingDatesByMonth = useMemo(() => {
    if (!athletes || !coachData) return {};

    const coachId = coachData?.coach_id?.toString().trim().toUpperCase();
    const firstName = coachData?.first_name?.toString().trim().toLowerCase();
    const lastName = coachData?.last_name?.toString().trim().toLowerCase();
    const fullName = [coachData?.first_name, coachData?.last_name].filter(Boolean).join(' ').trim().toLowerCase();

    const coachMatchesCoach = (coachName?: string | null, recordCoachId?: string | null) => {
      if (coachId && recordCoachId) {
        const rec = String(recordCoachId).trim().toUpperCase();
        if (rec === coachId) return true;
      }
      const coach = (coachName || '').trim();
      if (!coach) return false;
      const tLower = coach.toLowerCase();
      const tokens = tLower.split(/[^a-z0-9]+/).filter(Boolean);
      return (
        (firstName && tokens.includes(firstName)) ||
        (lastName && tokens.includes(lastName)) ||
        (fullName && tLower === fullName)
      );
    };

    const byMonth: Record<string, string[]> = {};
    for (const athlete of athletes) {
      for (const record of athlete.attendance) {
        if (!record.date) continue;
        if (!coachMatchesCoach(record.coach, record.coach_id)) continue;
        if (isExcludedDateForCoach(record)) continue;
        
        const yearMonth = record.date.slice(0, 7);
        if (!byMonth[yearMonth]) {
          byMonth[yearMonth] = [];
        }
        if (!byMonth[yearMonth].includes(record.date)) {
          byMonth[yearMonth].push(record.date);
        }
      }
    }

    // Sort dates within each month
    Object.keys(byMonth).forEach(ym => {
      byMonth[ym].sort().reverse();
    });

    return byMonth;
  }, [athletes, coachData]);

  // Training sessions with athlete details by month
  const trainingSessionsByMonth = useMemo(() => {
    if (!athletes || !coachData) return {};

    const coachId = coachData?.coach_id?.toString().trim().toUpperCase();
    const firstName = coachData?.first_name?.toString().trim().toLowerCase();
    const lastName = coachData?.last_name?.toString().trim().toLowerCase();
    const fullName = [coachData?.first_name, coachData?.last_name].filter(Boolean).join(' ').trim().toLowerCase();

    const coachMatchesCoach = (coachName?: string | null, recordCoachId?: string | null) => {
      if (coachId && recordCoachId) {
        const rec = String(recordCoachId).trim().toUpperCase();
        if (rec === coachId) return true;
      }
      const coach = (coachName || '').trim();
      if (!coach) return false;
      const tLower = coach.toLowerCase();
      const tokens = tLower.split(/[^a-z0-9]+/).filter(Boolean);
      return (
        (firstName && tokens.includes(firstName)) ||
        (lastName && tokens.includes(lastName)) ||
        (fullName && tLower === fullName)
      );
    };

    // Group by month -> date -> athletes
    const byMonth: Record<string, Record<string, Array<{
      athleteId: string;
      athleteName: string;
      shift?: string;
      beachLocation?: string;
    }>>> = {};

    for (const athlete of athletes) {
      const athleteName = `${athlete.first_name || ''} ${athlete.last_name || ''}`.trim();
      
      for (const record of athlete.attendance) {
        if (!record.date) continue;
        if (!coachMatchesCoach(record.coach, record.coach_id)) continue;
        if (isExcludedDateForCoach(record)) continue;
        
        const yearMonth = record.date.slice(0, 7);
        if (!byMonth[yearMonth]) {
          byMonth[yearMonth] = {};
        }
        if (!byMonth[yearMonth][record.date]) {
          byMonth[yearMonth][record.date] = [];
        }
        
        byMonth[yearMonth][record.date].push({
          athleteId: athlete.athlete_id,
          athleteName: athleteName,
          shift: record.shift || undefined,
          beachLocation: record.beach_location || undefined,
        });
      }
    }

    // Sort dates within each month (reverse chronological)
    Object.keys(byMonth).forEach(ym => {
      const sortedDates = Object.keys(byMonth[ym]).sort().reverse();
      const sortedMonth: Record<string, any> = {};
      sortedDates.forEach(date => {
        sortedMonth[date] = byMonth[ym][date];
      });
      byMonth[ym] = sortedMonth;
    });

    return byMonth;
  }, [athletes, coachData]);

  // Filtered training sessions based on filters and search
  const filteredTrainingSessionsByMonth = useMemo(() => {
    if (!trainingSessionsByMonth) return {};
    
    const filtered: typeof trainingSessionsByMonth = {};
    
    Object.entries(trainingSessionsByMonth).forEach(([month, sessions]) => {
      const filteredSessions: Record<string, any[]> = {};
      
      Object.entries(sessions).forEach(([date, athletesList]) => {
        // Apply date range filter
        if (historyDateRange.start && date < historyDateRange.start) return;
        if (historyDateRange.end && date > historyDateRange.end) return;
        
        // Filter athletes
        const filteredAthletes = athletesList.filter(athlete => {
          // Athlete filter
          if (historyAthleteFilter && historyAthleteFilter !== 'all' && athlete.athleteId !== historyAthleteFilter) return false;
          
          // Beach filter
          if (historyBeachFilter && historyBeachFilter !== 'all' && athlete.beachLocation !== historyBeachFilter) return false;
          
          // Search query
          if (historySearchQuery) {
            const query = historySearchQuery.toLowerCase();
            const matchesName = athlete.athleteName.toLowerCase().includes(query);
            const matchesDate = date.includes(query);
            const matchesBeach = athlete.beachLocation?.toLowerCase().includes(query);
            if (!matchesName && !matchesDate && !matchesBeach) return false;
          }
          
          return true;
        });
        
        if (filteredAthletes.length > 0) {
          filteredSessions[date] = filteredAthletes;
        }
      });
      
      if (Object.keys(filteredSessions).length > 0) {
        filtered[month] = filteredSessions;
      }
    });
    
    return filtered;
  }, [trainingSessionsByMonth, historyDateRange, historyAthleteFilter, historyBeachFilter, historySearchQuery]);

  // Extract unique athletes for filter dropdown
  const uniqueAthletesList = useMemo(() => {
    const athletesMap = new Map();
    Object.values(trainingSessionsByMonth).forEach(sessions => {
      Object.values(sessions).forEach(athletesList => {
        athletesList.forEach(athlete => {
          if (!athletesMap.has(athlete.athleteId)) {
            athletesMap.set(athlete.athleteId, {
              id: athlete.athleteId,
              name: athlete.athleteName
            });
          }
        });
      });
    });
    return Array.from(athletesMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [trainingSessionsByMonth]);

  // Extract unique beach locations for filter dropdown
  const uniqueBeachLocations = useMemo(() => {
    const beaches = new Set<string>();
    Object.values(trainingSessionsByMonth).forEach(sessions => {
      Object.values(sessions).forEach(athletesList => {
        athletesList.forEach(athlete => {
          if (athlete.beachLocation) beaches.add(athlete.beachLocation);
        });
      });
    });
    return Array.from(beaches).sort();
  }, [trainingSessionsByMonth]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalDays = Object.values(filteredTrainingSessionsByMonth).reduce((acc, sessions) => 
      acc + Object.keys(sessions).length, 0);
    
    const uniqueAthletes = new Set();
    const beachCounts: Record<string, number> = {};
    let totalAthletesSessions = 0;
    
    Object.values(filteredTrainingSessionsByMonth).forEach(sessions => {
      Object.values(sessions).forEach(athletesList => {
        totalAthletesSessions += athletesList.length;
        athletesList.forEach(athlete => {
          uniqueAthletes.add(athlete.athleteId);
          if (athlete.beachLocation) {
            beachCounts[athlete.beachLocation] = (beachCounts[athlete.beachLocation] || 0) + 1;
          }
        });
      });
    });
    
    const mostActiveBeach = Object.entries(beachCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    const avgAthletesPerSession = totalDays > 0 ? (totalAthletesSessions / totalDays).toFixed(1) : '0';
    
    return {
      totalDays,
      uniqueAthletesCount: uniqueAthletes.size,
      mostActiveBeach,
      avgAthletesPerSession
    };
  }, [filteredTrainingSessionsByMonth]);

  // Clear all filters
  const clearAllFilters = () => {
    setHistoryDateRange({ start: '', end: new Date().toISOString().split('T')[0] });
    setHistoryAthleteFilter('all');
    setHistoryBeachFilter('all');
    setHistorySearchQuery('');
  };

  // Generate HTML for PDF export
  const generateTrainingHistoryHTML = (): string => {
    const activeFilters = [];
    if (historyDateRange.start) activeFilters.push(`From: ${historyDateRange.start}`);
    if (historyDateRange.end) activeFilters.push(`To: ${historyDateRange.end}`);
    if (historyAthleteFilter !== 'all') activeFilters.push(`Athlete: ${historyAthleteFilter}`);
    if (historyBeachFilter !== 'all') activeFilters.push(`Beach: ${historyBeachFilter}`);
    if (historySearchQuery) activeFilters.push(`Search: ${historySearchQuery}`);

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Training Session History Report</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #0077be;
              padding-bottom: 20px;
            }
            .header img {
              width: 120px;
              margin-bottom: 15px;
            }
            .header h1 {
              margin: 10px 0;
              color: #0077be;
              font-size: 24px;
            }
            .header p {
              margin: 5px 0;
              color: #666;
              font-size: 14px;
            }
            .summary-stats {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 15px;
              margin-bottom: 30px;
            }
            .stat-box {
              border: 1px solid #e0e0e0;
              border-radius: 8px;
              padding: 15px;
              text-align: center;
              background: linear-gradient(to bottom, #f8f9fa, #ffffff);
            }
            .stat-value {
              font-size: 24px;
              font-weight: bold;
              color: #0077be;
              margin-bottom: 5px;
            }
            .stat-label {
              font-size: 12px;
              color: #666;
            }
            .filters-info {
              background: #f8f9fa;
              padding: 10px 15px;
              border-radius: 5px;
              margin-bottom: 20px;
              font-size: 12px;
              color: #666;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th {
              background: #0077be;
              color: white;
              padding: 12px;
              text-align: left;
              font-weight: 600;
              font-size: 14px;
            }
            td {
              padding: 10px 12px;
              border-bottom: 1px solid #e0e0e0;
              font-size: 13px;
            }
            tr:nth-child(even) {
              background: #f8f9fa;
            }
            .month-header {
              background: #e3f2fd;
              font-weight: bold;
              color: #0077be;
              padding: 8px 12px;
              font-size: 14px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e0e0e0;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="${apsLogoImage}" alt="APS Logo" />
            <h1>Training Session History Report</h1>
            <p><strong>Coach:</strong> ${coachDisplayName}</p>
            <p><strong>Generated:</strong> ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}</p>
            ${activeFilters.length > 0 ? `<p><strong>Applied Filters:</strong> ${activeFilters.join(' | ')}</p>` : ''}
          </div>

          <div class="summary-stats">
            <div class="stat-box">
              <div class="stat-value">${summaryStats.totalDays}</div>
              <div class="stat-label">Total Days</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${summaryStats.uniqueAthletesCount}</div>
              <div class="stat-label">Athletes Trained</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${summaryStats.mostActiveBeach}</div>
              <div class="stat-label">Most Active Beach</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${summaryStats.avgAthletesPerSession}</div>
              <div class="stat-label">Avg per Session</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Day</th>
                <th>Athlete</th>
                <th>Shift</th>
                <th>Beach Location</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(filteredTrainingSessionsByMonth).map(([month, sessions]) => `
                <tr>
                  <td colspan="5" class="month-header">${month}</td>
                </tr>
                ${Object.entries(sessions).map(([date, athletesList]) => 
                  athletesList.map(athlete => {
                    const dateObj = new Date(date);
                    const dayName = dateObj.toLocaleDateString('default', { weekday: 'long' });
                    return `
                      <tr>
                        <td>${date}</td>
                        <td>${dayName}</td>
                        <td>${athlete.athleteName}</td>
                        <td>${athlete.shift || 'N/A'}</td>
                        <td>${athlete.beachLocation || 'N/A'}</td>
                      </tr>
                    `;
                  }).join('')
                ).join('')}
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            <p>APS - Academia de Performance Surf | Training Session History Report</p>
          </div>
        </body>
      </html>
    `;
  };

  // View PDF in new tab
  const viewTrainingHistoryPDF = async () => {
    try {
      const htmlContent = generateTrainingHistoryHTML();
      const element = document.createElement('div');
      element.innerHTML = htmlContent;

      const opt = {
        margin: 10,
        filename: `training-history-${coachDisplayName}-${format(new Date(), "yyyy-MM-dd")}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
      };

      const pdf = await html2pdf().from(element).set(opt).outputPdf('blob');
      const pdfUrl = URL.createObjectURL(pdf);
      window.open(pdfUrl, '_blank');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({ title: "Error", description: "Failed to generate PDF", variant: "destructive" });
    }
  };

  // Download PDF
  const downloadTrainingHistoryPDF = async () => {
    try {
      const htmlContent = generateTrainingHistoryHTML();
      const element = document.createElement('div');
      element.innerHTML = htmlContent;

      const opt = {
        margin: 10,
        filename: `training-history-${coachDisplayName}-${format(new Date(), "yyyy-MM-dd")}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
      };

      await html2pdf().from(element).set(opt).save();
      toast({ title: "Success", description: "PDF downloaded successfully" });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({ title: "Error", description: "Failed to download PDF", variant: "destructive" });
    }
  };

  // State for expanded months
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  const toggleMonth = (month: string) => {
    const newExpanded = new Set(expandedMonths);
    if (newExpanded.has(month)) {
      newExpanded.delete(month);
    } else {
      newExpanded.add(month);
    }
    setExpandedMonths(newExpanded);
  };

  return (
    <div className="min-h-screen bg-gradient-surface">
      <AppHeader title="Coach Dashboard" showBack backTo="/" />
      
      <main className="mobile-container py-6">
        {/* Welcome Section */}
        <div className="mb-4">
          <div className="flex items-start justify-between mb-2">
            <h2 className="text-2xl font-bold text-foreground">
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
            <div className="flex gap-2 flex-shrink-0">
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout} className="flex-shrink-0">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage your athletes and track their progress
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="shadow-soft">
            <CardContent className="p-4 text-center">
              <Calendar className="h-6 w-6 text-success mx-auto mb-2" />
              {isLoading ? (
                <Skeleton className="h-8 w-12 mx-auto mb-1" />
              ) : (
                <p className="text-2xl font-normal text-foreground">{currentMonthTrainingSessions}</p>
              )}
              <p className="text-sm text-muted-foreground">This Month</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardContent className="p-4 text-center">
              <Waves className="h-6 w-6 text-warning mx-auto mb-2" />
              {isLoading ? (
                <Skeleton className="h-8 w-12 mx-auto mb-1" />
              ) : (
                <p className="text-2xl font-normal text-foreground">{totalTrainingSessions}</p>
              )}
              <p className="text-sm text-muted-foreground">Total Annual Sessions</p>
            </CardContent>
          </Card>
        </div>

        {/* Bulk Attendance Registration */}
        {coachData?.coach_id && (
          <BulkAttendanceRegistration coachId={coachData.coach_id} />
        )}

        {/* Search Athletes Card */}
        <Card className="shadow-soft mb-6">
          <CardHeader>
            <h4 className="font-medium text-foreground flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search athletes by Name
            </h4>
            <CardDescription>
              Find and select athletes to view their details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search athletes by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 touch-friendly"
              />
            </div>
          </CardContent>
        </Card>

        {/* Athletes List appears here when searching */}

        {/* Athletes List - Only shown when searching */}
        {searchQuery && (
        <Card className="shadow-medium mb-6">
          <CardHeader>
            <h4 className="font-medium text-foreground flex items-center gap-2">
              <User className="h-5 w-5" />
              Athletes & Attendance
            </h4>
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
                  <Collapsible key={athlete.athlete_id} defaultOpen={false} className="border-b border-border last:border-b-0">
                    <div className="p-4 space-y-4">
                      <Tabs defaultValue="view" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1">
                          <TabsTrigger 
                            value="view"
                            className="data-[state=active]:bg-view data-[state=active]:text-view-foreground text-xs sm:text-sm px-2"
                          >
                            View Info
                          </TabsTrigger>
                          <TabsTrigger 
                            value="add"
                            className="data-[state=active]:bg-attendance data-[state=active]:text-attendance-foreground text-xs sm:text-sm px-2"
                          >
                            Upload media
                          </TabsTrigger>
                          <TabsTrigger 
                            value="registrations"
                            className="data-[state=active]:bg-registrations data-[state=active]:text-registrations-foreground text-xs sm:text-sm px-2"
                          >
                            Register
                          </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="view" className="space-y-4">
                          {/* Athlete Profile Information */}
                          <div className="pt-4 space-y-4">
                            <PackBalanceAlert 
                              athleteId={athlete.athlete_id} 
                              athleteName={`${athlete.first_name} ${athlete.last_name}`}
                              showFor="coach"
                            />
                            
                            <AthleteProfileCard athlete={athlete} getLevelColor={getLevelColor} />
                          </div>

                          {/* Annual Summary First, then Monthly with Dropdown */}
                          {athlete.attendance.length > 0 && (
                            <div className="space-y-4">
                              <AnnualAttendanceSummary attendance={athlete.attendance} />
                              <MonthlyAttendanceSummary attendance={athlete.attendance} />
                              <AttendanceMediaGallery attendance={athlete.attendance} />
                            </div>
                          )}
                        </TabsContent>
                        
                        <TabsContent value="add" className="space-y-4">
                          <div className="pt-4 space-y-4">
                            <h3 className="text-lg font-semibold">Upload Media for {athlete.first_name} {athlete.last_name}</h3>
                            
                            <div className="space-y-2">
                              <Label>Date</Label>
                              <Input
                                type="date"
                                value={newAttendance.date}
                                onChange={(e) => setNewAttendance({ ...newAttendance, date: e.target.value })}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label>Shift *</Label>
                              <select
                                value={newAttendance.shift}
                                onChange={(e) => setNewAttendance({ ...newAttendance, shift: e.target.value })}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                              >
                                <option value="">Select shift...</option>
                                <option value="Morning">Morning</option>
                                <option value="Afternoon">Afternoon</option>
                              </select>
                            </div>
                            
                            <div className="space-y-2">
                              <Label>Beach Location</Label>
                              <Input
                                value={newAttendance.praia}
                                onChange={(e) => setNewAttendance({ ...newAttendance, praia: e.target.value })}
                                placeholder="Enter beach name"
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
                                    setUploadedPhotos(files);
                                  }}
                                />
                                {uploadedPhotos && uploadedPhotos.length > 0 && (
                                  <p className="text-sm text-muted-foreground">
                                    {uploadedPhotos.length} photo(s) selected
                                  </p>
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
                                    setUploadedVideos(files);
                                  }}
                                />
                                {uploadedVideos && uploadedVideos.length > 0 && (
                                  <p className="text-sm text-muted-foreground">
                                    {uploadedVideos.length} video(s) selected
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <Label>Notes (optional)</Label>
                              <Textarea
                                value={newAttendance.notas}
                                onChange={(e) => setNewAttendance({ ...newAttendance, notas: e.target.value })}
                                placeholder="Add any additional notes..."
                                rows={3}
                              />
                            </div>
                            
                            <Button 
                              onClick={() => {
                                setSelectedAthleteId(athlete.athlete_id);
                                handleSaveAttendance(athlete.athlete_id);
                              }} 
                              className="w-full" 
                              disabled={isUploading}
                            >
                              {isUploading ? (
                                <>
                                  <Upload className="h-4 w-4 mr-2 animate-spin" />
                                  Uploading...
                                </>
                              ) : (
                                "Upload Media"
                              )}
                            </Button>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="registrations" className="space-y-4">
                          <div className="pt-4">
                            <Tabs defaultValue="championships" className="w-full">
                              <TabsList className="grid w-full grid-cols-2 mb-4 bg-muted/50 p-1">
                                <TabsTrigger 
                                  value="championships" 
                                  className="data-[state=active]:bg-championships data-[state=active]:text-championships-foreground text-sm"
                                >
                                  Championships
                                </TabsTrigger>
                                <TabsTrigger 
                                  value="estagios"
                                  className="data-[state=active]:bg-estagios data-[state=active]:text-estagios-foreground text-sm"
                                >
                                  Estágios
                                </TabsTrigger>
                              </TabsList>
                              
                              <TabsContent value="championships">
                                <ChampionshipsTab athleteId={athlete.athlete_id} athleteName={`${athlete.first_name} ${athlete.last_name}`} />
                              </TabsContent>
                              
                              <TabsContent value="estagios">
                                <EstagiosTab athleteId={athlete.athlete_id} athleteName={`${athlete.first_name} ${athlete.last_name}`} />
                              </TabsContent>
                            </Tabs>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </Collapsible>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        )}

        {/* Coach Payments Section */}
        {coachData?.coach_id && (
          <Card className="shadow-soft mb-6">
            <CardHeader>
              <h4 className="font-medium text-foreground flex items-center gap-2">
                <Euro className="h-5 w-5" />
                My Payments
              </h4>
              <CardDescription>
                View your payment history and summaries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentsTab coachId={coachData.coach_id} />
            </CardContent>
          </Card>
        )}

        {/* Training Days Breakdown - Enhanced */}
        {!isLoading && (Object.keys(trainingDaysByMonth).length > 0 || Object.keys(trainingDaysByYear).length > 0) && (
          <Card className="shadow-soft mb-6">
            <CardHeader className="pb-4">
              <h4 className="font-medium text-foreground">Your Training Session History</h4>
              <CardDescription>Detailed breakdown of your training days</CardDescription>
            </CardHeader>
            <CardContent>
              {/* PDF Action Buttons */}
              <div className="flex items-center gap-2 mb-6">
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={downloadTrainingHistoryPDF}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={viewTrainingHistoryPDF}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  View PDF
                </Button>
              </div>
              
              {/* Summary Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="rounded-xl border border-primary/20 bg-gradient-to-b from-primary/5 to-background p-4 text-center shadow-sm">
                  <div className="text-xl font-medium text-primary">{summaryStats.totalDays}</div>
                  <div className="text-xs text-muted-foreground mt-1">Total Days</div>
                </div>
                <div className="rounded-xl border border-primary/20 bg-gradient-to-b from-primary/5 to-background p-4 text-center shadow-sm">
                  <div className="text-xl font-medium text-primary">{summaryStats.uniqueAthletesCount}</div>
                  <div className="text-xs text-muted-foreground mt-1">Athletes Trained</div>
                </div>
                <div className="rounded-xl border border-primary/20 bg-gradient-to-b from-primary/5 to-background p-4 text-center shadow-sm">
                  <div className="text-xl font-medium text-primary">
                    {summaryStats.mostActiveBeach}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Most Active Beach</div>
                </div>
                <div className="rounded-xl border border-primary/20 bg-gradient-to-b from-primary/5 to-background p-4 text-center shadow-sm">
                  <div className="text-xl font-medium text-primary">{summaryStats.avgAthletesPerSession}</div>
                  <div className="text-xs text-muted-foreground mt-1">Avg per Session</div>
                </div>
              </div>

              {/* Filters & Search */}
              <div className="bg-muted/50 p-4 rounded-lg mb-4 space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-sm font-medium flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filters & Search
                  </h5>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearAllFilters}
                    className="text-xs h-7"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear All
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Date Range Filter */}
                  <div className="space-y-1">
                    <Label className="text-xs">Start Date</Label>
                    <Input 
                      type="date" 
                      value={historyDateRange.start}
                      onChange={(e) => setHistoryDateRange({...historyDateRange, start: e.target.value})}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">End Date</Label>
                    <Input 
                      type="date" 
                      value={historyDateRange.end}
                      onChange={(e) => setHistoryDateRange({...historyDateRange, end: e.target.value})}
                      className="h-8 text-xs"
                    />
                  </div>
                  
                  {/* Athlete Filter */}
                  <div className="space-y-1">
                    <Label className="text-xs">Athlete</Label>
                    <Select value={historyAthleteFilter} onValueChange={setHistoryAthleteFilter}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="All Athletes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Athletes</SelectItem>
                        {uniqueAthletesList.map(athlete => (
                          <SelectItem key={athlete.id} value={athlete.id}>
                            {athlete.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Beach Filter */}
                  <div className="space-y-1">
                    <Label className="text-xs">Beach Location</Label>
                    <Select value={historyBeachFilter} onValueChange={setHistoryBeachFilter}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="All Beaches" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Beaches</SelectItem>
                        {uniqueBeachLocations.map(beach => (
                          <SelectItem key={beach} value={beach}>
                            {beach}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by athlete name, date, or location..."
                    value={historySearchQuery}
                    onChange={(e) => setHistorySearchQuery(e.target.value)}
                    className="pl-10 h-9 text-sm"
                  />
                </div>
              </div>

              {/* Empty State for Filtered Results */}
              {Object.keys(filteredTrainingSessionsByMonth).length === 0 && (historySearchQuery || historyAthleteFilter !== 'all' || historyBeachFilter !== 'all' || historyDateRange.start) && (
                <div className="text-center py-12 px-4">
                  <div className="bg-muted/30 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Search className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h5 className="text-lg font-semibold mb-2">No results found</h5>
                  <p className="text-sm text-muted-foreground mb-4">
                    Try adjusting your filters or search query
                  </p>
                  <Button variant="outline" size="sm" onClick={clearAllFilters}>
                    Clear All Filters
                  </Button>
                </div>
              )}

              {/* Training Sessions Display - Monthly View */}
              {Object.keys(filteredTrainingSessionsByMonth).length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-foreground">Monthly Breakdown</h4>
                  <div className="space-y-3">
                    {Object.entries(filteredTrainingSessionsByMonth).map(([month, sessionsByDate]) => {
                      const [year, monthNum] = month.split('-');
                      const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleString('default', { month: 'long' });
                      const isExpanded = expandedMonths.has(month);
                      const count = Object.keys(sessionsByDate).length;
                      
                      // Calculate total athletes in month
                      const totalAthletesInMonth = Object.values(sessionsByDate).reduce((acc, athletesList) => 
                        acc + athletesList.length, 0);
                      
                      return (
                        <div key={month} className="border-2 border-border rounded-lg overflow-hidden bg-card shadow-sm">
                          <button
                            onClick={() => toggleMonth(month)}
                            className="w-full flex items-center justify-between py-4 px-5 hover:bg-accent/50 transition-all group"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              {isExpanded ? (
                                <ChevronDown className="h-5 w-5 text-primary transition-transform flex-shrink-0" />
                              ) : (
                                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                              )}
                              <div className="text-left min-w-0">
                                <span className="text-lg font-semibold block text-foreground">{monthName} {year}</span>
                                <span className="text-sm text-muted-foreground block">
                                  {count} training {count === 1 ? 'day' : 'days'} • {totalAthletesInMonth} total {totalAthletesInMonth === 1 ? 'session' : 'sessions'}
                                </span>
                              </div>
                            </div>
                            <Badge variant="secondary" className="font-semibold text-base flex-shrink-0 px-3 py-1">
                              {count}
                            </Badge>
                          </button>
                          
                          {isExpanded && (
                            <div className="bg-muted/20 px-4 py-4 border-t-2 border-border">
                              <div className="space-y-3">
                                {Object.entries(sessionsByDate).map(([date, athletesList]) => {
                                  const dateObj = new Date(date);
                                  const dayName = dateObj.toLocaleDateString('default', { weekday: 'long' });
                                  const dayNum = dateObj.getDate();
                                  const athleteCount = athletesList.length;
                                  
                                  // Group athletes by shift
                                  const byShift: Record<string, typeof athletesList> = {};
                                  athletesList.forEach(athlete => {
                                    const shift = athlete.shift || 'No shift';
                                    if (!byShift[shift]) byShift[shift] = [];
                                    byShift[shift].push(athlete);
                                  });

                                  // Shift color mapping
                                  const shiftColors: Record<string, {bg: string, text: string, border: string}> = {
                                    'Morning': {bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800'},
                                    'Afternoon': {bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800'},
                                    'Evening': {bg: 'bg-purple-50 dark:bg-purple-950/30', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800'},
                                    'No shift': {bg: 'bg-muted/50', text: 'text-muted-foreground', border: 'border-border'}
                                  };
                                  
                                  return (
                                    <div key={date} className="border-2 border-border/50 rounded-lg overflow-hidden bg-card hover:shadow-md transition-shadow">
                                      {/* Date Header */}
                                      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary/10 to-primary/5 border-b-2 border-border/50">
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                          <div className="bg-primary/15 p-2 rounded-lg flex-shrink-0">
                                            <Calendar className="h-4 w-4 text-primary" />
                                          </div>
                                          <div className="min-w-0">
                                            <div className="text-base font-semibold text-foreground">{dayName}, {monthName} {dayNum}</div>
                                            <div className="text-sm text-muted-foreground">{date}</div>
                                          </div>
                                        </div>
                                        <Badge variant="default" className="text-sm font-medium flex-shrink-0">
                                          {athleteCount} {athleteCount === 1 ? 'athlete' : 'athletes'}
                                        </Badge>
                                      </div>
                                      
                                      {/* Athletes List grouped by shift */}
                                      <div className="p-4 space-y-3">
                                        {Object.entries(byShift).map(([shift, shiftAthletes]) => {
                                          const colors = shiftColors[shift] || shiftColors['No shift'];
                                          return (
                                            <div key={shift} className="space-y-2">
                                              <div className={`text-sm font-bold ${colors.text} flex items-center gap-2 px-2`}>
                                                <Clock className="h-4 w-4" />
                                                {shift} - {shiftAthletes.length} {shiftAthletes.length === 1 ? 'athlete' : 'athletes'}
                                              </div>
                                              <div className="space-y-2 pl-2">
                                                {shiftAthletes.map((athlete, idx) => (
                                                  <div 
                                                    key={`${athlete.athleteId}-${idx}`}
                                                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 px-4 py-3 rounded-lg bg-card border-2 border-border hover:border-primary/50 hover:shadow-sm transition-all"
                                                  >
                                                    <div className="flex items-center gap-3 flex-1">
                                                      <div className="bg-primary/15 p-2 rounded-full flex-shrink-0">
                                                        <User className="h-4 w-4 text-primary" />
                                                      </div>
                                                      <span 
                                                        className="text-xs font-medium text-foreground leading-snug" 
                                                        title={athlete.athleteName}
                                                      >
                                                        {athlete.athleteName}
                                                      </span>
                                                    </div>
                                                    {athlete.beachLocation && (
                                                      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-md flex-shrink-0 max-w-[140px] overflow-hidden">
                                                        <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                                                        <span className="font-medium truncate" title={athlete.beachLocation}>{athlete.beachLocation}</span>
                                                      </div>
                                                    )}
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
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