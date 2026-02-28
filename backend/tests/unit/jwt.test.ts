// JWT Utility Tests

import { generateToken, verifyToken, extractTokenFromHeader, decodeTokenToAuthContext } from '../../src/utils/jwt';

describe('JWT Utilities', () => {
  const testPayload = {
    userId: 'user-123',
    tenantId: 'tenant-abc',
    email: 'test@example.com',
    role: 'creator',
    tier: 'pro',
  };

  describe('generateToken', () => {
    it('should generate a valid JWT string', () => {
      const token = generateToken(testPayload);
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // header.payload.signature
    });
  });

  describe('verifyToken', () => {
    it('should decode a valid token to the original payload', () => {
      const token = generateToken(testPayload);
      const decoded = verifyToken(token);

      expect(decoded).not.toBeNull();
      expect(decoded!.userId).toBe(testPayload.userId);
      expect(decoded!.tenantId).toBe(testPayload.tenantId);
      expect(decoded!.email).toBe(testPayload.email);
      expect(decoded!.role).toBe(testPayload.role);
      expect(decoded!.tier).toBe(testPayload.tier);
    });

    it('should return null for an invalid token', () => {
      const result = verifyToken('invalid.token.here');
      expect(result).toBeNull();
    });

    it('should return null for an empty string', () => {
      const result = verifyToken('');
      expect(result).toBeNull();
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from Bearer header', () => {
      const token = extractTokenFromHeader('Bearer abc123');
      expect(token).toBe('abc123');
    });

    it('should return null for missing header', () => {
      expect(extractTokenFromHeader(undefined)).toBeNull();
    });

    it('should return null for non-Bearer header', () => {
      expect(extractTokenFromHeader('Basic abc123')).toBeNull();
    });

    it('should return null for malformed header', () => {
      expect(extractTokenFromHeader('Bearer')).toBeNull();
      expect(extractTokenFromHeader('Bearer a b')).toBeNull();
    });
  });

  describe('decodeTokenToAuthContext', () => {
    it('should return AuthContext from a valid token', () => {
      const token = generateToken(testPayload);
      const context = decodeTokenToAuthContext(token);

      expect(context).not.toBeNull();
      expect(context!.userId).toBe(testPayload.userId);
      expect(context!.tenantId).toBe(testPayload.tenantId);
      expect(context!.email).toBe(testPayload.email);
      expect(context!.role).toBe(testPayload.role);
    });

    it('should return null for an invalid token', () => {
      expect(decodeTokenToAuthContext('bad-token')).toBeNull();
    });
  });
});
