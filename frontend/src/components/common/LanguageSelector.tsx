import React, { useRef, useState, useEffect } from 'react';
import { useI18n, LANGUAGES, LangCode } from '../../i18n';

const LanguageSelector: React.FC = () => {
  const { language, setLanguage, t, isLoading } = useI18n();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = search
    ? LANGUAGES.filter(
        l =>
          l.name.toLowerCase().includes(search.toLowerCase()) ||
          l.nativeName.toLowerCase().includes(search.toLowerCase()) ||
          l.code.toLowerCase().includes(search.toLowerCase())
      )
    : LANGUAGES;

  const current = LANGUAGES.find(l => l.code === language);

  return (
    <div className="lang-selector" ref={ref}>
      <button
        className="lang-selector-trigger"
        onClick={() => setOpen(o => !o)}
        aria-label={t('lang.select')}
        title={t('lang.select')}
      >
        {isLoading ? (
          <span className="lang-loading-dot" />
        ) : (
          <>
            <span className="lang-native">{current?.nativeName ?? 'EN'}</span>
            <span className="lang-caret">▾</span>
          </>
        )}
      </button>

      {open && (
        <div className="lang-dropdown" role="listbox" aria-label="Language selector">
          <div className="lang-search-wrap">
            <input
              className="lang-search"
              type="text"
              placeholder="Search language..."
              value={search}
              onChange={e => setSearch(e.target.value.slice(0, 50))}
              autoFocus
            />
          </div>
          <div className="lang-list">
            {filtered.map(lang => (
              <button
                key={lang.code}
                role="option"
                aria-selected={lang.code === language}
                className={`lang-option ${lang.code === language ? 'active' : ''}`}
                onClick={() => {
                  setLanguage(lang.code as LangCode);
                  setOpen(false);
                  setSearch('');
                }}
              >
                <span className="lang-option-native">{lang.nativeName}</span>
                <span className="lang-option-en">{lang.name}</span>
                {lang.dir === 'rtl' && <span className="lang-rtl-badge">RTL</span>}
                {lang.code === language && <span className="lang-check">✓</span>}
              </button>
            ))}
            {filtered.length === 0 && (
              <div style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.8rem', textAlign: 'center' }}>
                No language found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
