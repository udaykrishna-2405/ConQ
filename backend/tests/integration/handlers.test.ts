// Integration Tests – Lambda Handler End-to-End
// Tests the full request/response cycle through each Lambda handler
// using mock API Gateway events. DynamoDB is mocked with an in-memory store.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { APIGatewayProxyEvent } from 'aws-lambda';

// ─── Mock DynamoDB before any imports that use it ────────────────────────────

const inMemoryStore = new Map<string, Map<string, Record<string, unknown>>>();

jest.mock('../../src/utils/dynamodb', () => {
  return {
    dynamoDb: {
      send: jest.fn(async (command: any) => {
        const cmdName = command.constructor.name;
        const table = command.input?.TableName || 'default';

        if (!inMemoryStore.has(table)) {
          inMemoryStore.set(table, new Map());
        }
        const tableStore = inMemoryStore.get(table)!;

        switch (cmdName) {
          case 'PutCommand': {
            const item = command.input.Item;
            const key = `${item.tenant_id}#${item.user_id || item.content_id || item.snapshot_id || item.trend_id || 'item'}`;
            tableStore.set(key, { ...item });
            return {};
          }
          case 'GetCommand': {
            const keyObj = command.input.Key;
            const tenantId = keyObj.tenant_id;
            for (const [k, v] of tableStore) {
              if (k.startsWith(`${tenantId}#`)) {
                const sortKeyName = Object.keys(keyObj).find(k => k !== 'tenant_id');
                if (sortKeyName && v[sortKeyName] === keyObj[sortKeyName]) {
                  return { Item: { ...v } };
                }
              }
            }
            return { Item: undefined };
          }
          case 'QueryCommand': {
            const tenantId = command.input.ExpressionAttributeValues?.[':tid'];
            const email = command.input.ExpressionAttributeValues?.[':email'];
            const items: Record<string, unknown>[] = [];
            for (const [, v] of tableStore) {
              if (v.tenant_id === tenantId) {
                if (email && v.email !== email) continue;
                items.push({ ...v });
              }
            }
            const limit = command.input.Limit || 100;
            return { Items: items.slice(0, limit) };
          }
          case 'UpdateCommand': {
            const keyObj = command.input.Key;
            const tenantId = keyObj.tenant_id;
            for (const [k, v] of tableStore) {
              if (k.startsWith(`${tenantId}#`)) {
                const sortKeyName = Object.keys(keyObj).find(k => k !== 'tenant_id');
                if (sortKeyName && v[sortKeyName] === keyObj[sortKeyName]) {
                  // Apply updates from ExpressionAttributeNames/Values
                  const names = command.input.ExpressionAttributeNames || {};
                  const values = command.input.ExpressionAttributeValues || {};
                  const nameEntries = Object.entries(names);
                  const valueEntries = Object.entries(values);
                  for (let i = 0; i < nameEntries.length; i++) {
                    const attrName = nameEntries[i][1] as string;
                    const attrValue = valueEntries[i]?.[1];
                    if (attrValue !== undefined) {
                      v[attrName] = attrValue;
                    }
                  }
                  return {};
                }
              }
            }
            return {};
          }
          case 'DeleteCommand':
            return {};
          default:
            return {};
        }
      }),
    },
  };
});

// Now import handlers (after mock is set up)
import { generateToken } from '../../src/utils/jwt';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TEST_TENANT_ID = 'tenant_integration_test';
const TEST_USER_ID = 'user_integration_test';
const TEST_EMAIL = 'integration@conq.test';

function makeToken(overrides: Record<string, string> = {}): string {
  return generateToken({
    userId: overrides.userId || TEST_USER_ID,
    tenantId: overrides.tenantId || TEST_TENANT_ID,
    email: overrides.email || TEST_EMAIL,
    role: overrides.role || 'creator',
    tier: overrides.tier || 'free',
  });
}

