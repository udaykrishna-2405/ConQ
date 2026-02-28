import React, { createContext, useContext, useState, useCallback } from 'react';
import en from './en';
import hi from './hi';

export type Language = 'en' | 'hi';

type Translations = Record<string, string>;

const translations: Record<Language, Translations> = { en, hi };

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string) => key,
});

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('conq_lang');
    return (saved === 'hi' ? 'hi' : 'en') as Language;
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('conq_lang', lang);
  }, []);

  const t = useCallback(
    (key: string): string => {
      return translations[language][key] || translations.en[key] || key;
    },
    [language]
  );

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);
