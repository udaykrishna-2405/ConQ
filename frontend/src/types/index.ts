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

// ── AI Studio ──

export interface AiStudioGenerateRequest {
  type: 'caption' | 'hook' | 'script_short' | 'script_long' | 'cta' | 'translation' | 'repurpose' | 'calendar';
  topic: string;
  platform: 'youtube' | 'instagram';
  tone?: string;
  language?: string;
  targetLanguages?: string[];
  sourceFormat?: string;
  targetFormats?: string[];
  durationDays?: number;
}

export interface AiStudioVideoAssistRequest {
  type: 'camera_angles' | 'shot_breakdown' | 'editing_style' | 'broll' | 'lighting' | 'framing' | 'platform_tips';
  contentType: string;
  platform: 'youtube' | 'instagram';
  style?: string;
  duration?: string;
}

export interface GeneratedContent {
  generationId: string;
  type: string;
  outputs: ContentOutput[];
  metadata: { platform: string; topic: string; tone: string; language: string; generatedAt: string };
}

export interface ContentOutput {
  variant: string;
  text: string;
  characterCount: number;
  hashtags?: string[];
  estimatedEngagement?: string;
}

export interface VideoAssistResult {
  assistId: string;
  type: string;
  suggestions: VideoSuggestion[];
  metadata: { contentType: string; platform: string; generatedAt: string };
}

export interface VideoSuggestion {
  category: string;
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
  rationale: string;
}

// ── Monetization ──

export interface MonetizationRequest {
  platform: 'youtube' | 'instagram';
  niche?: string;
  followerCount?: number;
  engagementRate?: number;
  avgViews?: number;
}

export interface MonetizationReport {
  reportId: string;
  generatedAt: string;
  revenueEstimate: { monthlyLow: number; monthlyHigh: number; yearlyLow: number; yearlyHigh: number; currency: string; breakdown: { source: string; amount: number; percentage: number }[] };
  cpmRpmForecast: { currentCpm: number; forecastedCpm: number; currentRpm: number; forecastedRpm: number; trend: string; confidence: number };
  brandMatches: { brandName: string; industry: string; matchScore: number; estimatedDealValue: number; currency: string; reason: string }[];
  sponsoredPostPredictor: { estimatedRate: number; currency: string; performanceScore: number; expectedReach: number; expectedEngagement: number; recommendation: string };
  audienceInterests: { interest: string; percentage: number; monetizationPotential: string }[];
}

// ── Content Shield ──

export interface ContentShieldRequest {
  text: string;
  platform: 'youtube' | 'instagram';
  contentType?: string;
  checkCopyright?: boolean;
  checkPolicy?: boolean;
  checkBrandSafety?: boolean;
}

export interface ContentShieldReport {
  reportId: string;
  generatedAt: string;
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  overallScore: number;
  policyViolations: { category: string; severity: string; description: string; matchedPhrase: string; suggestion: string }[];
  copyrightRisks: { type: string; risk: string; description: string; detectedElement: string; recommendation: string }[];
  brandSafetyIssues: { category: string; severity: string; description: string; impact: string }[];
  recommendations: string[];
  platformGuidelines: { rule: string; status: 'pass' | 'warning' | 'fail'; detail: string }[];
}

// ── Growth Intelligence ──

export interface GrowthForecastRequest {
  platform: 'youtube' | 'instagram';
  timeframeMonths?: number;
  currentFollowers?: number;
  currentEngagementRate?: number;
  postsPerWeek?: number;
  niche?: string;
}

export interface GrowthForecastReport {
  reportId: string;
  generatedAt: string;
  forecast: { month: number; label: string; projectedFollowers: number; projectedEngagementRate: number; projectedMonthlyViews: number; confidence: number }[];
  milestones: { label: string; targetFollowers: number; estimatedMonths: number; unlockedBenefits: string[] }[];
  growthDrivers: { factor: string; impact: string; currentScore: number; recommendation: string }[];
  actionPlan: { priority: number; action: string; expectedImpact: string; category: string }[];
}

export interface CompetitorBenchmarkRequest {
  platform: 'youtube' | 'instagram';
  niche: string;
  followerCount?: number;
  engagementRate?: number;
}

export interface CompetitorBenchmarkReport {
  reportId: string;
  generatedAt: string;
  yourMetrics: { followers: number; engagementRate: number; postsPerWeek: number; avgViewsPerPost: number; growthRateMonthly: number };
  nicheAverage: { followers: number; engagementRate: number; postsPerWeek: number; avgViewsPerPost: number; growthRateMonthly: number };
  topPerformers: { followers: number; engagementRate: number; postsPerWeek: number; avgViewsPerPost: number; growthRateMonthly: number };
  percentileRank: number;
  gaps: { metric: string; yourValue: number; benchmarkValue: number; gap: number; recommendation: string }[];
  opportunities: string[];
}

// ── Automation ──

export interface ScheduleRequest {
  title: string;
  platform: 'youtube' | 'instagram';
  contentType?: string;
  preferredTime?: string;
  timezone?: string;
  niche?: string;
}

export interface ScheduleResult {
  scheduleId: string;
  generatedAt: string;
  bestTimes: { dayOfWeek: string; time: string; timezone: string; expectedReachMultiplier: number; reason: string }[];
  weeklyPlan: { day: string; slots: { time: string; contentType: string; priority: string }[] }[];
  tips: string[];
}

export interface HashtagRequest {
  topic: string;
  platform: 'youtube' | 'instagram';
  niche?: string;
  count?: number;
}

export interface HashtagResult {
  hashtagId: string;
  generatedAt: string;
  hashtags: { tag: string; category: string; popularity: string; competitiveness: string; recommended: boolean }[];
  strategy: { total: number; mix: { trending: number; niche: number; branded: number; community: number }; advice: string };
}

export interface ABTestRequest {
  platform: 'youtube' | 'instagram';
  variantA: { title: string; description?: string };
  variantB: { title: string; description?: string };
  niche?: string;
  followerCount?: number;
}

export interface ABTestResult {
  testId: string;
  generatedAt: string;
  variantA: { title: string; predictedCtr: number; predictedEngagement: number; predictedReach: number; strengths: string[]; weaknesses: string[]; score: number };
  variantB: { title: string; predictedCtr: number; predictedEngagement: number; predictedReach: number; strengths: string[]; weaknesses: string[]; score: number };
  winner: 'A' | 'B';
  confidence: number;
  reasoning: string[];
  recommendation: string;
}

// ── Creator Scorecard ──

export interface CreatorScorecardRequest {
  platform: 'youtube' | 'instagram';
  niche?: string;
  followerCount?: number;
  engagementRate?: number;
  postsPerWeek?: number;
  avgViews?: number;
  contentQuality?: number;
}

export interface CreatorScorecard {
  scorecardId: string;
  generatedAt: string;
  overallScore: number;
  grade: string;
  tier: string;
  dimensions: { name: string; score: number; maxScore: number; weight: number; description: string; tips: string[] }[];
  brandStrength: { score: number; pillars: { name: string; score: number; description: string }[]; dealReadiness: string; estimatedBrandValue: number; currency: string };
  peerComparison: { percentile: number; nicheName: string; avgScore: number; topScore: number; ranking: string };
  improvementPlan: { priority: number; dimension: string; currentScore: number; targetScore: number; action: string; expectedImpact: string }[];
  badges: { name: string; icon: string; description: string; earned: boolean; requirement: string }[];
}
