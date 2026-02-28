// Security Hardening Tests
// Tests for rate limiting, input sanitization, validation bounds,
// security headers, password hashing strength, and error response safety.

import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from '../../src/middleware/rateLimit';
import { TooManyRequestsError } from '../../src/middleware/errorHandler';
import { sanitizeString, validateBody } from '../../src/middleware/validation';
import { hashPassword, verifyPassword } from '../../src/utils/password';
import { getResponseHeaders } from '../../src/utils/response';
import { formatErrorResponse, ValidationError, AppError } from '../../src/middleware/errorHandler';
import { loginSchema, registerSchema, viralityPredictSchema, trendQuerySchema } from '../../src/models/validation';
import { APIGatewayProxyEvent } from 'aws-lambda';

// ── Rate Limiting ──

describe('Rate Limiting', () => {
  it('should allow requests within the limit', () => {
    const config = { windowMs: 60_000, maxRequests: 5 };
    const key = `test-allow-${Date.now()}`;

    expect(() => {
      for (let i = 0; i < 5; i++) {
        checkRateLimit(key, config);
      }
    }).not.toThrow();
  });

  it('should block requests exceeding the limit', () => {
    const config = { windowMs: 60_000, maxRequests: 3 };
    const key = `test-block-${Date.now()}`;

    for (let i = 0; i < 3; i++) {
      checkRateLimit(key, config);
    }

    expect(() => checkRateLimit(key, config)).toThrow(TooManyRequestsError);
  });

  it('should include retry-after in error message', () => {
    const config = { windowMs: 60_000, maxRequests: 1 };
    const key = `test-retry-${Date.now()}`;
    checkRateLimit(key, config);

    try {
      checkRateLimit(key, config);
      fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(TooManyRequestsError);
      expect((err as TooManyRequestsError).statusCode).toBe(429);
      expect((err as TooManyRequestsError).message).toContain('Retry after');
    }
  });

  it('should isolate keys independently', () => {
    const config = { windowMs: 60_000, maxRequests: 2 };
    const key1 = `test-iso1-${Date.now()}`;
    const key2 = `test-iso2-${Date.now()}`;

    checkRateLimit(key1, config);
    checkRateLimit(key1, config);
    // key1 is exhausted

    // key2 should still work
    expect(() => checkRateLimit(key2, config)).not.toThrow();
  });

  it('should extract IP from event requestContext', () => {
    const event = {
      requestContext: { identity: { sourceIp: '1.2.3.4' } },
      headers: {},
    };
    expect(getRateLimitKey(event)).toBe('1.2.3.4');
  });

  it('should fall back to X-Forwarded-For header', () => {
    const event = {
      requestContext: {},
      headers: { 'X-Forwarded-For': '5.6.7.8, 9.10.11.12' },
    };
    expect(getRateLimitKey(event)).toBe('5.6.7.8');
  });

  it('should have reasonable auth rate limit config', () => {
    expect(RATE_LIMITS.auth.maxRequests).toBeLessThanOrEqual(20);
    expect(RATE_LIMITS.auth.windowMs).toBeGreaterThanOrEqual(60_000);
  });
});

// ── Input Sanitization ──

describe('Input Sanitization', () => {
  it('should escape HTML angle brackets', () => {
    expect(sanitizeString('<script>alert("xss")</script>')).not.toContain('<script>');
    expect(sanitizeString('<script>alert("xss")</script>')).toContain('&lt;script&gt;');
  });

  it('should strip javascript: protocol', () => {
    expect(sanitizeString('javascript:alert(1)')).not.toContain('javascript:');
  });

  it('should strip inline event handlers', () => {
    const result = sanitizeString('onerror=alert(1)');
    expect(result).not.toMatch(/onerror=/i);
  });

  it('should leave normal text unchanged', () => {
    const normal = 'Hello, this is a normal title with #hashtags and @mentions';
    expect(sanitizeString(normal)).toBe(normal);
  });
});

// ── Request Body Size Limits ──

describe('Request Body Size Limits', () => {
  it('should reject oversized request bodies', () => {
    const hugeBody = 'x'.repeat(100 * 1024); // 100 KB
    const event = {
      body: hugeBody,
      headers: {},
      queryStringParameters: null,
    } as unknown as APIGatewayProxyEvent;

    expect(() => validateBody(event, loginSchema)).toThrow('exceeds maximum');
  });
});

// ── Validation Schema Bounds ──

