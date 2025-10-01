import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, User, Calendar, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import AppHeader from "@/components/shared/AppHeader";
import SponsorBanner from "@/components/shared/SponsorBanner";
import AppFooter from "@/components/shared/AppFooter";

interface Athlete {
  Athlete_Id: string;
  first_name: string | null;
  last_name: string | null;
  surf_level: string | null;
  training_days: string | null;
}

const CoachDashboard = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: athletes, isLoading } = useQuery({
    queryKey: ['athletes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Atletas')
        .select('Athlete_Id, first_name, last_name, surf_level, training_days')
        .order('first_name', { ascending: true });
      
      if (error) throw error;
      return data as Athlete[];
    },
  });

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
              Recent Athletes
            </CardTitle>
            <CardDescription>
              Select an athlete to view their details
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
                  <div
                    key={athlete.Athlete_Id}
                    className="p-4 border-b border-border last:border-b-0 hover:bg-accent/50 transition-colors cursor-pointer active:bg-accent"
                    onClick={() => navigate(`/athlete/${athlete.Athlete_Id}`)}
                  >
                    <div className="flex items-center justify-between">
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
                      {athlete.surf_level && (
                        <div className="text-right">
                          <Badge className={`${getLevelColor(athlete.surf_level)} mb-1`}>
                            {athlete.surf_level}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
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