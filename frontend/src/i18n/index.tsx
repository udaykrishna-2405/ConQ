import React, {
  createContext, useContext, useState, useCallback, useEffect, useRef
} from 'react';

// ── Language Definitions ──────────────────────────────────────────────────────
export interface LanguageDef {
  code: string;
  name: string;       // English name
  nativeName: string; // Name in the language itself
  script: string;
  dir: 'ltr' | 'rtl';
  fontFamily: string;
  locale: string;     // BCP-47 locale tag
}

export const LANGUAGES: LanguageDef[] = [
  { code: 'en',  name: 'English',              nativeName: 'English',             script: 'Latin',     dir: 'ltr', fontFamily: 'Inter, sans-serif',                    locale: 'en-IN' },
  { code: 'hi',  name: 'Hindi',                nativeName: 'हिन्दी',               script: 'Devanagari',dir: 'ltr', fontFamily: "'Noto Sans Devanagari', sans-serif",    locale: 'hi-IN' },
  { code: 'ta',  name: 'Tamil',                nativeName: 'தமிழ்',               script: 'Tamil',     dir: 'ltr', fontFamily: "'Noto Sans Tamil', sans-serif",          locale: 'ta-IN' },
  { code: 'te',  name: 'Telugu',               nativeName: 'తెలుగు',              script: 'Telugu',    dir: 'ltr', fontFamily: "'Noto Sans Telugu', sans-serif",         locale: 'te-IN' },
  { code: 'ml',  name: 'Malayalam',            nativeName: 'മലയാളം',             script: 'Malayalam', dir: 'ltr', fontFamily: "'Noto Sans Malayalam', sans-serif",      locale: 'ml-IN' },
  { code: 'kn',  name: 'Kannada',              nativeName: 'ಕನ್ನಡ',               script: 'Kannada',   dir: 'ltr', fontFamily: "'Noto Sans Kannada', sans-serif",         locale: 'kn-IN' },
  { code: 'mr',  name: 'Marathi',              nativeName: 'मराठी',               script: 'Devanagari',dir: 'ltr', fontFamily: "'Noto Sans Devanagari', sans-serif",    locale: 'mr-IN' },
  { code: 'bn',  name: 'Bengali',              nativeName: 'বাংলা',               script: 'Bengali',   dir: 'ltr', fontFamily: "'Noto Sans Bengali', sans-serif",         locale: 'bn-IN' },
  { code: 'gu',  name: 'Gujarati',             nativeName: 'ગુજરાતી',            script: 'Gujarati',  dir: 'ltr', fontFamily: "'Noto Sans Gujarati', sans-serif",        locale: 'gu-IN' },
  { code: 'pa',  name: 'Punjabi',              nativeName: 'ਪੰਜਾਬੀ',              script: 'Gurmukhi',  dir: 'ltr', fontFamily: "'Noto Sans Gurmukhi', sans-serif",        locale: 'pa-IN' },
  { code: 'ur',  name: 'Urdu',                 nativeName: 'اردو',                script: 'Arabic',    dir: 'rtl', fontFamily: "'Noto Nastaliq Urdu', sans-serif",        locale: 'ur-IN' },
  { code: 'or',  name: 'Odia',                 nativeName: 'ଓଡ଼ିଆ',               script: 'Oriya',     dir: 'ltr', fontFamily: "'Noto Sans Oriya', sans-serif",           locale: 'or-IN' },
  { code: 'as',  name: 'Assamese',             nativeName: 'অসমীয়া',             script: 'Bengali',   dir: 'ltr', fontFamily: "'Noto Sans Bengali', sans-serif",         locale: 'as-IN' },
  { code: 'ks',  name: 'Kashmiri',             nativeName: 'کٲشُر',               script: 'Arabic',    dir: 'rtl', fontFamily: "'Noto Nastaliq Urdu', sans-serif",        locale: 'ks-IN' },
  { code: 'kok', name: 'Konkani',              nativeName: 'कोंकणी',              script: 'Devanagari',dir: 'ltr', fontFamily: "'Noto Sans Devanagari', sans-serif",    locale: 'kok-IN' },
  { code: 'mai', name: 'Maithili',             nativeName: 'मैथिली',              script: 'Devanagari',dir: 'ltr', fontFamily: "'Noto Sans Devanagari', sans-serif",    locale: 'mai-IN' },
  { code: 'doi', name: 'Dogri',               nativeName: 'डोगरी',               script: 'Devanagari',dir: 'ltr', fontFamily: "'Noto Sans Devanagari', sans-serif",    locale: 'doi-IN' },
  { code: 'brx', name: 'Bodo',                 nativeName: 'बड़ो',                 script: 'Devanagari',dir: 'ltr', fontFamily: "'Noto Sans Devanagari', sans-serif",    locale: 'brx-IN' },
  { code: 'sa',  name: 'Sanskrit',             nativeName: 'संस्कृतम्',           script: 'Devanagari',dir: 'ltr', fontFamily: "'Noto Sans Devanagari', sans-serif",    locale: 'sa-IN' },
  { code: 'sat', name: 'Santali',              nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ',            script: 'Ol Chiki',  dir: 'ltr', fontFamily: "'Noto Sans Ol Chiki', sans-serif",       locale: 'sat-IN' },
  { code: 'sd',  name: 'Sindhi',               nativeName: 'سنڌي',                script: 'Arabic',    dir: 'rtl', fontFamily: "'Noto Nastaliq Urdu', sans-serif",        locale: 'sd-IN' },
  { code: 'mni', name: 'Manipuri (Meitei)',    nativeName: 'মেইতেই',              script: 'Bengali',   dir: 'ltr', fontFamily: "'Noto Sans Bengali', sans-serif",         locale: 'mni-IN' },
  { code: 'ne',  name: 'Nepali',               nativeName: 'नेपाली',              script: 'Devanagari',dir: 'ltr', fontFamily: "'Noto Sans Devanagari', sans-serif",    locale: 'ne-IN' },
];

export const LANGUAGE_MAP = Object.fromEntries(LANGUAGES.map(l => [l.code, l]));

// ── Types ──────────────────────────────────────────────────────────────────────
export type LangCode = typeof LANGUAGES[number]['code'];

type Translations = Record<string, string>;

const DEFAULT_LANG: LangCode = 'en';

interface I18nContextType {
  language: LangCode;
  langDef: LanguageDef;
  setLanguage: (lang: LangCode) => void;
  t: (key: string) => string;
  isLoading: boolean;
}

// ── Lazy Loader ────────────────────────────────────────────────────────────────
async function loadLocale(code: LangCode): Promise<Translations> {
  try {
    const mod = await import(`./locales/${code}.json`);
    return mod.default as Translations;
  } catch {
    try {
      const fallback = await import('./locales/en.json');
      return fallback.default as Translations;
    } catch {
      return {};
    }
  }
}

// ── Validate language code (only allow known codes) ────────────────────────────
function sanitizeLangCode(code: unknown): LangCode {
  if (typeof code === 'string' && LANGUAGE_MAP[code]) {
    return code as LangCode;
  }
  return DEFAULT_LANG;
}

// ── Apply html attributes (dir, lang, font) ────────────────────────────────────
function applyHtmlAttributes(def: LanguageDef) {
  document.documentElement.setAttribute('dir', def.dir);
  document.documentElement.setAttribute('lang', def.locale);
  document.documentElement.style.fontFamily = def.fontFamily;
}

// ── Context ────────────────────────────────────────────────────────────────────
const I18nContext = createContext<I18nContextType>({
  language: DEFAULT_LANG,
  langDef: LANGUAGE_MAP[DEFAULT_LANG],
  setLanguage: () => {},
  t: (key: string) => key,
  isLoading: false,
});

// ── Provider ───────────────────────────────────────────────────────────────────
export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialLang = sanitizeLangCode(localStorage.getItem('conq_lang'));
  const [language, setLanguageState] = useState<LangCode>(initialLang);
  const [translations, setTranslations] = useState<Translations>({});
  const [enTranslations, setEnTranslations] = useState<Translations>({});
  const [isLoading, setIsLoading] = useState(true);
  // Cache loaded locales to avoid refetching
  const cache = useRef<Map<LangCode, Translations>>(new Map());

  // Load English baseline once
  useEffect(() => {
    loadLocale('en').then(data => {
      cache.current.set('en', data);
      setEnTranslations(data);
    });
  }, []);

  // Load locale on language change
  useEffect(() => {
    const def = LANGUAGE_MAP[language];
    applyHtmlAttributes(def);

    if (cache.current.has(language)) {
      setTranslations(cache.current.get(language)!);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    loadLocale(language).then(data => {
      cache.current.set(language, data);
      setTranslations(data);
      setIsLoading(false);
    });
  }, [language]);

  const setLanguage = useCallback((lang: LangCode) => {
    const safe = sanitizeLangCode(lang);
    localStorage.setItem('conq_lang', safe);
    setLanguageState(safe);
  }, []);

  const t = useCallback(
    (key: string): string => {
      // Validate key — only allow alphanumeric + dots + underscores
      if (!/^[a-zA-Z0-9._]+$/.test(key)) return key;
      return translations[key] || enTranslations[key] || key;
    },
    [translations, enTranslations]
  );

  return (
    <I18nContext.Provider value={{ language, langDef: LANGUAGE_MAP[language], setLanguage, t, isLoading }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);
