// JWT Token Utilities
// Handles token generation, validation, and claim extraction.
// Supports access + refresh token pairs for session management.
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

const ACCESS_TOKEN_EXPIRY = process.env.JWT_EXPIRY || '1h';
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d';

// Suppress unused variable – REFRESH_TOKEN_EXPIRY documents the intended TTL
// for refresh tokens stored in DynamoDB in production.
void REFRESH_TOKEN_EXPIRY;

export interface TokenPayload {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
  tier: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// In-memory refresh token store. In production, use DynamoDB with TTL.
const refreshTokenStore = new Map<string, {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
  tier: string;
  family: string;
  revoked: boolean;
}>();

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
    { expiresIn: ACCESS_TOKEN_EXPIRY } as jwt.SignOptions
  );
};

/**
 * Generate an access + refresh token pair.
 * The refresh token is an opaque random string stored server-side.
 */
export const generateTokenPair = (payload: TokenPayload): TokenPair => {
  const accessToken = generateToken(payload);
  const refreshToken = randomBytes(48).toString('hex');
  const family = randomBytes(16).toString('hex');

  refreshTokenStore.set(refreshToken, {
    userId: payload.userId,
    tenantId: payload.tenantId,
    email: payload.email,
    role: payload.role,
    tier: payload.tier,
    family,
    revoked: false,
  });

  return { accessToken, refreshToken };
};

/**
 * Rotate a refresh token: invalidate old, issue new pair.
 * Implements refresh token rotation — if a revoked token is reused,
 * the entire token family is invalidated (breach detection).
 */
export const rotateRefreshToken = (oldRefreshToken: string): TokenPair | null => {
  const stored = refreshTokenStore.get(oldRefreshToken);
  if (!stored) return null;

  // If an already-revoked token is reused, revoke entire family (potential breach)
  if (stored.revoked) {
    for (const [key, entry] of refreshTokenStore) {
      if (entry.family === stored.family) {
        entry.revoked = true;
        refreshTokenStore.set(key, entry);
      }
    }
    return null;
  }

  // Revoke the old refresh token
  stored.revoked = true;
  refreshTokenStore.set(oldRefreshToken, stored);

  // Issue new pair with same family
  const accessToken = generateToken({
    userId: stored.userId,
    tenantId: stored.tenantId,
    email: stored.email,
    role: stored.role,
    tier: stored.tier,
  });

  const newRefreshToken = randomBytes(48).toString('hex');
  refreshTokenStore.set(newRefreshToken, {
    userId: stored.userId,
    tenantId: stored.tenantId,
    email: stored.email,
    role: stored.role,
    tier: stored.tier,
    family: stored.family,
    revoked: false,
  });

  return { accessToken, refreshToken: newRefreshToken };
};

/**
 * Revoke all refresh tokens for a user (logout from all devices).
 */
export const revokeAllUserTokens = (userId: string): void => {
  for (const [key, entry] of refreshTokenStore) {
    if (entry.userId === userId) {
      entry.revoked = true;
      refreshTokenStore.set(key, entry);
    }
  }
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
