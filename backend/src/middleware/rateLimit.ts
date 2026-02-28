// Rate Limiting Middleware
// In-memory sliding window rate limiter for Lambda handlers.
// In production, replace with DynamoDB or ElastiCache-backed rate limiting
// for distributed enforcement across Lambda instances.

import { TooManyRequestsError } from './errorHandler';

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Clean up stale entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

const cleanup = (windowMs: number) => {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  const cutoff = now - windowMs;
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter(t => t > cutoff);
    if (entry.timestamps.length === 0) {
      store.delete(key);
    }
  }
};

export interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number;  // Max requests per window
}

// Default limits by endpoint type
export const RATE_LIMITS = {
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 10 } as RateLimitConfig,     // 10 per 15 min
  api: { windowMs: 60 * 1000, maxRequests: 60 } as RateLimitConfig,           // 60 per minute
  nlp: { windowMs: 60 * 1000, maxRequests: 30 } as RateLimitConfig,           // 30 per minute (heavy)
  prediction: { windowMs: 60 * 1000, maxRequests: 30 } as RateLimitConfig,    // 30 per minute (heavy)
};

/**
 * Check rate limit for a given key (IP or userId).
 * Throws TooManyRequestsError if limit exceeded.
 */
export const checkRateLimit = (key: string, config: RateLimitConfig): void => {
  const now = Date.now();
  const cutoff = now - config.windowMs;

  cleanup(config.windowMs);

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter(t => t > cutoff);

  if (entry.timestamps.length >= config.maxRequests) {
    const retryAfter = Math.ceil((entry.timestamps[0] + config.windowMs - now) / 1000);
    throw new TooManyRequestsError(retryAfter);
  }

  entry.timestamps.push(now);
};

/**
 * Extract a rate limit key from the event.
 * Uses source IP for unauthenticated endpoints.
 */
export const getRateLimitKey = (event: { requestContext?: { identity?: { sourceIp?: string } }; headers?: Record<string, string | undefined> }): string => {
  return event.requestContext?.identity?.sourceIp
    || event.headers?.['X-Forwarded-For']?.split(',')[0]?.trim()
    || 'unknown';
};
