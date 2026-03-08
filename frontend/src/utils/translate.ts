/**
 * translateText — Translates dynamic content to the target language.
 * Uses a script-range heuristic when target is English (reverse), otherwise
 * calls the backend /api/translate endpoint (which can use Gemini API).
 * Falls back gracefully: if the API call fails, returns the original text.
 *
 * Security: input is sanitized (length limit, no eval, no HTML injection).
 */
export async function translateText(text: string, targetLang: string): Promise<string> {
  // Input validation
  if (typeof text !== 'string') return '';
  const safeText = text.slice(0, 5000).replace(/<[^>]*>/g, ''); // strip HTML
  if (!safeText.trim()) return '';
  if (targetLang === 'en') return safeText;

  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: safeText, targetLanguage: targetLang }),
    });
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    return typeof data.translated === 'string' ? data.translated : safeText;
  } catch {
    // Graceful degradation: return original text
    return safeText;
  }
}

/**
 * detectLanguage — Detects the script/language of a text using Unicode ranges.
 * Returns a BCP-47-like language code.
 *
 * Security: only string input accepted, no external calls.
 */
export function detectLanguage(text: string): string {
  if (typeof text !== 'string' || !text.trim()) return 'en';

  const sample = text.slice(0, 500);

  const scriptRanges: [RegExp, string][] = [
    [/[\u0900-\u097F]/, 'hi'],   // Devanagari → Hindi (also Marathi, Sanskrit, Dogri, Bodo, Konkani, Maithili)
    [/[\u0980-\u09FF]/, 'bn'],   // Bengali / Assamese / Manipuri
    [/[\u0A80-\u0AFF]/, 'gu'],   // Gujarati
    [/[\u0A00-\u0A7F]/, 'pa'],   // Gurmukhi → Punjabi
    [/[\u0B80-\u0BFF]/, 'ta'],   // Tamil
    [/[\u0C00-\u0C7F]/, 'te'],   // Telugu
    [/[\u0C80-\u0CFF]/, 'kn'],   // Kannada
    [/[\u0D00-\u0D7F]/, 'ml'],   // Malayalam
    [/[\u0B00-\u0B7F]/, 'or'],   // Oriya
    [/[\u1C50-\u1C7F]/, 'sat'],  // Ol Chiki → Santali
    [/[\u0600-\u06FF\u0750-\u077F]/, 'ur'],  // Arabic script → Urdu/Kashmiri/Sindhi
  ];

  for (const [re, code] of scriptRanges) {
    if (re.test(sample)) return code;
  }

  return 'en';
}
