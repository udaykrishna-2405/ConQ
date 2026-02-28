// NLP Handler – POST /nlp/analyze
// Multilingual NLP analysis: language detection, sentiment, entity extraction.
// Authenticated endpoint — all results scoped by tenant_id.

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { AuthContext, withAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { nlpAnalyzeSchema } from '../models/validation';
import { NlpService } from '../services/nlpService';
import { success } from '../utils/response';

const nlpService = new NlpService();

/**
 * POST /nlp/analyze
 * Analyzes text content and returns language, sentiment, and entities.
 *
 * Request body:
 *   { text: string, platform?: 'youtube' | 'instagram' }
 *
 * Response:
 *   { language, sentiment, entities, confidence, ... }
 */
export const nlpHandler = withAuth(
  async (
    event: APIGatewayProxyEvent,
    context: AuthContext
  ): Promise<APIGatewayProxyResult> => {
    const body = validateBody(event, nlpAnalyzeSchema);

    const result = await nlpService.analyze(context.tenantId, {
      text: body.text,
      platform: body.platform,
    });

    return success({
      analysisId: result.analysisId,
      language: result.language,
      languageConfidence: result.languageConfidence,
      script: result.script,
      isCodeMixed: result.isCodeMixed,
      detectedLanguages: result.detectedLanguages,
      sentiment: result.sentiment,
      sentimentScore: result.sentimentScore,
      sentimentConfidence: result.sentimentConfidence,
      sentimentBreakdown: result.sentimentBreakdown,
      entities: result.entities,
      hashtagCount: result.hashtagCount,
      mentionCount: result.mentionCount,
      textStats: result.textStats,
    });
  }
);
