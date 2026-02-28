# ConQ – AI-Powered Growth Operating System

AI-powered multilingual Growth Operating System for India's creator economy. Predicts content virality, detects trends, analyzes multilingual text (Hindi + English), and unifies cross-platform analytics — all with explainable AI.

## Project Structure

```
conq/
├── backend/             # AWS Lambda microservices (Node.js/TypeScript)
│   ├── src/
│   │   ├── handlers/       # Lambda function handlers (6 endpoints)
│   │   ├── services/       # Business logic (NLP, prediction, trends, analytics)
│   │   ├── middleware/      # Auth, error handling, validation, rate limiting
│   │   ├── models/          # DynamoDB schemas + Zod validation
│   │   ├── utils/           # JWT, password hashing, response helpers
│   │   └── config/          # Environment configuration
│   ├── tests/              # Unit + integration tests (177 tests)
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/            # React + TypeScript SPA
│   ├── src/
│   │   ├── components/     # Layout, dashboard charts, common UI
│   │   ├── pages/          # Login, Dashboard, NLP, Prediction, Trends
│   │   ├── store/          # Redux Toolkit (5 slices)
│   │   ├── services/       # Axios API client
│   │   ├── hooks/          # Typed Redux hooks
│   │   ├── types/          # TypeScript interfaces
│   │   └── styles/         # Global CSS
│   ├── package.json
│   └── tsconfig.json
│
├── infrastructure/      # AWS CDK (Infrastructure as Code)
│   ├── bin/               # CDK app entry point
│   ├── lib/               # 4 stack definitions
│   │   ├── data-stack.ts     # DynamoDB (5 tables) + S3 data lake
│   │   ├── auth-stack.ts     # Cognito User Pool
│   │   ├── ml-stack.ts       # SageMaker endpoint
│   │   └── api-stack.ts      # API Gateway + 6 Lambda functions
│   ├── package.json
│   └── cdk.json
│
├── ml/                  # ML Pipeline (Python)
│   ├── config/            # ML configuration (26 features, hyperparameters)
│   ├── pipelines/         # Training, inference, feature engineering
│   ├── models/            # Trained model artifacts (.pkl)
│   ├── notebooks/         # Jupyter notebooks
│   ├── data/              # Local training data (gitignored)
│   └── requirements.txt
│
├── docs/                # Documentation
└── .gitignore
```

## Tech Stack

| Layer        | Technology                                      |
|--------------|--------------------------------------------------|
| Frontend     | React 18, TypeScript, Redux Toolkit, Recharts    |
| Backend      | AWS Lambda, Node.js 20, TypeScript, Zod          |
| API          | API Gateway (REST, Cognito authorizer)            |
| Auth         | Cognito User Pool, JWT (PBKDF2 local mock)        |
| Database     | DynamoDB (5 tables, tenant-scoped, TTL, GSIs)     |
| Storage      | S3 (data lake, model artifacts)                   |
| ML           | SageMaker, XGBoost, scikit-learn                  |
| IaC          | AWS CDK (4 stacks)                                |
| Security     | HSTS, CORS whitelist, rate limiting, input validation |

## Architecture

Multi-tenant serverless architecture. All data is scoped by `tenant_id` (DynamoDB partition key). JWT tokens carry tenant claims, and the `withAuth` middleware enforces isolation on every request.

```
Client (React SPA)
    │
    ▼
API Gateway (REST, Cognito Authorizer, CORS, Throttling)
    │
    ├── POST /auth/login         → Auth Lambda
    ├── POST /auth/register      → Auth Lambda
    ├── GET  /users/me           → User Lambda
    ├── PUT  /users/me           → User Lambda
    ├── POST /nlp/analyze        → NLP Lambda
    ├── POST /prediction/virality → Prediction Lambda
    ├── GET  /trends             → Trend Lambda
    └── GET  /analytics/dashboard → Analytics Lambda
                                        │
                                        ▼
                                   DynamoDB (tenant-scoped)
                                   S3 Data Lake
                                   SageMaker (ML inference)
```

## Key Features

### Multilingual NLP Engine
- Unicode script-based language detection (Hindi, English, Tamil, Telugu, Bengali)
- Hindi-English code-mixing detection (Devanagari + Latin script analysis)
- Lexicon-based sentiment analysis (English, Hindi Devanagari, Romanized Hindi)
- Named entity extraction (hashtags, mentions, topics, locations)

