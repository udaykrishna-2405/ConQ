// Analytics Handler – GET /analytics/dashboard
// Unified cross-platform analytics aggregation (YouTube + Instagram).
// Authenticated, tenant-scoped endpoint.

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { AuthContext, withAuth } from '../middleware/auth';
import { AnalyticsService } from '../services/analyticsService';
import { success } from '../utils/response';

const analyticsService = new AnalyticsService();

/**
 * GET /analytics/dashboard
 *
 * Returns unified dashboard metrics for the authenticated tenant.
 * Combines YouTube channel + video data, Instagram profile + post data,
 * cross-platform unified metrics, top content ranking, and trend alignment.
 *
 * No query parameters required — tenant is derived from JWT.
 */
export const analyticsHandler = withAuth(
  async (
    _event: APIGatewayProxyEvent,
    context: AuthContext
  ): Promise<APIGatewayProxyResult> => {
    const dashboard = await analyticsService.getDashboard(context.tenantId);
    return success(dashboard);
  }
);
