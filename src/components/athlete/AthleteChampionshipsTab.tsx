import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, MapPin, Calendar, Users } from "lucide-react";
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

interface AthleteChampionshipsTabProps {
  athleteId: string;
}

export const AthleteChampionshipsTab = ({ athleteId }: AthleteChampionshipsTabProps) => {
  // Fetch championship registrations for this athlete
  const { data: registrations, isLoading: loadingRegistrations } = useQuery({
    queryKey: ['athlete-championship-registrations', athleteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campeonatos_atletas')
        .select('campeonato_id')
        .eq('athlete_id', athleteId);
      
      if (error) throw error;
      return data.map(r => r.campeonato_id);
    },
  });

  // Fetch all championship details
  const { data: championships, isLoading: loadingChampionships } = useQuery({
    queryKey: ['championships-for-athlete', registrations],
    queryFn: async () => {
      if (!registrations || registrations.length === 0) return [];
      
      const { data, error } = await supabase
        .from('campeonatos')
        .select('*')
        .in('id', registrations)
        .order('data_inicio', { ascending: true });
      
      if (error) throw error;
      return data as Championship[];
    },
    enabled: !!registrations && registrations.length > 0,
  });

  const isLoading = loadingRegistrations || loadingChampionships;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
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
      <div className="text-center p-8">
        <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No Championships Yet</h3>
        <p className="text-muted-foreground text-sm">
          You haven't been registered for any championships yet.
        </p>
        <p className="text-muted-foreground text-sm mt-2">
          Check back later or contact your coach for more information.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Your Championships</h3>
      </div>

      <div className="space-y-3">
        {championships.map((championship) => (
          <Card key={championship.id} className="shadow-soft border-l-4 border-l-primary">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <h4 className="font-medium text-foreground flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-primary" />
                  {championship.nome_campeonato || 'Unnamed Championship'}
                </h4>
                <Badge variant="default" className="bg-success text-success-foreground">
                  Registered
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {championship.categoria && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground font-medium">{championship.categoria}</span>
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

              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Good luck! Remember to check with your coach for competition details and requirements.
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
