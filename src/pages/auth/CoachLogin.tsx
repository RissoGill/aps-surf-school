import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AppHeader from "@/components/shared/AppHeader";
import SponsorBanner from "@/components/shared/SponsorBanner";
import AppFooter from "@/components/shared/AppFooter";
import { supabase } from "@/integrations/supabase/client";

const CoachLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      // Fetch coach data to get the name (by auth_uid, then fallback by email)
      let coachName = "Coach";
      if (data.user) {
        const { data: coachByUid } = await supabase
          .from('Coach')
          .select('first_name, last_name, coach_id')
          .eq('auth_uid', data.user.id.toString())
          .maybeSingle();

        let profile = coachByUid;
        if (!profile && data.user.email) {
          const { data: coachByEmail } = await supabase
            .from('Coach')
            .select('first_name, last_name, coach_id')
            .eq('email', data.user.email)
            .maybeSingle();
          profile = coachByEmail || null;
        }

        if (profile) {
          const parts = [profile.first_name, profile.last_name].filter(Boolean);
          if (parts.length) {
            coachName = parts.join(' ');
          } else if (profile.coach_id) {
            // Fallback to coach_id mapping
            const map: Record<string, string> = {
              T01: 'Nuno Telmo',
              T02: 'David',
              T03: 'Danilo',
              T04: 'Gustavo',
              T05: 'Aaron',
              T06: 'Zé',
              T07: 'Francisco'
            };
            const mapped = map[String(profile.coach_id).trim().toUpperCase()];
            if (mapped) coachName = mapped;
          }
        } else {
          // If no profile found, try mapping from email prefix
          const map: Record<string, string> = {
            T01: 'Nuno Telmo',
            T02: 'David',
            T03: 'Danilo',
            T04: 'Gustavo',
            T05: 'Aaron',
            T06: 'Zé',
            T07: 'Francisco'
          };
          const emailPrefix = data.user.email ? data.user.email.split('@')[0].toUpperCase() : '';
          const mapped = map[emailPrefix];
          if (mapped) coachName = mapped;
        }
      }

      toast({
        title: "Login Successful",
        description: `Welcome back, ${coachName}!`,
      });
      navigate("/dashboard/coach");
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password",
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
      <AppHeader title="Coach Login" showBack backTo="/" />
      
      <main className="mobile-container py-8">
        <Card className="shadow-medium animate-slide-up">
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 mx-auto">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Coach Portal</CardTitle>
            <CardDescription>
              Access your coaching dashboard to manage athletes
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
                  placeholder="coach@apssurfschool.com"
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
                className="w-full touch-friendly gradient-primary hover:opacity-90"
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

export default CoachLogin;