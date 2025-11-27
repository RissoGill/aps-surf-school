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
import { useLanguage } from "@/i18n/LanguageContext";

const AthleteLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
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
          title: t('login.error'),
          description: t('login.invalidCredentials'),
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

      const athleteName = athleteData?.first_name || t('login.athlete');

      // Store session in localStorage
      localStorage.setItem('athleteSession', JSON.stringify({
        athlete_id: userRecord.athlete_id,
        email: formData.email,
        role: userRecord.athlete_role,
        name: athleteName
      }));

      toast({
        title: t('login.success'),
        description: t('login.welcomeBack').replace('{name}', athleteName),
      });
      navigate("/dashboard/athlete");
    } catch (error) {
      toast({
        title: t('login.error'),
        description: t('login.unexpectedError'),
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
      <AppHeader title={t('login.athlete')} showBack backTo="/" />
      
      <main className="mobile-container py-8">
        <Card className="shadow-medium animate-slide-up">
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 mb-4 mx-auto">
              <Trophy className="h-8 w-8 text-success" />
            </div>
            <CardTitle className="text-2xl">{t('login.athletePortal')}</CardTitle>
            <CardDescription>
              {t('login.athleteDescription')}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('login.athleteId')}</Label>
                <Input
                  id="email"
                  name="email"
                  type="text"
                  placeholder={t('login.athletePlaceholder')}
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="touch-friendly"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">{t('login.password')}</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder={t('login.passwordPlaceholder')}
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
                {isLoading ? t('login.signingIn') : t('login.signIn')}
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