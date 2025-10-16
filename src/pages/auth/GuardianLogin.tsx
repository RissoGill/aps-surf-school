import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AppHeader from "@/components/shared/AppHeader";
import SponsorBanner from "@/components/shared/SponsorBanner";
import AppFooter from "@/components/shared/AppFooter";
import { supabase } from "@/integrations/supabase/client";

const GuardianLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  // Check if guardian is already logged in via localStorage
  useEffect(() => {
    const guardianSession = localStorage.getItem('guardianSession');
    if (guardianSession) {
      navigate("/dashboard/guardian");
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { email, password } = formData;
    try {
      const identifier = email.trim();
      const candidateIds = identifier.includes('@') ? [identifier] : [identifier, `${identifier}@aps.com`];

      // Query the Users table to validate credentials (accept code or email)
      const { data: userRecords, error } = await supabase
        .from('users')
        .select('*')
        .in('guardian_id', candidateIds)
        .eq('guardian_password', password);
      
      const userRecord = userRecords?.[0];

      if (error || !userRecord) {
        toast({
          title: "Login failed",
          description: "Invalid email or password. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Store session in localStorage
      localStorage.setItem('guardianSession', JSON.stringify({
        guardian_id: userRecord.guardian_id,
        athlete_id: userRecord.athlete_id,
        role: userRecord.guardian_role,
        email: email
      }));

      toast({
        title: "Login successful",
        description: "Welcome back, Guardian!",
      });
      navigate("/dashboard/guardian");
    } catch (err: any) {
      toast({
        title: "Login failed",
        description: err?.message || "An unexpected error occurred",
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
      <AppHeader title="Guardian Login" showBack backTo="/" />
      
      <main className="mobile-container py-8">
        <Card className="shadow-medium animate-slide-up">
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-warning/10 mb-4 mx-auto">
              <Heart className="h-8 w-8 text-warning" />
            </div>
            <CardTitle className="text-2xl">Guardian Portal</CardTitle>
            <CardDescription>
              Track your child's progress and manage payments
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email or Code</Label>
                <Input
                  id="email"
                  name="email"
                  type="text"
                  placeholder="PA01 or parent@email.com"
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
                className="w-full touch-friendly bg-warning hover:bg-warning/90"
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

export default GuardianLogin;