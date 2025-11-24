import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import ptTranslations from './translations/pt.json';
import enTranslations from './translations/en.json';

type Language = 'pt' | 'en';
type Translations = typeof ptTranslations;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Translations> = {
  pt: ptTranslations,
  en: enTranslations,
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      // Try to get saved language from localStorage
      const saved = localStorage.getItem('aps-language');
      if (saved === 'pt' || saved === 'en') {
        return saved;
      }
      
      // Fallback to browser language or Portuguese
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith('pt')) return 'pt';
      if (browserLang.startsWith('en')) return 'en';
    } catch (error) {
      console.warn('Error loading language preference:', error);
    }
    return 'pt'; // Default to Portuguese
  });

  useEffect(() => {
    try {
      localStorage.setItem('aps-language', language);
    } catch (error) {
      console.warn('Error saving language preference:', error);
    }
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    try {
      const keys = key.split('.');
      let value: any = translations[language];
      
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          console.warn(`Translation key not found: ${key}`);
          return key;
        }
      }
      
      return typeof value === 'string' ? value : key;
    } catch (error) {
      console.warn(`Error translating key "${key}":`, error);
      return key;
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
