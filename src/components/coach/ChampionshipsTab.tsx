import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, MapPin, Calendar, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/i18n/LanguageContext";

interface Championship {
  id: number;
  nome_campeonato: string | null;
  categoria: string | null;
  gender: string | null;
  local: string | null;
  data_inicio: string | null;
  data_fim: string | null;
}

interface ChampionshipsTabProps {
  athleteId: string;
  athleteName: string;
}

export const ChampionshipsTab = ({ athleteId, athleteName }: ChampionshipsTabProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [registering, setRegistering] = useState<number | null>(null);
  const [selectedChampionshipId, setSelectedChampionshipId] = useState<string>("");

  // Fetch all championships
  const { data: championships, isLoading: loadingChampionships } = useQuery({
    queryKey: ['championships'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campeonatos')
        .select('*')
        .order('data_inicio', { ascending: true });
      
      if (error) throw error;
      return data as Championship[];
    },
  });

  // Fetch existing registrations for this athlete
  const { data: registrations, isLoading: loadingRegistrations } = useQuery({
    queryKey: ['athlete-championships', athleteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campeonatos_atletas')
        .select('campeonato_id')
        .eq('athlete_id', athleteId);
      
      if (error) throw error;
      return data.map(r => r.campeonato_id);
    },
  });

  const handleRegisterAthlete = async () => {
    if (!selectedChampionshipId) {
      toast({
        title: "No Championship Selected",
        description: "Please select a championship first.",
        variant: "destructive",
      });
      return;
    }

    const championshipId = parseInt(selectedChampionshipId);

    // Check if already registered
    if (registrations?.includes(championshipId)) {
      toast({
        title: "Already Registered",
        description: "This athlete is already registered for this championship.",
        variant: "destructive",
      });
      return;
    }

    setRegistering(championshipId);

    try {
      const { error } = await supabase
        .from('campeonatos_atletas')
        .insert({
          id: crypto.randomUUID(),
          campeonato_id: championshipId,
          athlete_id: athleteId,
        });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Athlete successfully registered for this championship!",
      });

      // Clear selection and invalidate queries
      setSelectedChampionshipId("");
      queryClient.invalidateQueries({ queryKey: ['athlete-championships', athleteId] });
    } catch (error: any) {
      console.error('Error registering athlete:', error);
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register athlete for championship.",
        variant: "destructive",
      });
    } finally {
      setRegistering(null);
    }
  };

  const isRegistered = (championshipId: number) => {
    return registrations?.includes(championshipId) || false;
  };

  if (loadingChampionships || loadingRegistrations) {
    return (
      <div className="pt-4 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!championships || championships.length === 0) {
    return (
      <div className="pt-4 text-center p-6">
        <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">No championships available at the moment.</p>
      </div>
    );
  }

  const selectedChampionship = championships?.find(c => c.id.toString() === selectedChampionshipId);
  const isSelectedRegistered = selectedChampionshipId ? isRegistered(parseInt(selectedChampionshipId)) : false;

  return (
    <div className="pt-4 space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="h-5 w-5 text-championships" />
        <h3 className="text-lg font-semibold">Register {athleteName} for Championships</h3>
      </div>

      {/* Championship Selection */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Select Championship</Label>
          <Select value={selectedChampionshipId} onValueChange={setSelectedChampionshipId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a championship..." />
            </SelectTrigger>
            <SelectContent>
              {championships.map((championship) => (
                <SelectItem key={championship.id} value={championship.id.toString()}>
                  {championship.nome_campeonato || 'Unnamed Championship'}
                  {isRegistered(championship.id) && ' ✓'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Selected Championship Details */}
        {selectedChampionship && (
          <Card className="shadow-soft border-l-4 border-l-championships">
            <CardHeader className="pb-3 bg-championships-light">
              <div className="flex items-start justify-between gap-4">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  {selectedChampionship.nome_campeonato || 'Unnamed Championship'}
                  {isSelectedRegistered && (
                    <Badge variant="default" className="bg-success text-success-foreground">
                      Registered
                    </Badge>
                  )}
                </CardTitle>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                {selectedChampionship.categoria && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{selectedChampionship.categoria}</span>
                  </div>
                )}
                
                {selectedChampionship.gender && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {selectedChampionship.gender}
                    </Badge>
                  </div>
                )}
                
                {selectedChampionship.local && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{selectedChampionship.local}</span>
                  </div>
                )}
                
                {selectedChampionship.data_inicio && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {format(new Date(selectedChampionship.data_inicio), 'MMM d, yyyy')}
                      {selectedChampionship.data_fim && ` - ${format(new Date(selectedChampionship.data_fim), 'MMM d, yyyy')}`}
                    </span>
                  </div>
                )}
              </div>

              <Button
                onClick={handleRegisterAthlete}
                disabled={isSelectedRegistered || registering !== null}
                className="w-full"
                variant={isSelectedRegistered ? "outline" : "default"}
              >
                {registering ? "Registering..." : isSelectedRegistered ? "Already Registered" : "Register for Championship"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* List of Already Registered Championships */}
        {registrations && registrations.length > 0 && (
          <div className="space-y-2">
            <Label>Already Registered Championships</Label>
            <div className="space-y-2">
              {championships
                ?.filter(c => isRegistered(c.id))
                .map(championship => (
                  <div key={championship.id} className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                    <Trophy className="h-4 w-4 text-success" />
                    <span className="text-sm font-medium">{championship.nome_campeonato}</span>
                    <Badge variant="outline" className="ml-auto text-xs bg-success/10 text-success border-success/20">
                      Registered
                    </Badge>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
