// AI Studio Handler
// POST /ai-studio/generate — Content generation
// POST /ai-studio/video-assist — Video production assistance
// GET  /ai-studio/history — Generation history

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { AuthContext, withAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { aiStudioGenerateSchema, aiStudioVideoAssistSchema } from '../models/validation';
import { AiStudioService } from '../services/aiStudioService';
import { success } from '../utils/response';

const service = new AiStudioService();

export const aiStudioGenerateHandler = withAuth(
  async (
    event: APIGatewayProxyEvent,
    context: AuthContext
  ): Promise<APIGatewayProxyResult> => {
    const body = validateBody(event, aiStudioGenerateSchema);
    const result = await service.generateContent(context.tenantId, body);
    return success(result);
  }
);

export const aiStudioVideoAssistHandler = withAuth(
  async (
    event: APIGatewayProxyEvent,
    context: AuthContext
  ): Promise<APIGatewayProxyResult> => {
    const body = validateBody(event, aiStudioVideoAssistSchema);
    const result = await service.generateVideoAssist(context.tenantId, body);
    return success(result);
  }
);

export const aiStudioHistoryHandler = withAuth(
  async (
    _event: APIGatewayProxyEvent,
    context: AuthContext
  ): Promise<APIGatewayProxyResult> => {
    const history = await service.getHistory(context.tenantId);
    return success({ history });
  }
);