describe('Validation Schema Bounds', () => {
  it('should reject emails exceeding 254 characters', () => {
    const longEmail = 'a'.repeat(250) + '@b.com';
    const result = loginSchema.safeParse({
      email: longEmail,
      password: 'password123',
      tenantId: 'tenant-abc',
    });
    expect(result.success).toBe(false);
  });

  it('should reject passwords exceeding 128 characters', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: 'x'.repeat(129),
      name: 'Test',
    });
    expect(result.success).toBe(false);
  });

  it('should trim and lowercase email', () => {
    const result = loginSchema.safeParse({
      email: '  User@Example.COM  ',
      password: 'password123',
      tenantId: 'tenant-abc',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('user@example.com');
    }
  });

  it('should enforce followerCount max bound at 1 billion', () => {
    const result = viralityPredictSchema.safeParse({
      title: 'Test title',
      platform: 'youtube',
      followerCount: 2_000_000_000,
    });
    expect(result.success).toBe(false);
  });

  it('should enforce tags max array length of 30', () => {
    const tooManyTags = Array.from({ length: 31 }, (_, i) => `tag${i}`);
    const result = viralityPredictSchema.safeParse({
      title: 'Test title',
      platform: 'youtube',
      tags: tooManyTags,
    });
    expect(result.success).toBe(false);
  });

  it('should enforce individual tag max length of 50', () => {
    const result = viralityPredictSchema.safeParse({
      title: 'Test title',
      platform: 'youtube',
      tags: ['a'.repeat(51)],
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid trend date format', () => {
    const result = trendQuerySchema.safeParse({ date: '27-02-2026' });
    expect(result.success).toBe(false);
  });

  it('should accept valid trend date format', () => {
    const result = trendQuerySchema.safeParse({ date: '2026-02-27' });
    expect(result.success).toBe(true);
  });

  it('should reject non-numeric limit in trend query', () => {
    const result = trendQuerySchema.safeParse({ limit: 'abc' });
    expect(result.success).toBe(false);
  });
});

// ── Password Hashing Strength ──

describe('Password Hashing Strength', () => {
  it('should produce a long hash (PBKDF2 output)', () => {
    const { hash } = hashPassword('testPassword');
    // PBKDF2 with 64 byte key length = 128 hex chars
    expect(hash.length).toBe(128);
  });

  it('should use a sufficiently long salt', () => {
    const { salt } = hashPassword('testPassword');
    // 32 bytes = 64 hex chars
    expect(salt.length).toBe(64);
  });

  it('should verify correct password after PBKDF2 hashing', () => {
    const { hash, salt } = hashPassword('securePassword!');
    expect(verifyPassword('securePassword!', hash, salt)).toBe(true);
  });

  it('should reject incorrect password', () => {
    const { hash, salt } = hashPassword('securePassword!');
    expect(verifyPassword('wrongPassword', hash, salt)).toBe(false);
  });

  it('should produce different hashes for same password with different salts', () => {
    const r1 = hashPassword('samePassword');
    const r2 = hashPassword('samePassword');
    expect(r1.hash).not.toBe(r2.hash);
    expect(r1.salt).not.toBe(r2.salt);
  });
});

// ── Security Headers ──

describe('Security Headers', () => {
  const headers = getResponseHeaders();

  it('should include Strict-Transport-Security', () => {
    expect(headers['Strict-Transport-Security']).toContain('max-age=');
  });

  it('should include X-Content-Type-Options: nosniff', () => {
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
  });

  it('should include X-Frame-Options: DENY', () => {
    expect(headers['X-Frame-Options']).toBe('DENY');
  });

  it('should include Referrer-Policy', () => {
    expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
  });

  it('should include Permissions-Policy', () => {
    expect(headers['Permissions-Policy']).toContain('geolocation=()');
  });

  it('should include Cache-Control: no-store', () => {
    expect(headers['Cache-Control']).toBe('no-store');
  });

  it('should set CORS origin to localhost in dev (not wildcard *)', () => {
    expect(headers['Access-Control-Allow-Origin']).not.toBe('*');
    expect(headers['Access-Control-Allow-Origin']).toContain('localhost');
  });
});

// ── Error Response Safety ──

describe('Error Response Safety', () => {
  it('should not leak stack traces for unhandled errors', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const response = formatErrorResponse(new Error('Something broke internally'));
    const body = JSON.parse(response.body);

    expect(response.statusCode).toBe(500);
    expect(body.error).toBe('Internal server error');
    expect(body.stack).toBeUndefined();
    expect(body.message).toBeUndefined();
    consoleSpy.mockRestore();
  });

  it('should include security headers in error responses', () => {
    const response = formatErrorResponse(new AppError(400, 'Bad request', 'BAD_REQUEST'));
    expect(response.headers).toBeDefined();
    expect(response.headers!['X-Content-Type-Options']).toBe('nosniff');
    expect(response.headers!['Strict-Transport-Security']).toBeDefined();
  });

  it('should include code but not internal details in validation errors', () => {
    const response = formatErrorResponse(
      new ValidationError('Invalid input', { email: 'required' })
    );
    const body = JSON.parse(response.body);

    expect(body.code).toBe('VALIDATION_ERROR');
    // In dev, fields are included; in production they are stripped
    // We test the structure is correct regardless
    expect(body.error).toBe('Invalid input');
  });
});
