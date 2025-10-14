import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import AppHeader from "@/components/shared/AppHeader";
import SponsorBanner from "@/components/shared/SponsorBanner";
import AppFooter from "@/components/shared/AppFooter";

interface Athlete {
  Athlete_Id: string;
  first_name: string | null;
  last_name: string | null;
  photo_url: string | null;
  surf_level: string | null;
  training_days: string | null;
  email: string | null;
  phone: string | null;
}

const AthletesList = () => {
  const { data: athletes, isLoading, error } = useQuery({
    queryKey: ['athletes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('atletas')
        .select('*')
        .order('first_name', { ascending: true });
      
      if (error) throw error;
      return data as Athlete[];
    },
  });

  const getInitials = (firstName: string | null, lastName: string | null) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return `${first}${last}`.toUpperCase() || '?';
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Athletes List</h1>
          <p className="text-muted-foreground">
            View all registered athletes in the academy
          </p>
        </div>

        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">Error loading athletes: {error.message}</p>
            </CardContent>
          </Card>
        )}

        {isLoading && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        {athletes && athletes.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">No athletes found</p>
            </CardContent>
          </Card>
        )}

        {athletes && athletes.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {athletes.map((athlete) => (
              <Card key={athlete.Athlete_Id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={athlete.photo_url || undefined} alt={`${athlete.first_name} ${athlete.last_name}`} />
                      <AvatarFallback>
                        {getInitials(athlete.first_name, athlete.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">
                        {athlete.first_name} {athlete.last_name}
                      </CardTitle>
                      {athlete.surf_level && (
                        <Badge variant="secondary" className="mt-1">
                          {athlete.surf_level}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {athlete.email && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Email: </span>
                      <span className="truncate">{athlete.email}</span>
                    </div>
                  )}
                  {athlete.phone && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Phone: </span>
                      <span>{athlete.phone}</span>
                    </div>
                  )}
                  {athlete.training_days && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Training: </span>
                      <span>{athlete.training_days}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <SponsorBanner />
      <AppFooter />
    </div>
  );
};

export default AthletesList;
