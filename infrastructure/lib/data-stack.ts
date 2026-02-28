// ConQ Data Stack
// Defines DynamoDB tables and S3 data lake bucket.
// All tables use tenant_id as partition key for multi-tenant isolation.

import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export class ConqDataStack extends cdk.Stack {
  public readonly usersTable: dynamodb.Table;
  public readonly contentTable: dynamodb.Table;
  public readonly predictionsTable: dynamodb.Table;
  public readonly trendsTable: dynamodb.Table;
  public readonly analyticsTable: dynamodb.Table;
  public readonly dataLakeBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ── DynamoDB Tables ──
    // All tables: PK = tenant_id, on-demand billing, point-in-time recovery

    this.usersTable = new dynamodb.Table(this, 'UsersTable', {
      tableName: 'conq-users',
      partitionKey: { name: 'tenant_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'user_id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // GSI: lookup by email within a tenant
    this.usersTable.addGlobalSecondaryIndex({
      indexName: 'email-index',
      partitionKey: { name: 'tenant_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'email', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    this.contentTable = new dynamodb.Table(this, 'ContentTable', {
      tableName: 'conq-content',
      partitionKey: { name: 'tenant_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'content_id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // GSI: query content by platform
    this.contentTable.addGlobalSecondaryIndex({
      indexName: 'platform-index',
      partitionKey: { name: 'tenant_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'platform', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    this.predictionsTable = new dynamodb.Table(this, 'PredictionsTable', {
      tableName: 'conq-predictions',
      partitionKey: { name: 'tenant_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'prediction_id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'ttl',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.trendsTable = new dynamodb.Table(this, 'TrendsTable', {
      tableName: 'conq-trends',
      partitionKey: { name: 'tenant_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'trend_id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // GSI: query trends by date
    this.trendsTable.addGlobalSecondaryIndex({
      indexName: 'date-index',
      partitionKey: { name: 'tenant_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'date', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    this.analyticsTable = new dynamodb.Table(this, 'AnalyticsTable', {
      tableName: 'conq-analytics',
      partitionKey: { name: 'tenant_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'snapshot_id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'ttl',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ── S3 Data Lake Bucket ──

    this.dataLakeBucket = new s3.Bucket(this, 'DataLakeBucket', {
      bucketName: `conq-data-lake-${this.account}-${this.region}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: 'archive-old-data',
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(90),
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(365),
            },
          ],
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // ── Outputs ──

    new cdk.CfnOutput(this, 'UsersTableName', { value: this.usersTable.tableName });
    new cdk.CfnOutput(this, 'ContentTableName', { value: this.contentTable.tableName });
    new cdk.CfnOutput(this, 'PredictionsTableName', { value: this.predictionsTable.tableName });
    new cdk.CfnOutput(this, 'TrendsTableName', { value: this.trendsTable.tableName });
    new cdk.CfnOutput(this, 'AnalyticsTableName', { value: this.analyticsTable.tableName });
    new cdk.CfnOutput(this, 'DataLakeBucketName', { value: this.dataLakeBucket.bucketName });
  }
}
