// Trend Scoring Calculator
// Implements the velocity-based trend scoring formula:
//
//   trend_score = ((current_volume - baseline_volume) / baseline_volume) * velocity_factor
//
// Categories are assigned based on score thresholds:
//   Emerging:  10 <= score < 30
//   Trending:  30 <= score < 60
//   Viral:     score >= 60
//   Declining: score < 0

export interface TrendDataPoint {
  keyword: string;
  currentVolume: number;
  baselineVolume: number;
  previousVolume: number;
  region: string;
  language: string;
}

export interface TrendScoreResult {
  keyword: string;
  score: number;
  normalizedScore: number;   // 0-100
  velocity: number;
  category: 'emerging' | 'trending' | 'viral' | 'declining';
  growthRate: number;        // Percentage growth over baseline
  region: string;
  language: string;
}

// Category thresholds (on normalized 0-100 scale)
const CATEGORY_THRESHOLDS = {
  viral: 60,
  trending: 30,
  emerging: 10,
};

/**
 * Calculates the velocity factor based on volume acceleration.
 * Velocity > 1 means volume is accelerating (current growth > previous growth).
 * Velocity < 1 means volume is decelerating.
 */
const calculateVelocity = (
  currentVolume: number,
  previousVolume: number,
  baselineVolume: number
): number => {
  const currentGrowth = baselineVolume > 0
    ? (currentVolume - baselineVolume) / baselineVolume
    : 0;

  const previousGrowth = baselineVolume > 0
    ? (previousVolume - baselineVolume) / baselineVolume
    : 0;

  // Velocity is the ratio of current growth to previous growth
  // Clamped to [0.1, 5.0] to prevent extreme values
  if (previousGrowth <= 0) {
    return currentGrowth > 0 ? 2.0 : 0.5;
  }

  const velocity = currentGrowth / previousGrowth;
  return Math.max(0.1, Math.min(5.0, velocity));
};

/**
 * Classifies a trend based on its normalized score.
 */
const classifyTrend = (normalizedScore: number): TrendScoreResult['category'] => {
  if (normalizedScore >= CATEGORY_THRESHOLDS.viral) return 'viral';
  if (normalizedScore >= CATEGORY_THRESHOLDS.trending) return 'trending';
  if (normalizedScore >= CATEGORY_THRESHOLDS.emerging) return 'emerging';
  return 'declining';
};

/**
 * Computes the trend score for a single data point.
 *
 * Formula:
 *   raw_score = ((current - baseline) / baseline) * velocity_factor
 *   normalized_score = clamp(raw_score * scale_factor, 0, 100)
 */
export const calculateTrendScore = (dataPoint: TrendDataPoint): TrendScoreResult => {
  const { keyword, currentVolume, baselineVolume, previousVolume, region, language } = dataPoint;

  // Guard against zero baseline
  if (baselineVolume <= 0) {
    return {
      keyword,
      score: 0,
      normalizedScore: 0,
      velocity: 0,
      category: 'declining',
      growthRate: 0,
      region,
      language,
    };
  }

  // Growth rate
  const growthRate = ((currentVolume - baselineVolume) / baselineVolume) * 100;

  // Velocity factor
  const velocity = calculateVelocity(currentVolume, previousVolume, baselineVolume);

  // Raw trend score
  const rawScore = ((currentVolume - baselineVolume) / baselineVolume) * velocity;

  // Normalize to 0-100 scale (raw score typically ranges -1 to ~10)
  const scaleFactor = 10;
  const normalizedScore = Math.max(0, Math.min(100, Math.round(rawScore * scaleFactor)));

  // Classify
  const category = classifyTrend(normalizedScore);

  return {
    keyword,
    score: Math.round(rawScore * 100) / 100,
    normalizedScore,
    velocity: Math.round(velocity * 100) / 100,
    category,
    growthRate: Math.round(growthRate * 10) / 10,
    region,
    language,
  };
};

/**
 * Batch-scores multiple trend data points and sorts by score descending.
 */
export const calculateBatchTrendScores = (
  dataPoints: TrendDataPoint[]
): TrendScoreResult[] => {
  return dataPoints
    .map(calculateTrendScore)
    .sort((a, b) => b.normalizedScore - a.normalizedScore);
};
