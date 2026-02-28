// JWT Authentication Middleware
// Validates JWT tokens and extracts tenant_id from claims.
// Wraps Lambda handlers to enforce authentication.

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { extractTokenFromHeader, decodeTokenToAuthContext } from '../utils/jwt';
import { formatErrorResponse, AppError } from './errorHandler';

export interface AuthContext {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
}

export type AuthenticatedHandler = (
  event: APIGatewayProxyEvent,
  context: AuthContext
) => Promise<APIGatewayProxyResult>;

/**
 * Middleware that wraps a handler to enforce JWT authentication.
 * Extracts the Bearer token, validates it, and passes the AuthContext
 * to the inner handler. All downstream queries use context.tenantId
 * for multi-tenant data isolation.
 */
export const withAuth = (handler: AuthenticatedHandler) => {
  return async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
      const authHeader = event.headers?.Authorization || event.headers?.authorization;
      const token = extractTokenFromHeader(authHeader);

      if (!token) {
        throw new AppError(401, 'Missing or invalid authorization token', 'AUTH_TOKEN_MISSING');
      }

      const authContext = decodeTokenToAuthContext(token);

      if (!authContext) {
        throw new AppError(401, 'Invalid or expired token', 'AUTH_TOKEN_INVALID');
      }

      if (!authContext.tenantId) {
        throw new AppError(403, 'Token missing tenant context', 'TENANT_MISSING');
      }

      return await handler(event, authContext);
    } catch (error) {
      return formatErrorResponse(error);
    }
  };
};

/**
 * Extracts AuthContext from an already-validated event.
 * Use this when the handler needs auth context but validation
 * is done at the API Gateway level (Cognito authorizer).
 */
export const extractAuthContext = (event: APIGatewayProxyEvent): AuthContext | null => {
  const authHeader = event.headers?.Authorization || event.headers?.authorization;
  const token = extractTokenFromHeader(authHeader);
  if (!token) return null;
  return decodeTokenToAuthContext(token);
};
