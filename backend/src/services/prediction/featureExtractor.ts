// Feature Extraction Layer
// Extracts numerical and categorical features from content for virality prediction.
// Features are designed to align with the XGBoost model training schema.

import { detectLanguage } from '../nlp/languageDetector';
import { analyzeSentiment } from '../nlp/sentimentAnalyzer';
import { extractEntities } from '../nlp/entityExtractor';

export interface ContentInput {
  title: string;
  description?: string;
  tags?: string[];
  platform: 'youtube' | 'instagram';
  language?: string;
  historicalEngagementRate?: number;
  followerCount?: number;
}

export interface ExtractedFeatures {
  // Text features
  titleLength: number;
  descriptionLength: number;
  titleWordCount: number;
  descriptionWordCount: number;
  hashtagCount: number;
  mentionCount: number;
  emojiCount: number;
  urlCount: number;
  questionMarkCount: number;
  exclamationCount: number;
  capsRatio: number;

  // NLP features
  sentimentScore: number;
  sentimentLabel: string;
  entityCount: number;
  topicCount: number;
  isCodeMixed: boolean;
  language: string;

  // Metadata features
  tagCount: number;
  avgTagLength: number;
  platform: string;

  // Temporal features (posting time)
  hourOfDay: number;
  dayOfWeek: number;
  isWeekend: boolean;

  // Creator features
  followerCount: number;
  historicalEngagementRate: number;

  // Composite features
  titleEngagementPotential: number;  // Combination signal
  contentDensity: number;           // Information density metric
}

// Emoji regex (simplified — covers most common emoji ranges)
const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
const URL_REGEX = /https?:\/\/[\S]+/g;

/**
 * Extracts all features from content input for model inference.
 */
export const extractFeatures = (input: ContentInput): ExtractedFeatures => {
  const fullText = `${input.title} ${input.description || ''}`;

  // NLP analysis
  const langResult = detectLanguage(fullText);
  const language = input.language || langResult.language;
  const sentimentResult = analyzeSentiment(fullText, language);
  const entityResult = extractEntities(fullText);

  // Text metrics
  const titleWords = input.title.split(/\s+/).filter(w => w.length > 0);
  const descWords = (input.description || '').split(/\s+/).filter(w => w.length > 0);
  const emojiMatches = fullText.match(EMOJI_REGEX) || [];
  const urlMatches = fullText.match(URL_REGEX) || [];

  // Caps ratio (uppercase letters / total letters)
  const letters = fullText.replace(/[^a-zA-Z]/g, '');
  const upperLetters = fullText.replace(/[^A-Z]/g, '');
  const capsRatio = letters.length > 0 ? upperLetters.length / letters.length : 0;

  // Temporal features (based on current time — in production, use scheduled post time)
  const now = new Date();
  const hourOfDay = now.getHours();
  const dayOfWeek = now.getDay();

  // Topic count from entities
  const topicCount = entityResult.entities.filter(e => e.type === 'topic').length;

  // Composite: title engagement potential
  // Titles with questions, exclamations, moderate length, and strong sentiment tend to perform better
  const questionFactor = (input.title.match(/\?/g) || []).length > 0 ? 1.2 : 1.0;
  const exclamationFactor = (input.title.match(/!/g) || []).length > 0 ? 1.1 : 1.0;
  const lengthFactor = titleWords.length >= 5 && titleWords.length <= 15 ? 1.15 : 0.9;
  const sentimentFactor = Math.abs(sentimentResult.score) > 0.3 ? 1.2 : 1.0;
  const titleEngagementPotential = questionFactor * exclamationFactor * lengthFactor * sentimentFactor;

  // Content density: entities + hashtags + topics relative to word count
  const totalWords = titleWords.length + descWords.length;
  const contentDensity = totalWords > 0
    ? (entityResult.entities.length + entityResult.hashtagCount + topicCount) / totalWords
    : 0;

  return {
    titleLength: input.title.length,
    descriptionLength: (input.description || '').length,
    titleWordCount: titleWords.length,
    descriptionWordCount: descWords.length,
    hashtagCount: entityResult.hashtagCount,
    mentionCount: entityResult.mentionCount,
    emojiCount: emojiMatches.length,
    urlCount: urlMatches.length,
    questionMarkCount: (fullText.match(/\?/g) || []).length,
    exclamationCount: (fullText.match(/!/g) || []).length,
    capsRatio: Math.round(capsRatio * 100) / 100,

    sentimentScore: sentimentResult.score,
    sentimentLabel: sentimentResult.sentiment,
    entityCount: entityResult.entities.length,
    topicCount,
    isCodeMixed: langResult.isCodeMixed,
    language,

    tagCount: (input.tags || []).length,
    avgTagLength: (input.tags || []).length > 0
      ? Math.round((input.tags!.reduce((sum, t) => sum + t.length, 0) / input.tags!.length) * 10) / 10
      : 0,
    platform: input.platform,

    hourOfDay,
    dayOfWeek,
    isWeekend: dayOfWeek === 0 || dayOfWeek === 6,

    followerCount: input.followerCount || 0,
    historicalEngagementRate: input.historicalEngagementRate || 0,

    titleEngagementPotential: Math.round(titleEngagementPotential * 100) / 100,
    contentDensity: Math.round(contentDensity * 100) / 100,
  };
};

/**
 * Converts features to a flat numeric array for model input.
 * Order must match the training feature order.
 */
export const featuresToVector = (features: ExtractedFeatures): number[] => {
  return [
    features.titleLength,
    features.descriptionLength,
    features.titleWordCount,
    features.descriptionWordCount,
    features.hashtagCount,
    features.mentionCount,
    features.emojiCount,
    features.urlCount,
    features.questionMarkCount,
    features.exclamationCount,
    features.capsRatio,
    features.sentimentScore,
    features.entityCount,
    features.topicCount,
    features.isCodeMixed ? 1 : 0,
    features.tagCount,
    features.avgTagLength,
    features.platform === 'youtube' ? 1 : 0,
    features.hourOfDay,
    features.dayOfWeek,
    features.isWeekend ? 1 : 0,
    features.followerCount,
    features.historicalEngagementRate,
    features.titleEngagementPotential,
    features.contentDensity,
  ];
};

/**
 * Returns the ordered list of feature names matching featuresToVector output.
 */
export const getFeatureNames = (): string[] => [
  'title_length',
  'description_length',
  'title_word_count',
  'description_word_count',
  'hashtag_count',
  'mention_count',
  'emoji_count',
  'url_count',
  'question_mark_count',
  'exclamation_count',
  'caps_ratio',
  'sentiment_score',
  'entity_count',
  'topic_count',
  'is_code_mixed',
  'tag_count',
  'avg_tag_length',
  'is_youtube',
  'hour_of_day',
  'day_of_week',
  'is_weekend',
  'follower_count',
  'historical_engagement_rate',
  'title_engagement_potential',
  'content_density',
];
