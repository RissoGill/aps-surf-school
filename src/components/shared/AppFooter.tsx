import { Mail, Phone } from "lucide-react";

const AppFooter = () => {
  return (
    <footer className="bg-secondary/50 border-t py-6 mt-8">
      <div className="mobile-container text-center space-y-3">
        <div className="flex items-center justify-center">
          <a 
            href="mailto:geral@academiaprofissionaldesurf.com" 
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <Mail className="h-4 w-4" />
            <span className="text-sm">geral@academiaprofissionaldesurf.com</span>
          </a>
        </div>
        <p className="text-xs text-muted-foreground">
          © 2024 APS Surf School. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default AppFooter;