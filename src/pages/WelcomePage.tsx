import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Trophy, Heart, Settings, BookOpen } from "lucide-react";
import AppHeader from "@/components/shared/AppHeader";
import SponsorBanner from "@/components/shared/SponsorBanner";
import AppFooter from "@/components/shared/AppFooter";
import NewsCarousel from "@/components/shared/NewsCarousel";
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
        </div>

        {/* News Carousel */}
        <NewsCarousel />

        <p className="text-center text-muted-foreground mb-4">
          {t('welcome.subtitle')}
        </p>

        {/* Role Selection */}
        <div className="grid grid-cols-2 gap-4 mb-4">
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

        {/* User Manual Link */}
        <Card
          className="animate-fade-in cursor-pointer hover:shadow-medium transition-all duration-200 active:scale-95 bg-primary/5"
          onClick={() => navigate('/manual')}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left flex-1">
              <h3 className="font-semibold text-foreground text-sm">{t('footer.userManual')}</h3>
              <p className="text-xs text-muted-foreground">
                {t('userManual.subtitle')}
              </p>
            </div>
          </CardContent>
        </Card>
      </main>

      <SponsorBanner />
      <AppFooter />
    </div>
  );
};

export default WelcomePage;
