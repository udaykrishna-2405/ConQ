// ConQ Frontend Type Definitions
// Matches backend API response shapes exactly.

// ── Auth ──

export interface OnboardingData {
  youtubeChannelId?: string;
  instagramHandle?: string;
  contentNiche?: string[];
  goals?: string[];
}

export interface User {
  userId: string;
  tenantId: string;
  email: string;
  name: string;
  role: 'admin' | 'creator' | 'viewer';
  tier: 'free' | 'pro' | 'enterprise';
  platforms: string[];
  onboarding?: OnboardingData | null;
  onboardingCompleted?: boolean;
}

export interface UpdateProfileRequest {
  name?: string;
  platforms?: string[];
  onboarding?: OnboardingData;
  onboardingCompleted?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
  tenantId: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  tenantId?: string;
  role?: 'admin' | 'creator' | 'viewer';
}

export interface AuthResponse {
  token: string;
  user: User;
}

// ── NLP ──

export interface NlpAnalyzeRequest {
  text: string;
  platform?: 'youtube' | 'instagram';
}

export interface NlpResult {
  language: string;
  languageName: string;
  confidence: number;
  isCodeMixed: boolean;
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  sentimentScore: number;
  sentimentConfidence: number;
  entities: Entity[];
}

export interface Entity {
  text: string;
  type: string;
  confidence: number;
}

// ── Virality Prediction ──

export interface PredictionRequest {
  title: string;
  description?: string;
  tags?: string[];
  platform: 'youtube' | 'instagram';
  language?: string;
  historicalEngagementRate?: number;
  followerCount?: number;
}

export interface ViralityPrediction {
  score: number;
  confidence: number;
  explanation: FeatureImpact[];
  riskLevel: string;
}

export interface FeatureImpact {
  feature: string;
  impact: number;
  direction: 'positive' | 'negative';
  label: string;
}

// ── Trends ──

export interface TrendQuery {
  region?: string;
  language?: string;
  category?: 'emerging' | 'trending' | 'viral' | 'declining';
  limit?: number;
  date?: string;
}

export interface TrendResponse {
  date: string;
  region: string;
  totalTrends: number;
  trends: Trend[];
  summary: {
    viral: number;
    trending: number;
    emerging: number;
    declining: number;
  };
}

export interface Trend {
  trendId: string;
  keyword: string;
  category: 'emerging' | 'trending' | 'viral' | 'declining';
  score: number;
  normalizedScore: number;
  velocity: number;
  growthRate: number;
  region: string;
  language: string;
}

// ── Analytics Dashboard ──

export interface DashboardResponse {
  tenantId: string;
  generatedAt: string;
  snapshotId: string;
  platforms: {
    youtube: YouTubeSummary;
    instagram: InstagramSummary;
  };
  unified: UnifiedMetrics;
  topContent: TopContentItem[];
  trendAlignment: TrendAlignmentItem[];
}

export interface YouTubeSummary {
  channel: {
    channelId: string;
    title: string;
    subscriberCount: number;
    videoCount: number;
    viewCount: number;
    thumbnailUrl: string;
  };
  aggregated: {
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    avgEngagementRate: number;
    videoCount: number;
  };
  recentVideos: YouTubeVideo[];
}

export interface YouTubeVideo {
  videoId: string;
  title: string;
  publishedAt: string;
  stats: {
    viewCount: number;
    likeCount: number;
    commentCount: number;
    shareCount: number;
  };
  engagementRate: number;
}

export interface InstagramSummary {
  profile: {
    profileId: string;
    username: string;
    followersCount: number;
    followingCount: number;
    mediaCount: number;
    biography: string;
  };
  aggregated: {
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    totalSaves: number;
    totalReach: number;
    totalImpressions: number;
    avgEngagementRate: number;
    postCount: number;
  };
  recentPosts: InstagramPost[];
}

export interface InstagramPost {
  postId: string;
  caption: string;
  mediaType: 'image' | 'video' | 'carousel';
  publishedAt: string;
  stats: {
    likeCount: number;
    commentCount: number;
    shareCount: number;
    saveCount: number;
    reachCount: number;
    impressionCount: number;
  };
  engagementRate: number;
}

export interface UnifiedMetrics {
  totalEngagements: number;
  totalReach: number;
  weightedEngagementRate: number;
  contentCount: number;
  platformBreakdown: {
    youtube: { engagements: number; percentage: number };
    instagram: { engagements: number; percentage: number };
  };
  growthIndicators: {
    subscriberToFollowerRatio: number;
    crossPlatformPresence: number;
  };
}

export interface TopContentItem {
  platform: 'youtube' | 'instagram';
  contentId: string;
  title: string;
  engagementRate: number;
  totalEngagements: number;
  publishedAt: string;
}

export interface TrendAlignmentItem {
  keyword: string;
  platform: 'youtube' | 'instagram';
  contentId: string;
  contentTitle: string;
  alignmentScore: number;
}

// ── Shared ──

export interface ApiError {
  error: string;
  code?: string;
  statusCode: number;
}
