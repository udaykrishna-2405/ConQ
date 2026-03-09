/**
 * Local Express Dev Server
 * Wraps AWS Lambda handlers so they can be called locally via HTTP.
 * Run with: npm run dev
 */

import { config as dotenvConfig } from 'dotenv';
dotenvConfig(); // Load .env before anything else

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { APIGatewayProxyEvent } from 'aws-lambda';

// Import handlers
import { authHandler } from './handlers/auth';
import { userHandler } from './handlers/user';
import { nlpHandler } from './handlers/nlp';
import { predictionHandler } from './handlers/prediction';
import { trendHandler } from './handlers/trend';
import { analyticsHandler } from './handlers/analytics';
import { aiStudioGenerateHandler, aiStudioVideoAssistHandler, aiStudioHistoryHandler } from './handlers/aiStudio';
import { monetizationHandler } from './handlers/monetization';
import { contentShieldHandler } from './handlers/contentShield';
import { growthForecastHandler, competitorBenchmarkHandler } from './handlers/growthIntelligence';
import { automationScheduleHandler, automationHashtagHandler, automationAbTestHandler } from './handlers/automation';
import { creatorScorecardHandler } from './handlers/creatorScorecard';
import { dashboardHandler } from './handlers/dashboard';

const app = express();
const PORT = process.env.PORT || 3001;

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:3000'];

// ── Security Middleware ──
app.use(helmet({
  crossOriginEmbedderPolicy: false, // Allow embedded resources in dev
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", ...ALLOWED_ORIGINS],
    },
  },
}));

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin) return callback(null, true);

    if (origin.includes('localhost') || origin.includes('vercel.app')) {
      return callback(null, true);
    }

    return callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing with size limit (matches Lambda middleware limit)
app.use(express.json({ limit: '64kb' }));
app.use(express.urlencoded({ extended: false, limit: '64kb' }));

// Global rate limit for dev server (Lambda uses its own rate limiting middleware)
app.use(rateLimit({
  windowMs: 60 * 1000,      // 1 minute
  max: 120,                  // 120 requests per minute globally
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down', code: 'RATE_LIMIT_EXCEEDED' },
}));

// ── Lambda Event Bridge ──

function toApiGatewayEvent(
  req: Request,
  pathParameters?: Record<string, string>
): APIGatewayProxyEvent {
  return {
    httpMethod: req.method,
    path: req.path,
    pathParameters: pathParameters || null,
    queryStringParameters: (Object.keys(req.query).length > 0
      ? req.query
      : null) as Record<string, string> | null,
    headers: req.headers as Record<string, string>,
    body: req.body ? JSON.stringify(req.body) : null,
    isBase64Encoded: false,
    multiValueHeaders: {},
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {
      accountId: 'local',
      apiId: 'local',
      authorizer: null,
      protocol: 'HTTP/1.1',
      httpMethod: req.method,
      identity: {
        sourceIp: req.ip || '127.0.0.1',
        userAgent: req.get('user-agent') || '',
        accessKey: null, accountId: null, apiKey: null, apiKeyId: null,
        caller: null, clientCert: null, cognitoAuthenticationProvider: null,
        cognitoAuthenticationType: null, cognitoIdentityId: null,
        cognitoIdentityPoolId: null, principalOrgId: null, user: null, userArn: null,
      },
      path: req.path,
      stage: 'local',
      requestId: `local-${Date.now()}`,
      requestTimeEpoch: Date.now(),
      resourceId: 'local',
      resourcePath: req.path,
    },
    resource: req.path,
  };
}

function wrapHandler(
  handler: (event: APIGatewayProxyEvent) => Promise<any>,
  pathParameters?: (req: Request) => Record<string, string>
) {
  return async (req: Request, res: Response) => {
    try {
      const event = toApiGatewayEvent(
        req,
        pathParameters ? pathParameters(req) : undefined
      );
      const result = await handler(event);

      // Forward Lambda response headers (skip CORS ones — Express cors() handles them)
      if (result.headers) {
        const skipHeaders = new Set([
          'access-control-allow-origin', 'access-control-allow-credentials',
          'access-control-allow-methods', 'access-control-allow-headers',
          'access-control-max-age',
        ]);
        Object.entries(result.headers).forEach(([key, value]) => {
          if (!skipHeaders.has(key.toLowerCase())) {
            res.setHeader(key, String(value));
          }
        });
      }
      res.status(result.statusCode).json(JSON.parse(result.body));
    } catch (err: any) {
      console.error('Handler error:', err.message);
      res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
    }
  };
}

