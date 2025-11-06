import { useState } from "react";
import { Calendar, CheckSquare, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface BulkAttendanceRegistrationProps {
  coachId: string;
}

export const BulkAttendanceRegistration = ({ coachId }: BulkAttendanceRegistrationProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>([]);
  const [athleteStatuses, setAthleteStatuses] = useState<Record<string, string>>({});
  const [selectedShift, setSelectedShift] = useState("Morning");
  const [beachLocation, setBeachLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  // Fetch all athletes
  const { data: athletes = [] } = useQuery({
    queryKey: ['athletes-for-bulk'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('atletas')
        .select('athlete_id, first_name, last_name, plan_type')
        .order('first_name', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Filter athletes based on search
  const filteredAthletes = athletes.filter(athlete => {
    const fullName = `${athlete.first_name || ''} ${athlete.last_name || ''}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  const handleAddAthlete = (athleteId: string) => {
    if (!selectedAthletes.includes(athleteId)) {
      setSelectedAthletes([...selectedAthletes, athleteId]);
      setAthleteStatuses(prev => ({ ...prev, [athleteId]: "Present" }));
    }
    setSearchQuery("");
    setShowDropdown(false);
  };

  const handleRemoveAthlete = (athleteId: string) => {
    setSelectedAthletes(selectedAthletes.filter(id => id !== athleteId));
    setAthleteStatuses(prev => {
      const newStatuses = { ...prev };
      delete newStatuses[athleteId];
      return newStatuses;
    });
  };

  const handleSelectAll = () => {
    const allAthleteIds = athletes.map(a => a.athlete_id);
    setSelectedAthletes(allAthleteIds);
    const newStatuses: Record<string, string> = {};
    allAthleteIds.forEach(id => {
      newStatuses[id] = "Present";
    });
    setAthleteStatuses(newStatuses);
    setShowDropdown(false);
  };

  const handleClearAll = () => {
    setSelectedAthletes([]);
    setAthleteStatuses({});
  };

  const handleStatusChange = (athleteId: string, status: string) => {
    setAthleteStatuses(prev => ({ ...prev, [athleteId]: status }));
  };

  const getAthleteName = (athleteId: string) => {
    const athlete = athletes.find(a => a.athlete_id === athleteId);
    return athlete ? `${athlete.first_name || ''} ${athlete.last_name || ''}`.trim() : athleteId;
  };

  const handleMarkAttendance = async () => {
    if (selectedAthletes.length === 0) {
      toast({
        title: "No Athletes Selected",
        description: "Please select at least one athlete.",
        variant: "destructive",
      });
      return;
    }


    if (!selectedShift) {
      toast({
        title: "Shift Required",
        description: "Please select a shift (Morning or Afternoon).",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Check for duplicate attendance records (same date and shift)
      const { data: existingRecords, error: duplicateCheckError } = await supabase
        .from('attendance')
        .select('athlete_id')
        .in('athlete_id', selectedAthletes)
        .eq('date', selectedDate)
        .eq('shift', selectedShift);

      if (duplicateCheckError) {
        console.error('Error checking duplicates:', duplicateCheckError);
      }

      if (existingRecords && existingRecords.length > 0) {
        const duplicateAthleteIds = existingRecords.map(r => r.athlete_id);
        const duplicateNames = duplicateAthleteIds.map(id => getAthleteName(id)).join(', ');
        
        toast({
          title: "Duplicate Attendance",
          description: `Attendance for this athlete and shift already exists on this date. Athletes: ${duplicateNames}`,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Get athletes with pack plans (no longer blocking, just tracking)
      const packAthletes = selectedAthletes.filter(id => {
        const athlete = athletes.find(a => a.athlete_id === id);
        return athlete?.plan_type === 'Pack';
      });

      // Create attendance records for all selected athletes
      const attendancePromises = selectedAthletes.map(async (athleteId) => {
        const record = {
          id: `${athleteId}-${selectedDate}-${Date.now()}-${Math.random()}`,
          athlete_id: athleteId,
          date: selectedDate,
          status: athleteStatuses[athleteId] || "Present",
          shift: selectedShift,
          coach_id: coachId,
          beach_location: beachLocation || null,
          notes: notes || null,
          photos: null,
          videos: null,
        };

        // Try direct insert first
        const { error: insertError } = await supabase.from('attendance').insert(record);

        if (insertError) {
          // Fallback to edge function for RLS bypass
          const resp = await fetch(`https://bzzzecvzoahauqrhkvds.supabase.co/functions/v1/attendance-admin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(record),
          });
          if (!resp.ok) {
            throw new Error(`Failed to save attendance for ${getAthleteName(athleteId)}`);
          }
        }

        // Increment pack tokens if Pack athlete (allow negative balance)
        const athlete = athletes.find(a => a.athlete_id === athleteId);
        if (athlete?.plan_type === 'Pack') {
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
      });

      await Promise.all(attendancePromises);

      toast({
        title: "Success",
        description: `Attendance marked for ${selectedAthletes.length} athlete(s)`,
      });

      // Clear selections
      setSelectedAthletes([]);
      setAthleteStatuses({});
      setBeachLocation("");
      setNotes("");
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['athletes-with-attendance'] });
      
    } catch (error: any) {
      console.error('Error marking attendance:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to mark attendance. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CheckSquare className="h-5 w-5 text-primary" />
          <CardTitle>Bulk Attendance Registration</CardTitle>
        </div>
        <CardDescription>
          Quickly mark attendance for multiple athletes at once
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Date Picker */}
          <div className="space-y-2">
            <Label htmlFor="training-date">Training Date</Label>
            <Input
              id="training-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Shift Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="training-shift">Shift</Label>
            <Select value={selectedShift} onValueChange={setSelectedShift}>
              <SelectTrigger id="training-shift">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Morning">Morning</SelectItem>
                <SelectItem value="Afternoon">Afternoon</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Athletes Multi-Select */}
        <div className="space-y-2">
          <Label htmlFor="athletes-search">Select Athletes</Label>
          <div className="relative">
            <Input
              id="athletes-search"
              type="text"
              placeholder="Search athletes..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
            />
            
            {/* Dropdown */}
            {showDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-y-auto">
                <div className="p-2 border-b flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                    className="flex-1"
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDropdown(false)}
                    className="flex-1"
                  >
                    Close
                  </Button>
                </div>
                <div className="p-1">
                  {filteredAthletes.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">No athletes found</div>
                  ) : (
                    filteredAthletes.map((athlete) => (
                      <button
                        key={athlete.athlete_id}
                        type="button"
                        onClick={() => handleAddAthlete(athlete.athlete_id)}
                        className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent hover:text-accent-foreground"
                        disabled={selectedAthletes.includes(athlete.athlete_id)}
                      >
                        {athlete.first_name} {athlete.last_name}
                        {selectedAthletes.includes(athlete.athlete_id) && (
                          <span className="ml-2 text-xs text-muted-foreground">(selected)</span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Selected Athletes with Status */}
          {selectedAthletes.length > 0 && (
            <div className="space-y-3 mt-4">
              <div className="flex items-center justify-between">
                <Label>Selected Athletes ({selectedAthletes.length})</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="h-8 px-3 text-xs"
                >
                  Clear All
                </Button>
              </div>
              <div className="space-y-2">
                {selectedAthletes.map((athleteId) => (
                  <div key={athleteId} className="flex items-center gap-3 p-3 border rounded-lg bg-card">
                    <div className="flex-1 font-medium">
                      {getAthleteName(athleteId)}
                    </div>
                    <Select 
                      value={athleteStatuses[athleteId] || "Present"} 
                      onValueChange={(value) => handleStatusChange(athleteId, value)}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Present">Present</SelectItem>
                        <SelectItem value="Absent">Absent</SelectItem>
                        <SelectItem value="Justified">Justified</SelectItem>
                      </SelectContent>
                    </Select>
                    <button
                      type="button"
                      onClick={() => handleRemoveAthlete(athleteId)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Beach Location */}
        <div className="space-y-2">
          <Label htmlFor="beach-location">Beach Location (Optional)</Label>
          <Input
            id="beach-location"
            type="text"
            placeholder="e.g., Praia Grande"
            value={beachLocation}
            onChange={(e) => setBeachLocation(e.target.value)}
          />
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="bulk-notes">Notes (Optional)</Label>
          <Textarea
            id="bulk-notes"
            placeholder="Add notes that apply to all selected athletes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleMarkAttendance}
            disabled={isSubmitting || selectedAthletes.length === 0}
            className="flex-1"
          >
            {isSubmitting ? "Saving..." : `Mark Attendance (${selectedAthletes.length})`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
