// JWT Token Utilities
// Handles token generation, validation, and claim extraction.
// Uses jsonwebtoken for local/mock auth. In production, Cognito issues tokens
// and this layer validates them against the Cognito JWKS.

import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import { AuthContext } from '../middleware/auth';

// In production, JWT_SECRET must be set via environment variable (minimum 32 chars).
// For local dev, a random secret is generated per process if not set.
const JWT_SECRET = (() => {
  const envSecret = process.env.JWT_SECRET;
  if (envSecret) {
    if (envSecret.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters');
    }
    return envSecret;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production');
  }
  // Dev-only: generate random secret per process (tokens don't survive restarts)
  return randomBytes(64).toString('hex');
})();

const JWT_EXPIRY = process.env.JWT_EXPIRY || '1h';

export interface TokenPayload {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
  tier: string;
}

export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(
    {
      sub: payload.userId,
      tenant_id: payload.tenantId,
      email: payload.email,
      role: payload.role,
      tier: payload.tier,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY } as jwt.SignOptions
  );
};

export const verifyToken = (token: string): TokenPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    return {
      userId: decoded.sub as string,
      tenantId: decoded.tenant_id,
      email: decoded.email,
      role: decoded.role,
      tier: decoded.tier,
    };
  } catch {
    return null;
  }
};

export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  return parts[1];
};

export const decodeTokenToAuthContext = (token: string): AuthContext | null => {
  const payload = verifyToken(token);
  if (!payload) return null;
  return {
    userId: payload.userId,
    tenantId: payload.tenantId,
    email: payload.email,
    role: payload.role,
  };
};
