import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";

const LanguageSelector = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setLanguage('pt')}
        className={`text-2xl p-2 transition-all ${
          language === 'pt' 
            ? 'opacity-100 scale-110' 
            : 'opacity-40 hover:opacity-70'
        }`}
        title="Português"
      >
        🇵🇹
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setLanguage('en')}
        className={`text-2xl p-2 transition-all ${
          language === 'en' 
            ? 'opacity-100 scale-110' 
            : 'opacity-40 hover:opacity-70'
        }`}
        title="English"
      >
        🇬🇧
      </Button>
    </div>
  );
};

export default LanguageSelector;
