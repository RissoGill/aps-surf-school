import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GraduationCap, MapPin, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";

interface Estagio {
  id: number;
  nome_estagio: string | null;
  local: string | null;
  data_inicio: string | null;
  data_fim: string | null;
}

interface EstagiosTabProps {
  athleteId: string;
  athleteName: string;
}

export const EstagiosTab = ({ athleteId, athleteName }: EstagiosTabProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [registering, setRegistering] = useState<number | null>(null);
  const [selectedEstagioId, setSelectedEstagioId] = useState<string>("");

  // Fetch all estagios
  const { data: estagios, isLoading: loadingEstagios } = useQuery({
    queryKey: ['estagios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Estagio')
        .select('*')
        .order('data_inicio', { ascending: true });
      
      if (error) throw error;
      return data as Estagio[];
    },
  });

  // Fetch existing registrations for this athlete
  const { data: registrations, isLoading: loadingRegistrations } = useQuery({
    queryKey: ['athlete-estagios', athleteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('estagio_atletas')
        .select('estagios_id')
        .eq('athlete_id', athleteId);
      
      if (error) throw error;
      return data.map(r => r.estagios_id);
    },
  });

  const handleRegisterAthlete = async () => {
    if (!selectedEstagioId) {
      toast({
        title: "No Estágio Selected",
        description: "Please select an estágio first.",
        variant: "destructive",
      });
      return;
    }

    const estagioId = parseInt(selectedEstagioId);

    // Check if already registered
    if (registrations?.includes(estagioId)) {
      toast({
        title: "Already Registered",
        description: "This athlete is already registered for this estágio.",
        variant: "destructive",
      });
      return;
    }

    setRegistering(estagioId);

    try {
      const { error } = await supabase
        .from('estagio_atletas')
        .insert({
          estagios_id: estagioId,
          athlete_id: athleteId,
        });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Athlete successfully registered for this Estágio!",
      });

      // Clear selection and invalidate queries
      setSelectedEstagioId("");
      queryClient.invalidateQueries({ queryKey: ['athlete-estagios', athleteId] });
    } catch (error: any) {
      console.error('Error registering athlete:', error);
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register athlete for estágio.",
        variant: "destructive",
      });
    } finally {
      setRegistering(null);
    }
  };

  const isRegistered = (estagioId: number) => {
    return registrations?.includes(estagioId) || false;
  };

  if (loadingEstagios || loadingRegistrations) {
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

  if (!estagios || estagios.length === 0) {
    return (
      <div className="pt-4 text-center p-6">
        <GraduationCap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">No estágios available at the moment.</p>
      </div>
    );
  }

  const selectedEstagio = estagios?.find(e => e.id.toString() === selectedEstagioId);
  const isSelectedRegistered = selectedEstagioId ? isRegistered(parseInt(selectedEstagioId)) : false;

  return (
    <div className="pt-4 space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <GraduationCap className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Register {athleteName} for Estágios</h3>
      </div>

      {/* Estagio Selection */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Select Estágio</Label>
          <Select value={selectedEstagioId} onValueChange={setSelectedEstagioId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose an estágio..." />
            </SelectTrigger>
            <SelectContent>
              {estagios.map((estagio) => (
                <SelectItem key={estagio.id} value={estagio.id.toString()}>
                  {estagio.nome_estagio || 'Unnamed Estágio'}
                  {isRegistered(estagio.id) && ' ✓'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Selected Estagio Details */}
        {selectedEstagio && (
          <Card className="shadow-soft">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  {selectedEstagio.nome_estagio || 'Unnamed Estágio'}
                  {isSelectedRegistered && (
                    <Badge variant="default" className="bg-success text-success-foreground">
                      Registered
                    </Badge>
                  )}
                </CardTitle>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-2 text-sm">
                {selectedEstagio.local && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{selectedEstagio.local}</span>
                  </div>
                )}
                
                {selectedEstagio.data_inicio && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {format(new Date(selectedEstagio.data_inicio), 'MMM d, yyyy')}
                      {selectedEstagio.data_fim && ` - ${format(new Date(selectedEstagio.data_fim), 'MMM d, yyyy')}`}
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
                {registering ? "Registering..." : isSelectedRegistered ? "Already Registered" : "Register for Estágio"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* List of Already Registered Estagios */}
        {registrations && registrations.length > 0 && (
          <div className="space-y-2">
            <Label>Already Registered Estágios</Label>
            <div className="space-y-2">
              {estagios
                ?.filter(e => isRegistered(e.id))
                .map(estagio => (
                  <div key={estagio.id} className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                    <GraduationCap className="h-4 w-4 text-success" />
                    <span className="text-sm font-medium">{estagio.nome_estagio}</span>
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
