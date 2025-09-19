import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import apsLogo from "@/assets/aps-logo.png";

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
  backTo?: string;
}

const AppHeader = ({ title, showBack = false, backTo = "/" }: AppHeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="bg-card shadow-soft border-b">
      <div className="mobile-container flex items-center justify-between h-16">
        <div className="flex items-center gap-3">
          {showBack && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate(backTo)}
              className="touch-friendly p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <img 
            src={apsLogo} 
            alt="APS Surf School" 
            className="h-8 w-auto"
          />
        </div>
        
        {title && (
          <h1 className="text-lg font-semibold text-foreground truncate">
            {title}
          </h1>
        )}
      </div>
    </header>
  );
};

export default AppHeader;