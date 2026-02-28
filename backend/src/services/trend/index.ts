// Trend Service Index
// Re-exports all trend sub-modules.

export { calculateTrendScore, calculateBatchTrendScores } from './trendCalculator';
export type { TrendDataPoint, TrendScoreResult } from './trendCalculator';
export { generateTrendData, generateDailyTrendData } from './trendDataGenerator';
