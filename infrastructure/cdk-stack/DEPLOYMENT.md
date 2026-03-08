# ConQ Contextual Intelligence Engine - Deployment Guide

## Prerequisites

1. **AWS CLI** configured with profile `default` in region `ap-south-1`
2. **AWS CDK** v2 installed: `npm install -g aws-cdk`
3. **Node.js** 18+ and **Python** 3.12+
4. **AWS Toolkit** extension in VS Code

## Project Structure

```
ConQ-hackathon/
├── infrastructure/
│   └── cdk-stack/              ← NEW: CDK pipeline stack
│       ├── app.ts              ← CDK app entry point
│       ├── conq-pipeline-stack.ts  ← Main stack definition
│       ├── cdk.json            ← CDK configuration
│       └── tsconfig.json
├── lambda/                     ← NEW: Lambda function code
│   ├── upload_handler/         ← Handles document upload
│   ├── document_processor/     ← Text extraction (Textract)
│   ├── entity_extractor/       ← NER + keyphrases (Comprehend)
│   ├── summarizer/             ← AI summary (Bedrock Claude)
│   └── results_api/            ← Results retrieval (DynamoDB)
├── workflows/                  ← NEW: Step Functions workflow
│   └── step_function_definition/
│       ├── state_machine.asl.json  ← ASL definition
│       └── workflow_config.json    ← Pipeline config
├── frontend/                   ← Existing React app
├── backend/                    ← Existing Express/Lambda backend
└── README.md
```

## Deployment Steps

### Step 1: Bootstrap CDK (First time only)

```bash
cd infrastructure/cdk-stack
cdk bootstrap aws://ACCOUNT_ID/ap-south-1
```

### Step 2: Install Dependencies

```bash
cd infrastructure/cdk-stack
npm install aws-cdk-lib constructs source-map-support
```

### Step 3: Synthesize CloudFormation Template

```bash
cd infrastructure/cdk-stack
npx cdk synth
```

### Step 4: Deploy the Stack

```bash
cd infrastructure/cdk-stack
npx cdk deploy ConqPipelineStack --require-approval broadening
```

This creates:
- S3 bucket: `conq-document-storage-{account}-{region}`
- DynamoDB table: `ConQInsights`
- 6 Lambda functions (upload, processor, extractor, summarizer, results, process-trigger)
- API Gateway: ConQ Contextual Intelligence API
- Step Functions: `conq-document-processing-pipeline`
- EventBridge rule: auto-trigger on S3 upload
- CloudWatch dashboard: `ConQ-Pipeline-Dashboard`
- All IAM roles with least privilege

### Step 5: Note the Outputs

After deployment, CDK outputs:
```
ConqPipelineStack.ApiGatewayUrl = https://xxxxxxxxxx.execute-api.ap-south-1.amazonaws.com/prod/
ConqPipelineStack.DocumentBucketName = conq-document-storage-xxxxx-ap-south-1
ConqPipelineStack.InsightsTableName = ConQInsights
ConqPipelineStack.StateMachineArn = arn:aws:states:ap-south-1:xxxxx:stateMachine:conq-document-processing-pipeline
```

## Testing API Endpoints

### Health Check
```bash
curl https://API_URL/health
```

### Upload Document (Pre-signed URL)
```bash
curl -X POST https://API_URL/upload \
  -H "Content-Type: application/json" \
  -d '{"filename": "report.pdf", "file_type": "application/pdf"}'
```

### Upload Document (Direct)
```bash
curl -X POST https://API_URL/upload \
  -H "Content-Type: application/json" \
  -d '{"filename": "test.txt", "file_content": "BASE64_ENCODED_CONTENT", "file_type": "text/plain"}'
```

### Trigger Processing
```bash
curl -X POST https://API_URL/process \
  -H "Content-Type: application/json" \
  -d '{"document_id": "DOCUMENT_ID", "s3_key": "uploads/DOCUMENT_ID/filename.pdf"}'
```

### Get Results
```bash
curl https://API_URL/results/DOCUMENT_ID
```

## Verify Pipeline Execution

1. **AWS Console → Step Functions** → Find `conq-document-processing-pipeline`
2. View execution history to see each stage
3. **CloudWatch → Dashboards** → `ConQ-Pipeline-Dashboard` for metrics
4. **DynamoDB → Tables** → `ConQInsights` to see stored results

## Architecture Description (For Presentation)

### ConQ - Contextual Intelligence Engine

ConQ transforms unstructured documents into structured intelligence using a fully serverless, event-driven architecture on AWS.

**How it works:**
1. **Upload** → User uploads a document via API Gateway → Lambda stores it in S3
2. **Trigger** → S3 event triggers EventBridge → EventBridge starts Step Functions pipeline
3. **Process** → Pipeline runs 4 stages sequentially:
   - **Text Extraction** (Textract) → Extracts raw text from PDFs, DOCX, etc.
   - **Entity Extraction** (Comprehend) → Identifies people, organizations, locations, dates
   - **AI Summarization** (Bedrock Claude) → Generates summaries, classifications, insights
   - **Store Results** → Persists structured data in DynamoDB
4. **Retrieve** → User queries results via GET /results/{id} API

**Key AWS Services:**
- **Amazon S3** - Document storage with event notifications
- **AWS Lambda** - Serverless compute (5 functions)
- **Amazon API Gateway** - REST API with CORS
- **AWS Step Functions** - Pipeline orchestration with error handling
- **Amazon EventBridge** - Event-driven triggers
- **Amazon DynamoDB** - NoSQL results storage
- **Amazon Textract** - Document text extraction
- **Amazon Comprehend** - NLP entity extraction + sentiment
- **Amazon Bedrock** - AI summarization with Claude
- **Amazon CloudWatch** - Monitoring dashboard
- **AWS IAM** - Least privilege security

**Architecture Pattern:** Event-driven, serverless, pay-per-use, auto-scaling, zero infrastructure management.
