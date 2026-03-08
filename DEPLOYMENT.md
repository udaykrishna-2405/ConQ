# ConQ — AWS Deployment Guide

## Architecture Overview

```
Browser/CloudFront → API Gateway → Lambda Functions → DynamoDB
                                                     ↘ S3 (reports)
                                         Gemini AI ←→ Lambda Functions
```

## Quick Start (Local Development)

```bash
# Install all dependencies
npm run install:all

# Start both backend and frontend
npm run dev

# Backend: http://localhost:3001
# Frontend: http://localhost:3000
```

> [!IMPORTANT]
> Create `backend/.env` from `backend/.env.example` and set `GEMINI_API_KEY` before starting.

---

## Step 1 — DynamoDB Tables

Create these tables in AWS Console or via CLI:

```bash
# Run for each table (replace TABLE_NAME):
aws dynamodb create-table \
  --table-name TABLE_NAME \
  --attribute-definitions \
    AttributeName=tenant_id,AttributeType=S \
    AttributeName=sort_key,AttributeType=S \
  --key-schema \
    AttributeName=tenant_id,KeyType=HASH \
    AttributeName=sort_key,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region ap-south-1
```

**Tables to create:**
| Table Name | Purpose |
|---|---|
| `conq-users` | User accounts & auth |
| `conq-content` | AI Studio generations |
| `conq-analytics` | Dashboard snapshots |
| `conq-predictions` | Virality predictions |
| `conq-trends` | Trend data |
| `conq-ai-studio` | AI generation history |
| `conq-growth-intelligence` | Growth reports |
| `conq-monetization` | Revenue reports |
| `conq-creator-scorecard` | Creator scores |
| `conq-content-shield` | Content analysis reports |
| `conq-automation` | Automation schedules |

---

## Step 2 — S3 Buckets

```bash
# Reports bucket
aws s3api create-bucket \
  --bucket conq-reports \
  --region ap-south-1 \
  --create-bucket-configuration LocationConstraint=ap-south-1

# Block public access (reports are private)
aws s3api put-public-access-block \
  --bucket conq-reports \
  --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

# Frontend static hosting bucket
aws s3api create-bucket \
  --bucket conq-frontend \
  --region ap-south-1 \
  --create-bucket-configuration LocationConstraint=ap-south-1

aws s3api put-bucket-policy \
  --bucket conq-frontend \
  --policy '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":"*","Action":"s3:GetObject","Resource":"arn:aws:s3:::conq-frontend/*"}]}'
```

---

## Step 3 — Build & Deploy Backend Lambda

```bash
# Build TypeScript
cd backend
npm run build

# Package for Lambda
zip -r lambda-dist.zip dist/ node_modules/

# Create Lambda function (one per handler)
aws lambda create-function \
  --function-name conq-ai-studio \
  --zip-file fileb://lambda-dist.zip \
  --handler dist/handlers/aiStudio.aiStudioGenerateHandler \
  --runtime nodejs20.x \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/conq-lambda-role \
  --environment Variables='{
    "NODE_ENV":"production",
    "GEMINI_API_KEY":"YOUR_KEY",
    "JWT_SECRET":"YOUR_SECRET",
    "AWS_REGION":"ap-south-1",
    "DYNAMODB_USERS_TABLE":"conq-users",
    "DYNAMODB_AI_STUDIO_TABLE":"conq-ai-studio"
  }' \
  --timeout 30 \
  --memory-size 512 \
  --region ap-south-1
```

**Lambda functions to create:**
- `conq-auth` → `dist/handlers/auth.authHandler`
- `conq-ai-studio` → `dist/handlers/aiStudio.aiStudioGenerateHandler`
- `conq-content-shield` → `dist/handlers/contentShield.contentShieldHandler`
- `conq-growth-intelligence` → `dist/handlers/growthIntelligence.growthForecastHandler`
- `conq-creator-scorecard` → `dist/handlers/creatorScorecard.creatorScorecardHandler`
- `conq-monetization` → `dist/handlers/monetization.monetizationHandler`
- `conq-dashboard` → `dist/handlers/dashboard.dashboardHandler`
- `conq-analytics` → `dist/handlers/analytics.analyticsHandler`

