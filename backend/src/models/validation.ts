// Validation Schemas
// Zod schemas for request body validation across all endpoints.
// All string inputs have max length constraints to prevent abuse.

import { z } from 'zod';

// ── Auth Schemas ──

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address').max(254),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  tenantId: z.string().min(1, 'Tenant ID is required').max(100).trim(),
});

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address').max(254),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password exceeds maximum length'),
  name: z.string().min(1, 'Name is required').max(100).trim(),
  tenantId: z.string().max(100).trim().optional(),
  role: z.enum(['admin', 'creator', 'viewer']).optional(),
  tier: z.enum(['free', 'pro', 'enterprise']).optional(),
});

// ── User Schemas ──

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  platforms: z.array(z.enum(['youtube', 'instagram'])).max(10).optional(),
  onboarding: z.object({
    youtubeChannelId: z.string().max(100).trim().optional(),
    instagramHandle: z.string().max(100).trim().optional(),
    contentNiche: z.array(z.string().max(50).trim()).max(5).optional(),
    goals: z.array(z.string().max(50).trim()).max(5).optional(),
  }).optional(),
  onboardingCompleted: z.boolean().optional(),
});

// ── NLP Schemas (Phase 2) ──

export const nlpAnalyzeSchema = z.object({
  text: z.string().min(1, 'Text is required').max(5000),
  platform: z.enum(['youtube', 'instagram']).optional(),
});

// ── Prediction Schemas (Phase 3) ──

export const viralityPredictSchema = z.object({
  title: z.string().min(1).max(500).trim(),
  description: z.string().max(5000).trim().optional(),
  tags: z.array(z.string().max(50).trim()).max(30).optional(),
  platform: z.enum(['youtube', 'instagram']),
  language: z.string().max(50).optional(),
  historicalEngagementRate: z.number().min(0).max(1).optional(),
  followerCount: z.number().int().min(0).max(1_000_000_000).optional(),
});

// ── Trend Schemas (Phase 4) ──

export const trendQuerySchema = z.object({
  region: z.string().max(50).trim().optional(),
  language: z.string().max(50).optional(),
  category: z.enum(['emerging', 'trending', 'viral', 'declining']).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required').max(200),
});

// ── AI Studio Schemas ──

export const aiStudioGenerateSchema = z.object({
  type: z.enum(['caption', 'hook', 'script_short', 'script_long', 'cta', 'translation', 'repurpose', 'calendar']),
  topic: z.string().min(1, 'Topic is required').max(500).trim(),
  platform: z.enum(['youtube', 'instagram']),
  tone: z.string().max(50).trim().optional(),
  language: z.string().max(50).optional(),
  targetLanguages: z.array(z.string().max(50)).max(10).optional(),
  sourceFormat: z.string().max(100).trim().optional(),
  targetFormats: z.array(z.string().max(50)).max(10).optional(),
  durationDays: z.number().int().min(1).max(90).optional(),
});

export const aiStudioVideoAssistSchema = z.object({
  type: z.enum(['camera_angles', 'shot_breakdown', 'editing_style', 'broll', 'lighting', 'framing', 'platform_tips']),
  contentType: z.string().min(1).max(200).trim(),
  platform: z.enum(['youtube', 'instagram']),
  style: z.string().max(100).trim().optional(),
  duration: z.string().max(20).optional(),
});

// ── Monetization Schema ──

export const monetizationReportSchema = z.object({
  platform: z.enum(['youtube', 'instagram']),
  niche: z.string().max(100).trim().optional(),
  followerCount: z.number().int().min(0).max(1_000_000_000).optional(),
  engagementRate: z.number().min(0).max(1).optional(),
  avgViews: z.number().int().min(0).optional(),
});

// ── Content Shield Schema ──

export const contentShieldSchema = z.object({
  text: z.string().min(1, 'Text is required').max(10000),
  platform: z.enum(['youtube', 'instagram']),
  contentType: z.string().max(50).trim().optional(),
  checkCopyright: z.boolean().optional(),
  checkPolicy: z.boolean().optional(),
  checkBrandSafety: z.boolean().optional(),
});

// ── Growth Intelligence Schemas ──

export const growthForecastSchema = z.object({
  platform: z.enum(['youtube', 'instagram']),
  timeframeMonths: z.number().int().min(1).max(24).optional(),
  currentFollowers: z.number().int().min(0).max(1_000_000_000).optional(),
  currentEngagementRate: z.number().min(0).max(1).optional(),
  postsPerWeek: z.number().int().min(0).max(50).optional(),
  niche: z.string().max(100).trim().optional(),
});

export const competitorBenchmarkSchema = z.object({
  platform: z.enum(['youtube', 'instagram']),
  niche: z.string().max(100).trim().optional(),
  followerCount: z.number().int().min(0).max(1_000_000_000).optional(),
  engagementRate: z.number().min(0).max(1).optional(),
});

// ── Automation Schemas ──

