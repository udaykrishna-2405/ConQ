// Monetization Hub Handler
// POST /monetization/report — Generate monetization report

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { AuthContext, withAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { monetizationReportSchema } from '../models/validation';
import { MonetizationService } from '../services/monetizationService';
import { success } from '../utils/response';

const service = new MonetizationService();

export const monetizationHandler = withAuth(
  async (
    event: APIGatewayProxyEvent,
    context: AuthContext
  ): Promise<APIGatewayProxyResult> => {
    const body = validateBody(event, monetizationReportSchema);
    const result = await service.generateReport(context.tenantId, body);
    return success(result);
  }
);
