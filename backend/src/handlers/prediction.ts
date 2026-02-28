// Prediction Handler – POST /prediction/virality
// Virality prediction with explainability.
// Authenticated endpoint — all results scoped by tenant_id.

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { AuthContext, withAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { viralityPredictSchema } from '../models/validation';
import { PredictionService } from '../services/predictionService';
import { success } from '../utils/response';

const predictionService = new PredictionService();

/**
 * POST /prediction/virality
 * Predicts virality score for content with explainability.
 *
 * Request body:
 *   { title, description?, tags?, platform, language?,
 *     historicalEngagementRate?, followerCount? }
 *
 * Response:
 *   { predictionId, score: 0-100, confidence: 0-1,
 *     explanation: [{feature, impact, direction}], features: {...} }
 */
export const predictionHandler = withAuth(
  async (
    event: APIGatewayProxyEvent,
    context: AuthContext
  ): Promise<APIGatewayProxyResult> => {
    const body = validateBody(event, viralityPredictSchema);

    const result = await predictionService.predict(context.tenantId, {
      title: body.title,
      description: body.description,
      tags: body.tags,
      platform: body.platform,
      language: body.language,
      historicalEngagementRate: body.historicalEngagementRate,
      followerCount: body.followerCount,
    });

    return success({
      predictionId: result.predictionId,
      score: result.score,
      confidence: result.confidence,
      explanation: result.explanation,
      modelVersion: result.modelVersion,
      features: result.features,
    });
  }
);
