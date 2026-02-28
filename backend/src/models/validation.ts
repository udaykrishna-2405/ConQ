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
  language: z.string().max(10).optional(),
  historicalEngagementRate: z.number().min(0).max(1).optional(),
  followerCount: z.number().int().min(0).max(1_000_000_000).optional(),
});

// ── Trend Schemas (Phase 4) ──

export const trendQuerySchema = z.object({
  region: z.string().max(50).trim().optional(),
  language: z.string().max(10).optional(),
  category: z.enum(['emerging', 'trending', 'viral', 'declining']).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type NlpAnalyzeInput = z.infer<typeof nlpAnalyzeSchema>;
export type ViralityPredictInput = z.infer<typeof viralityPredictSchema>;
export type TrendQueryInput = z.infer<typeof trendQuerySchema>;
