/**
 * Local Express Dev Server
 * Wraps AWS Lambda handlers so they can be called locally via HTTP.
 * Run with: npx ts-node src/devServer.ts
 */

import { config as dotenvConfig } from 'dotenv';
dotenvConfig(); // Load .env before anything else

import express, { Request, Response } from 'express';
import cors from 'cors';
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

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

/**
 * Convert an Express request into a fake APIGatewayProxyEvent
 */
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
        accessKey: null,
        accountId: null,
        apiKey: null,
        apiKeyId: null,
        caller: null,
        clientCert: null,
        cognitoAuthenticationProvider: null,
        cognitoAuthenticationType: null,
        cognitoIdentityId: null,
        cognitoIdentityPoolId: null,
        principalOrgId: null,
        user: null,
        userArn: null,
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

/**
 * Generic handler wrapper: Lambda handler → Express route handler
 */
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
      // Set response headers from Lambda result
      if (result.headers) {
        Object.entries(result.headers).forEach(([key, value]) => {
          if (key.toLowerCase() !== 'access-control-allow-origin' &&
              key.toLowerCase() !== 'access-control-allow-credentials' &&
              key.toLowerCase() !== 'access-control-allow-methods' &&
              key.toLowerCase() !== 'access-control-allow-headers') {
            res.setHeader(key, String(value));
          }
        });
      }
      res.status(result.statusCode).json(JSON.parse(result.body));
    } catch (err: any) {
      console.error('Handler error:', err);
      res.status(500).json({ error: err.message || 'Internal server error' });
    }
  };
}

// ── Auth routes (unauthenticated) ──
app.post('/auth/login', wrapHandler(authHandler, () => ({ action: 'login' })));
app.post('/auth/register', wrapHandler(authHandler, () => ({ action: 'register' })));
app.post('/auth/refresh', wrapHandler(authHandler, () => ({ action: 'refresh' })));
app.post('/auth/logout', wrapHandler(authHandler, () => ({ action: 'logout' })));

// ── User routes ──
app.get('/users/me', wrapHandler(userHandler));
app.put('/users/me', wrapHandler(userHandler));

// ── NLP routes ──
app.post('/nlp/analyze', wrapHandler(nlpHandler));

// ── Prediction routes ──
app.post('/prediction/virality', wrapHandler(predictionHandler));

// ── Trends routes ──
app.get('/trends', wrapHandler(trendHandler));

// ── Analytics routes ──
app.get('/analytics/dashboard', wrapHandler(analyticsHandler));

// ── AI Studio routes ──
app.post('/ai-studio/generate', wrapHandler(aiStudioGenerateHandler));
app.post('/ai-studio/video-assist', wrapHandler(aiStudioVideoAssistHandler));
app.get('/ai-studio/history', wrapHandler(aiStudioHistoryHandler));

// ── Monetization routes ──
app.post('/monetization/report', wrapHandler(monetizationHandler));

// ── Content Shield routes ──
app.post('/content-shield/analyze', wrapHandler(contentShieldHandler));

// ── Growth Intelligence routes ──
app.post('/growth-intelligence/forecast', wrapHandler(growthForecastHandler));
app.post('/growth-intelligence/benchmark', wrapHandler(competitorBenchmarkHandler));

// ── Automation routes ──
app.post('/automation/schedule', wrapHandler(automationScheduleHandler));
app.post('/automation/hashtags', wrapHandler(automationHashtagHandler));
app.post('/automation/ab-test', wrapHandler(automationAbTestHandler));

// ── Creator Scorecard routes ──
app.post('/creator-scorecard/generate', wrapHandler(creatorScorecardHandler));

// ── Health check ──
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Start server ──
app.listen(PORT, () => {
  console.log(`\n🚀 ConQ Backend Dev Server running at http://localhost:${PORT}`);
  console.log(`\nAvailable routes:`);
  console.log(`  POST   /auth/login`);
  console.log(`  POST   /auth/register`);
  console.log(`  POST   /auth/refresh`);
  console.log(`  POST   /auth/logout`);
  console.log(`  GET    /users/me`);
  console.log(`  PUT    /users/me`);
  console.log(`  POST   /nlp/analyze`);
  console.log(`  POST   /prediction/virality`);
  console.log(`  GET    /trends`);
  console.log(`  GET    /analytics/dashboard`);
  console.log(`  POST   /ai-studio/generate`);
  console.log(`  POST   /ai-studio/video-assist`);
  console.log(`  GET    /ai-studio/history`);
  console.log(`  POST   /monetization/report`);
  console.log(`  POST   /content-shield/analyze`);
  console.log(`  POST   /growth-intelligence/forecast`);
  console.log(`  POST   /growth-intelligence/benchmark`);
  console.log(`  POST   /automation/schedule`);
  console.log(`  POST   /automation/hashtags`);
  console.log(`  POST   /automation/ab-test`);
  console.log(`  POST   /creator-scorecard/generate`);
  console.log(`  GET    /health\n`);
});
