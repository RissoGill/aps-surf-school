import { useQuery } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { calculatePackBalance } from "@/utils/packBalance";

interface PackBalanceAlertProps {
  athleteId: string;
  athleteName?: string;
  showFor: 'athlete' | 'guardian' | 'coach';
}

export function PackBalanceAlert({ athleteId, athleteName, showFor }: PackBalanceAlertProps) {
  const { data: balance, isLoading } = useQuery({
    queryKey: ['pack-balance', athleteId],
    queryFn: () => calculatePackBalance(athleteId),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (isLoading || !balance || !balance.isNegative) {
    return null;
  }

  const sessionsOver = Math.abs(balance.balance);
  
  const getMessage = () => {
    switch (showFor) {
      case 'athlete':
        return `You've used ${sessionsOver} more session${sessionsOver > 1 ? 's' : ''} than your pack includes. Please purchase additional sessions.`;
      case 'guardian':
        return `${athleteName || 'Athlete'} has exceeded their pack limit by ${sessionsOver} session${sessionsOver > 1 ? 's' : ''}. Additional payment may be required.`;
      case 'coach':
        return `${athleteName || 'Athlete'}'s pack balance: -${sessionsOver} session${sessionsOver > 1 ? 's' : ''}. They can continue training, but guardian should be notified.`;
      default:
        return '';
    }
  };

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Pack Session Limit Exceeded</AlertTitle>
      <AlertDescription>{getMessage()}</AlertDescription>
    </Alert>
  );
}
