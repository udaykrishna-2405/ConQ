// API Response Helpers
// Standardized response formatting for Lambda handlers.
// Includes security headers and CORS configuration.

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000'];

const SECURITY_HEADERS: Record<string, string | boolean> = {
  'Content-Type': 'application/json',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '0',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'Cache-Control': 'no-store',
};

const buildCorsHeaders = (origin?: string): Record<string, string | boolean> => {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Credentials': true,
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Max-Age': '3600',
  };
};

export const getResponseHeaders = (origin?: string): Record<string, string | boolean> => ({
  ...SECURITY_HEADERS,
  ...buildCorsHeaders(origin),
});

export const success = (body: unknown, statusCode = 200) => ({
  statusCode,
  headers: getResponseHeaders(),
  body: JSON.stringify(body),
});

export const created = (body: unknown) => success(body, 201);

export const noContent = () => ({
  statusCode: 204,
  headers: getResponseHeaders(),
  body: '',
});