---

## Step 4 — API Gateway

```bash
# Create HTTP API
aws apigatewayv2 create-api \
  --name conq-api \
  --protocol-type HTTP \
  --cors-configuration \
    AllowOrigins="https://your-domain.cloudfront.net",AllowMethods="GET,POST,PUT,DELETE" \
  --region ap-south-1
```

**Route mapping:**
| Route | Lambda |
|---|---|
| `POST /auth/{action}` | `conq-auth` |
| `POST /api/ai/generate` | `conq-ai-studio` |
| `POST /api/content/check` | `conq-content-shield` |
| `POST /api/growth/analyze` | `conq-growth-intelligence` |
| `POST /api/creator/score` | `conq-creator-scorecard` |
| `POST /api/monetization/predict` | `conq-monetization` |
| `GET /api/dashboard` | `conq-dashboard` |

---

## Step 5 — Frontend Build & CloudFront

```bash
# Build React app
cd frontend
npm run build

# Upload to S3
aws s3 sync build/ s3://conq-frontend --delete

# Create CloudFront distribution
aws cloudfront create-distribution \
  --distribution-config '{
    "Origins": {
      "Quantity": 1,
      "Items": [{
        "Id": "S3-conq-frontend",
        "DomainName": "conq-frontend.s3.ap-south-1.amazonaws.com",
        "S3OriginConfig": {"OriginAccessIdentity": ""}
      }]
    },
    "DefaultCacheBehavior": {
      "ViewerProtocolPolicy": "redirect-to-https",
      "TargetOriginId": "S3-conq-frontend",
      "ForwardedValues": {"QueryString": false, "Cookies": {"Forward": "none"}},
      "MinTTL": 0
    },
    "DefaultRootObject": "index.html",
    "Enabled": true,
    "PriceClass": "PriceClass_100"
  }'
```

---

## Step 6 — IAM Role for Lambda

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": "arn:aws:s3:::ap-south-1:*:table/conq-*"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject"],
      "Resource": "arn:aws:s3:::conq-reports/*"
    },
    {
      "Effect": "Allow",
      "Action": ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
      "Resource": "*"
    }
  ]
}
```

---

## Environment Variables (Production)

Set in Lambda console or AWS Secrets Manager:

```
NODE_ENV=production
JWT_SECRET=<min 64 char random string>
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
GEMINI_API_KEY=<your Gemini API key>
GEMINI_MODEL=gemini-1.5-flash
AWS_REGION=ap-south-1
ALLOWED_ORIGINS=https://your-app.cloudfront.net
DYNAMODB_USERS_TABLE=conq-users
DYNAMODB_AI_STUDIO_TABLE=conq-ai-studio
... (see backend/.env.example for full list)
```

---

## Available Routes Summary

| Method | Route | Description |
|---|---|---|
| POST | `/auth/register` | Register user |
| POST | `/auth/login` | Login |
| POST | `/auth/refresh` | Refresh token |
| POST | `/auth/logout` | Logout |
| GET | `/api/dashboard` | Full dashboard aggregation |
| POST | `/api/ai/generate` | AI content generation (Gemini) |
| POST | `/ai-studio/generate` | Same with extended params |
| POST | `/api/content/check` | Content Shield analysis |
| POST | `/api/growth/analyze` | Growth Intelligence |
| POST | `/api/creator/score` | Creator Scorecard |
| POST | `/api/monetization/predict` | Revenue prediction |
| POST | `/nlp/analyze` | NLP & sentiment |
| POST | `/prediction/virality` | Virality prediction |
| GET | `/trends` | Trending topics |
| GET | `/health` | Health check |
