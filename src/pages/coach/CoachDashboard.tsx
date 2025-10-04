import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, User, Calendar, Plus, MapPin } from "lucide-react";
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

interface AttendanceRecord {
  Id: string;
  Date: string | null;
  status: string | null;
  treinador: string | null;
  praia: string | null;
  notas: string | null;
}

interface Athlete {
  Athlete_Id: string;
  first_name: string | null;
  last_name: string | null;
  surf_level: string | null;
  training_days: string | null;
  attendance: AttendanceRecord[];
}

const CoachDashboard = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);
  const [newAttendance, setNewAttendance] = useState({
    date: new Date().toISOString().split('T')[0],
    status: "",
    treinador: "",
    praia: "",
    notas: ""
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: athletes, isLoading } = useQuery({
    queryKey: ['athletes-with-attendance'],
    queryFn: async () => {
      const { data: athletesData, error: athletesError } = await supabase
        .from('Atletas')
        .select('Athlete_Id, first_name, last_name, surf_level, training_days')
        .order('first_name', { ascending: true });
      
      if (athletesError) throw athletesError;

      const { data: attendanceData, error: attendanceError } = await supabase
        .from('Attendance')
        .select('*')
        .order('Date', { ascending: false });

      if (attendanceError) throw attendanceError;

      const athletesWithAttendance = athletesData.map(athlete => ({
        ...athlete,
        attendance: attendanceData.filter(att => att.Athlete_id === athlete.Athlete_Id)
      }));

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

    const { error } = await supabase
      .from('Attendance')
      .insert({
        Athlete_id: selectedAthleteId,
        Date: newAttendance.date,
        status: newAttendance.status,
        treinador: newAttendance.treinador,
        praia: newAttendance.praia,
        notas: newAttendance.notas,
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save attendance",
        variant: "destructive",
      });
      return;
    }

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
    queryClient.invalidateQueries({ queryKey: ['athletes-with-attendance'] });
  };

  const filteredAthletes = useMemo(() => {
    if (!athletes) return [];
    if (!searchQuery) return athletes;
    
    return athletes.filter(athlete => {
      const fullName = `${athlete.first_name} ${athlete.last_name}`.toLowerCase();
      return fullName.includes(searchQuery.toLowerCase());
    });
  }, [athletes, searchQuery]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Beginner": return "bg-warning/10 text-warning";
      case "Intermediate": return "bg-primary/10 text-primary";
      case "Advanced": return "bg-success/10 text-success";
      default: return "bg-secondary/10 text-secondary-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-surface">
      <AppHeader title="Coach Dashboard" showBack backTo="/" />
      
      <main className="mobile-container py-6">
        {/* Welcome Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Welcome Back, Coach
          </h2>
          <p className="text-muted-foreground">
            Manage your athletes and track their progress
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search athletes by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 touch-friendly shadow-soft"
          />
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

        {/* Athletes List */}
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
                  <Collapsible key={athlete.Athlete_Id} className="border-b border-border last:border-b-0">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-medium text-foreground mb-1">
                            {athlete.first_name} {athlete.last_name}
                          </h3>
                          {athlete.training_days && (
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {athlete.training_days}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {athlete.surf_level && (
                            <Badge className={`${getLevelColor(athlete.surf_level)}`}>
                              {athlete.surf_level}
                            </Badge>
                          )}
                          <Dialog open={isDialogOpen && selectedAthleteId === athlete.Athlete_Id} onOpenChange={(open) => {
                            setIsDialogOpen(open);
                            if (open) setSelectedAthleteId(athlete.Athlete_Id);
                          }}>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline">
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
                                <Button onClick={handleSaveAttendance} className="w-full">
                                  Save Attendance
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>

                      {athlete.attendance.length > 0 && (
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="w-full mt-2">
                            <span className="text-sm text-muted-foreground">
                              {athlete.attendance.length} attendance record(s) - Click to expand
                            </span>
                          </Button>
                        </CollapsibleTrigger>
                      )}

                      <CollapsibleContent>
                        <div className="mt-3 space-y-2">
                          {athlete.attendance.map((record) => (
                            <Card key={record.Id} className="bg-accent/30">
                              <CardContent className="p-3">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Date:</span>
                                    <p className="font-medium">{record.Date || '-'}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Status:</span>
                                    <p className="font-medium">{record.status || '-'}</p>
                                  </div>
                                  {record.treinador && (
                                    <div>
                                      <span className="text-muted-foreground">Trainer:</span>
                                      <p className="font-medium">{record.treinador}</p>
                                    </div>
                                  )}
                                  {record.praia && (
                                    <div className="flex items-start gap-1">
                                      <MapPin className="h-3 w-3 mt-0.5 text-muted-foreground" />
                                      <div>
                                        <span className="text-muted-foreground">Beach:</span>
                                        <p className="font-medium">{record.praia}</p>
                                      </div>
                                    </div>
                                  )}
                                  {record.notas && (
                                    <div className="col-span-2">
                                      <span className="text-muted-foreground">Notes:</span>
                                      <p className="font-medium">{record.notas}</p>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <SponsorBanner />
      <AppFooter />
    </div>
  );
};

export default CoachDashboard;