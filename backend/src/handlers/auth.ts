// Auth Handler – POST /auth/login, POST /auth/register
// Unauthenticated endpoints for user registration and login.
// Includes rate limiting to prevent brute force attacks.

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { AuthService } from '../services/authService';
import { validateBody } from '../middleware/validation';
import { loginSchema, registerSchema } from '../models/validation';
import { success, created } from '../utils/response';
import { withErrorHandling } from '../middleware/errorHandler';
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from '../middleware/rateLimit';
import { getResponseHeaders } from '../utils/response';

const authService = new AuthService();

/**
 * POST /auth/register
 * Creates a new user account and returns a JWT token.
 */
export const registerHandler = withErrorHandling(
  async (event: unknown): Promise<APIGatewayProxyResult> => {
    const apiEvent = event as APIGatewayProxyEvent;
    checkRateLimit(`register:${getRateLimitKey(apiEvent)}`, RATE_LIMITS.auth);

    const body = validateBody(apiEvent, registerSchema);

    const result = await authService.register({
      email: body.email,
      password: body.password,
      name: body.name,
      tenantId: body.tenantId,
      role: body.role,
      tier: body.tier,
    });

    return created({
      user: {
        userId: result.user.user_id,
        tenantId: result.user.tenant_id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        tier: result.user.tier,
      },
      token: result.token,
    });
  }
);

/**
 * POST /auth/login
 * Authenticates a user and returns a JWT token.
 */
export const loginHandler = withErrorHandling(
  async (event: unknown): Promise<APIGatewayProxyResult> => {
    const apiEvent = event as APIGatewayProxyEvent;
    checkRateLimit(`login:${getRateLimitKey(apiEvent)}`, RATE_LIMITS.auth);

    const body = validateBody(apiEvent, loginSchema);

    const result = await authService.login({
      email: body.email,
      password: body.password,
      tenantId: body.tenantId,
    });

    return success({
      user: {
        userId: result.user.user_id,
        tenantId: result.user.tenant_id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        tier: result.user.tier,
      },
      token: result.token,
    });
  }
);

/**
 * Auth router – dispatches to register or login based on path.
 * API Gateway maps: POST /auth/{action}
 */
export const authHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const action = event.pathParameters?.action || event.resource?.split('/').pop();

  switch (action) {
    case 'register':
      return registerHandler(event);
    case 'login':
      return loginHandler(event);
    default:
      return {
        statusCode: 404,
        headers: getResponseHeaders(),
        body: JSON.stringify({ error: 'Not found' }),
      };
  }
};
