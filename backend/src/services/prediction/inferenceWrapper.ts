// Inference Wrapper
// Abstracts model inference behind a common interface.
// Currently uses the local mock heuristic model.
// SageMaker integration has been removed — Gemini AI handles AI features.
// If you wish to re-enable SageMaker for ML predictions, install
// @aws-sdk/client-sagemaker-runtime and restore the invokeSageMaker function.

import { ExtractedFeatures, featuresToVector as toVector } from './featureExtractor';
import { predictVirality as localPredict } from './viralityModel';
import { FeatureImpact } from '../../models/schemas';

// toVector is imported but used only in SageMaker path — reference here to avoid unused warning
void toVector;

interface InferenceResult {
  score: number;
  confidence: number;
  featureImportances: FeatureImpact[];
  modelVersion: string;
  inferenceMode: string;
}

/**
 * Runs virality prediction using the local heuristic model.
 * SageMaker path has been removed; use Gemini for AI-powered predictions.
 */
export const runInference = async (features: ExtractedFeatures): Promise<InferenceResult> => {
  return invokeLocal(features);
};

/**
 * Local model inference (heuristic model — no external dependencies).
 */
const invokeLocal = async (features: ExtractedFeatures): Promise<InferenceResult> => {
  const result = localPredict(features);
  return {
    score: result.score,
    confidence: result.confidence,
    featureImportances: result.featureImportances,
    modelVersion: 'heuristic-v1.0.0',
    inferenceMode: 'local',
  };
};
