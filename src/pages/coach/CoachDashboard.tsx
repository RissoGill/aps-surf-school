import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, User, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AppHeader from "@/components/shared/AppHeader";
import SponsorBanner from "@/components/shared/SponsorBanner";
import AppFooter from "@/components/shared/AppFooter";

// Mock data for demonstration
const mockAthletes = [
  {
    id: 1,
    name: "Emma Johnson",
    level: "Intermediate",
    lastTraining: "2024-09-18",
    nextTraining: "2024-09-20"
  },
  {
    id: 2,
    name: "Liam Smith",
    level: "Beginner",
    lastTraining: "2024-09-17",
    nextTraining: "2024-09-19"
  },
  {
    id: 3,
    name: "Sofia Rodriguez",
    level: "Advanced",
    lastTraining: "2024-09-18",
    nextTraining: "2024-09-21"
  }
];

const CoachDashboard = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredAthletes, setFilteredAthletes] = useState(mockAthletes);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const filtered = mockAthletes.filter(athlete =>
      athlete.name.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredAthletes(filtered);
  };

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
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 touch-friendly shadow-soft"
          />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="shadow-soft">
            <CardContent className="p-4 text-center">
              <User className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">12</p>
              <p className="text-sm text-muted-foreground">Total Athletes</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-soft">
            <CardContent className="p-4 text-center">
              <Calendar className="h-6 w-6 text-success mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">8</p>
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
            {filteredAthletes.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-muted-foreground">No athletes found</p>
              </div>
            ) : (
              <div className="space-y-0">
                {filteredAthletes.map((athlete) => (
                  <div
                    key={athlete.id}
                    className="p-4 border-b border-border last:border-b-0 hover:bg-accent/50 transition-colors cursor-pointer active:bg-accent"
                    onClick={() => navigate(`/athlete/${athlete.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground mb-1">
                          {athlete.name}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Last: {athlete.lastTraining}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={`${getLevelColor(athlete.level)} mb-1`}>
                          {athlete.level}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          Next: {athlete.nextTraining}
                        </p>
                      </div>
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