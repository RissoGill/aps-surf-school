import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Trophy, Heart, Settings } from "lucide-react";
import AppHeader from "@/components/shared/AppHeader";
import SponsorBanner from "@/components/shared/SponsorBanner";
import AppFooter from "@/components/shared/AppFooter";
import surfHero from "@/assets/surf-hero.jpg";

const WelcomePage = () => {
  const navigate = useNavigate();

  const roles = [
    {
      title: "Coach",
      description: "Manage athlete training and attendance",
      icon: Users,
      color: "primary",
      path: "/login/coach"
    },
    {
      title: "Athlete",
      description: "View your training schedule and progress",
      icon: Trophy,
      color: "success",
      path: "/login/athlete"
    },
    {
      title: "Guardian",
      description: "Track your child's progress and payments",
      icon: Heart,
      color: "warning",
      path: "/login/guardian"
    },
    {
      title: "Administration",
      description: "Full access to school management",
      icon: Settings,
      color: "secondary",
      path: "/login/administration"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-surface">
      <AppHeader />
      
      <main className="mobile-container py-6">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="relative overflow-hidden rounded-xl mb-6">
            <img 
              src={surfHero} 
              alt="Surf Beach" 
              className="w-full h-48 object-cover"
            />
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <div className="text-white">
                <h1 className="text-3xl font-bold mb-2">Welcome to APS</h1>
                <p className="text-lg opacity-90">Surf School Management</p>
              </div>
            </div>
          </div>
          
          <p className="text-muted-foreground">
            Choose your profile to access your personalized dashboard
          </p>
        </div>

        {/* Role Selection */}
        <div className="grid grid-cols-2 gap-4">
          {roles.map((role) => (
            <Card 
              key={role.title}
              className="animate-fade-in cursor-pointer hover:shadow-medium transition-all duration-200 active:scale-95"
              onClick={() => navigate(role.path)}
            >
              <CardContent className="p-6 text-center">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full bg-${role.color}/10 mb-4`}>
                  <role.icon className={`h-6 w-6 text-${role.color}`} />
                </div>
                <h3 className="font-semibold text-foreground mb-2">
                  {role.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {role.description}
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