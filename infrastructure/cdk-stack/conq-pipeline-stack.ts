import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import { Construct } from 'constructs';
import * as path from 'path';

export class ConqPipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // =============================================
    // S3 BUCKET - Document Storage
    // =============================================
    const documentBucket = new s3.Bucket(this, 'ConqDocumentStorage', {
      bucketName: `conq-document-storage-${this.account}-${this.region}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      cors: [
        {
          allowedMethods: [s3.HttpMethod.GET, s3.HttpMethod.PUT, s3.HttpMethod.POST],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
          maxAge: 3600,
        },
      ],
      lifecycleRules: [
        {
          id: 'CleanupOldVersions',
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
    });

    // =============================================
    // DYNAMODB TABLE - ConQInsights
    // =============================================
    const insightsTable = new dynamodb.Table(this, 'ConqInsightsTable', {
      tableName: 'ConQInsights',
      partitionKey: {
        name: 'document_id',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
      timeToLiveAttribute: 'ttl',
    });

    // GSI for querying by processing status
    insightsTable.addGlobalSecondaryIndex({
      indexName: 'status-index',
      partitionKey: {
        name: 'processing_status',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'upload_timestamp',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // =============================================
    // COMMON LAMBDA ENVIRONMENT VARIABLES
    // =============================================
    const commonEnv: Record<string, string> = {
      S3_BUCKET_NAME: documentBucket.bucketName,
      DYNAMODB_TABLE_NAME: insightsTable.tableName,
      AWS_REGION_NAME: this.region,
      NODE_OPTIONS: '--enable-source-maps',
      LOG_LEVEL: 'INFO',
    };

    // =============================================
    // LAMBDA FUNCTIONS
    // =============================================

    // 1. Upload Handler Lambda
    const uploadHandler = new lambda.Function(this, 'UploadHandlerLambda', {
      functionName: 'conq-upload-handler',
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'handler.lambda_handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/upload_handler')),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: commonEnv,
      logRetention: logs.RetentionDays.TWO_WEEKS,
      tracing: lambda.Tracing.ACTIVE,
    });

    // 2. Document Processor Lambda
    const documentProcessor = new lambda.Function(this, 'DocumentProcessorLambda', {
      functionName: 'conq-document-processor',
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'handler.lambda_handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/document_processor')),
      timeout: cdk.Duration.seconds(120),
      memorySize: 512,
      environment: commonEnv,
      logRetention: logs.RetentionDays.TWO_WEEKS,
      tracing: lambda.Tracing.ACTIVE,
    });

    // 3. Entity Extractor Lambda
    const entityExtractor = new lambda.Function(this, 'EntityExtractorLambda', {
      functionName: 'conq-entity-extractor',
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'handler.lambda_handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/entity_extractor')),
      timeout: cdk.Duration.seconds(120),
      memorySize: 512,
      environment: commonEnv,
      logRetention: logs.RetentionDays.TWO_WEEKS,
      tracing: lambda.Tracing.ACTIVE,
    });

    // 4. Summarizer Lambda
    const summarizer = new lambda.Function(this, 'SummarizerLambda', {
      functionName: 'conq-summarizer',
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'handler.lambda_handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/summarizer')),
      timeout: cdk.Duration.seconds(180),
      memorySize: 1024,
      environment: commonEnv,
      logRetention: logs.RetentionDays.TWO_WEEKS,
      tracing: lambda.Tracing.ACTIVE,
    });

    // 5. Results API Lambda
    const resultsApi = new lambda.Function(this, 'ResultsApiLambda', {
      functionName: 'conq-results-api',
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'handler.lambda_handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/results_api')),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: commonEnv,
      logRetention: logs.RetentionDays.TWO_WEEKS,
      tracing: lambda.Tracing.ACTIVE,
    });

    // =============================================
    // IAM PERMISSIONS - Least Privilege
    // =============================================

    // Upload handler: S3 write + DynamoDB write
    documentBucket.grantWrite(uploadHandler);
    insightsTable.grantWriteData(uploadHandler);

    // Document processor: S3 read + DynamoDB read/write
    documentBucket.grantRead(documentProcessor);
    insightsTable.grantReadWriteData(documentProcessor);

    // Entity extractor: S3 read + DynamoDB read/write + Comprehend
    documentBucket.grantRead(entityExtractor);
    insightsTable.grantReadWriteData(entityExtractor);
    entityExtractor.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'comprehend:DetectEntities',
        'comprehend:DetectKeyPhrases',
        'comprehend:DetectSentiment',
        'comprehend:DetectDominantLanguage',
      ],
      resources: ['*'],
    }));

    // Summarizer: S3 read + DynamoDB read/write + Bedrock
    documentBucket.grantRead(summarizer);
    insightsTable.grantReadWriteData(summarizer);
    summarizer.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'bedrock:InvokeModel',
        'bedrock:InvokeModelWithResponseStream',
      ],
      resources: ['*'],
    }));

    // Results API: DynamoDB read
    insightsTable.grantReadData(resultsApi);

    // =============================================
    // STEP FUNCTIONS - AI Processing Pipeline
    // =============================================

    // Step 1: Document Processor
    const processDocument = new tasks.LambdaInvoke(this, 'ProcessDocument', {
      lambdaFunction: documentProcessor,
      outputPath: '$.Payload',
      retryOnServiceExceptions: true,
    });
    processDocument.addRetry({
      maxAttempts: 2,
      interval: cdk.Duration.seconds(5),
      backoffRate: 2,
    });

    // Step 2: Entity Extractor
    const extractEntities = new tasks.LambdaInvoke(this, 'ExtractEntities', {
      lambdaFunction: entityExtractor,
      outputPath: '$.Payload',
      retryOnServiceExceptions: true,
    });
    extractEntities.addRetry({
      maxAttempts: 2,
      interval: cdk.Duration.seconds(5),
      backoffRate: 2,
    });

    // Step 3: Summarizer
    const summarizeDocument = new tasks.LambdaInvoke(this, 'SummarizeDocument', {
      lambdaFunction: summarizer,
      outputPath: '$.Payload',
      retryOnServiceExceptions: true,
    });
    summarizeDocument.addRetry({
      maxAttempts: 2,
      interval: cdk.Duration.seconds(10),
      backoffRate: 2,
    });

    // Step 4: Store Results (uses DynamoDB directly via a Pass state or inline in summarizer)
    const storeResults = new tasks.DynamoPutItem(this, 'StoreResults', {
      table: insightsTable,
      item: {
        document_id: tasks.DynamoAttributeValue.fromString(sfn.JsonPath.stringAt('$.document_id')),
        upload_timestamp: tasks.DynamoAttributeValue.fromString(sfn.JsonPath.stringAt('$.upload_timestamp')),
        summary: tasks.DynamoAttributeValue.fromString(sfn.JsonPath.stringAt('$.summary')),
        entities: tasks.DynamoAttributeValue.fromString(sfn.JsonPath.stringAt('$.entities')),
        keywords: tasks.DynamoAttributeValue.fromString(sfn.JsonPath.stringAt('$.keywords')),
        tags: tasks.DynamoAttributeValue.fromString(sfn.JsonPath.stringAt('$.tags')),
        topics: tasks.DynamoAttributeValue.fromString(sfn.JsonPath.stringAt('$.topics')),
        processing_status: tasks.DynamoAttributeValue.fromString('COMPLETED'),
      },
      resultPath: '$.dynamoResult',
    });

    // Success state
    const pipelineSuccess = new sfn.Succeed(this, 'PipelineSuccess', {
      comment: 'Document processing pipeline completed successfully',
    });

    // Failure handler
    const pipelineFailure = new sfn.Fail(this, 'PipelineFailed', {
      cause: 'Document processing pipeline failed',
      error: 'PipelineError',
    });

    // Error catch for each step
    const handleError = new tasks.DynamoUpdateItem(this, 'UpdateStatusFailed', {
      table: insightsTable,
      key: {
        document_id: tasks.DynamoAttributeValue.fromString(sfn.JsonPath.stringAt('$.document_id')),
      },
      updateExpression: 'SET processing_status = :status, error_message = :error',
      expressionAttributeValues: {
        ':status': tasks.DynamoAttributeValue.fromString('FAILED'),
        ':error': tasks.DynamoAttributeValue.fromString(sfn.JsonPath.stringAt('$.error')),
      },
      resultPath: '$.errorUpdate',
    });
    handleError.next(pipelineFailure);

    // Build the pipeline chain
    const definition = processDocument
      .addCatch(handleError, { resultPath: '$.error' })
      .next(extractEntities
        .addCatch(handleError, { resultPath: '$.error' }))
      .next(summarizeDocument
        .addCatch(handleError, { resultPath: '$.error' }))
      .next(storeResults)
      .next(pipelineSuccess);

    // Create Step Functions state machine
    const stateMachine = new sfn.StateMachine(this, 'ConqProcessingPipeline', {
      stateMachineName: 'conq-document-processing-pipeline',
      definitionBody: sfn.DefinitionBody.fromChainable(definition),
      timeout: cdk.Duration.minutes(15),
      tracingEnabled: true,
      logs: {
        destination: new logs.LogGroup(this, 'StateMachineLogGroup', {
          logGroupName: '/aws/stepfunctions/conq-pipeline',
          retention: logs.RetentionDays.TWO_WEEKS,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        }),
        level: sfn.LogLevel.ALL,
        includeExecutionData: true,
      },
    });

    // =============================================
    // EVENTBRIDGE - S3 Event Trigger
    // =============================================

    // EventBridge rule: trigger Step Functions when a file is uploaded to S3
    const uploadRule = new events.Rule(this, 'S3UploadRule', {
      ruleName: 'conq-document-upload-trigger',
      description: 'Triggers the AI processing pipeline when a document is uploaded to S3',
      eventPattern: {
        source: ['aws.s3'],
        detailType: ['Object Created'],
        detail: {
          bucket: {
            name: [documentBucket.bucketName],
          },
        },
      },
    });

    // Grant EventBridge permission to start Step Functions
    uploadRule.addTarget(new targets.SfnStateMachine(stateMachine, {
      input: events.RuleTargetInput.fromEventPath('$.detail'),
    }));

    // Enable S3 EventBridge notifications
    documentBucket.enableEventBridgeNotification();

    // =============================================
    // API GATEWAY - REST API
    // =============================================
    const api = new apigateway.RestApi(this, 'ConqPipelineApi', {
      restApiName: 'ConQ Contextual Intelligence API',
      description: 'API for the ConQ document processing pipeline',
      deployOptions: {
        stageName: 'prod',
        tracingEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date', 'X-Api-Key'],
      },
    });

    // POST /upload
    const uploadResource = api.root.addResource('upload');
    uploadResource.addMethod('POST', new apigateway.LambdaIntegration(uploadHandler, {
      proxy: true,
    }));

    // POST /process - Start Step Functions execution
    const processLambda = new lambda.Function(this, 'ProcessTriggerLambda', {
      functionName: 'conq-process-trigger',
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'index.lambda_handler',
      code: lambda.Code.fromInline(`
import json
import boto3
import os
import uuid
from datetime import datetime

sfn_client = boto3.client('stepfunctions')
STATE_MACHINE_ARN = os.environ['STATE_MACHINE_ARN']

def lambda_handler(event, context):
    try:
        body = json.loads(event.get('body', '{}'))
        document_id = body.get('document_id')
        s3_key = body.get('s3_key')

        if not document_id or not s3_key:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'document_id and s3_key are required'})
            }

        execution_name = f"conq-{document_id}-{uuid.uuid4().hex[:8]}"

        response = sfn_client.start_execution(
            stateMachineArn=STATE_MACHINE_ARN,
            name=execution_name,
            input=json.dumps({
                'document_id': document_id,
                's3_key': s3_key,
                'bucket_name': os.environ.get('S3_BUCKET_NAME', ''),
                'upload_timestamp': datetime.utcnow().isoformat() + 'Z'
            })
        )

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'message': 'Processing pipeline started',
                'execution_arn': response['executionArn'],
                'document_id': document_id
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }
`),
      timeout: cdk.Duration.seconds(15),
      memorySize: 128,
      environment: {
        ...commonEnv,
        STATE_MACHINE_ARN: stateMachine.stateMachineArn,
      },
    });
    stateMachine.grantStartExecution(processLambda);

    const processResource = api.root.addResource('process');
    processResource.addMethod('POST', new apigateway.LambdaIntegration(processLambda, {
      proxy: true,
    }));

    // GET /results/{document_id}
    const resultsResource = api.root.addResource('results');
    const resultByIdResource = resultsResource.addResource('{document_id}');
    resultByIdResource.addMethod('GET', new apigateway.LambdaIntegration(resultsApi, {
      proxy: true,
    }));

    // GET /health
    const healthResource = api.root.addResource('health');
    healthResource.addMethod('GET', new apigateway.MockIntegration({
      integrationResponses: [{
        statusCode: '200',
        responseTemplates: {
          'application/json': JSON.stringify({
            status: 'healthy',
            service: 'ConQ Contextual Intelligence Engine',
            version: '1.0.0',
            timestamp: '$context.requestTime',
          }),
        },
      }],
      requestTemplates: {
        'application/json': '{"statusCode": 200}',
      },
    }), {
      methodResponses: [{
        statusCode: '200',
        responseModels: {
          'application/json': apigateway.Model.EMPTY_MODEL,
        },
      }],
    });

    // =============================================
    // CLOUDWATCH DASHBOARD
    // =============================================
    const dashboard = new cdk.aws_cloudwatch.Dashboard(this, 'ConqDashboard', {
      dashboardName: 'ConQ-Pipeline-Dashboard',
    });

    dashboard.addWidgets(
      new cdk.aws_cloudwatch.GraphWidget({
        title: 'Lambda Invocations',
        left: [
          uploadHandler.metricInvocations(),
          documentProcessor.metricInvocations(),
          entityExtractor.metricInvocations(),
          summarizer.metricInvocations(),
          resultsApi.metricInvocations(),
        ],
      }),
      new cdk.aws_cloudwatch.GraphWidget({
        title: 'Lambda Errors',
        left: [
          uploadHandler.metricErrors(),
          documentProcessor.metricErrors(),
          entityExtractor.metricErrors(),
          summarizer.metricErrors(),
          resultsApi.metricErrors(),
        ],
      }),
      new cdk.aws_cloudwatch.GraphWidget({
        title: 'Lambda Duration (p99)',
        left: [
          uploadHandler.metricDuration({ statistic: 'p99' }),
          documentProcessor.metricDuration({ statistic: 'p99' }),
          entityExtractor.metricDuration({ statistic: 'p99' }),
          summarizer.metricDuration({ statistic: 'p99' }),
        ],
      }),
    );

    // =============================================
    // STACK OUTPUTS
    // =============================================
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: api.url,
      description: 'ConQ Pipeline API Gateway URL',
      exportName: 'ConqPipelineApiUrl',
    });

    new cdk.CfnOutput(this, 'DocumentBucketName', {
      value: documentBucket.bucketName,
      description: 'S3 bucket for document storage',
      exportName: 'ConqDocumentBucketName',
    });

    new cdk.CfnOutput(this, 'InsightsTableName', {
      value: insightsTable.tableName,
      description: 'DynamoDB table for insights',
      exportName: 'ConqInsightsTableName',
    });

    new cdk.CfnOutput(this, 'StateMachineArn', {
      value: stateMachine.stateMachineArn,
      description: 'Step Functions state machine ARN',
      exportName: 'ConqStateMachineArn',
    });

    new cdk.CfnOutput(this, 'UploadEndpoint', {
      value: `${api.url}upload`,
      description: 'POST /upload endpoint',
    });

    new cdk.CfnOutput(this, 'ProcessEndpoint', {
      value: `${api.url}process`,
      description: 'POST /process endpoint',
    });

    new cdk.CfnOutput(this, 'ResultsEndpoint', {
      value: `${api.url}results/{document_id}`,
      description: 'GET /results/{document_id} endpoint',
    });

    new cdk.CfnOutput(this, 'HealthEndpoint', {
      value: `${api.url}health`,
      description: 'GET /health endpoint',
    });
  }
}