export const scheduleSchema = z.object({
  title: z.string().min(1).max(500).trim(),
  platform: z.enum(['youtube', 'instagram']),
  contentType: z.string().max(100).trim().optional(),
  preferredTime: z.string().max(20).optional(),
  timezone: z.string().max(100).optional(),
  niche: z.string().max(100).trim().optional(),
});

export const hashtagSchema = z.object({
  topic: z.string().min(1, 'Topic is required').max(500).trim(),
  platform: z.enum(['youtube', 'instagram']),
  niche: z.string().max(100).trim().optional(),
  count: z.number().int().min(1).max(50).optional(),
});

export const abTestSchema = z.object({
  platform: z.enum(['youtube', 'instagram']),
  variantA: z.object({
    title: z.string().min(1).max(500).trim(),
    description: z.string().max(5000).trim().optional(),
  }),
  variantB: z.object({
    title: z.string().min(1).max(500).trim(),
    description: z.string().max(5000).trim().optional(),
  }),
  niche: z.string().max(100).trim().optional(),
  followerCount: z.number().int().min(0).max(1_000_000_000).optional(),
});

// ── Creator Scorecard Schema ──

export const creatorScorecardSchema = z.object({
  platform: z.enum(['youtube', 'instagram']),
  niche: z.string().max(100).trim().optional(),
  followerCount: z.number().int().min(0).max(1_000_000_000).optional(),
  engagementRate: z.number().min(0).max(1).optional(),
  postsPerWeek: z.number().int().min(0).max(50).optional(),
  avgViews: z.number().int().min(0).optional(),
  contentQuality: z.number().min(0).max(10).optional(),
});

// ── Spec-Aligned Schemas (for /api/* alias routes) ──

/** POST /api/ai/generate — simplified AI Studio endpoint */
export const aiGenerateSchema = z.object({
  topic: z.string().min(1, 'Topic is required').max(500).trim(),
  platform: z.enum(['youtube', 'instagram']).default('youtube'),
  tone: z.string().max(100).trim().optional(),
  type: z.enum(['caption', 'hook', 'script_short', 'script_long', 'cta', 'translation', 'repurpose', 'calendar']).default('caption'),
});

/** POST /api/content/check — simplified content shield endpoint */
export const contentCheckSchema = z.object({
  content: z.string().min(1, 'Content is required').max(10000),
  platform: z.enum(['youtube', 'instagram']).optional().default('youtube'),
  text: z.string().max(10000).optional(), // accept either 'content' or 'text'
});

/** POST /api/growth/analyze — simplified growth intelligence endpoint */
export const growthAnalyzeSchema = z.object({
  likes: z.number().int().min(0).optional(),
  comments: z.number().int().min(0).optional(),
  views: z.number().int().min(0).optional(),
  followers: z.number().int().min(0).max(1_000_000_000).optional(),
  platform: z.enum(['youtube', 'instagram']).default('youtube'),
  timeframeMonths: z.number().int().min(1).max(24).optional(),
});

/** POST /api/creator/score — simplified creator scorecard endpoint */
export const creatorScoreSchema = z.object({
  platform: z.enum(['youtube', 'instagram']).default('youtube'),
  followers: z.number().int().min(0).max(1_000_000_000).optional(),
  engagementRate: z.number().min(0).max(1).optional(),
  postsPerWeek: z.number().int().min(0).max(50).optional(),
  niche: z.string().max(100).trim().optional(),
});

/** POST /api/monetization/predict — simplified monetization endpoint */
export const monetizationPredictSchema = z.object({
  views: z.number().int().min(0).optional(),
  platform: z.enum(['youtube', 'instagram']).default('youtube'),
  niche: z.string().max(100).trim().optional(),
  followers: z.number().int().min(0).max(1_000_000_000).optional(),
});

export type AiGenerateInput = z.infer<typeof aiGenerateSchema>;
export type ContentCheckInput = z.infer<typeof contentCheckSchema>;
export type GrowthAnalyzeInput = z.infer<typeof growthAnalyzeSchema>;
export type CreatorScoreInput = z.infer<typeof creatorScoreSchema>;
export type MonetizationPredictInput = z.infer<typeof monetizationPredictSchema>;

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type NlpAnalyzeInput = z.infer<typeof nlpAnalyzeSchema>;
export type ViralityPredictInput = z.infer<typeof viralityPredictSchema>;
export type TrendQueryInput = z.infer<typeof trendQuerySchema>;
export type AiStudioGenerateInput = z.infer<typeof aiStudioGenerateSchema>;
export type AiStudioVideoAssistInput = z.infer<typeof aiStudioVideoAssistSchema>;
export type MonetizationReportInput = z.infer<typeof monetizationReportSchema>;
export type ContentShieldInput = z.infer<typeof contentShieldSchema>;
export type GrowthForecastInput = z.infer<typeof growthForecastSchema>;
export type CompetitorBenchmarkInput = z.infer<typeof competitorBenchmarkSchema>;
export type ScheduleInput = z.infer<typeof scheduleSchema>;
export type HashtagInput = z.infer<typeof hashtagSchema>;
export type ABTestInput = z.infer<typeof abTestSchema>;
export type CreatorScorecardInput = z.infer<typeof creatorScorecardSchema>;
