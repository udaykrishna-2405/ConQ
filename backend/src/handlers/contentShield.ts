// Content Shield Handler
// POST /content-shield/analyze — Analyze content for policy/copyright/brand-safety risks

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { AuthContext, withAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { contentShieldSchema } from '../models/validation';
import { ContentShieldService } from '../services/contentShieldService';
import { success } from '../utils/response';

const service = new ContentShieldService();

export const contentShieldHandler = withAuth(
  async (
    event: APIGatewayProxyEvent,
    context: AuthContext
  ): Promise<APIGatewayProxyResult> => {
    const body = validateBody(event, contentShieldSchema);
    const result = await service.analyzeContent(context.tenantId, body);
    return success(result);
  }
);