function makeEvent(overrides: Partial<APIGatewayProxyEvent> = {}): APIGatewayProxyEvent {
  return {
    httpMethod: overrides.httpMethod || 'GET',
    path: overrides.path || '/',
    pathParameters: overrides.pathParameters || null,
    queryStringParameters: overrides.queryStringParameters || null,
    headers: overrides.headers || {},
    body: overrides.body || null,
    isBase64Encoded: false,
    resource: overrides.resource || '/',
    stageVariables: null,
    multiValueHeaders: {},
    multiValueQueryStringParameters: null,
    requestContext: {
      accountId: '123456789',
      apiId: 'test',
      authorizer: null,
      protocol: 'HTTP/1.1',
      httpMethod: overrides.httpMethod || 'GET',
      identity: {
        sourceIp: '127.0.0.1',
        accessKey: null, accountId: null, apiKey: null, apiKeyId: null,
        caller: null, clientCert: null, cognitoAuthenticationProvider: null,
        cognitoAuthenticationType: null, cognitoIdentityId: null,
        cognitoIdentityPoolId: null, principalOrgId: null, user: null,
        userAgent: null, userArn: null,
      },
      path: overrides.path || '/',
      stage: 'test',
      requestId: 'test-req-id',
      requestTimeEpoch: Date.now(),
      resourceId: 'test',
      resourcePath: overrides.resource || '/',
    },
  } as APIGatewayProxyEvent;
}

function authedEvent(overrides: Partial<APIGatewayProxyEvent> = {}): APIGatewayProxyEvent {
  const token = makeToken();
  return makeEvent({
    ...overrides,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(overrides.headers || {}),
    },
  });
}

function parseBody(response: { body: string }) {
  return JSON.parse(response.body);
}

// Suppress console.error/warn noise in tests
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});

// In-memory store persists across tests within the file.
// Each test uses unique emails (Date.now()) to avoid interference.

// ─── Auth Handlers ───────────────────────────────────────────────────────────