// ── Auth Routes ──
app.post('/auth/login', wrapHandler(authHandler, () => ({ action: 'login' })));
app.post('/auth/register', wrapHandler(authHandler, () => ({ action: 'register' })));
app.post('/auth/refresh', wrapHandler(authHandler, () => ({ action: 'refresh' })));
app.post('/auth/logout', wrapHandler(authHandler, () => ({ action: 'logout' })));

// ── User Routes ──
app.get('/users/me', wrapHandler(userHandler));
app.put('/users/me', wrapHandler(userHandler));

// ── NLP Routes ──
app.post('/nlp/analyze', wrapHandler(nlpHandler));

// ── Prediction Routes ──
app.post('/prediction/virality', wrapHandler(predictionHandler));

// ── Trends Routes ──
app.get('/trends', wrapHandler(trendHandler));

// ── Analytics / Dashboard Routes ──
app.get('/analytics/dashboard', wrapHandler(analyticsHandler));
app.get('/api/dashboard', wrapHandler(dashboardHandler));           // full aggregator (spec-aligned)

// ── AI Studio Routes ──
app.post('/ai-studio/generate', wrapHandler(aiStudioGenerateHandler));
app.post('/api/ai/generate', wrapHandler(aiStudioGenerateHandler)); // spec-aligned alias
app.post('/ai-studio/video-assist', wrapHandler(aiStudioVideoAssistHandler));
app.get('/ai-studio/history', wrapHandler(aiStudioHistoryHandler));

// ── Monetization Routes ──
app.post('/monetization/report', wrapHandler(monetizationHandler));
app.post('/api/monetization/predict', wrapHandler(monetizationHandler)); // spec-aligned alias

// ── Content Shield Routes ──
app.post('/content-shield/analyze', wrapHandler(contentShieldHandler));
app.post('/api/content/check', wrapHandler(contentShieldHandler));  // spec-aligned alias

// ── Growth Intelligence Routes ──
app.post('/growth-intelligence/forecast', wrapHandler(growthForecastHandler));
app.post('/api/growth/analyze', wrapHandler(growthForecastHandler)); // spec-aligned alias
app.post('/growth-intelligence/benchmark', wrapHandler(competitorBenchmarkHandler));

// ── Automation Routes ──
app.post('/automation/schedule', wrapHandler(automationScheduleHandler));
app.post('/automation/hashtags', wrapHandler(automationHashtagHandler));
app.post('/automation/ab-test', wrapHandler(automationAbTestHandler));

// ── Creator Scorecard Routes ──
app.post('/creator-scorecard/generate', wrapHandler(creatorScorecardHandler));
app.post('/api/creator/score', wrapHandler(creatorScorecardHandler)); // spec-aligned alias

// ── Health Check ──
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    aiMode: 'local',
  });
});

// ── 404 Handler ──
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
});

// ── Global Error Handler ──
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Express error:', err.message);
  res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
});

// ── Start Server ──
app.listen(PORT, () => {
  console.log(`\n🚀 ConQ Backend Dev Server running at http://localhost:${PORT}`);
  console.log(`🤖 AI Mode: local (no external API key required)`);
  console.log(`🛡️  Security: helmet, CORS, rate limiting, 64kb body limit`);
  console.log(`\n📍 Core Routes:`);
  console.log(`   POST /auth/login | POST /auth/register`);
  console.log(`   POST /api/ai/generate      → AI Studio`);
  console.log(`   POST /api/content/check    → Content Shield`);
  console.log(`   POST /api/growth/analyze   → Growth Intelligence`);
  console.log(`   POST /api/creator/score    → Creator Scorecard`);
  console.log(`   POST /api/monetization/predict → Monetization`);
  console.log(`   GET  /api/dashboard        → Dashboard Aggregator`);
  console.log(`   GET  /health\n`);
});
