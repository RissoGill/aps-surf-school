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
  const [attendanceStatus, setAttendanceStatus] = useState("Present");
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
    }
    setSearchQuery("");
    setShowDropdown(false);
  };

  const handleRemoveAthlete = (athleteId: string) => {
    setSelectedAthletes(selectedAthletes.filter(id => id !== athleteId));
  };

  const handleSelectAll = () => {
    setSelectedAthletes(athletes.map(a => a.athlete_id));
    setShowDropdown(false);
  };

  const handleClearAll = () => {
    setSelectedAthletes([]);
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

    if (!attendanceStatus) {
      toast({
        title: "Status Required",
        description: "Please select an attendance status.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Check pack tokens for Pack athletes before creating records
      const packAthletes = selectedAthletes.filter(id => {
        const athlete = athletes.find(a => a.athlete_id === id);
        return athlete?.plan_type === 'Pack';
      });

      if (packAthletes.length > 0) {
        const { data: packs, error: packsError } = await supabase
          .from('packs')
          .select('athlete_id, total_tokens, used_tokens')
          .in('athlete_id', packAthletes)
          .eq('active', true);

        if (packsError) throw packsError;

        const insufficientTokens: string[] = [];
        packAthletes.forEach(athleteId => {
          const pack = packs?.find(p => p.athlete_id === athleteId);
          if (!pack) {
            insufficientTokens.push(athleteId);
            return;
          }
          const remaining = parseInt(pack.total_tokens || '0') - parseInt(pack.used_tokens || '0');
          if (remaining <= 0) {
            insufficientTokens.push(athleteId);
          }
        });

        if (insufficientTokens.length > 0) {
          const names = insufficientTokens.map(id => getAthleteName(id)).join(', ');
          toast({
            title: "Insufficient Pack Tokens",
            description: `The following athletes don't have pack tokens: ${names}`,
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
      }

      // Create attendance records for all selected athletes
      const attendancePromises = selectedAthletes.map(async (athleteId) => {
        const record = {
          id: `${athleteId}-${selectedDate}-${Date.now()}-${Math.random()}`,
          athlete_id: athleteId,
          date: selectedDate,
          status: attendanceStatus,
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

        // Increment pack tokens if Pack athlete
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
          <CardTitle>Register Attendance</CardTitle>
        </div>
        <CardDescription>
          Quickly mark attendance for multiple athletes at once
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Date Picker */}
          <div className="space-y-2">
            <Label htmlFor="training-date" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Select Training Date
            </Label>
            <Input
              id="training-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          {/* Status Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="attendance-status">Status</Label>
            <Select value={attendanceStatus} onValueChange={setAttendanceStatus}>
              <SelectTrigger id="attendance-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Present">Present</SelectItem>
                <SelectItem value="Absent">Absent</SelectItem>
                <SelectItem value="Justified">Justified</SelectItem>
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

          {/* Selected Athletes */}
          {selectedAthletes.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedAthletes.map((athleteId) => (
                <Badge key={athleteId} variant="secondary" className="flex items-center gap-1">
                  {getAthleteName(athleteId)}
                  <button
                    type="button"
                    onClick={() => handleRemoveAthlete(athleteId)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="h-6 px-2 text-xs"
              >
                Clear All
              </Button>
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