describe('Auth Lambda Handlers', () => {
  const { registerHandler, loginHandler, refreshHandler, logoutHandler, authHandler } = require('../../src/handlers/auth');

  describe('POST /auth/register', () => {
    it('should register a new user and return tokens', async () => {
      const event = makeEvent({
        httpMethod: 'POST',
        body: JSON.stringify({
          email: `test_${Date.now()}@conq.test`,
          password: 'StrongP@ss123!',
          name: 'Test User',
        }),
      });

      const response = await registerHandler(event);
      expect(response.statusCode).toBe(201);

      const body = parseBody(response);
      expect(body.user).toBeDefined();
      expect(body.token).toBeDefined();
      expect(body.refreshToken).toBeDefined();
      expect(body.user.email).toContain('@conq.test');
      expect(body.user.role).toBe('creator');
    });

    it('should reject registration with missing fields', async () => {
      const event = makeEvent({
        httpMethod: 'POST',
        body: JSON.stringify({ email: 'test@conq.test' }),
      });

      const response = await registerHandler(event);
      expect(response.statusCode).toBe(400);
    });

    it('should reject registration with invalid email', async () => {
      const event = makeEvent({
        httpMethod: 'POST',
        body: JSON.stringify({
          email: 'not-an-email',
          password: 'StrongP@ss123!',
          name: 'Test',
        }),
      });

      const response = await registerHandler(event);
      expect(response.statusCode).toBe(400);
    });

    it('should reject duplicate email registration', async () => {
      const email = `dupe_${Date.now()}@conq.test`;
      const tenantId = 'tenant_dupe_test';
      const event = makeEvent({
        httpMethod: 'POST',
        body: JSON.stringify({
          email,
          password: 'StrongP@ss123!',
          name: 'First User',
          tenantId,
        }),
      });

      const response1 = await registerHandler(event);
      expect(response1.statusCode).toBe(201);

      const response2 = await registerHandler(event);
      expect(response2.statusCode).toBe(409);
    });
  });

  describe('POST /auth/login', () => {
    const testEmail = `login_test_${Date.now()}@conq.test`;
    let testTenantId: string;

    beforeAll(async () => {
      const regEvent = makeEvent({
        httpMethod: 'POST',
        body: JSON.stringify({
          email: testEmail,
          password: 'TestP@ss123!',
          name: 'Login Test',
        }),
      });
      const regResponse = await registerHandler(regEvent);
      const regBody = parseBody(regResponse);
      testTenantId = regBody.user.tenantId;
    });

    it('should login with valid credentials', async () => {
      const event = makeEvent({
        httpMethod: 'POST',
        body: JSON.stringify({
          email: testEmail,
          password: 'TestP@ss123!',
          tenantId: testTenantId,
        }),
      });

      const response = await loginHandler(event);
      expect(response.statusCode).toBe(200);

      const body = parseBody(response);
      expect(body.token).toBeDefined();
      expect(body.refreshToken).toBeDefined();
      expect(body.user.email).toBe(testEmail);
    });

    it('should reject login with wrong password', async () => {
      const event = makeEvent({
        httpMethod: 'POST',
        body: JSON.stringify({
          email: testEmail,
          password: 'WrongPassword123!',
          tenantId: testTenantId,
        }),
      });

      const response = await loginHandler(event);
      expect(response.statusCode).toBe(401);
    });

    it('should reject login with nonexistent email', async () => {
      const event = makeEvent({
        httpMethod: 'POST',
        body: JSON.stringify({
          email: 'nobody@conq.test',
          password: 'TestP@ss123!',
          tenantId: testTenantId,
        }),
      });

      const response = await loginHandler(event);
      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /auth/refresh', () => {
    it('should rotate refresh token and return new pair', async () => {
      const regEvent = makeEvent({
        httpMethod: 'POST',
        body: JSON.stringify({
          email: `refresh_${Date.now()}@conq.test`,
          password: 'TestP@ss123!',
          name: 'Refresh Test',
        }),
      });
      const regResponse = await registerHandler(regEvent);
      const { refreshToken } = parseBody(regResponse);

      const event = makeEvent({
        httpMethod: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
      const response = await refreshHandler(event);
      expect(response.statusCode).toBe(200);

      const body = parseBody(response);
      expect(body.token).toBeDefined();
      expect(body.refreshToken).toBeDefined();
      expect(body.refreshToken).not.toBe(refreshToken);
    });

    it('should reject reuse of rotated refresh token', async () => {
      const regEvent = makeEvent({
        httpMethod: 'POST',
        body: JSON.stringify({
          email: `reuse_${Date.now()}@conq.test`,
          password: 'TestP@ss123!',
          name: 'Reuse Test',
        }),
      });
      const regResponse = await registerHandler(regEvent);
      const { refreshToken } = parseBody(regResponse);

      // First rotation succeeds
      const event1 = makeEvent({
        httpMethod: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
      const response1 = await refreshHandler(event1);
      expect(response1.statusCode).toBe(200);

      // Reuse of old token should fail
      const event2 = makeEvent({
        httpMethod: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
      const response2 = await refreshHandler(event2);
      expect(response2.statusCode).toBe(401);
    });

    it('should reject invalid refresh token', async () => {
      const event = makeEvent({
        httpMethod: 'POST',
        body: JSON.stringify({ refreshToken: 'invalid_token_123' }),
      });
      const response = await refreshHandler(event);
      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout successfully with valid token', async () => {
      const event = authedEvent({ httpMethod: 'POST' });
      const response = await logoutHandler(event);
      expect(response.statusCode).toBe(200);

      const body = parseBody(response);
      expect(body.message).toContain('Logged out');
    });

    it('should reject logout without token', async () => {
      const event = makeEvent({ httpMethod: 'POST' });
      const response = await logoutHandler(event);
      expect(response.statusCode).toBe(401);
    });
  });

  describe('Auth Router', () => {
    it('should route to register', async () => {
      const event = makeEvent({
        httpMethod: 'POST',
        pathParameters: { action: 'register' },
        body: JSON.stringify({
          email: `router_${Date.now()}@conq.test`,
          password: 'TestP@ss123!',
          name: 'Router Test',
        }),
      });
      const response = await authHandler(event);
      expect(response.statusCode).toBe(201);
    });

    it('should return 404 for unknown action', async () => {
      const event = makeEvent({
        httpMethod: 'POST',
        pathParameters: { action: 'unknown' },
      });
      const response = await authHandler(event);
      expect(response.statusCode).toBe(404);
    });
  });
});

// ─── NLP Handler ─────────────────────────────────────────────────────────────

describe('NLP Lambda Handler', () => {
  const { nlpHandler } = require('../../src/handlers/nlp');

  it('should analyze English text', async () => {
    const event = authedEvent({
      httpMethod: 'POST',
      body: JSON.stringify({
        text: 'I absolutely love this amazing new product! It changed my life!',
        platform: 'youtube',
      }),
    });

    const response = await nlpHandler(event);
    expect(response.statusCode).toBe(200);

    const body = parseBody(response);
    expect(body.language).toBeDefined();
    expect(body.sentiment).toBeDefined();
    expect(body.sentimentScore).toBeDefined();
    expect(body.entities).toBeDefined();
    expect(body.analysisId).toBeDefined();
  });

  it('should analyze Hindi text', async () => {
    const event = authedEvent({
      httpMethod: 'POST',
      body: JSON.stringify({
        text: 'यह बहुत अच्छा उत्पाद है, मुझे बहुत पसंद आया',
        platform: 'instagram',
      }),
    });

    const response = await nlpHandler(event);
    expect(response.statusCode).toBe(200);

    const body = parseBody(response);
    expect(body.language).toBeDefined();
    expect(body.sentiment).toBeDefined();
  });

  it('should reject empty text', async () => {
    const event = authedEvent({
      httpMethod: 'POST',
      body: JSON.stringify({ text: '' }),
    });

    const response = await nlpHandler(event);
    expect(response.statusCode).toBe(400);
  });

  it('should reject unauthenticated requests', async () => {
    const event = makeEvent({
      httpMethod: 'POST',
      body: JSON.stringify({ text: 'Hello world' }),
    });

    const response = await nlpHandler(event);
    expect(response.statusCode).toBe(401);
  });
});

// ─── Prediction Handler ─────────────────────────────────────────────────────

describe('Prediction Lambda Handler', () => {
  const { predictionHandler } = require('../../src/handlers/prediction');

  it('should return a virality prediction', async () => {
    const event = authedEvent({
      httpMethod: 'POST',
      body: JSON.stringify({
        title: 'Top 10 AI Tips for Beginners in 2026',
        description: 'Learn the best AI tools and techniques',
        tags: ['ai', 'technology', 'tutorial'],
        platform: 'youtube',
        language: 'en',
        followerCount: 50000,
        historicalEngagementRate: 0.05,
      }),
    });

    const response = await predictionHandler(event);
    expect(response.statusCode).toBe(200);

    const body = parseBody(response);
    expect(body.predictionId).toBeDefined();
    expect(body.score).toBeGreaterThanOrEqual(0);
    expect(body.score).toBeLessThanOrEqual(100);
    expect(body.confidence).toBeGreaterThan(0);
    expect(body.confidence).toBeLessThanOrEqual(1);
    expect(body.explanation).toBeDefined();
    expect(Array.isArray(body.explanation)).toBe(true);
  });

  it('should work with minimal fields', async () => {
    const event = authedEvent({
      httpMethod: 'POST',
      body: JSON.stringify({
        title: 'Simple post',
        platform: 'instagram',
      }),
    });

    const response = await predictionHandler(event);
    expect(response.statusCode).toBe(200);

    const body = parseBody(response);
    expect(body.score).toBeDefined();
  });

  it('should reject missing title', async () => {
    const event = authedEvent({
      httpMethod: 'POST',
      body: JSON.stringify({ platform: 'youtube' }),
    });

    const response = await predictionHandler(event);
    expect(response.statusCode).toBe(400);
  });

  it('should reject unauthenticated requests', async () => {
    const event = makeEvent({
      httpMethod: 'POST',
      body: JSON.stringify({
        title: 'Test',
        platform: 'youtube',
      }),
    });

    const response = await predictionHandler(event);
    expect(response.statusCode).toBe(401);
  });
});

// ─── Trend Handler ───────────────────────────────────────────────────────────

describe('Trend Lambda Handler', () => {
  const { trendHandler } = require('../../src/handlers/trend');

  it('should return trends with default params', async () => {
    const event = authedEvent({ httpMethod: 'GET' });

    const response = await trendHandler(event);
    expect(response.statusCode).toBe(200);

    const body = parseBody(response);
    expect(body.trends).toBeDefined();
    expect(Array.isArray(body.trends)).toBe(true);
    expect(body.trends.length).toBeGreaterThan(0);
  });

  it('should filter by region', async () => {
    const event = authedEvent({
      httpMethod: 'GET',
      queryStringParameters: { region: 'india' },
    });

    const response = await trendHandler(event);
    expect(response.statusCode).toBe(200);

    const body = parseBody(response);
    body.trends.forEach((t: { region: string }) => {
      expect(t.region).toBe('india');
    });
  });

  it('should filter by category', async () => {
    const event = authedEvent({
      httpMethod: 'GET',
      queryStringParameters: { category: 'trending' },
    });

    const response = await trendHandler(event);
    expect(response.statusCode).toBe(200);

    const body = parseBody(response);
    body.trends.forEach((t: { category: string }) => {
      expect(t.category).toBe('trending');
    });
  });

  it('should respect limit parameter', async () => {
    const event = authedEvent({
      httpMethod: 'GET',
      queryStringParameters: { limit: '5' },
    });

    const response = await trendHandler(event);
    expect(response.statusCode).toBe(200);

    const body = parseBody(response);
    expect(body.trends.length).toBeLessThanOrEqual(5);
  });

  it('should reject unauthenticated requests', async () => {
    const event = makeEvent({ httpMethod: 'GET' });

    const response = await trendHandler(event);
    expect(response.statusCode).toBe(401);
  });
});

// ─── Analytics Handler ───────────────────────────────────────────────────────

describe('Analytics Lambda Handler', () => {
  const { analyticsHandler } = require('../../src/handlers/analytics');

  it('should return unified dashboard', async () => {
    const event = authedEvent({ httpMethod: 'GET' });

    const response = await analyticsHandler(event);
    expect(response.statusCode).toBe(200);

    const body = parseBody(response);
    expect(body.tenantId).toBe(TEST_TENANT_ID);
    expect(body.platforms).toBeDefined();
    expect(body.platforms.youtube).toBeDefined();
    expect(body.platforms.instagram).toBeDefined();
    expect(body.unified).toBeDefined();
    expect(body.topContent).toBeDefined();
    expect(body.trendAlignment).toBeDefined();
  });

  it('should include YouTube channel and video data', async () => {
    const event = authedEvent({ httpMethod: 'GET' });

    const response = await analyticsHandler(event);
    const body = parseBody(response);

    const yt = body.platforms.youtube;
    expect(yt.channel.channelId).toBeDefined();
    expect(yt.aggregated.totalViews).toBeGreaterThan(0);
    expect(yt.recentVideos.length).toBeGreaterThan(0);
  });

  it('should include Instagram profile and post data', async () => {
    const event = authedEvent({ httpMethod: 'GET' });

    const response = await analyticsHandler(event);
    const body = parseBody(response);

    const ig = body.platforms.instagram;
    expect(ig.profile.profileId).toBeDefined();
    expect(ig.aggregated.totalLikes).toBeGreaterThan(0);
    expect(ig.recentPosts.length).toBeGreaterThan(0);
  });

  it('should include unified cross-platform metrics', async () => {
    const event = authedEvent({ httpMethod: 'GET' });

    const response = await analyticsHandler(event);
    const body = parseBody(response);

    const unified = body.unified;
    expect(unified.totalEngagements).toBeGreaterThan(0);
    expect(unified.totalReach).toBeGreaterThan(0);
    expect(unified.platformBreakdown.youtube).toBeDefined();
    expect(unified.platformBreakdown.instagram).toBeDefined();
  });

  it('should reject unauthenticated requests', async () => {
    const event = makeEvent({ httpMethod: 'GET' });

    const response = await analyticsHandler(event);
    expect(response.statusCode).toBe(401);
  });
});

// ─── User Handler ────────────────────────────────────────────────────────────

describe('User Lambda Handler', () => {
  const { userHandler } = require('../../src/handlers/user');

  it('should reject unauthenticated GET', async () => {
    const event = makeEvent({ httpMethod: 'GET' });
    const response = await userHandler(event);
    expect(response.statusCode).toBe(401);
  });

  it('should reject unauthenticated PUT', async () => {
    const event = makeEvent({
      httpMethod: 'PUT',
      body: JSON.stringify({ name: 'New Name' }),
    });
    const response = await userHandler(event);
    expect(response.statusCode).toBe(401);
  });

  it('should reject unsupported HTTP method', async () => {
    const event = authedEvent({ httpMethod: 'DELETE' });
    const response = await userHandler(event);
    expect(response.statusCode).toBe(405);
  });
});

// ─── Security Headers ────────────────────────────────────────────────────────

describe('Response Security Headers (integration)', () => {
  const { nlpHandler } = require('../../src/handlers/nlp');

  it('should include security headers on success', async () => {
    const event = authedEvent({
      httpMethod: 'POST',
      body: JSON.stringify({ text: 'Test text for security headers', platform: 'youtube' }),
    });

    const response = await nlpHandler(event);
    expect(response.statusCode).toBe(200);
    expect(response.headers!['Strict-Transport-Security']).toBeDefined();
    expect(response.headers!['X-Content-Type-Options']).toBe('nosniff');
    expect(response.headers!['X-Frame-Options']).toBe('DENY');
    expect(response.headers!['Cache-Control']).toBe('no-store');
  });

  it('should include security headers on auth error', async () => {
    const event = makeEvent({
      httpMethod: 'POST',
      body: JSON.stringify({ text: 'Test' }),
    });

    const response = await nlpHandler(event);
    expect(response.statusCode).toBe(401);
    expect(response.headers!['X-Content-Type-Options']).toBe('nosniff');
  });
});
