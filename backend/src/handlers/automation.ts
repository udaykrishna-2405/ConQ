// Automation Center Handler
// POST /automation/schedule — Smart scheduling
// POST /automation/hashtags — Hashtag generation
// POST /automation/ab-test — A/B testing simulation

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { AuthContext, withAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { scheduleSchema, hashtagSchema, abTestSchema } from '../models/validation';
import { AutomationService } from '../services/automationService';
import { success } from '../utils/response';

const service = new AutomationService();

export const automationScheduleHandler = withAuth(
  async (
    event: APIGatewayProxyEvent,
    context: AuthContext
  ): Promise<APIGatewayProxyResult> => {
    const body = validateBody(event, scheduleSchema);
    const result = await service.generateSchedule(context.tenantId, body);
    return success(result);
  }
);

export const automationHashtagHandler = withAuth(
  async (
    event: APIGatewayProxyEvent,
    context: AuthContext
  ): Promise<APIGatewayProxyResult> => {
    const body = validateBody(event, hashtagSchema);
    const result = await service.generateHashtags(context.tenantId, body);
    return success(result);
  }
);

export const automationAbTestHandler = withAuth(
  async (
    event: APIGatewayProxyEvent,
    context: AuthContext
  ): Promise<APIGatewayProxyResult> => {
    const body = validateBody(event, abTestSchema);
    const result = await service.runABTest(context.tenantId, body);
    return success(result);
  }
);
