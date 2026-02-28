// Centralized Error Handler
// Standardized error responses for all Lambda handlers.
// Provides consistent error formatting across all endpoints.

import { APIGatewayProxyResult } from 'aws-lambda';
import { getResponseHeaders } from '../utils/response';

const IS_DEV = process.env.NODE_ENV !== 'production';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public fields?: Record<string, string>) {
    super(400, message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, `${resource} not found`, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(403, message, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class TooManyRequestsError extends AppError {
  constructor(retryAfterSeconds = 60) {
    super(429, `Rate limit exceeded. Retry after ${retryAfterSeconds}s`, 'RATE_LIMIT_EXCEEDED');
    this.name = 'TooManyRequestsError';
  }
}

export const formatErrorResponse = (error: unknown): APIGatewayProxyResult => {
  const headers = getResponseHeaders();

  if (error instanceof ValidationError) {
    return {
      statusCode: error.statusCode,
      headers,
      body: JSON.stringify({
        error: error.message,
        code: error.code,
        // Only expose field-level validation details in development
        ...(IS_DEV && error.fields && { fields: error.fields }),
      }),
    };
  }

  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      headers,
      body: JSON.stringify({
        error: error.message,
        code: error.code,
      }),
    };
  }

  // Never expose internal error details to client
  console.error('Unhandled error:', error);

  return {
    statusCode: 500,
    headers,
    body: JSON.stringify({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    }),
  };
};

/**
 * Wraps a Lambda handler with try/catch error formatting.
 * Use this for unauthenticated endpoints (auth endpoints use withAuth instead).
 */
export const withErrorHandling = (
  handler: (event: unknown) => Promise<APIGatewayProxyResult>
) => {
  return async (event: unknown): Promise<APIGatewayProxyResult> => {
    try {
      return await handler(event);
    } catch (error) {
      return formatErrorResponse(error);
    }
  };
};
