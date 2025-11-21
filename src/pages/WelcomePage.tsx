import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Trophy, Heart, Settings } from "lucide-react";
import AppHeader from "@/components/shared/AppHeader";
import SponsorBanner from "@/components/shared/SponsorBanner";
import AppFooter from "@/components/shared/AppFooter";
import ProcessedLogo from "@/components/ProcessedLogo";
import { useLanguage } from "@/i18n/LanguageContext";

const WelcomePage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const roles = [
    {
      titleKey: "roles.coach.title",
      descriptionKey: "roles.coach.description",
      icon: Users,
      color: "primary",
      path: "/login/coach",
    },
    {
      titleKey: "roles.athlete.title",
      descriptionKey: "roles.athlete.description",
      icon: Trophy,
      color: "success",
      path: "/login/athlete",
    },
    {
      titleKey: "roles.guardian.title",
      descriptionKey: "roles.guardian.description",
      icon: Heart,
      color: "warning",
      path: "/login/guardian",
    },
    {
      titleKey: "roles.administration.title",
      descriptionKey: "roles.administration.description",
      icon: Settings,
      color: "secondary",
      path: "/login/administration",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-surface">
      <AppHeader />

      <main className="mobile-container py-6">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="text-center">
            <ProcessedLogo
              containerClassName="h-40 w-40 mx-auto mb-4"
              className="h-full w-full object-contain"
              alt="APS Surf School"
              rounded={false}
            />
            <h1 className="text-3xl font-bold text-foreground">{t('welcome.title')}</h1>
          </div>

          <p className="text-muted-foreground">
            {t('welcome.subtitle')}
          </p>
        </div>

        {/* Role Selection */}
        <div className="grid grid-cols-2 gap-4">
          {roles.map((role) => (
            <Card
              key={role.titleKey}
              className="animate-fade-in cursor-pointer hover:shadow-medium transition-all duration-200 active:scale-95"
              onClick={() => navigate(role.path)}
            >
              <CardContent className="p-6 text-center">
                <div
                  className={`inline-flex items-center justify-center w-12 h-12 rounded-full bg-${role.color}/10 mb-4`}
                >
                  <role.icon className={`h-6 w-6 text-${role.color}`} />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{t(role.titleKey)}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t(role.descriptionKey)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <SponsorBanner />
      <AppFooter />
    </div>
  );
};

export default WelcomePage;
