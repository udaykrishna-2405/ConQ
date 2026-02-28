// Sentiment Analysis Module
// Rule-based sentiment analysis with Hindi + English lexicons.
// Uses weighted word-level scoring with negation handling.
//
// For production, replace with fine-tuned multilingual BERT or
// IndicBERT sentiment classifier via SageMaker endpoint.

interface SentimentResult {
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  score: number;       // -1.0 to 1.0
  confidence: number;  // 0 to 1.0
  breakdown: {
    positiveWords: string[];
    negativeWords: string[];
    positiveScore: number;
    negativeScore: number;
  };
}

// English sentiment lexicon (subset — expand for production)
const EN_POSITIVE: Record<string, number> = {
  'good': 0.6, 'great': 0.8, 'excellent': 0.9, 'amazing': 0.9, 'awesome': 0.85,
  'fantastic': 0.9, 'wonderful': 0.85, 'love': 0.8, 'like': 0.5, 'best': 0.9,
  'beautiful': 0.7, 'happy': 0.7, 'perfect': 0.9, 'incredible': 0.85,
  'brilliant': 0.85, 'recommended': 0.7, 'useful': 0.6, 'helpful': 0.65,
  'fun': 0.7, 'enjoy': 0.7, 'impressive': 0.75, 'outstanding': 0.9,
  'superb': 0.85, 'favorite': 0.75, 'top': 0.6, 'viral': 0.65,
  'trending': 0.6, 'fire': 0.7, 'lit': 0.65, 'dope': 0.65,
};

const EN_NEGATIVE: Record<string, number> = {
  'bad': 0.6, 'terrible': 0.85, 'awful': 0.85, 'horrible': 0.9, 'worst': 0.9,
  'hate': 0.85, 'dislike': 0.6, 'boring': 0.6, 'poor': 0.65, 'ugly': 0.7,
  'disappointing': 0.7, 'useless': 0.75, 'waste': 0.7, 'annoying': 0.65,
  'frustrating': 0.7, 'sad': 0.6, 'angry': 0.7, 'fail': 0.7,
  'broken': 0.65, 'scam': 0.85, 'fake': 0.7, 'trash': 0.8,
  'cringe': 0.65, 'flop': 0.7, 'overrated': 0.6,
};

// Hindi sentiment lexicon (Devanagari)
const HI_POSITIVE: Record<string, number> = {
  'अच्छा': 0.7, 'बहुत': 0.4, 'शानदार': 0.85, 'बढ़िया': 0.75,
  'मज़ा': 0.7, 'खुशी': 0.75, 'प्यार': 0.8, 'सुंदर': 0.7,
  'जबरदस्त': 0.85, 'लाजवाब': 0.9, 'कमाल': 0.8, 'धमाल': 0.75,
  'सही': 0.6, 'मस्त': 0.7, 'झकास': 0.8, 'फायदा': 0.6,
  'सफल': 0.75, 'जीत': 0.7, 'उम्दा': 0.8, 'दमदार': 0.8,
};

const HI_NEGATIVE: Record<string, number> = {
  'बुरा': 0.6, 'खराब': 0.7, 'बेकार': 0.75, 'गंदा': 0.7,
  'नफरत': 0.85, 'दुखी': 0.65, 'गुस्सा': 0.7, 'बकवास': 0.8,
  'फालतू': 0.7, 'धोखा': 0.8, 'नकली': 0.7, 'घटिया': 0.8,
  'हानि': 0.65, 'नुकसान': 0.65, 'असफल': 0.7, 'हार': 0.65,
  'बोरिंग': 0.6, 'गलत': 0.65, 'भद्दा': 0.65,
};

// Romanized Hindi sentiment
const HI_LATN_POSITIVE: Record<string, number> = {
  'accha': 0.7, 'achha': 0.7, 'badhiya': 0.75, 'shandar': 0.85,
  'mast': 0.7, 'zabardast': 0.85, 'kamaal': 0.8, 'lajawab': 0.9,
  'pyaar': 0.8, 'khushi': 0.75, 'mazaa': 0.7, 'dhamaal': 0.75,
  'jhkaas': 0.8, 'sahi': 0.6, 'faayda': 0.6, 'jeet': 0.7,
};

const HI_LATN_NEGATIVE: Record<string, number> = {
  'bura': 0.6, 'kharab': 0.7, 'bekaar': 0.75, 'bakwas': 0.8,
  'ganda': 0.7, 'nafrat': 0.85, 'dukhi': 0.65, 'gussa': 0.7,
  'faaltu': 0.7, 'dhoka': 0.8, 'nakli': 0.7, 'ghatiya': 0.8,
  'galat': 0.65, 'boring': 0.6, 'haar': 0.65,
};

