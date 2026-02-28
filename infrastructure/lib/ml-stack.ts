// ConQ ML Stack
// Defines SageMaker endpoint for virality prediction model.
// In MVP, the local heuristic model is used. This stack provisions
// the SageMaker infrastructure for production deployment.

import * as cdk from 'aws-cdk-lib';
import * as sagemaker from 'aws-cdk-lib/aws-sagemaker';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface ConqMlStackProps extends cdk.StackProps {
  dataLakeBucket: s3.IBucket;
}

export class ConqMlStack extends cdk.Stack {
  public readonly endpointName: string;

  constructor(scope: Construct, id: string, props: ConqMlStackProps) {
    super(scope, id, props);

    // ── SageMaker Execution Role ──

    const sagemakerRole = new iam.Role(this, 'SageMakerExecutionRole', {
      roleName: 'conq-sagemaker-execution-role',
      assumedBy: new iam.ServicePrincipal('sagemaker.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSageMakerFullAccess'),
      ],
    });

    // Grant access to data lake bucket for training data
    props.dataLakeBucket.grantRead(sagemakerRole);

    // ── Model Artifact Bucket ──
    // SageMaker model artifacts are stored here after training

    const modelBucket = new s3.Bucket(this, 'ModelArtifactsBucket', {
      bucketName: `conq-model-artifacts-${this.account}-${this.region}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    modelBucket.grantReadWrite(sagemakerRole);

    // ── SageMaker Model ──
    // Uses XGBoost built-in algorithm container.
    // Model data URI is populated after training pipeline runs.

    const model = new sagemaker.CfnModel(this, 'ViralityModel', {
      modelName: 'conq-virality-model',
      executionRoleArn: sagemakerRole.roleArn,
      primaryContainer: {
        // XGBoost built-in algorithm container for ap-south-1
        image: `720646828776.dkr.ecr.${this.region}.amazonaws.com/sagemaker-xgboost:1.7-1`,
        modelDataUrl: `s3://${modelBucket.bucketName}/models/virality/model.tar.gz`,
      },
    });

    // ── Endpoint Configuration ──

    const endpointConfig = new sagemaker.CfnEndpointConfig(this, 'ViralityEndpointConfig', {
      endpointConfigName: 'conq-virality-endpoint-config',
      productionVariants: [
        {
          variantName: 'primary',
          modelName: model.modelName!,
          initialInstanceCount: 1,
          instanceType: 'ml.t2.medium',
          initialVariantWeight: 1.0,
        },
      ],
    });

    endpointConfig.addDependency(model);

    // ── SageMaker Endpoint ──

    const endpoint = new sagemaker.CfnEndpoint(this, 'ViralityEndpoint', {
      endpointName: 'conq-virality-endpoint',
      endpointConfigName: endpointConfig.endpointConfigName!,
    });

    endpoint.addDependency(endpointConfig);

    this.endpointName = 'conq-virality-endpoint';

    // ── Outputs ──

    new cdk.CfnOutput(this, 'SageMakerEndpointName', { value: this.endpointName });
    new cdk.CfnOutput(this, 'ModelArtifactsBucketName', { value: modelBucket.bucketName });
    new cdk.CfnOutput(this, 'SageMakerRoleArn', { value: sagemakerRole.roleArn });
  }
}
