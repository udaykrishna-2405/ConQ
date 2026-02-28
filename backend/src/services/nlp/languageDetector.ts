// Language Detection Module
// Detects language of input text using Unicode script analysis and keyword matching.
// Supports: Hindi (hi), English (en), Bengali (bn), Tamil (ta), Telugu (te),
// Marathi (mr), Gujarati (gu), Kannada (kn), Malayalam (ml), Punjabi (pa).
//
// This is a rule-based detector using Unicode ranges. For production,
// replace with FastText lid.176.bin or Google CLD3.

interface LanguageDetectionResult {
  language: string;
  confidence: number;
  script: string;
  isCodeMixed: boolean;
  detectedLanguages: Array<{ language: string; percentage: number }>;
}

// Unicode script ranges for Indian languages
const SCRIPT_RANGES: Array<{ name: string; language: string; start: number; end: number }> = [
  { name: 'Devanagari', language: 'hi', start: 0x0900, end: 0x097F },
  { name: 'Bengali', language: 'bn', start: 0x0980, end: 0x09FF },
  { name: 'Gurmukhi', language: 'pa', start: 0x0A00, end: 0x0A7F },
  { name: 'Gujarati', language: 'gu', start: 0x0A80, end: 0x0AFF },
  { name: 'Tamil', language: 'ta', start: 0x0B80, end: 0x0BFF },
  { name: 'Telugu', language: 'te', start: 0x0C00, end: 0x0C7F },
  { name: 'Kannada', language: 'kn', start: 0x0C80, end: 0x0CFF },
  { name: 'Malayalam', language: 'ml', start: 0x0D00, end: 0x0D7F },
];

// Common Hindi words for Romanized Hindi detection
const HINDI_MARKERS = [
  'hai', 'hain', 'nahi', 'nahin', 'mein', 'aur', 'kya', 'yeh', 'woh',
  'koi', 'kuch', 'abhi', 'toh', 'bhi', 'agar', 'lekin', 'kyunki',
  'bahut', 'accha', 'theek', 'matlab', 'samajh', 'dekho', 'chalo',
  'bhai', 'yaar', 'dost', 'karo', 'karna', 'hona', 'jaana', 'aana',
  'achha', 'sab', 'kaisa', 'kaisi', 'kaise', 'kitna', 'kitni', 'kitne',
];

const getScriptForChar = (charCode: number): string | null => {
  for (const range of SCRIPT_RANGES) {
    if (charCode >= range.start && charCode <= range.end) {
      return range.language;
    }
  }
  // Latin characters
  if ((charCode >= 0x0041 && charCode <= 0x005A) ||
      (charCode >= 0x0061 && charCode <= 0x007A)) {
    return 'en';
  }
  return null;
};

const countScriptCharacters = (text: string): Map<string, number> => {
  const counts = new Map<string, number>();
  for (const char of text) {
    const script = getScriptForChar(char.charCodeAt(0));
    if (script) {
      counts.set(script, (counts.get(script) || 0) + 1);
    }
  }
  return counts;
};

const detectRomanizedHindi = (text: string): number => {
  const words = text.toLowerCase().split(/\s+/);
  const hindiWordCount = words.filter(w => HINDI_MARKERS.includes(w)).length;
  return words.length > 0 ? hindiWordCount / words.length : 0;
};

export const detectLanguage = (text: string): LanguageDetectionResult => {
  const scriptCounts = countScriptCharacters(text);
  const totalScriptChars = Array.from(scriptCounts.values()).reduce((a, b) => a + b, 0);

  if (totalScriptChars === 0) {
    return {
      language: 'unknown',
      confidence: 0,
      script: 'unknown',
      isCodeMixed: false,
      detectedLanguages: [],
    };
  }

  // Calculate percentage for each detected script
  const detectedLanguages = Array.from(scriptCounts.entries())
    .map(([lang, count]) => ({
      language: lang,
      percentage: Math.round((count / totalScriptChars) * 100),
    }))
    .sort((a, b) => b.percentage - a.percentage);

  const primaryLang = detectedLanguages[0];

  // Check for code-mixing: multiple scripts each with >15% share
  const significantLanguages = detectedLanguages.filter(l => l.percentage > 15);
  const isCodeMixed = significantLanguages.length > 1;

  // If text is purely Latin, check for Romanized Hindi (Hinglish)
  let language = primaryLang.language;
  let confidence = primaryLang.percentage / 100;
  let script = SCRIPT_RANGES.find(r => r.language === language)?.name || 'Latin';

  if (language === 'en') {
    const romanizedHindiRatio = detectRomanizedHindi(text);
    if (romanizedHindiRatio > 0.2) {
      // Significant Romanized Hindi detected — mark as code-mixed
      return {
        language: 'hi-Latn',
        confidence: Math.min(0.6 + romanizedHindiRatio, 0.9),
        script: 'Latin (Romanized Hindi)',
        isCodeMixed: true,
        detectedLanguages: [
          { language: 'hi-Latn', percentage: Math.round(romanizedHindiRatio * 100) },
          { language: 'en', percentage: Math.round((1 - romanizedHindiRatio) * 100) },
        ],
      };
    }
  }

  return {
    language,
    confidence: isCodeMixed ? confidence * 0.8 : Math.max(confidence, 0.85),
    script,
    isCodeMixed,
    detectedLanguages,
  };
};
