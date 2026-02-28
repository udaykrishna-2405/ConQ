// Auth Handler – POST /auth/login, POST /auth/register, POST /auth/refresh, POST /auth/logout
// Unauthenticated endpoints for user authentication.
// Includes rate limiting and refresh token rotation.

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { AuthService } from '../services/authService';
import { validateBody } from '../middleware/validation';
import { loginSchema, registerSchema, refreshTokenSchema } from '../models/validation';
import { success, created, getResponseHeaders } from '../utils/response';
import { withErrorHandling } from '../middleware/errorHandler';
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from '../middleware/rateLimit';
import { withAuth, AuthContext } from '../middleware/auth';

const authService = new AuthService();

/**
 * POST /auth/register
 * Creates a new user account and returns access + refresh token pair.
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
      token: result.tokens.accessToken,
      refreshToken: result.tokens.refreshToken,
    });
  }
);

/**
 * POST /auth/login
 * Authenticates a user and returns access + refresh token pair.
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
      token: result.tokens.accessToken,
      refreshToken: result.tokens.refreshToken,
    });
  }
);

/**
 * POST /auth/refresh
 * Rotates refresh token and returns new access + refresh token pair.
 */
export const refreshHandler = withErrorHandling(
  async (event: unknown): Promise<APIGatewayProxyResult> => {
    const apiEvent = event as APIGatewayProxyEvent;
    checkRateLimit(`refresh:${getRateLimitKey(apiEvent)}`, RATE_LIMITS.auth);

    const body = validateBody(apiEvent, refreshTokenSchema);
    const tokens = await authService.refreshToken(body.refreshToken);

    return success({
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  }
);

/**
 * POST /auth/logout
 * Revokes all refresh tokens for the authenticated user.
 */
export const logoutHandler = withAuth(
  async (
    _event: APIGatewayProxyEvent,
    context: AuthContext
  ): Promise<APIGatewayProxyResult> => {
    await authService.logout(context.userId);
    return success({ message: 'Logged out successfully' });
  }
);

/**
 * Auth router – dispatches to register, login, refresh, or logout based on path.
 * API Gateway maps: POST /auth/{action}
 */
export const authHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const action = event.pathParameters?.action || event.resource?.split('/').pop();

  switch (action) {
    case 'register':
      return registerHandler(event);
    case 'login':
      return loginHandler(event);
    case 'refresh':
      return refreshHandler(event);
    case 'logout':
      return logoutHandler(event);
    default:
      return {
        statusCode: 404,
        headers: getResponseHeaders(),
        body: JSON.stringify({ error: 'Not found' }),
      };
  }
};
