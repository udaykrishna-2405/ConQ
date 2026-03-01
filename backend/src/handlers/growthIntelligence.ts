// Growth Intelligence Handler
// POST /growth-intelligence/forecast — Growth forecasting
// POST /growth-intelligence/benchmark — Competitor benchmarking

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { AuthContext, withAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { growthForecastSchema, competitorBenchmarkSchema } from '../models/validation';
import { GrowthIntelligenceService } from '../services/growthIntelligenceService';
import { success } from '../utils/response';

const service = new GrowthIntelligenceService();

export const growthForecastHandler = withAuth(
  async (
    event: APIGatewayProxyEvent,
    context: AuthContext
  ): Promise<APIGatewayProxyResult> => {
    const body = validateBody(event, growthForecastSchema);
    const result = await service.generateForecast(context.tenantId, body);
    return success(result);
  }
);

export const competitorBenchmarkHandler = withAuth(
  async (
    event: APIGatewayProxyEvent,
    context: AuthContext
  ): Promise<APIGatewayProxyResult> => {
    const body = validateBody(event, competitorBenchmarkSchema);
    const result = await service.generateBenchmark(context.tenantId, body);
    return success(result);
  }
);
