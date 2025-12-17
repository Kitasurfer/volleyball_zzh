import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { Language, Translation, SUPPORTED_LANGUAGES } from '../types';
import { translations } from '../data/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translation;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('de');

  useEffect(() => {
    const isPrerender =
      typeof window !== 'undefined' &&
      Boolean((window as unknown as { __PRERENDER_INJECTED?: { prerender?: boolean } }).__PRERENDER_INJECTED?.prerender);

    if (isPrerender) return;

    try {
      const savedLang = localStorage.getItem('language') as Language;
      if (savedLang && SUPPORTED_LANGUAGES.includes(savedLang)) {
        setLanguage(savedLang);
      }
    } catch {
      return;
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    const isPrerender =
      typeof window !== 'undefined' &&
      Boolean((window as unknown as { __PRERENDER_INJECTED?: { prerender?: boolean } }).__PRERENDER_INJECTED?.prerender);

    if (isPrerender) return;

    try {
      localStorage.setItem('language', lang);
    } catch {
      return;
    }
  };

  const value = {
    language,
    setLanguage: handleSetLanguage,
    t: translations[language],
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
