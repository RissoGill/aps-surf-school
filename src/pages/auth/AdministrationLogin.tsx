import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import AppHeader from "@/components/shared/AppHeader";
import SponsorBanner from "@/components/shared/SponsorBanner";
import AppFooter from "@/components/shared/AppFooter";
import { useLanguage } from "@/i18n/LanguageContext";

const AdministrationLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Legacy system authentication using users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('admin_id, admin_password, admin_role')
        .eq('admin_id', formData.email)
        .eq('admin_password', formData.password)
        .maybeSingle();

      if (userError || !userData) {
        toast({
          title: t('login.error'),
          description: t('login.invalidCredentials'),
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      // Store session in localStorage
      const adminSession = {
        id: userData.admin_id,
        email: userData.admin_id,
        role: userData.admin_role || 'admin'
      };
      
      localStorage.setItem('adminSession', JSON.stringify(adminSession));

      toast({
        title: t('login.success'),
        description: t('login.welcomeAdmin'),
      });
      
      navigate("/dashboard/administration");
    } catch (error) {
      toast({
        title: t('login.error'),
        description: t('login.unexpectedError'),
        variant: "destructive"
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
      <AppHeader title={t('login.admin')} showBack backTo="/" />
      
      <main className="mobile-container py-8">
        <Card className="shadow-medium animate-slide-up">
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary/50 mb-4 mx-auto">
              <Settings className="h-8 w-8 text-secondary-foreground" />
            </div>
            <CardTitle className="text-2xl">{t('login.adminPortal')}</CardTitle>
            <CardDescription>
              {t('login.adminDescription')}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('login.emailOrId')}</Label>
                <Input
                  id="email"
                  name="email"
                  type="text"
                  placeholder={t('login.adminIdPlaceholder')}
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
                className="w-full touch-friendly"
                variant="secondary"
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

export default AdministrationLogin;