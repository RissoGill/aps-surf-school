import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, MapPin, Calendar, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [registering, setRegistering] = useState<number | null>(null);

  // Fetch all championships
  const { data: championships, isLoading: loadingChampionships } = useQuery({
    queryKey: ['championships'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Campeonatos')
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

  const handleRegisterAthlete = async (championshipId: number) => {
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
          campeonato_id: championshipId,
          athlete_id: athleteId,
        });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Athlete successfully registered for this championship!",
      });

      // Invalidate queries to refresh the registration list
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

  return (
    <div className="pt-4 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Register {athleteName} for Championships</h3>
      </div>

      <div className="space-y-3">
        {championships.map((championship) => {
          const registered = isRegistered(championship.id);
          const isRegistering = registering === championship.id;

          return (
            <Card key={championship.id} className={`shadow-soft transition-all ${registered ? 'bg-muted/50' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    {championship.nome_campeonato || 'Unnamed Championship'}
                    {registered && (
                      <Badge variant="default" className="bg-success text-success-foreground">
                        Registered
                      </Badge>
                    )}
                  </CardTitle>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  {championship.categoria && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">{championship.categoria}</span>
                    </div>
                  )}
                  
                  {championship.gender && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {championship.gender}
                      </Badge>
                    </div>
                  )}
                  
                  {championship.local && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{championship.local}</span>
                    </div>
                  )}
                  
                  {championship.data_inicio && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {format(new Date(championship.data_inicio), 'MMM d, yyyy')}
                        {championship.data_fim && ` - ${format(new Date(championship.data_fim), 'MMM d, yyyy')}`}
                      </span>
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => handleRegisterAthlete(championship.id)}
                  disabled={registered || isRegistering}
                  className="w-full"
                  variant={registered ? "outline" : "default"}
                >
                  {isRegistering ? "Registering..." : registered ? "Already Registered" : "Register for Championship"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
