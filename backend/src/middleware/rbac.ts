// RBAC Middleware
// Role-based access control enforcement.
// Checks that the authenticated user has the required role for the operation.

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { AuthContext, AuthenticatedHandler } from './auth';
import { ForbiddenError, formatErrorResponse } from './errorHandler';

type Role = 'admin' | 'creator' | 'viewer';

const ROLE_HIERARCHY: Record<Role, number> = {
  viewer: 1,
  creator: 2,
  admin: 3,
};

/**
 * Middleware that enforces a minimum role level on an authenticated handler.
 * Must be used inside withAuth (receives AuthContext).
 *
 * Usage:
 *   export const handler = withAuth(requireRole('admin', myHandler));
 */
export const requireRole = (
  minimumRole: Role,
  handler: AuthenticatedHandler
): AuthenticatedHandler => {
  return async (
    event: APIGatewayProxyEvent,
    context: AuthContext
  ): Promise<APIGatewayProxyResult> => {
    const userLevel = ROLE_HIERARCHY[context.role as Role] || 0;
    const requiredLevel = ROLE_HIERARCHY[minimumRole];

    if (userLevel < requiredLevel) {
      return formatErrorResponse(
        new ForbiddenError(`Role '${minimumRole}' or higher required`)
      );
    }

    return handler(event, context);
  };
};

/**
 * Checks if a user's role matches any of the allowed roles.
 */
export const requireAnyRole = (
  allowedRoles: Role[],
  handler: AuthenticatedHandler
): AuthenticatedHandler => {
  return async (
    event: APIGatewayProxyEvent,
    context: AuthContext
  ): Promise<APIGatewayProxyResult> => {
    if (!allowedRoles.includes(context.role as Role)) {
      return formatErrorResponse(
        new ForbiddenError(`One of roles [${allowedRoles.join(', ')}] required`)
      );
    }

    return handler(event, context);
  };
};
