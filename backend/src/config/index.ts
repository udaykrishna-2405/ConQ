// ConQ Backend Configuration
// Environment-based configuration for AWS resources and services.
// All secrets MUST come from environment variables — no hardcoded fallbacks in production.

const isProd = process.env.NODE_ENV === 'production';

if (isProd && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required in production');
}

// GEMINI_API_KEY is no longer required — local AI fallback is used instead.

export const config = {
  // Runtime
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),

  // AWS Region
  region: process.env.AWS_REGION || 'ap-south-1',

  // AI mode — always 'local' now (Gemini removed for keyless deployment)
  ai: {
    mode: 'local',
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || (isProd ? (() => { throw new Error('JWT_SECRET required'); })() : 'conq-dev-only-change-in-production'),
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // CORS
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
      : ['http://localhost:3000'],
  },

  // DynamoDB Table Names
  tables: {
    users: process.env.DYNAMODB_USERS_TABLE || 'conq-users',
    content: process.env.DYNAMODB_CONTENT_TABLE || 'conq-content',
    predictions: process.env.DYNAMODB_PREDICTIONS_TABLE || 'conq-predictions',
    trends: process.env.DYNAMODB_TRENDS_TABLE || 'conq-trends',
    analytics: process.env.DYNAMODB_ANALYTICS_TABLE || 'conq-analytics',
    aiStudio: process.env.DYNAMODB_AI_STUDIO_TABLE || 'conq-ai-studio',
    growthIntelligence: process.env.DYNAMODB_GROWTH_TABLE || 'conq-growth-intelligence',
    monetization: process.env.DYNAMODB_MONETIZATION_TABLE || 'conq-monetization',
    creatorScorecard: process.env.DYNAMODB_SCORECARD_TABLE || 'conq-creator-scorecard',
    contentShield: process.env.DYNAMODB_SHIELD_TABLE || 'conq-content-shield',
    automation: process.env.DYNAMODB_AUTOMATION_TABLE || 'conq-automation',
  },

  // DynamoDB advanced config
  dynamodb: {
    endpoint: process.env.DYNAMODB_ENDPOINT || undefined, // For local DynamoDB
    tables: {
      users: process.env.DYNAMODB_USERS_TABLE || 'conq-users',
      content: process.env.DYNAMODB_CONTENT_TABLE || 'conq-content',
      predictions: process.env.DYNAMODB_PREDICTIONS_TABLE || 'conq-predictions',
      trends: process.env.DYNAMODB_TRENDS_TABLE || 'conq-trends',
      analytics: process.env.DYNAMODB_ANALYTICS_TABLE || 'conq-analytics',
      aiStudio: process.env.DYNAMODB_AI_STUDIO_TABLE || 'conq-ai-studio',
    },
  },

  // S3
  s3: {
    reportsBucket: process.env.S3_REPORTS_BUCKET || 'conq-reports',
    dataLakeBucket: process.env.S3_DATA_LAKE_BUCKET || 'conq-data-lake',
  },

  // CloudFront
  cloudfront: {
    domain: process.env.CLOUDFRONT_DOMAIN || '',
  },

  // SES Configuration
  ses: {
    fromEmail: process.env.SES_FROM_EMAIL || 'noreply@conq.ai',
    replyToEmail: process.env.SES_REPLY_TO_EMAIL || 'support@conq.ai',
  },

  // Platform API Keys
  youtube: {
    apiKey: process.env.YOUTUBE_API_KEY || '',
  },
  instagram: {
    accessToken: process.env.INSTAGRAM_ACCESS_TOKEN || '',
  },

  // SageMaker — disabled in favour of Gemini AI; kept as stub to avoid breaking
  // any code that references config.sagemaker during local development.
  sagemaker: {
    viralityEndpoint: process.env.SAGEMAKER_ENDPOINT_VIRALITY || 'conq-virality-endpoint',
  },
};

export default config;
