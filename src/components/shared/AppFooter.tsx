import { Mail, Phone, BookOpen } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useNavigate } from "react-router-dom";

const AppFooter = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  return (
    <footer className="bg-secondary/50 border-t py-6 mt-8">
      <div className="mobile-container text-center space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a 
            href="mailto:geral@academiaprofissionaldesurf.com" 
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <Mail className="h-4 w-4" />
            <span className="text-sm">geral@academiaprofissionaldesurf.com</span>
          </a>
          <button
            onClick={() => navigate('/manual')}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <BookOpen className="h-4 w-4" />
            <span className="text-sm">{t('footer.userManual')}</span>
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          © 2024 APS Surf School. {t('footer.rights')}.
        </p>
      </div>
    </footer>
  );
};

export default AppFooter;