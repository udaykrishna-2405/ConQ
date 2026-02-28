// ConQ API Stack
// Defines API Gateway REST API, Lambda functions, and route integrations.
// All Lambdas get tenant-scoped DynamoDB access + environment variables.

import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

interface ConqApiStackProps extends cdk.StackProps {
  usersTable: dynamodb.ITable;
  contentTable: dynamodb.ITable;
  predictionsTable: dynamodb.ITable;
  trendsTable: dynamodb.ITable;
  analyticsTable: dynamodb.ITable;
  userPool: cognito.IUserPool;
  dataLakeBucket: s3.IBucket;
  sagemakerEndpointName: string;
}

export class ConqApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ConqApiStackProps) {
    super(scope, id, props);

    // ── Shared Lambda Environment ──

    const commonEnv: Record<string, string> = {
      NODE_OPTIONS: '--enable-source-maps',
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      DYNAMODB_USERS_TABLE: props.usersTable.tableName,
      DYNAMODB_CONTENT_TABLE: props.contentTable.tableName,
      DYNAMODB_PREDICTIONS_TABLE: props.predictionsTable.tableName,
      DYNAMODB_TRENDS_TABLE: props.trendsTable.tableName,
      DYNAMODB_ANALYTICS_TABLE: props.analyticsTable.tableName,
      COGNITO_USER_POOL_ID: props.userPool.userPoolId,
      SAGEMAKER_ENDPOINT_VIRALITY: props.sagemakerEndpointName,
      S3_DATA_LAKE_BUCKET: props.dataLakeBucket.bucketName,
    };

    // ── Lambda Factory ──

    const createLambda = (
      constructId: string,
      funcName: string,
      handler: string,
      description: string
    ): lambda.Function => {
      return new lambda.Function(this, constructId, {
        functionName: funcName,
        runtime: lambda.Runtime.NODEJS_20_X,
        memorySize: 256,
        timeout: cdk.Duration.seconds(30),
        environment: commonEnv,
        logRetention: logs.RetentionDays.ONE_MONTH,
        tracing: lambda.Tracing.ACTIVE,
        handler,
        code: lambda.Code.fromAsset('../backend/dist'),
        description,
      });
    };

    // ── Lambda Functions ──

    const authFn = createLambda('AuthFunction', 'conq-auth', 'handlers/auth.authHandler', 'Auth handler – login, register');
    const userFn = createLambda('UserFunction', 'conq-user', 'handlers/user.userHandler', 'User handler – profile CRUD');
    const nlpFn = createLambda('NlpFunction', 'conq-nlp', 'handlers/nlp.nlpHandler', 'NLP handler – multilingual text analysis');
    const predictionFn = createLambda('PredictionFunction', 'conq-prediction', 'handlers/prediction.predictionHandler', 'Prediction handler – virality scoring');
    const trendFn = createLambda('TrendFunction', 'conq-trend', 'handlers/trend.trendHandler', 'Trend handler – trend discovery');
    const analyticsFn = createLambda('AnalyticsFunction', 'conq-analytics', 'handlers/analytics.analyticsHandler', 'Analytics handler – unified dashboard');

    // ── DynamoDB Permissions ──

    const allTables = [
      props.usersTable,
      props.contentTable,
      props.predictionsTable,
      props.trendsTable,
      props.analyticsTable,
    ];

    // Auth + User need users table read/write
    props.usersTable.grantReadWriteData(authFn);
    props.usersTable.grantReadWriteData(userFn);

    // NLP needs content table for persistence
    props.contentTable.grantReadWriteData(nlpFn);

    // Prediction needs predictions + content tables
    props.predictionsTable.grantReadWriteData(predictionFn);
    props.contentTable.grantReadData(predictionFn);

    // Trend needs trends table
    props.trendsTable.grantReadWriteData(trendFn);

    // Analytics needs read on all tables
    allTables.forEach((table) => table.grantReadData(analyticsFn));
    props.analyticsTable.grantWriteData(analyticsFn);

    // ── SageMaker Permissions (Prediction Lambda) ──

    predictionFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['sagemaker:InvokeEndpoint'],
        resources: [
          `arn:aws:sagemaker:${this.region}:${this.account}:endpoint/${props.sagemakerEndpointName}`,
        ],
      })
    );

    // ── S3 Permissions ──

    props.dataLakeBucket.grantRead(analyticsFn);

    // ── API Gateway ──

    const api = new apigateway.RestApi(this, 'ConqApi', {
      restApiName: 'ConQ API',
      description: 'ConQ AI Growth OS – REST API',
      deployOptions: {
        stageName: 'v1',
        throttlingRateLimit: 100,
        throttlingBurstLimit: 200,
        metricsEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'Authorization',
          'X-Amz-Date',
          'X-Api-Key',
        ],
      },
    });

    // ── Cognito Authorizer ──

    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'ConqAuthorizer', {
      cognitoUserPools: [props.userPool],
      authorizerName: 'conq-cognito-authorizer',
      identitySource: 'method.request.header.Authorization',
    });

    const authMethodOptions: apigateway.MethodOptions = {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    };

    // ── Routes ──

    // POST /auth/login, POST /auth/register (public – no authorizer)
    const authResource = api.root.addResource('auth');
    const authLogin = authResource.addResource('login');
    authLogin.addMethod('POST', new apigateway.LambdaIntegration(authFn));
    const authRegister = authResource.addResource('register');
    authRegister.addMethod('POST', new apigateway.LambdaIntegration(authFn));

    // GET/PUT /users/me (authenticated)
    const usersResource = api.root.addResource('users');
    const usersMeResource = usersResource.addResource('me');
    usersMeResource.addMethod('GET', new apigateway.LambdaIntegration(userFn), authMethodOptions);
    usersMeResource.addMethod('PUT', new apigateway.LambdaIntegration(userFn), authMethodOptions);

    // POST /nlp/analyze (authenticated)
    const nlpResource = api.root.addResource('nlp');
    const nlpAnalyzeResource = nlpResource.addResource('analyze');
    nlpAnalyzeResource.addMethod('POST', new apigateway.LambdaIntegration(nlpFn), authMethodOptions);

    // POST /prediction/virality (authenticated)
    const predictionResource = api.root.addResource('prediction');
    const predViralityResource = predictionResource.addResource('virality');
    predViralityResource.addMethod('POST', new apigateway.LambdaIntegration(predictionFn), authMethodOptions);

    // GET /trends (authenticated)
    const trendsResource = api.root.addResource('trends');
    trendsResource.addMethod('GET', new apigateway.LambdaIntegration(trendFn), authMethodOptions);

    // GET /analytics/dashboard (authenticated)
    const analyticsResource = api.root.addResource('analytics');
    const analyticsDashboardResource = analyticsResource.addResource('dashboard');
    analyticsDashboardResource.addMethod('GET', new apigateway.LambdaIntegration(analyticsFn), authMethodOptions);

    // ── Outputs ──

    new cdk.CfnOutput(this, 'ApiEndpoint', { value: api.url });
    new cdk.CfnOutput(this, 'ApiId', { value: api.restApiId });
  }
}
