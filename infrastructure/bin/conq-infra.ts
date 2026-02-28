#!/usr/bin/env node
// ConQ CDK App Entry Point
// Deploys 4 stacks in dependency order:
//   1. ConqDataStack   – DynamoDB tables + S3 data lake
//   2. ConqAuthStack   – Cognito User Pool
//   3. ConqMlStack     – SageMaker endpoint
//   4. ConqApiStack    – API Gateway + Lambda functions (depends on 1, 2, 3)

import * as cdk from 'aws-cdk-lib';
import { ConqDataStack } from '../lib/data-stack';
import { ConqAuthStack } from '../lib/auth-stack';
import { ConqMlStack } from '../lib/ml-stack';
import { ConqApiStack } from '../lib/api-stack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'ap-south-1',
};

// Stack 1: Data layer – DynamoDB tables + S3
const dataStack = new ConqDataStack(app, 'ConqDataStack', { env });

// Stack 2: Auth layer – Cognito User Pool
const authStack = new ConqAuthStack(app, 'ConqAuthStack', { env });

// Stack 3: ML layer – SageMaker endpoint
const mlStack = new ConqMlStack(app, 'ConqMlStack', {
  env,
  dataLakeBucket: dataStack.dataLakeBucket,
});

// Stack 4: API layer – Lambda + API Gateway (depends on all above)
new ConqApiStack(app, 'ConqApiStack', {
  env,
  usersTable: dataStack.usersTable,
  contentTable: dataStack.contentTable,
  predictionsTable: dataStack.predictionsTable,
  trendsTable: dataStack.trendsTable,
  analyticsTable: dataStack.analyticsTable,
  userPool: authStack.userPool,
  dataLakeBucket: dataStack.dataLakeBucket,
  sagemakerEndpointName: mlStack.endpointName,
});

app.synth();
