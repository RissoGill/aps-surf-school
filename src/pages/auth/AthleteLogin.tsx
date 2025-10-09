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

  // Check if user is already logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard/athlete");
      }
    };
    checkUser();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        toast({
          title: "Login Failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      if (data.session) {
        // Fetch athlete data to get the name
        let athleteName = "Athlete";
        if (data.user) {
          const { data: athleteByUid } = await supabase
            .from('Atletas')
            .select('first_name, last_name, athlete_id')
            .eq('auth_uid', data.user.id)
            .maybeSingle();

          let profile = athleteByUid;
          if (!profile && data.user.email) {
            const { data: athleteByEmail } = await supabase
              .from('Atletas')
              .select('first_name, last_name, athlete_id')
              .eq('email', data.user.email)
              .maybeSingle();
            profile = athleteByEmail || null;
          }

          if (profile?.first_name) {
            athleteName = profile.first_name;
          } else if (profile?.athlete_id) {
            // Fallback to athlete_id mapping
            const map: Record<string, string> = {
              A01: 'Afonso Miguel', A02: 'António', A03: 'António Maria', A04: 'Baltazar', A05: 'Bruno',
              A06: 'Caetano', A07: 'Constança', A08: 'Davyd', A09: 'Diogo', A10: 'Diogo',
              A11: 'Duarte Miquel', A12: 'Ema', A13: 'Francisco', A14: 'Francisco', A15: 'Francisco',
              A16: 'Gabriela', A17: 'Gonçalo', A18: 'Inês', A19: 'Jaime', A20: 'João Maria',
              A21: 'João Maria', A22: 'Joaquim', A23: 'Levon', A24: 'Manuel', A25: 'Margarida',
              A26: 'Maria', A27: 'Maria', A28: 'Marta', A29: 'Martim', A30: 'Martinho',
              A31: 'Matilde', A32: 'Maria da Piedade', A33: 'Maria Frederica', A34: 'Marques Madalena',
              A35: 'Lucas', A37: 'Matilde Maria', A38: 'Matilde', A39: 'Max', A40: 'Miguel',
              A41: 'Nicolas', A42: 'Pedro', A43: 'Vasco', A44: 'Timothé', A45: 'Henrique',
              A46: 'Kiko', A47: 'Rita', A48: 'Gonçalo', A49: 'Manuel', A50: 'Vicente',
              A51: 'Ray', A52: 'Luca', A53: 'Vasco', A54: 'Sebastião Maria', A55: 'Peter',
              A56: 'Zé', A57: 'Pedro', A58: 'Mafalda', A59: 'Matilde', A60: 'Francisco',
              A61: 'Salvador', A62: 'Diogo', A63: 'Tiago', A64: 'Francisco', A65: 'Santiago',
              A66: 'Guilherme', A67: 'Luz', A68: 'Laura', A69: 'Marta Maria', A70: 'Duarte',
              A71: 'Rita', A72: 'Pia', A73: 'Maria da Piedade', A74: 'Pureza', A75: 'Mateus',
              A76: 'Martim', A77: 'Maria Madalena'
            };
            const mapped = map[profile.athlete_id.toUpperCase()];
            if (mapped) athleteName = mapped;
          } else if (data.user.email) {
            // Last fallback: try to get athlete_id from email prefix
            const emailPrefix = data.user.email.split('@')[0].toUpperCase();
            const map: Record<string, string> = {
              A01: 'Afonso Miguel', A02: 'António', A03: 'António Maria', A04: 'Baltazar', A05: 'Bruno',
              A06: 'Caetano', A07: 'Constança', A08: 'Davyd', A09: 'Diogo', A10: 'Diogo',
              A11: 'Duarte Miquel', A12: 'Ema', A13: 'Francisco', A14: 'Francisco', A15: 'Francisco',
              A16: 'Gabriela', A17: 'Gonçalo', A18: 'Inês', A19: 'Jaime', A20: 'João Maria',
              A21: 'João Maria', A22: 'Joaquim', A23: 'Levon', A24: 'Manuel', A25: 'Margarida',
              A26: 'Maria', A27: 'Maria', A28: 'Marta', A29: 'Martim', A30: 'Martinho',
              A31: 'Matilde', A32: 'Maria da Piedade', A33: 'Maria Frederica', A34: 'Marques Madalena',
              A35: 'Lucas', A37: 'Matilde Maria', A38: 'Matilde', A39: 'Max', A40: 'Miguel',
              A41: 'Nicolas', A42: 'Pedro', A43: 'Vasco', A44: 'Timothé', A45: 'Henrique',
              A46: 'Kiko', A47: 'Rita', A48: 'Gonçalo', A49: 'Manuel', A50: 'Vicente',
              A51: 'Ray', A52: 'Luca', A53: 'Vasco', A54: 'Sebastião Maria', A55: 'Peter',
              A56: 'Zé', A57: 'Pedro', A58: 'Mafalda', A59: 'Matilde', A60: 'Francisco',
              A61: 'Salvador', A62: 'Diogo', A63: 'Tiago', A64: 'Francisco', A65: 'Santiago',
              A66: 'Guilherme', A67: 'Luz', A68: 'Laura', A69: 'Marta Maria', A70: 'Duarte',
              A71: 'Rita', A72: 'Pia', A73: 'Maria da Piedade', A74: 'Pureza', A75: 'Mateus',
              A76: 'Martim', A77: 'Maria Madalena'
            };
            const mapped = map[emailPrefix];
            if (mapped) athleteName = mapped;
          }
        }

        toast({
          title: "Login Successful",
          description: `Welcome back, ${athleteName}!`,
        });
        navigate("/dashboard/athlete");
      }
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