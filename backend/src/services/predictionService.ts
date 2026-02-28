// Prediction Service – Orchestrator
// Coordinates feature extraction, model inference, and result persistence.
// All predictions are tenant-scoped and stored with TTL.

import { v4 as uuidv4 } from 'uuid';
import { extractFeatures, ContentInput } from './prediction/featureExtractor';
import { runInference } from './prediction/inferenceWrapper';
import { Prediction, FeatureImpact } from '../models/schemas';
import { TenantRepository } from '../utils/repository';
import { config } from '../config';

// TTL: predictions expire after 7 days
const PREDICTION_TTL_DAYS = 7;

export interface PredictionRequest {
  title: string;
  description?: string;
  tags?: string[];
  platform: 'youtube' | 'instagram';
  language?: string;
  historicalEngagementRate?: number;
  followerCount?: number;
}

export interface PredictionResponse {
  predictionId: string;
  score: number;
  confidence: number;
  explanation: FeatureImpact[];
  modelVersion: string;
  features: {
    hashtagCount: number;
    mentionCount: number;
    sentimentScore: number;
    sentimentLabel: string;
    isCodeMixed: boolean;
    language: string;
    topicCount: number;
    titleEngagementPotential: number;
    contentDensity: number;
  };
}

class PredictionRepository extends TenantRepository {
  constructor() {
    super(config.tables.predictions);
  }

  async savePrediction(tenantId: string, prediction: Prediction): Promise<void> {
    await this.put(tenantId, prediction as unknown as Record<string, unknown>);
  }

  async getPrediction(tenantId: string, predictionId: string): Promise<Prediction | null> {
    return this.get<Prediction>(tenantId, 'prediction_id', predictionId);
  }

  async listPredictions(tenantId: string, limit = 20): Promise<Prediction[]> {
    return this.queryByTenant<Prediction>(tenantId, limit);
  }
}

export class PredictionService {
  private repo: PredictionRepository;

  constructor() {
    this.repo = new PredictionRepository();
  }

  /**
   * Full prediction pipeline:
   * 1. Extract features from content input
   * 2. Run model inference (local mock or SageMaker)
   * 3. Generate explanations
   * 4. Persist prediction with TTL
   * 5. Return formatted response
   */
  async predict(
    tenantId: string,
    request: PredictionRequest
  ): Promise<PredictionResponse> {
    // 1. Build content input
    const contentInput: ContentInput = {
      title: request.title,
      description: request.description,
      tags: request.tags,
      platform: request.platform,
      language: request.language,
      historicalEngagementRate: request.historicalEngagementRate,
      followerCount: request.followerCount,
    };

    // 2. Extract features
    const features = extractFeatures(contentInput);

    // 3. Run inference
    const inferenceResult = await runInference(features);

    const predictionId = uuidv4();
    const now = new Date();
    const ttl = Math.floor(now.getTime() / 1000) + (PREDICTION_TTL_DAYS * 24 * 60 * 60);

    // 4. Build prediction record
    const prediction: Prediction = {
      tenant_id: tenantId,
      prediction_id: predictionId,
      content_id: `content_${predictionId.slice(0, 8)}`,
      score: inferenceResult.score,
      confidence: inferenceResult.confidence,
      explanation: inferenceResult.featureImportances,
      model_version: inferenceResult.modelVersion,
      created_at: now.toISOString(),
      ttl,
    };

    // 5. Persist (non-blocking)
    this.repo.savePrediction(tenantId, prediction).catch(err => {
      console.error('Failed to save prediction:', err);
    });

    // 6. Return response with feature highlights
    return {
      predictionId,
      score: inferenceResult.score,
      confidence: inferenceResult.confidence,
      explanation: inferenceResult.featureImportances,
      modelVersion: inferenceResult.modelVersion,
      features: {
        hashtagCount: features.hashtagCount,
        mentionCount: features.mentionCount,
        sentimentScore: features.sentimentScore,
        sentimentLabel: features.sentimentLabel,
        isCodeMixed: features.isCodeMixed,
        language: features.language,
        topicCount: features.topicCount,
        titleEngagementPotential: features.titleEngagementPotential,
        contentDensity: features.contentDensity,
      },
    };
  }

  /**
   * Retrieve a previously saved prediction.
   */
  async getPrediction(tenantId: string, predictionId: string): Promise<Prediction | null> {
    return this.repo.getPrediction(tenantId, predictionId);
  }

  /**
   * List recent predictions for a tenant.
   */
  async listPredictions(tenantId: string, limit = 20): Promise<Prediction[]> {
    return this.repo.listPredictions(tenantId, limit);
  }
}
