// Virality Scoring Model (Mock)
// Weighted heuristic model that simulates XGBoost virality prediction.
// Each feature has a learned weight and contribution direction.
//
// In production, replace this with SageMaker endpoint invocation
// calling a trained XGBoost or neural network model.

import { ExtractedFeatures, getFeatureNames, featuresToVector } from './featureExtractor';
import { FeatureImpact } from '../../models/schemas';

interface ModelOutput {
  score: number;        // 0-100
  confidence: number;   // 0-1
  featureImportances: FeatureImpact[];
}

// Feature weights learned from historical data (mock — simulates trained model)
// Positive weight = increases virality, negative = decreases
const FEATURE_WEIGHTS: Record<string, { weight: number; bias: number }> = {
  title_length:                { weight: 0.02,   bias: 0 },        // Moderate length helps
  description_length:          { weight: 0.005,  bias: 0 },        // Longer descriptions mildly help
  title_word_count:            { weight: 0.8,    bias: -3 },       // Sweet spot ~8-12 words
  description_word_count:      { weight: 0.1,    bias: 0 },
  hashtag_count:               { weight: 2.5,    bias: 0 },        // Hashtags help discoverability
  mention_count:               { weight: 1.5,    bias: 0 },        // Mentions drive engagement
  emoji_count:                 { weight: 1.0,    bias: 0 },        // Emojis increase CTR
  url_count:                   { weight: -1.0,   bias: 0 },        // URLs can reduce reach
  question_mark_count:         { weight: 3.0,    bias: 0 },        // Questions drive engagement
  exclamation_count:           { weight: 1.5,    bias: 0 },        // Excitement signals
  caps_ratio:                  { weight: -5.0,   bias: 0 },        // Too many caps = spam
  sentiment_score:             { weight: 8.0,    bias: 5 },        // Strong sentiment (pos/neg) = viral
  entity_count:                { weight: 1.5,    bias: 0 },        // Named entities add relevance
  topic_count:                 { weight: 3.0,    bias: 0 },        // Trending topics boost
  is_code_mixed:               { weight: 4.0,    bias: 0 },        // Code-mixing resonates in India
  tag_count:                   { weight: 1.0,    bias: 0 },
  avg_tag_length:              { weight: 0.3,    bias: 0 },
  is_youtube:                  { weight: 2.0,    bias: 0 },        // Platform factor
  hour_of_day:                 { weight: 0,      bias: 0 },        // Handled by time bonus
  day_of_week:                 { weight: 0,      bias: 0 },        // Handled by weekend bonus
  is_weekend:                  { weight: 3.0,    bias: 0 },        // Weekend posts get more views
  follower_count:              { weight: 0.00005, bias: 0 },       // More followers = more reach
  historical_engagement_rate:  { weight: 25.0,   bias: 0 },        // Past performance predicts future
  title_engagement_potential:  { weight: 10.0,   bias: -10 },      // Composite title score
  content_density:             { weight: 8.0,    bias: 0 },        // Rich content performs better
};

// Optimal posting hours (IST-aligned for Indian audience)
const OPTIMAL_HOURS = new Set([9, 10, 11, 12, 17, 18, 19, 20, 21]);

/**
 * Computes virality score using weighted feature summation.
 * Simulates trained XGBoost model output.
 */
export const predictVirality = (features: ExtractedFeatures): ModelOutput => {
  const featureNames = getFeatureNames();
  const featureVector = featuresToVector(features);

  let rawScore = 30; // Base score
  const contributions: Array<{ name: string; value: number; contribution: number }> = [];

  // Compute weighted sum
  featureNames.forEach((name, index) => {
    const config = FEATURE_WEIGHTS[name];
    if (!config) return;

    const value = featureVector[index];
    const contribution = (value + config.bias) * config.weight;
    rawScore += contribution;

    contributions.push({ name, value, contribution });
  });

  // Time-of-day bonus
  if (OPTIMAL_HOURS.has(features.hourOfDay)) {
    rawScore += 5;
    contributions.push({ name: 'optimal_posting_time', value: 1, contribution: 5 });
  }

  // Platform-specific bonuses
  if (features.platform === 'instagram' && features.hashtagCount >= 5 && features.hashtagCount <= 15) {
    rawScore += 5; // Instagram sweet spot for hashtags
    contributions.push({ name: 'instagram_hashtag_optimal', value: features.hashtagCount, contribution: 5 });
  }

  if (features.platform === 'youtube' && features.descriptionWordCount >= 50) {
    rawScore += 3; // YouTube rewards detailed descriptions
    contributions.push({ name: 'youtube_description_bonus', value: features.descriptionWordCount, contribution: 3 });
  }

  // Clamp score to 0-100
  const score = Math.max(0, Math.min(100, Math.round(rawScore)));

  // Confidence based on feature coverage
  const nonZeroFeatures = featureVector.filter(v => v !== 0).length;
  const coverageRatio = nonZeroFeatures / featureVector.length;
  const confidence = Math.min(
    0.5 + coverageRatio * 0.4 + (features.historicalEngagementRate > 0 ? 0.1 : 0),
    0.95
  );

  // Sort contributions by absolute impact (descending)
  contributions.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

  // Build feature importances (SHAP-style explanation)
  const featureImportances: FeatureImpact[] = contributions
    .filter(c => Math.abs(c.contribution) > 0.5) // Only meaningful contributions
    .slice(0, 8) // Top 8 features
    .map(c => ({
      feature: formatFeatureName(c.name),
      impact: Math.round(Math.abs(c.contribution) * 100) / 100,
      direction: c.contribution >= 0 ? 'positive' as const : 'negative' as const,
    }));

  return {
    score,
    confidence: Math.round(confidence * 100) / 100,
    featureImportances,
  };
};

/**
 * Converts internal feature names to human-readable labels.
 */
const formatFeatureName = (name: string): string => {
  const labels: Record<string, string> = {
    sentiment_score: 'Sentiment Strength',
    title_engagement_potential: 'Title Quality',
    historical_engagement_rate: 'Creator Track Record',
    content_density: 'Content Richness',
    hashtag_count: 'Hashtag Usage',
    topic_count: 'Trending Topic Alignment',
    question_mark_count: 'Engagement Hooks (Questions)',
    mention_count: 'Collaborator Mentions',
    is_code_mixed: 'Multilingual Appeal',
    emoji_count: 'Emoji Usage',
    exclamation_count: 'Excitement Signals',
    is_weekend: 'Weekend Posting',
    follower_count: 'Audience Size',
    caps_ratio: 'Excessive Caps',
    url_count: 'External Links',
    optimal_posting_time: 'Optimal Posting Time',
    instagram_hashtag_optimal: 'Instagram Hashtag Strategy',
    youtube_description_bonus: 'YouTube Description Quality',
    title_word_count: 'Title Length',
    is_youtube: 'YouTube Platform',
    tag_count: 'Tag Count',
  };
  return labels[name] || name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};
