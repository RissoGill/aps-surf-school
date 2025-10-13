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

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/dashboard/guardian");
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate("/dashboard/guardian");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { email, password } = formData;
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        throw error;
      }
      toast({
        title: "Login successful",
        description: "Welcome back, Guardian!",
      });
      navigate("/dashboard/guardian");
    } catch (err: any) {
      toast({
        title: "Login failed",
        description: err?.message || "Please check your credentials and try again.",
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
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="parent@email.com"
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