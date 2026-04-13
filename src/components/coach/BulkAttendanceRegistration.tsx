import { useState } from "react";
import { Calendar, CheckSquare, X, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";

interface BulkAttendanceRegistrationProps {
  coachId: string;
}

export const BulkAttendanceRegistration = ({ coachId }: BulkAttendanceRegistrationProps) => {
  const { t } = useLanguage();
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
  const [includeSecondCoach, setIncludeSecondCoach] = useState(false);
  const [secondCoachId, setSecondCoachId] = useState<string>("");

  // Fetch all athletes (including daily_rate for daily plan athletes)
  const { data: athletes = [] } = useQuery({
    queryKey: ['athletes-for-bulk'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('atletas')
        .select('athlete_id, first_name, last_name, plan_type, daily_rate')
        .order('first_name', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch all coaches
  const { data: coaches = [] } = useQuery({
    queryKey: ['coaches-for-bulk'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coach')
        .select('coach_id, first_name, last_name')
        .eq('status', true)
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

  const getCoachName = (coachIdToFind: string) => {
    const coach = coaches.find(c => c.coach_id === coachIdToFind);
    return coach ? `${coach.first_name || ''} ${coach.last_name || ''}`.trim() : coachIdToFind;
  };

  const handleMarkAttendance = async () => {
    if (selectedAthletes.length === 0) {
      toast({
        title: t('coach.bulkAttendance.noAthletesSelected'),
        description: t('coach.bulkAttendance.selectAtLeastOne'),
        variant: "destructive",
      });
      return;
    }


    if (!selectedShift) {
      toast({
        title: t('coach.bulkAttendance.shiftRequired'),
        description: t('coach.bulkAttendance.selectShiftMessage'),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Check for duplicate attendance records (same date and shift) - case-insensitive
      const { data: allRecords, error: duplicateCheckError } = await supabase
        .from('attendance')
        .select('athlete_id, shift')
        .in('athlete_id', selectedAthletes)
        .eq('date', selectedDate)
        .limit(10000);

      if (duplicateCheckError) {
        console.error('Error checking duplicates:', duplicateCheckError);
      }

      // Filter with case-insensitive, trimmed comparison to match database trigger
      const normalizedShift = selectedShift.trim().toLowerCase();
      const existingRecords = allRecords?.filter(r => 
        r.shift?.trim().toLowerCase() === normalizedShift
      ) || [];

      // Build list of duplicates and athletes to insert
      const duplicateAthleteIds = new Set(existingRecords.map(r => r.athlete_id));
      const toInsert = selectedAthletes.filter(id => !duplicateAthleteIds.has(id));

      if (duplicateAthleteIds.size > 0) {
        const duplicateNames = Array.from(duplicateAthleteIds).map(id => getAthleteName(id)).join(', ');
        toast({
          title: t('coach.bulkAttendance.skippingDuplicates'),
          description: t('coach.bulkAttendance.athletesAlreadyHave')
            .replace('{count}', duplicateAthleteIds.size.toString())
            .replace('{names}', duplicateNames),
        });
      }

      if (toInsert.length === 0) {
        toast({
          title: t('coach.bulkAttendance.noAttendanceToMark'),
          description: t('coach.bulkAttendance.allHaveAttendance'),
        });
        setIsSubmitting(false);
        return;
      }

      // Get athletes with pack plans (no longer blocking, just tracking)
      const packAthletes = selectedAthletes.filter(id => {
        const athlete = athletes.find(a => a.athlete_id === id);
        return athlete?.plan_type === 'Pack';
      });

      // Create attendance records for athletes without duplicates
      const attendancePromises = toInsert.map(async (athleteId) => {
        const record = {
          id: `${athleteId}-${selectedDate}-${Date.now()}-${Math.random()}`,
          athlete_id: athleteId,
          date: selectedDate,
          status: athleteStatuses[athleteId] || "Present",
          shift: selectedShift,
          coach_id: coachId,
          beach_location: beachLocation || null,
          notes: includeSecondCoach && secondCoachId 
            ? `${notes || ''}\n[Segundo Treinador: ${getCoachName(secondCoachId)}]`.trim()
            : notes || null,
          photos: null,
          videos: null,
        };

        // Try direct insert first
        const { error: insertError } = await supabase.from('attendance').insert(record);

        if (insertError) {
          // Check if it's a duplicate error
          const errorMsg = insertError.message || '';
          if (errorMsg.includes('Attendance for this athlete and shift already exists on this date') || insertError.code === 'P0001') {
            console.warn(`Duplicate attendance for ${getAthleteName(athleteId)} - skipping`);
            return 0; // Skip this athlete
          }

          // Fallback to edge function for RLS bypass - pass role for legacy auth
          const { data, error: invokeError } = await supabase.functions.invoke('attendance-admin', {
            body: { ...record, role: 'coach', userId: coachId },
          });

          if (invokeError) {
            throw new Error(`Failed to save attendance for ${getAthleteName(athleteId)}: ${invokeError.message}`);
          }

          if (data?.duplicate) {
            console.warn(`Duplicate attendance for ${getAthleteName(athleteId)} - skipping`);
            return 0; // Skip this athlete
          }

          if (!data?.success) {
            throw new Error(`Failed to save attendance for ${getAthleteName(athleteId)}`);
          }
        }

        // Handle plan-specific logic
        const athlete = athletes.find(a => a.athlete_id === athleteId);
        
        // Increment pack tokens if Pack athlete
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
        
        // Create daily payment if daily plan athlete (only if status is Present)
        if (athlete?.plan_type === 'daily' && (athleteStatuses[athleteId] || "Present") === "Present") {
          const dailyRate = Number(athlete.daily_rate) || 35;
          
          // Get next payment ID
          const { data: maxPayment } = await supabase
            .from('payments')
            .select('payment_id')
            .order('payment_id', { ascending: false })
            .limit(1)
            .maybeSingle();

          let nextPaymentNum = 1;
          if (maxPayment?.payment_id) {
            const match = maxPayment.payment_id.match(/PAY(\d+)/);
            if (match) {
              nextPaymentNum = parseInt(match[1]) + 1;
            }
          }

          const paymentId = `PAY${nextPaymentNum}`;
          const date = new Date(selectedDate);
          const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                              'July', 'August', 'September', 'October', 'November', 'December'];

          await supabase.from('payments').insert({
            payment_id: paymentId,
            athlete_id: athleteId,
            month: monthNames[date.getMonth()],
            year: date.getFullYear(),
            amount_due: dailyRate,
            amount_paid: 0,
            status: 'Unpaid',
            plan_type: 'daily',
            notes: `Treino: ${selectedDate}`,
          });
        }

        return 1; // Successfully inserted
      });

      const results = await Promise.all(attendancePromises);
      const successCount = results.filter(r => r === 1).length;
      const skippedCount = toInsert.length - successCount + duplicateAthleteIds.size;

      toast({
        title: t('coach.bulkAttendance.success'),
        description: t('coach.bulkAttendance.markedFor')
          .replace('{count}', successCount.toString())
          .replace('{skipped}', skippedCount.toString()),
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
        title: t('coach.bulkAttendance.error'),
        description: error.message || t('coach.bulkAttendance.failedToMark'),
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
          <h4 className="font-medium text-foreground">{t('coach.bulkAttendance.title')}</h4>
        </div>
        <CardDescription>
          {t('coach.bulkAttendance.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Date Picker */}
          <div className="space-y-2">
            <Label htmlFor="training-date">
              {t('coach.bulkAttendance.trainingDate')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="training-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full"
              required
            />
          </div>

          {/* Shift Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="training-shift">
              {t('coach.bulkAttendance.shift')} <span className="text-destructive">*</span>
            </Label>
            <Select value={selectedShift} onValueChange={setSelectedShift}>
              <SelectTrigger id="training-shift">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Morning">{t('coach.bulkAttendance.morning')}</SelectItem>
                <SelectItem value="Afternoon">{t('coach.bulkAttendance.afternoon')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Second Coach Option */}
        <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="include-second-coach" 
              checked={includeSecondCoach}
              onCheckedChange={(checked) => {
                setIncludeSecondCoach(checked === true);
                if (!checked) setSecondCoachId("");
              }}
            />
            <Label htmlFor="include-second-coach" className="flex items-center gap-2 cursor-pointer">
              <UserPlus className="h-4 w-4" />
              {t('coach.bulkAttendance.includeSecondCoach')}
            </Label>
          </div>
          
          {includeSecondCoach && (
            <div className="space-y-2 mt-3">
              <Label htmlFor="second-coach">{t('coach.bulkAttendance.selectSecondCoach')}</Label>
              <Select value={secondCoachId} onValueChange={setSecondCoachId}>
                <SelectTrigger id="second-coach">
                  <SelectValue placeholder={t('coach.bulkAttendance.selectCoachPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {coaches
                    .filter(coach => coach.coach_id !== coachId)
                    .map((coach) => (
                      <SelectItem key={coach.coach_id} value={coach.coach_id}>
                        {coach.first_name} {coach.last_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Athletes Multi-Select */}
        <div className="space-y-2">
          <Label htmlFor="athletes-search">
            {t('coach.bulkAttendance.selectAthletes')} <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Input
              id="athletes-search"
              type="text"
              placeholder={t('coach.bulkAttendance.searchAthletes')}
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
                    {t('coach.bulkAttendance.selectAll')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDropdown(false)}
                    className="flex-1"
                  >
                    {t('coach.bulkAttendance.close')}
                  </Button>
                </div>
                <div className="p-1">
                  {filteredAthletes.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">{t('coach.bulkAttendance.noAthletesFound')}</div>
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
                          <span className="ml-2 text-xs text-muted-foreground">({t('coach.bulkAttendance.selected')})</span>
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
                <Label className="text-sm">{t('coach.bulkAttendance.selectedAthletes')} ({selectedAthletes.length})</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="h-8 px-3 text-xs"
                >
                  {t('coach.bulkAttendance.clearAll')}
                </Button>
              </div>
              <div className="space-y-2">
                {selectedAthletes.map((athleteId) => (
                  <div key={athleteId} className="flex items-center gap-3 p-3 border rounded-lg bg-card">
                    <div className="flex-1 font-medium text-sm">
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
                        <SelectItem value="Present">{t('coach.bulkAttendance.present')}</SelectItem>
                        <SelectItem value="Absent">{t('coach.bulkAttendance.absent')}</SelectItem>
                        <SelectItem value="Justified">{t('coach.bulkAttendance.justified')}</SelectItem>
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
          <Label htmlFor="beach-location">{t('coach.bulkAttendance.beachLocation')}</Label>
          <Input
            id="beach-location"
            type="text"
            placeholder={t('coach.bulkAttendance.beachPlaceholder')}
            value={beachLocation}
            onChange={(e) => setBeachLocation(e.target.value)}
          />
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="bulk-notes">{t('coach.bulkAttendance.notes')}</Label>
          <Textarea
            id="bulk-notes"
            placeholder={t('coach.bulkAttendance.notesPlaceholder')}
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
            {isSubmitting ? t('coach.bulkAttendance.saving') : `${t('coach.bulkAttendance.markAttendance')} (${selectedAthletes.length})`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
