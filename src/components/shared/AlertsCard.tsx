import { Bell, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";

interface Alert {
  id: string;
  message: string;
  target_type: string;
  target_id: string | null;
  is_resolved: boolean;
  created_at: string;
}

interface AlertsCardProps {
  userType: 'coach' | 'athlete' | 'guardian';
  userId: string;
  guardianChildrenIds?: string[]; // For guardians, list of athlete_ids of their children
}

const AlertsCard = ({ userType, userId, guardianChildrenIds = [] }: AlertsCardProps) => {
  const { t, language } = useLanguage();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['user-alerts', userType, userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('is_resolved', false)
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      // Filter alerts based on user type and target
      const filteredAlerts = (data as Alert[]).filter(alert => {
        // All users see alerts targeted to 'all'
        if (alert.target_type === 'all') return true;

        switch (userType) {
          case 'coach':
            // Coaches see alerts for 'coaches' or their specific coach_id
            if (alert.target_type === 'coaches') return true;
            if (alert.target_type === 'specific_coach' && alert.target_id === userId) return true;
            break;
          case 'athlete':
            // Athletes see alerts for 'athletes' or their specific athlete_id
            if (alert.target_type === 'athletes') return true;
            if (alert.target_type === 'specific_athlete' && alert.target_id === userId) return true;
            break;
          case 'guardian':
            // Guardians see alerts for 'guardians' or alerts for their children
            if (alert.target_type === 'guardians') return true;
            if (alert.target_type === 'specific_athlete' && guardianChildrenIds.includes(alert.target_id || '')) return true;
            break;
        }
        return false;
      });

      return filteredAlerts;
    }
  });

  if (isLoading) {
    return null;
  }

  if (alerts.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-soft border-destructive/20 bg-destructive/5 mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <CardTitle className="text-base text-destructive">
            {t('shared.alerts.title')}
          </CardTitle>
          <Badge variant="destructive" className="ml-auto">
            {alerts.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-start gap-3 p-3 rounded-md bg-background border border-destructive/10"
            >
              <Bell className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{alert.message}</p>
                <span className="text-xs text-muted-foreground">
                  {new Date(alert.created_at).toLocaleDateString(language === 'pt' ? 'pt-PT' : 'en-GB')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AlertsCard;
