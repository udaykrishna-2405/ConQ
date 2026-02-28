// Request Validation Middleware
// Parses and validates request body/query using Zod schemas.
// Includes body size limits and input sanitization.

import { APIGatewayProxyEvent } from 'aws-lambda';
import { ZodSchema } from 'zod';
import { ValidationError } from './errorHandler';

const MAX_BODY_SIZE = 64 * 1024; // 64 KB

// Strip potentially dangerous characters from string inputs.
// Prevents stored XSS when data is rendered in frontends.
export const sanitizeString = (input: string): string => {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '');
};

/**
 * Parses the event body and validates it against a Zod schema.
 * Throws ValidationError with field-level details on failure.
 */
export const validateBody = <T>(event: APIGatewayProxyEvent, schema: ZodSchema<T>): T => {
  if (event.body && event.body.length > MAX_BODY_SIZE) {
    throw new ValidationError('Request body exceeds maximum allowed size');
  }

  let body: unknown;

  try {
    body = event.body ? JSON.parse(event.body) : {};
  } catch {
    throw new ValidationError('Invalid JSON in request body');
  }

  const result = schema.safeParse(body);

  if (!result.success) {
    const fields: Record<string, string> = {};
    result.error.errors.forEach((err) => {
      const path = err.path.join('.');
      fields[path] = err.message;
    });
    throw new ValidationError('Validation failed', fields);
  }

  return result.data;
};

/**
 * Extracts and validates query string parameters.
 */
export const validateQuery = <T>(event: APIGatewayProxyEvent, schema: ZodSchema<T>): T => {
  const params = event.queryStringParameters || {};
  const result = schema.safeParse(params);

  if (!result.success) {
    const fields: Record<string, string> = {};
    result.error.errors.forEach((err) => {
      const path = err.path.join('.');
      fields[path] = err.message;
    });
    throw new ValidationError('Invalid query parameters', fields);
  }

  return result.data;
};
