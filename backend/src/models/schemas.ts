// User Model – DynamoDB Schema
// All models include tenant_id as partition key for multi-tenant isolation.

export interface OnboardingData {
  youtubeChannelId?: string;
  instagramHandle?: string;
  contentNiche?: string[];
  goals?: string[];
}

export interface User {
  tenant_id: string;       // Partition key
  user_id: string;         // Sort key
  email: string;
  name: string;
  role: 'admin' | 'creator' | 'viewer';
  tier: 'free' | 'pro' | 'enterprise';
  platforms: string[];     // Connected platforms: ['youtube', 'instagram']
  onboarding?: OnboardingData;
  onboarding_completed?: boolean;
  password_hash?: string;  // PBKDF2 hash (mock auth only; Cognito in production)
  password_salt?: string;  // PBKDF2 salt (mock auth only; Cognito in production)
  created_at: string;      // ISO 8601
  updated_at: string;      // ISO 8601
}

export interface Content {
  tenant_id: string;       // Partition key
  content_id: string;      // Sort key
  platform: 'youtube' | 'instagram';
  title: string;
  description: string;
  language: string;
  tags: string[];
  metrics: ContentMetrics;
  nlp_analysis?: NlpAnalysis;
  virality_score?: number;
  created_at: string;
  updated_at: string;
}

export interface ContentMetrics {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  engagement_rate: number;
}

export interface NlpAnalysis {
  language: string;
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  sentiment_score: number;
  entities: Entity[];
  is_code_mixed: boolean;
}

export interface Entity {
  text: string;
  type: 'person' | 'location' | 'organization' | 'hashtag' | 'topic';
  confidence: number;
}

export interface Prediction {
  tenant_id: string;       // Partition key
  prediction_id: string;   // Sort key
  content_id: string;
  score: number;           // 0-100
  confidence: number;      // 0-1
  explanation: FeatureImpact[];
  model_version: string;
  created_at: string;
  ttl: number;             // DynamoDB TTL (epoch seconds)
}

export interface FeatureImpact {
  feature: string;
  impact: number;
  direction: 'positive' | 'negative';
}

export interface Trend {
  tenant_id: string;       // Partition key (use 'global' for shared trends)
  trend_id: string;        // Sort key
  keyword: string;
  category: 'emerging' | 'trending' | 'viral' | 'declining';
  score: number;
  velocity: number;
  region: string;
  language: string;
  date: string;            // ISO 8601 date
  created_at: string;
}