// Negation words (flip sentiment of following word)
const NEGATION_EN = new Set(['not', 'no', 'never', 'neither', 'nobody', 'nothing', "don't", "doesn't", "didn't", "won't", "wouldn't", "couldn't", "shouldn't", "isn't", "aren't", "wasn't", "weren't"]);
const NEGATION_HI = new Set(['नहीं', 'ना', 'मत', 'न']);
const NEGATION_HI_LATN = new Set(['nahi', 'nahin', 'nah', 'na', 'mat']);

// Intensifiers
const INTENSIFIERS: Record<string, number> = {
  'very': 1.3, 'really': 1.3, 'extremely': 1.5, 'absolutely': 1.5,
  'totally': 1.3, 'super': 1.3, 'so': 1.2, 'bahut': 1.3,
  'bohot': 1.3, 'kaafi': 1.2, 'ekdum': 1.4,
};

export const analyzeSentiment = (text: string, language: string): SentimentResult => {
  const words = text.toLowerCase().split(/[\s,;.!?]+/).filter(w => w.length > 0);

  let positiveScore = 0;
  let negativeScore = 0;
  const positiveWords: string[] = [];
  const negativeWords: string[] = [];

  // Select lexicons based on detected language
  const posLexicons = [EN_POSITIVE];
  const negLexicons = [EN_NEGATIVE];
  const negationSets = [NEGATION_EN];

  if (language === 'hi' || language === 'hi-Latn') {
    posLexicons.push(HI_POSITIVE, HI_LATN_POSITIVE);
    negLexicons.push(HI_NEGATIVE, HI_LATN_NEGATIVE);
    negationSets.push(NEGATION_HI, NEGATION_HI_LATN);
  }

  const isNegation = (word: string): boolean =>
    negationSets.some(set => set.has(word));

  let negated = false;
  let intensifier = 1.0;

  for (const word of words) {
    // Check for negation
    if (isNegation(word)) {
      negated = true;
      continue;
    }

    // Check for intensifiers
    if (INTENSIFIERS[word]) {
      intensifier = INTENSIFIERS[word];
      continue;
    }

    // Look up word in positive lexicons
    let posScore = 0;
    let negScore = 0;

    for (const lex of posLexicons) {
      if (lex[word]) {
        posScore = Math.max(posScore, lex[word]);
      }
    }
    for (const lex of negLexicons) {
      if (lex[word]) {
        negScore = Math.max(negScore, lex[word]);
      }
    }

    if (posScore > 0) {
      const adjustedScore = posScore * intensifier;
      if (negated) {
        negativeScore += adjustedScore * 0.7; // Negated positive = weaker negative
        negativeWords.push(word);
      } else {
        positiveScore += adjustedScore;
        positiveWords.push(word);
      }
    }

    if (negScore > 0) {
      const adjustedScore = negScore * intensifier;
      if (negated) {
        positiveScore += adjustedScore * 0.5; // Negated negative = weak positive
        positiveWords.push(word);
      } else {
        negativeScore += adjustedScore;
        negativeWords.push(word);
      }
    }

    // Reset modifiers after a sentiment word is processed
    if (posScore > 0 || negScore > 0) {
      negated = false;
      intensifier = 1.0;
    }
  }

  // Normalize scores
  const totalSentimentWords = positiveWords.length + negativeWords.length;
  const maxScore = Math.max(positiveScore, negativeScore, 0.01);

  // Score from -1 to 1
  const rawScore = totalSentimentWords > 0
    ? (positiveScore - negativeScore) / (positiveScore + negativeScore)
    : 0;

  // Confidence based on coverage and signal strength
  const wordCoverage = totalSentimentWords / Math.max(words.length, 1);
  const confidence = Math.min(0.5 + wordCoverage * 0.5 + maxScore * 0.2, 0.95);

  // Determine overall sentiment label
  let sentiment: SentimentResult['sentiment'];
  if (positiveWords.length > 0 && negativeWords.length > 0 &&
      Math.abs(positiveScore - negativeScore) / maxScore < 0.3) {
    sentiment = 'mixed';
  } else if (rawScore > 0.1) {
    sentiment = 'positive';
  } else if (rawScore < -0.1) {
    sentiment = 'negative';
  } else {
    sentiment = 'neutral';
  }

  return {
    sentiment,
    score: Math.round(rawScore * 100) / 100,
    confidence: Math.round(confidence * 100) / 100,
    breakdown: {
      positiveWords,
      negativeWords,
      positiveScore: Math.round(positiveScore * 100) / 100,
      negativeScore: Math.round(negativeScore * 100) / 100,
    },
  };
};
