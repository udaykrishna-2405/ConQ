// Creator Scorecard Handler
// POST /creator-scorecard/generate — Generate creator scorecard

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { AuthContext, withAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { creatorScorecardSchema } from '../models/validation';
import { CreatorScorecardService } from '../services/creatorScorecardService';
import { success } from '../utils/response';

const service = new CreatorScorecardService();

export const creatorScorecardHandler = withAuth(
  async (
    event: APIGatewayProxyEvent,
    context: AuthContext
  ): Promise<APIGatewayProxyResult> => {
    const body = validateBody(event, creatorScorecardSchema);
    const result = await service.generateScorecard(context.tenantId, body);
    return success(result);
  }
);
