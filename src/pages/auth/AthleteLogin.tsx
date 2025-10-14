import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import AppHeader from "@/components/shared/AppHeader";
import SponsorBanner from "@/components/shared/SponsorBanner";
import AppFooter from "@/components/shared/AppFooter";

const AthleteLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  // Check if athlete is already logged in via localStorage
  useEffect(() => {
    const athleteSession = localStorage.getItem('athleteSession');
    if (athleteSession) {
      navigate("/dashboard/athlete");
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Query the Users table to validate credentials
      const { data: userRecord, error } = await supabase
        .from('users')
        .select('*')
        .eq('athlete_user_id', formData.email)
        .eq('athlete_password', formData.password)
        .maybeSingle();

      if (error || !userRecord) {
        toast({
          title: "Login Failed",
          description: "Invalid email or password. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Fetch athlete details from Atletas table
      const { data: athleteData } = await supabase
        .from('atletas')
        .select('first_name, last_name, athlete_id')
        .eq('athlete_id', userRecord.athlete_id)
        .maybeSingle();

      const athleteName = athleteData?.first_name || "Athlete";

      // Store session in localStorage
      localStorage.setItem('athleteSession', JSON.stringify({
        athlete_id: userRecord.athlete_id,
        email: formData.email,
        role: userRecord.athlete_role,
        name: athleteName
      }));

      toast({
        title: "Login Successful",
        description: `Welcome back, ${athleteName}!`,
      });
      navigate("/dashboard/athlete");
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-surface">
      <AppHeader title="Athlete Login" showBack backTo="/" />
      
      <main className="mobile-container py-8">
        <Card className="shadow-medium animate-slide-up">
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 mb-4 mx-auto">
              <Trophy className="h-8 w-8 text-success" />
            </div>
            <CardTitle className="text-2xl">Athlete Portal</CardTitle>
            <CardDescription>
              View your training schedule and progress
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="athlete@email.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="touch-friendly"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="touch-friendly"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full touch-friendly bg-success hover:bg-success/90"
                disabled={isLoading}
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>

      <SponsorBanner />
      <AppFooter />
    </div>
  );
};

export default AthleteLogin;