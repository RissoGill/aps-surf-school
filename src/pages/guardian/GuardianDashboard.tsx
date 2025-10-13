import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, CreditCard, AlertCircle, CheckCircle, Loader2, Calendar, Image as ImageIcon, Video, Play, Download } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import AppHeader from "@/components/shared/AppHeader";
import SponsorBanner from "@/components/shared/SponsorBanner";
import AppFooter from "@/components/shared/AppFooter";
import { AnnualAttendanceSummary } from "@/components/coach/AnnualAttendanceSummary";

interface AttendanceRecord {
  Id: string;
  Date: string | null;
  status: string | null;
  trainer: string | null;
  beach_location: string | null;
  notes: string | null;
  photos: string[] | null;
  videos: string[] | null;
}

const AttendanceTab = ({ athleteId }: { athleteId: string }) => {
  const { data: attendanceRecords = [], isLoading } = useQuery({
    queryKey: ['guardian-attendance', athleteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Attendance')
        .select('*')
        .eq('athlete_id', athleteId)
        .order('date', { ascending: false });
      
      if (error) throw error;
      
      // Filter: only records with status and from September 2025 onwards
      const filteredData = (data || []).filter((record: any) => {
        if (!record.status) return false;
        if (!record.date) return false;
        const recordDate = new Date(record.date);
        const septemberCutoff = new Date('2025-09-01');
        return recordDate >= septemberCutoff;
      });
      
      return filteredData.map((record: any) => ({
        Id: record.id,
        Date: record.date,
        status: record.status,
        trainer: record.trainer,
        beach_location: record.beach_location,
        notes: record.notes,
        photos: record.photos,
        videos: record.videos,
      })) as AttendanceRecord[];
    },
  });

  const getStatusColor = (status: string | null) => {
    if (!status) return "bg-secondary/10 text-secondary-foreground";
    const normalizedStatus = status.toLowerCase();
    if (normalizedStatus.includes("present")) return "bg-success/10 text-success";
    if (normalizedStatus.includes("late")) return "bg-warning/10 text-warning";
    if (normalizedStatus.includes("absent")) return "bg-destructive/10 text-destructive";
    return "bg-secondary/10 text-secondary-foreground";
  };

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Attendance Records
        </CardTitle>
        <CardDescription>Training session attendance history (from September 2025)</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
          </div>
        ) : attendanceRecords.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No attendance records found
          </p>
        ) : (
          <div className="space-y-3">
            {attendanceRecords.map((record) => {
              const formattedDate = record.Date 
                ? new Date(record.Date).toLocaleDateString('pt-PT', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })
                : '-';
              
              return (
                <div key={record.Id} className="border border-border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{formattedDate}</p>
                    <Badge className={getStatusColor(record.status)}>
                      {record.status || 'Unknown'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                    {record.trainer && (
                      <div>
                        <span className="font-medium">Trainer:</span> {record.trainer}
                      </div>
                    )}
                    {record.beach_location && (
                      <div>
                        <span className="font-medium">Beach:</span> {record.beach_location}
                      </div>
                    )}
                    {record.notes && (
                      <div className="col-span-2">
                        <span className="font-medium">Notes:</span> {record.notes}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const AnnualAttendanceSummaryWrapper = ({ athleteId }: { athleteId: string }) => {
  const { data: attendanceRecords = [] } = useQuery({
    queryKey: ['guardian-annual-attendance', athleteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Attendance')
        .select('*')
        .eq('athlete_id', athleteId)
        .order('date', { ascending: false });
      
      if (error) throw error;
      
      return (data || [])
        .filter((record: any) => record.status)
        .map((record: any) => ({
          id: record.id,
          date: record.date,
          status: record.status,
          trainer: record.trainer,
          beach_location: record.beach_location,
          notes: record.notes,
        }));
    },
  });

  if (attendanceRecords.length === 0) return null;

  return <AnnualAttendanceSummary attendance={attendanceRecords} />;
};

const MediaTab = ({ athleteId }: { athleteId: string }) => {
  const { data: attendanceRecords = [], isLoading } = useQuery({
    queryKey: ['guardian-media', athleteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Attendance')
        .select('*')
        .eq('athlete_id', athleteId)
        .order('date', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map((record: any) => ({
        Id: record.id,
        Date: record.date,
        status: record.status,
        trainer: record.trainer,
        beach_location: record.beach_location,
        notes: record.notes,
        photos: record.photos,
        videos: record.videos,
      })) as AttendanceRecord[];
    },
  });

  const allPhotos: Array<{ url: string; date: string | null; trainer: string | null }> = [];
  const allVideos: Array<{ url: string; date: string | null; trainer: string | null }> = [];
  
  attendanceRecords.forEach(record => {
    if (record.photos && Array.isArray(record.photos)) {
      record.photos.forEach(url => {
        allPhotos.push({ url, date: record.Date, trainer: record.trainer });
      });
    }
    if (record.videos && Array.isArray(record.videos)) {
      record.videos.forEach(url => {
        allVideos.push({ url, date: record.Date, trainer: record.trainer });
      });
    }
  });

  const hasMedia = allPhotos.length > 0 || allVideos.length > 0;

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Photos & Videos
        </CardTitle>
        <CardDescription>Media from training sessions</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 w-full bg-secondary/10 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : !hasMedia ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No photos or videos yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Coaches will upload media from training sessions
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
        )}
      </CardContent>
    </Card>
  );
};

const GuardianDashboard = () => {
  const { toast } = useToast();
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedRecentMonth, setSelectedRecentMonth] = useState<string | null>(null);
  const [guardianId, setGuardianId] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('guardianSession');
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
    navigate("/login/guardian");
  };

  // Check authentication from localStorage
  useEffect(() => {
    const checkAuth = async () => {
      const guardianSessionStr = localStorage.getItem('guardianSession');
      
      if (!guardianSessionStr) {
        navigate("/login/guardian");
        return;
      }
      
      try {
        const guardianSession = JSON.parse(guardianSessionStr);
        let athleteId: string | null = guardianSession.athlete_id || null;

        // Fallback: derive athlete_id from Users table if missing
        if (!athleteId) {
          const identifier = (guardianSession.guardian_id || guardianSession.email || '').trim();
          const candidateIds = identifier.includes('@') ? [identifier] : [identifier, `${identifier}@aps.com`];
          const { data: userRec, error } = await supabase
            .from('Users')
            .select('athlete_id')
            .in('guardian_id', candidateIds)
            .maybeSingle();
          if (!error && userRec?.athlete_id) athleteId = userRec.athlete_id;
        }
        
        if (!athleteId) {
          toast({
            title: "Error",
            description: "No athlete linked to this guardian account",
            variant: "destructive",
          });
          return;
        }
        
        // Use the athlete_id directly for queries
        setGuardianId(athleteId);
      } catch (error) {
        console.error('Error parsing guardian session:', error);
        navigate("/login/guardian");
      }
    };

    checkAuth();
  }, [navigate, toast]);

  // Fetch athletes linked to this guardian (using athlete_id from session)
  const { data: athletes, isLoading: athletesLoading } = useQuery({
    queryKey: ['guardian-athletes', guardianId],
    queryFn: async () => {
      if (!guardianId) {
        console.log('No guardianId (athlete_id) available for query');
        return [];
      }
      
      console.log('Fetching athlete for athlete_id:', guardianId);
      
      const { data, error } = await supabase
        .from('Atletas')
        .select('*')
        .eq('athlete_id', guardianId);
      
      console.log('Athletes query result:', { data, error });
      
      if (error) {
        console.error('Error fetching athletes:', error);
        toast({
          title: "Error",
          description: "Failed to load athlete data",
          variant: "destructive",
        });
        throw error;
      }
      
      console.log('Athletes loaded:', data?.length || 0);
      return data || [];
    },
    enabled: !!guardianId,
  });

  // Fetch payments for all guardian's athletes
  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ['guardian-payments', athletes],
    queryFn: async () => {
      if (!athletes || athletes.length === 0) return [];
      
      const athleteIds = athletes.map(a => a.athlete_id);
      
      const { data, error } = await supabase
        .from('Payments')
        .select('*')
        .in('athlete_id', athleteIds)
        .order('year', { ascending: false })
        .order('month', { ascending: false });
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to load payment data",
          variant: "destructive",
        });
        throw error;
      }
      
      return data || [];
    },
    enabled: !!athletes && athletes.length > 0,
  });

  // Filter payments by selected year if set
  const filteredPayments = selectedYear 
    ? payments?.filter(p => p.year === selectedYear) 
    : payments;

  // Get unique years for filtering
  const availableYears = Array.from(new Set(payments?.map(p => p.year) || [])).sort((a, b) => b - a);

  const getPaymentStatus = (payment: any) => {
    if (payment.status?.toLowerCase() === "paid" || payment.amount_paid >= payment.amount_due) {
      return { status: "Paid", color: "bg-success/10 text-success", icon: CheckCircle };
    } else if (payment.amount_paid > 0 && payment.amount_paid < payment.amount_due) {
      return { status: "Partial", color: "bg-warning/10 text-warning", icon: AlertCircle };
    } else {
      return { status: "Pending", color: "bg-destructive/10 text-destructive", icon: AlertCircle };
    }
  };

  // Calculate totals - outstanding only includes previous and current months
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12

  const pastAndCurrentPayments = filteredPayments?.filter(p => {
    const paymentYear = p.year || 0;
    const paymentMonth = parseInt(p.month) || 0;
    
    // Include if year is less than current, or same year but month <= current
    if (paymentYear < currentYear) return true;
    if (paymentYear === currentYear && paymentMonth <= currentMonth) return true;
    return false;
  }) || [];

  // Find next payment (unpaid or partial payment from current or future months)
  const nextPayment = filteredPayments?.find(p => {
    const paymentYear = p.year || 0;
    const paymentMonth = parseInt(p.month) || 0;
    const isPaid = p.status?.toLowerCase() === "paid" || (p.amount_paid >= p.amount_due);
    
    // Look for unpaid/partial payments from current month onwards
    if (paymentYear > currentYear) return !isPaid;
    if (paymentYear === currentYear && paymentMonth >= currentMonth) return !isPaid;
    return false;
  });

  const nextPaymentAmount = nextPayment?.amount_due || 0;
  const totalPaid = filteredPayments?.reduce((sum, p) => sum + (p.amount_paid || 0), 0) || 0;
  
  // Outstanding only from past and current months
  const outstandingDue = pastAndCurrentPayments.reduce((sum, p) => sum + (p.amount_due || 0), 0);
  const outstandingPaid = pastAndCurrentPayments.reduce((sum, p) => sum + (p.amount_paid || 0), 0);
  const totalOutstanding = outstandingDue - outstandingPaid;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const getMonthName = (monthStr: string) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return months[parseInt(monthStr) - 1] || monthStr;
  };

  // Get available months from payments for Recent Payments filter
  const availableMonths = Array.from(
    new Set(
      payments?.map(p => `${p.year}-${String(p.month).padStart(2, '0')}`) || []
    )
  ).sort((a, b) => b.localeCompare(a)); // Sort descending (newest first)

  // Default to current month if not selected
  const currentMonthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
  const effectiveRecentMonth = selectedRecentMonth || currentMonthKey;

  // Filter recent payments by selected month
  const recentPayments = payments?.filter(p => {
    const paymentKey = `${p.year}-${String(p.month).padStart(2, '0')}`;
    return paymentKey === effectiveRecentMonth;
  }) || [];

  const isLoading = athletesLoading;
  const athlete = athletes?.[0]; // For now, display first athlete

  console.log('Guardian Dashboard State:', {
    isLoading,
    athletesLoading,
    paymentsLoading,
    guardianId,
    athletesCount: athletes?.length || 0,
    athlete: athlete ? 'exists' : 'null'
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-surface flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!guardianId || !athlete) {
    console.log('Showing error state:', { guardianId, hasAthlete: !!athlete });
    return (
      <div className="min-h-screen bg-gradient-surface">
        <AppHeader title="Guardian Dashboard" showBack backTo="/" />
        <main className="mobile-container py-6">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground mb-4">
                {!guardianId 
                  ? "Guardian profile not found. Please contact administration."
                  : "No athletes linked to your account."}
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Debug: guardianId={guardianId || 'null'}, athletes={athletes?.length || 0}
              </p>
              <Button onClick={() => navigate("/login/guardian")}>Back to Login</Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-surface">
      <AppHeader title="Guardian Dashboard" showBack backTo="/" />
      
      <main className="mobile-container py-6">
        {/* Logout Button */}
        <div className="mb-4 flex justify-end">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleLogout}
            className="touch-friendly"
          >
            Logout
          </Button>
        </div>

        {/* Child Info Header */}
        <Card className="shadow-medium mb-6">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-warning" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                {athlete.first_name} {athlete.last_name}
              </h2>
              <Badge className="bg-primary/10 text-primary mb-2">
                {athlete.surf_level || 'Beginner'} Level
              </Badge>
              <p className="text-sm text-muted-foreground">
                {athlete.trainings_per_week || 0} sessions per week
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tabs Navigation */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="payments" className="text-xs">Payments</TabsTrigger>
            <TabsTrigger value="attendance" className="text-xs">Attendance</TabsTrigger>
            <TabsTrigger value="media" className="text-xs">Media</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="text-lg">Payment Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-accent/50 rounded-lg">
                    <p className="text-lg font-bold text-foreground">{formatCurrency(nextPaymentAmount)}</p>
                    <p className="text-xs text-muted-foreground">Next Payment</p>
                  </div>
                  <div className="p-3 bg-success/10 rounded-lg">
                    <p className="text-lg font-bold text-success">{formatCurrency(totalPaid)}</p>
                    <p className="text-xs text-muted-foreground">Total Paid</p>
                  </div>
                  <div className="p-3 bg-destructive/10 rounded-lg">
                    <p className="text-lg font-bold text-destructive">{formatCurrency(totalOutstanding)}</p>
                    <p className="text-xs text-muted-foreground">Outstanding</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Recent Payments</CardTitle>
                  <select
                    className="text-sm border rounded px-2 py-1"
                    value={effectiveRecentMonth}
                    onChange={(e) => setSelectedRecentMonth(e.target.value)}
                  >
                    {availableMonths.map(monthKey => {
                      const [year, month] = monthKey.split('-');
                      return (
                        <option key={monthKey} value={monthKey}>
                          {getMonthName(month)} {year}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentPayments.map((payment) => {
                    const statusInfo = getPaymentStatus(payment);
                    const StatusIcon = statusInfo.icon;
                    
                    return (
                      <div key={payment.payment_id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div>
                          <p className="font-medium">{getMonthName(payment.month)} {payment.year}</p>
                          <p className="text-sm text-muted-foreground">{formatCurrency(payment.amount_due)}</p>
                        </div>
                        <Badge className={statusInfo.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusInfo.status}
                        </Badge>
                      </div>
                    );
                  })}
                  {recentPayments.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No payment records found for this month</p>
                  )}
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
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-3 bg-accent/50 rounded-lg">
                    <p className="text-lg font-bold text-foreground">{formatCurrency(nextPaymentAmount)}</p>
                    <p className="text-xs text-muted-foreground">Next Payment</p>
                  </div>
                  <div className="text-center p-3 bg-success/10 rounded-lg">
                    <p className="text-lg font-bold text-success">{formatCurrency(totalPaid)}</p>
                    <p className="text-xs text-muted-foreground">Total Paid</p>
                  </div>
                  <div className="text-center p-3 bg-destructive/10 rounded-lg">
                    <p className="text-lg font-bold text-destructive">{formatCurrency(totalOutstanding)}</p>
                    <p className="text-xs text-muted-foreground">Outstanding</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Payment History</CardTitle>
                  <select
                    className="text-sm border rounded px-2 py-1"
                    value={selectedYear || ''}
                    onChange={(e) => setSelectedYear(e.target.value ? parseInt(e.target.value) : null)}
                  >
                    <option value="">All Years</option>
                    {availableYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <CardDescription>All payment records sorted by date</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredPayments?.map((payment) => {
                    const statusInfo = getPaymentStatus(payment);
                    const StatusIcon = statusInfo.icon;
                    
                    return (
                      <div 
                        key={payment.payment_id} 
                        className="p-4 border rounded-lg border-border"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{getMonthName(payment.month)} {payment.year}</h4>
                          <Badge className={statusInfo.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusInfo.status}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Amount Due: <span className="font-medium">{formatCurrency(payment.amount_due)}</span></p>
                          <p>Amount Paid: <span className="font-medium text-success">{formatCurrency(payment.amount_paid || 0)}</span></p>
                          {payment.payment_date && (
                            <p>Payment Date: <span className="font-medium">{payment.payment_date}</span></p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {(!filteredPayments || filteredPayments.length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-4">No payment records found</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance" className="space-y-4">
            <AttendanceTab athleteId={athlete.athlete_id} />
            <AnnualAttendanceSummaryWrapper athleteId={athlete.athlete_id} />
          </TabsContent>

          {/* Media Tab */}
          <TabsContent value="media" className="space-y-4">
            <MediaTab athleteId={athlete.athlete_id} />
          </TabsContent>
        </Tabs>
      </main>

      <SponsorBanner />
      <AppFooter />
    </div>
  );
};

export default GuardianDashboard;