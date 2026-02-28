// User Handler – GET /users/me, PUT /users/me
// Authenticated endpoints for user profile management.

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { AuthContext, withAuth } from '../middleware/auth';
import { AuthService } from '../services/authService';
import { validateBody } from '../middleware/validation';
import { updateProfileSchema } from '../models/validation';
import { success, getResponseHeaders } from '../utils/response';

const authService = new AuthService();

/**
 * GET /users/me
 * Returns the authenticated user's profile.
 */
const getProfile = async (
  _event: APIGatewayProxyEvent,
  context: AuthContext
): Promise<APIGatewayProxyResult> => {
  const user = await authService.getProfile(context.tenantId, context.userId);

  return success({
    userId: user.user_id,
    tenantId: user.tenant_id,
    email: user.email,
    name: user.name,
    role: user.role,
    tier: user.tier,
    platforms: user.platforms,
    onboarding: user.onboarding || null,
    onboardingCompleted: user.onboarding_completed || false,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  });
};

/**
 * PUT /users/me
 * Updates the authenticated user's profile.
 */
const updateProfile = async (
  event: APIGatewayProxyEvent,
  context: AuthContext
): Promise<APIGatewayProxyResult> => {
  const updates = validateBody(event, updateProfileSchema);

  const user = await authService.updateProfile(
    context.tenantId,
    context.userId,
    updates
  );

  return success({
    userId: user.user_id,
    tenantId: user.tenant_id,
    email: user.email,
    name: user.name,
    role: user.role,
    tier: user.tier,
    platforms: user.platforms,
    onboarding: user.onboarding || null,
    onboardingCompleted: user.onboarding_completed || false,
    updatedAt: user.updated_at,
  });
};

/**
 * User router – dispatches based on HTTP method.
 */
export const userHandler = withAuth(
  async (
    event: APIGatewayProxyEvent,
    context: AuthContext
  ): Promise<APIGatewayProxyResult> => {
    switch (event.httpMethod) {
      case 'GET':
        return getProfile(event, context);
      case 'PUT':
        return updateProfile(event, context);
      default:
        return {
          statusCode: 405,
          headers: getResponseHeaders(),
          body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }
  }
);
