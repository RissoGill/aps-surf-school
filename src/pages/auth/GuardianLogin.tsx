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
import { useLanguage } from "@/i18n/LanguageContext";

const GuardianLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
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
          title: t('login.error'),
          description: t('login.invalidCredentials'),
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
        title: t('login.success'),
        description: t('login.welcomeGuardian'),
      });
      navigate("/dashboard/guardian");
    } catch (err: any) {
      toast({
        title: t('login.error'),
        description: err?.message || t('login.unexpectedError'),
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
      <AppHeader title={t('login.guardian')} showBack backTo="/" />
      
      <main className="mobile-container py-8">
        <Card className="shadow-medium animate-slide-up">
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-warning/10 mb-4 mx-auto">
              <Heart className="h-8 w-8 text-warning" />
            </div>
            <CardTitle className="text-2xl">{t('login.guardianPortal')}</CardTitle>
            <CardDescription>
              {t('login.guardianDescription')}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('login.guardianId')}</Label>
                <Input
                  id="email"
                  name="email"
                  type="text"
                  placeholder={t('login.guardianPlaceholder')}
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
                className="w-full touch-friendly bg-warning hover:bg-warning/90"
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

export default GuardianLogin;