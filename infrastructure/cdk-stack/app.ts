#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ConqPipelineStack } from './conq-pipeline-stack';

const app = new cdk.App();

const env: cdk.Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID,
  region: process.env.CDK_DEFAULT_REGION || 'ap-south-1',
};

new ConqPipelineStack(app, 'ConqPipelineStack', {
  env,
  description: 'ConQ Contextual Intelligence Engine - AI Processing Pipeline',
  tags: {
    Project: 'ConQ',
    Environment: 'production',
    ManagedBy: 'CDK',
  },
});

app.synth();
