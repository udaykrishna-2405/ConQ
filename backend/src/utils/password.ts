// Password Hashing Utility
// Uses PBKDF2 with SHA-512 for password hashing (NIST-approved KDF).
// In production, Cognito handles password management.
// This mock allows local development without Cognito dependency.

import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'crypto';

const ITERATIONS = 100_000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';

export const hashPassword = (password: string, salt?: string): { hash: string; salt: string } => {
  const useSalt = salt || randomBytes(32).toString('hex');
  const hash = pbkdf2Sync(password, useSalt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex');
  return { hash, salt: useSalt };
};

export const verifyPassword = (password: string, hash: string, salt: string): boolean => {
  const result = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex');
  // Constant-time comparison to prevent timing attacks
  const hashBuffer = Buffer.from(hash, 'hex');
  const resultBuffer = Buffer.from(result, 'hex');
  if (hashBuffer.length !== resultBuffer.length) return false;
  return timingSafeEqual(hashBuffer, resultBuffer);
};
