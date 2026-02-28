// Mock Trend Data Generator
// Generates realistic trend data for Indian creator economy topics.
// Simulates what a real-time data pipeline (EventBridge + SQS) would produce.
//
// In production, replace with:
//   - YouTube Trending API ingestion
//   - Instagram hashtag volume tracking
//   - Twitter/X trending topics
//   - Google Trends API

import { TrendDataPoint } from './trendCalculator';

interface TrendSeed {
  keyword: string;
  baseVolume: number;
  region: string;
  language: string;
  trendDirection: 'rising' | 'falling' | 'stable' | 'spike';
}

// Curated seed data representing typical Indian creator economy trends
const TREND_SEEDS: TrendSeed[] = [
  // Technology
  { keyword: 'AI Tutorial', baseVolume: 5000, region: 'india', language: 'en', trendDirection: 'rising' },
  { keyword: 'ChatGPT Tips', baseVolume: 8000, region: 'india', language: 'en', trendDirection: 'spike' },
  { keyword: 'Coding Challenge', baseVolume: 3000, region: 'india', language: 'en', trendDirection: 'rising' },
  { keyword: 'Web3 India', baseVolume: 2000, region: 'india', language: 'en', trendDirection: 'falling' },

  // Hindi content
  { keyword: 'टेक टिप्स', baseVolume: 4000, region: 'india', language: 'hi', trendDirection: 'rising' },
  { keyword: 'मोटिवेशन', baseVolume: 6000, region: 'india', language: 'hi', trendDirection: 'stable' },
  { keyword: 'कुकिंग रेसिपी', baseVolume: 7000, region: 'india', language: 'hi', trendDirection: 'rising' },
  { keyword: 'क्रिकेट हाइलाइट्स', baseVolume: 15000, region: 'india', language: 'hi', trendDirection: 'spike' },

  // Entertainment
  { keyword: 'Bollywood Review', baseVolume: 10000, region: 'india', language: 'en', trendDirection: 'stable' },
  { keyword: 'OTT Series', baseVolume: 4500, region: 'india', language: 'en', trendDirection: 'rising' },
  { keyword: 'Indie Music', baseVolume: 3500, region: 'india', language: 'en', trendDirection: 'rising' },

  // Regional
  { keyword: 'Tamil Vlog', baseVolume: 3000, region: 'tamil-nadu', language: 'ta', trendDirection: 'rising' },
  { keyword: 'Bengali Food', baseVolume: 2500, region: 'west-bengal', language: 'bn', trendDirection: 'stable' },
  { keyword: 'Telugu Comedy', baseVolume: 4000, region: 'telangana', language: 'te', trendDirection: 'spike' },
  { keyword: 'Kannada Tech', baseVolume: 1500, region: 'karnataka', language: 'kn', trendDirection: 'rising' },

  // Lifestyle
  { keyword: 'Fitness Routine', baseVolume: 5500, region: 'india', language: 'en', trendDirection: 'stable' },
  { keyword: 'Street Food Tour', baseVolume: 8000, region: 'india', language: 'en', trendDirection: 'rising' },
  { keyword: 'Travel Vlog India', baseVolume: 6000, region: 'india', language: 'en', trendDirection: 'rising' },

  // Finance
  { keyword: 'Stock Market Tips', baseVolume: 7000, region: 'india', language: 'en', trendDirection: 'rising' },
  { keyword: 'Crypto India', baseVolume: 3000, region: 'india', language: 'en', trendDirection: 'falling' },
  { keyword: 'Mutual Fund SIP', baseVolume: 4000, region: 'india', language: 'en', trendDirection: 'rising' },

  // Gaming
  { keyword: 'BGMI Tournament', baseVolume: 9000, region: 'india', language: 'en', trendDirection: 'spike' },
  { keyword: 'GTA 6 India', baseVolume: 5000, region: 'india', language: 'en', trendDirection: 'rising' },

  // Education
  { keyword: 'UPSC Preparation', baseVolume: 12000, region: 'india', language: 'en', trendDirection: 'stable' },
  { keyword: 'JEE Tips', baseVolume: 8000, region: 'india', language: 'en', trendDirection: 'rising' },
];

/**
 * Applies a growth multiplier based on the trend direction.
 * Adds randomness to simulate real-world variance.
 */
const applyTrendDirection = (baseVolume: number, direction: TrendSeed['trendDirection']): {
  currentVolume: number;
  previousVolume: number;
} => {
  const jitter = () => 0.9 + Math.random() * 0.2; // +-10% noise

  switch (direction) {
    case 'spike':
      return {
        currentVolume: Math.round(baseVolume * (2.5 + Math.random() * 1.5) * jitter()),
        previousVolume: Math.round(baseVolume * (1.3 + Math.random() * 0.5) * jitter()),
      };
    case 'rising':
      return {
        currentVolume: Math.round(baseVolume * (1.5 + Math.random() * 0.8) * jitter()),
        previousVolume: Math.round(baseVolume * (1.1 + Math.random() * 0.3) * jitter()),
      };
    case 'stable':
      return {
        currentVolume: Math.round(baseVolume * (0.95 + Math.random() * 0.1) * jitter()),
        previousVolume: Math.round(baseVolume * (0.95 + Math.random() * 0.1) * jitter()),
      };
    case 'falling':
      return {
        currentVolume: Math.round(baseVolume * (0.4 + Math.random() * 0.3) * jitter()),
        previousVolume: Math.round(baseVolume * (0.7 + Math.random() * 0.2) * jitter()),
      };
  }
};

/**
 * Generates trend data points from seed data.
 * Optionally filters by region and/or language.
 */
export const generateTrendData = (filters?: {
  region?: string;
  language?: string;
}): TrendDataPoint[] => {
  let seeds = TREND_SEEDS;

  if (filters?.region) {
    seeds = seeds.filter(s =>
      s.region === filters.region || s.region === 'india'
    );
  }

  if (filters?.language) {
    seeds = seeds.filter(s => s.language === filters.language);
  }

  return seeds.map(seed => {
    const { currentVolume, previousVolume } = applyTrendDirection(seed.baseVolume, seed.trendDirection);

    return {
      keyword: seed.keyword,
      currentVolume,
      baselineVolume: seed.baseVolume,
      previousVolume,
      region: seed.region,
      language: seed.language,
    };
  });
};

/**
 * Generates trend data for a specific date (deterministic seeding for consistency).
 * Uses date string as seed offset for reproducible results per day.
 */
export const generateDailyTrendData = (
  date: string,
  filters?: { region?: string; language?: string }
): TrendDataPoint[] => {
  // Use date to create a deterministic seed offset
  const dateHash = date.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const savedRandom = Math.random;

  // Simple seeded random (for deterministic daily trends)
  let seed = dateHash;
  const seededRandom = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  // Temporarily replace Math.random
  Math.random = seededRandom;
  const data = generateTrendData(filters);
  Math.random = savedRandom;

  return data;
};