### Virality Prediction Engine
- 25-feature extraction (content, NLP, temporal, creator, platform signals)
- XGBoost model with weighted heuristic fallback
- SHAP-style explainability (top feature impacts with direction indicators)
- SageMaker-compatible inference wrapper (`model_fn`, `input_fn`, `predict_fn`, `output_fn`)

### Trend Detection Engine
- Velocity-based trend scoring with exponential decay
- Category classification: viral, trending, emerging, declining
- Regional and language filtering (25+ seed trends for India)

### Unified Analytics Dashboard
- Cross-platform metrics (YouTube + Instagram)
- Platform breakdown (pie chart), engagement charts (bar chart)
- Top content ranking by engagement rate
- Trend alignment scoring with creator content

### Security Hardening
- PBKDF2 password hashing (SHA-512, 100K iterations, timing-safe comparison)
- JWT with no hardcoded secrets (random per dev process, required env var in production)
- Rate limiting on auth endpoints (sliding window, per-IP)
- Input validation with max length constraints on all fields
- Security headers (HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy)
- CORS origin whitelisting (no wildcard)
- Error response hardening (no stack traces, no field details in production)

## Getting Started

### Prerequisites

- Node.js 20+
- Python 3.10+
- AWS CLI (configured)
- AWS CDK CLI (`npm install -g aws-cdk`)

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your values (JWT_SECRET is required in production)
npm run build
npm test
```

### Frontend Setup

```bash
cd frontend
npm install --legacy-peer-deps
cp .env.example .env
npm start
```

### ML Pipeline Setup

```bash
cd ml
pip install -r requirements.txt
# Train a model
python -m pipelines.training_pipeline
# Test inference
python -m pipelines.inference_wrapper
```

### Infrastructure Deployment

```bash
cd infrastructure
npm install
npm run build
# Preview changes
npx cdk diff
# Deploy all stacks
npx cdk deploy --all
```

## API Reference

### Authentication (unauthenticated)

```
POST /auth/register
Body: { email, password, name, tenantId?, role?, tier? }
Response: { user: {...}, token: "jwt..." }

POST /auth/login
Body: { email, password, tenantId }
Response: { user: {...}, token: "jwt..." }
```

### User Profile (authenticated)

```
GET /users/me
Headers: Authorization: Bearer <token>
Response: { userId, tenantId, email, name, role, tier, platforms, ... }

PUT /users/me
Headers: Authorization: Bearer <token>
Body: { name?, platforms? }
```

### NLP Analysis (authenticated)

```
POST /nlp/analyze
Headers: Authorization: Bearer <token>
Body: { text: "...", platform?: "youtube" | "instagram" }
Response: { analysisId, language, sentiment, sentimentScore, entities, ... }
```

### Virality Prediction (authenticated)

```
POST /prediction/virality
Headers: Authorization: Bearer <token>
Body: { title, description?, tags?, platform, language?,
        historicalEngagementRate?, followerCount? }
Response: { predictionId, score: 0-100, confidence: 0-1,
            explanation: [{feature, impact, direction}], ... }
```

### Trends (authenticated)

```
GET /trends?region=india&language=hi&category=trending&limit=20&date=2026-02-27
Headers: Authorization: Bearer <token>
Response: { trends: [...], summary: { total, emerging, trending, viral, declining } }
```

### Analytics Dashboard (authenticated)

```
GET /analytics/dashboard
Headers: Authorization: Bearer <token>
Response: { youtube: {...}, instagram: {...}, unifiedMetrics: {...},
            topContent: [...], trendAlignment: [...] }
```

## Testing

```bash
# Backend: 177 tests across 15 test suites
cd backend && npm test

# Frontend: build verification
cd frontend && npm run build
```

### Test Coverage

| Suite                     | Tests |
|---------------------------|-------|
| NLP (language, sentiment, entities) | 31 |
| Virality prediction + features       | 17 |
| Trend detection + calculator         | 16 |
| Platform mocks (YouTube, Instagram)  | 28 |
| Analytics service                    | 14 |
| Auth (JWT, password, validation)     | 22 |
| Security hardening                   | 35 |
| **Total**                            | **177** |

## Environment Variables

See the `.env.example` files in each package directory:
- `backend/.env.example` — JWT, AWS, DynamoDB, Cognito, SageMaker, CORS
- `frontend/.env.example` — API URL, Cognito configuration
- `ml/.env.example` — AWS, S3, SageMaker role

## License

Proprietary — Hackathon Submission.
