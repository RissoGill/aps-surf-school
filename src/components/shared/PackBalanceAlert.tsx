import { useQuery } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { calculatePackBalance } from "@/utils/packBalance";
import { useLanguage } from "@/i18n/LanguageContext";

interface PackBalanceAlertProps {
  athleteId: string;
  athleteName?: string;
  showFor: 'athlete' | 'guardian' | 'coach';
}

export function PackBalanceAlert({ athleteId, athleteName, showFor }: PackBalanceAlertProps) {
  const { t } = useLanguage();
  const { data: balance, isLoading } = useQuery({
    queryKey: ['pack-balance', athleteId],
    queryFn: () => calculatePackBalance(athleteId),
    refetchInterval: 30000,
  });

  if (isLoading || !balance || balance.balance > 0) {
    return null;
  }

  const isExhausted = balance.isExhausted;
  const sessionsOver = Math.abs(balance.balance);
  
  const getTitle = () => {
    if (isExhausted) {
      return t('shared.packBalance.exhausted');
    }
    return t('shared.packBalance.exceeded');
  };

  const getMessage = () => {
    if (isExhausted) {
      switch (showFor) {
        case 'athlete':
          return t('shared.packBalance.athleteExhaustedMessage');
        case 'guardian':
          return t('shared.packBalance.guardianExhaustedMessage').replace('{name}', athleteName || 'Athlete');
        case 'coach':
          return t('shared.packBalance.coachExhaustedMessage').replace('{name}', athleteName || 'Athlete');
        default:
          return '';
      }
    }

    switch (showFor) {
      case 'athlete':
        return t('shared.packBalance.athleteMessage').replace('{count}', sessionsOver.toString());
      case 'guardian':
        return t('shared.packBalance.guardianMessage')
          .replace('{name}', athleteName || 'Athlete')
          .replace('{count}', sessionsOver.toString());
      case 'coach':
        return t('shared.packBalance.coachMessage')
          .replace('{name}', athleteName || 'Athlete')
          .replace('{count}', sessionsOver.toString());
      default:
        return '';
    }
  };

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{getTitle()}</AlertTitle>
      <AlertDescription>{getMessage()}</AlertDescription>
    </Alert>
  );
}
