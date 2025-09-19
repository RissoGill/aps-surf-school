import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import AppHeader from "@/components/shared/AppHeader";
import AppFooter from "@/components/shared/AppFooter";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-surface">
      <AppHeader title="Page Not Found" />
      
      <main className="mobile-container py-16">
        <Card className="shadow-medium text-center">
          <CardContent className="p-8">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            
            <h1 className="text-4xl font-bold text-foreground mb-4">404</h1>
            <p className="text-xl text-muted-foreground mb-6">Oops! Page not found</p>
            <p className="text-sm text-muted-foreground mb-8">
              The page you're looking for doesn't exist or has been moved.
            </p>
            
            <Button 
              onClick={() => window.location.href = "/"}
              className="touch-friendly gradient-primary"
            >
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </main>

      <AppFooter />
    </div>
  );
};

export default NotFound;
