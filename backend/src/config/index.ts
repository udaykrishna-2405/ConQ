// DynamoDB Configuration
// Centralized database client and table name configuration.

export const config = {
  region: process.env.AWS_REGION || 'ap-south-1',
  tables: {
    users: process.env.DYNAMODB_USERS_TABLE || 'conq-users',
    content: process.env.DYNAMODB_CONTENT_TABLE || 'conq-content',
    predictions: process.env.DYNAMODB_PREDICTIONS_TABLE || 'conq-predictions',
    trends: process.env.DYNAMODB_TRENDS_TABLE || 'conq-trends',
    analytics: process.env.DYNAMODB_ANALYTICS_TABLE || 'conq-analytics',
  },
  cognito: {
    userPoolId: process.env.COGNITO_USER_POOL_ID || '',
    clientId: process.env.COGNITO_CLIENT_ID || '',
  },
  sagemaker: {
    viralityEndpoint: process.env.SAGEMAKER_ENDPOINT_VIRALITY || 'conq-virality-endpoint',
  },
  s3: {
    dataLakeBucket: process.env.S3_DATA_LAKE_BUCKET || 'conq-data-lake',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
};
