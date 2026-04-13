import { useNavigate } from "react-router-dom";
import { Users, UserPlus, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AppHeader from "@/components/shared/AppHeader";
import AppFooter from "@/components/shared/AppFooter";
import CoachTrainingManagement from "@/components/admin/CoachTrainingManagement";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";

const DailyManagement = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const adminSessionStr = localStorage.getItem('adminSession');
    if (!adminSessionStr) {
      navigate("/login/administration");
      return;
    }
    try {
      const session = JSON.parse(adminSessionStr);
      setUserRole(session.role || null);
    } catch {
      navigate("/login/administration");
    }
  }, [navigate]);

  const { data: athletes } = useQuery({
    queryKey: ['admin-athletes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('atletas').select('*').limit(10000);
      if (error) throw error;
      return data;
    },
  });

  const dailyActions = [
    {
      title: t('admin.management.users'),
      description: t('admin.management.usersDesc'),
      icon: Users,
      color: "primary",
      action: t('admin.management.viewUsers'),
      route: "/admin/users",
      requiresRole: true,
    },
    {
      title: t('admin.management.athletes'),
      description: t('admin.management.athletesDesc'),
      icon: UserPlus,
      color: "success",
      action: t('admin.management.manageAthletes'),
      route: "/admin/athletes",
      requiresRole: false,
    },
    {
      title: t('admin.management.attendance'),
      description: t('admin.management.attendanceDesc'),
      icon: Calendar,
      color: "secondary",
      action: t('admin.management.manageAttendance'),
      route: "/admin/attendance",
      requiresRole: false,
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title={t('admin.management.dailyManagement')} showBack backTo="/dashboard/administration" />

      <main className="mobile-container py-6 space-y-4">
        {dailyActions
          .filter(action => {
            if (action.requiresRole) {
              return userRole === 'super_admin' || userRole === 'reports_viewer';
            }
            return true;
          })
          .map((action, index) => {
            const bgColorClass =
              action.color === "primary" ? "bg-primary/10" :
              action.color === "success" ? "bg-success/10" :
              action.color === "warning" ? "bg-warning/10" :
              action.color === "secondary" ? "bg-secondary/10" :
              "bg-primary/10";
            const textColorClass =
              action.color === "primary" ? "text-primary" :
              action.color === "success" ? "text-success" :
              action.color === "warning" ? "text-warning" :
              action.color === "secondary" ? "text-secondary" :
              "text-primary";
            return (
              <Card
                key={index}
                className="shadow-soft hover:shadow-medium transition-shadow cursor-pointer"
                onClick={() => navigate(action.route)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-full ${bgColorClass} flex items-center justify-center flex-shrink-0`}>
                      <action.icon className={`h-6 w-6 ${textColorClass}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground mb-1 whitespace-normal break-words">{action.title}</h4>
                      <p className="text-sm text-muted-foreground whitespace-normal break-words">{action.description}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button variant="default" size="sm" className="w-full sm:w-auto touch-friendly">
                      {userRole === 'reports_viewer' ? t('admin.management.view') : action.action}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

        <CoachTrainingManagement userRole={userRole} athletes={athletes || []} />
      </main>

      <AppFooter />
    </div>
  );
};

export default DailyManagement;
