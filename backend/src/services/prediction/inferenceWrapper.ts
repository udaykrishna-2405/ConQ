// Inference Wrapper
// Abstracts model inference behind a common interface.
// Currently uses the local mock model; in production, routes to SageMaker endpoint.
//
// To switch to SageMaker:
//   1. Set PREDICTION_MODE=sagemaker in environment
//   2. Ensure SAGEMAKER_ENDPOINT_VIRALITY is configured
//   3. This wrapper will route inference to the SageMaker endpoint

import { SageMakerRuntimeClient, InvokeEndpointCommand } from '@aws-sdk/client-sagemaker-runtime';
import { ExtractedFeatures, featuresToVector as toVector } from './featureExtractor';
import { predictVirality as localPredict } from './viralityModel';
import { FeatureImpact } from '../../models/schemas';
import { config } from '../../config';

const PREDICTION_MODE = process.env.PREDICTION_MODE || 'local'; // 'local' | 'sagemaker'

interface InferenceResult {
  score: number;
  confidence: number;
  featureImportances: FeatureImpact[];
  modelVersion: string;
  inferenceMode: string;
}

/**
 * Runs virality prediction using the configured inference backend.
 */
export const runInference = async (features: ExtractedFeatures): Promise<InferenceResult> => {
  if (PREDICTION_MODE === 'sagemaker') {
    return invokeSageMaker(features);
  }
  return invokeLocal(features);
};

/**
 * Local model inference (mock XGBoost).
 */
const invokeLocal = async (features: ExtractedFeatures): Promise<InferenceResult> => {
  const result = localPredict(features);
  return {
    score: result.score,
    confidence: result.confidence,
    featureImportances: result.featureImportances,
    modelVersion: 'mock-v0.1.0',
    inferenceMode: 'local',
  };
};

/**
 * SageMaker endpoint inference.
 * Sends feature vector to the deployed model endpoint.
 * Expected SageMaker response format: { score, confidence, importances }
 */
const invokeSageMaker = async (features: ExtractedFeatures): Promise<InferenceResult> => {
  const client = new SageMakerRuntimeClient({ region: config.region });
  const vector = toVector(features);

  const command = new InvokeEndpointCommand({
    EndpointName: config.sagemaker.viralityEndpoint,
    ContentType: 'application/json',
    Body: JSON.stringify({ features: vector }),
  });

  const response = await client.send(command);
  const body = JSON.parse(new TextDecoder().decode(response.Body as Uint8Array));

  return {
    score: Math.round(body.score),
    confidence: Math.round(body.confidence * 100) / 100,
    featureImportances: body.importances || [],
    modelVersion: body.model_version || 'sagemaker-v1',
    inferenceMode: 'sagemaker',
  };
};
