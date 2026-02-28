// Trend Handler – GET /trends
// Velocity-based trend detection with regional and language filtering.
// Authenticated endpoint with query parameter validation.

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { AuthContext, withAuth } from '../middleware/auth';
import { validateQuery } from '../middleware/validation';
import { trendQuerySchema } from '../models/validation';
import { TrendService } from '../services/trendService';
import { success } from '../utils/response';

const trendService = new TrendService();

/**
 * GET /trends?region=india&language=hi&category=trending&limit=20&date=2026-02-27
 *
 * Query parameters (all optional):
 *   region   - Filter by region (default: 'india')
 *   language - Filter by language ('en', 'hi', 'ta', etc.)
 *   category - Filter by category ('emerging', 'trending', 'viral', 'declining')
 *   limit    - Max trends to return (default: 25, max: 100)
 *   date     - Specific date (YYYY-MM-DD format, default: today)
 */
export const trendHandler = withAuth(
  async (
    event: APIGatewayProxyEvent,
    _context: AuthContext
  ): Promise<APIGatewayProxyResult> => {
    const params = validateQuery(event, trendQuerySchema);

    const limit = params.limit ? Math.min(parseInt(params.limit, 10), 100) : undefined;

    const result = await trendService.getTrends({
      region: params.region,
      language: params.language,
      category: params.category,
      limit: Number.isNaN(limit) ? undefined : limit,
      date: params.date,
    });

    return success(result);
  }
);
