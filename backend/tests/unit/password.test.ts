// Password Utility Tests

import { hashPassword, verifyPassword } from '../../src/utils/password';

describe('Password Utilities', () => {
  describe('hashPassword', () => {
    it('should return a hash and salt', () => {
      const result = hashPassword('myPassword123');
      expect(result.hash).toBeDefined();
      expect(result.salt).toBeDefined();
      expect(result.hash.length).toBeGreaterThan(0);
      expect(result.salt.length).toBeGreaterThan(0);
    });

    it('should produce different salts for same password', () => {
      const result1 = hashPassword('myPassword123');
      const result2 = hashPassword('myPassword123');
      expect(result1.salt).not.toBe(result2.salt);
      expect(result1.hash).not.toBe(result2.hash);
    });

    it('should produce same hash given same salt', () => {
      const result1 = hashPassword('myPassword123', 'fixed-salt');
      const result2 = hashPassword('myPassword123', 'fixed-salt');
      expect(result1.hash).toBe(result2.hash);
    });
  });

  describe('verifyPassword', () => {
    it('should return true for correct password', () => {
      const { hash, salt } = hashPassword('correctPassword');
      expect(verifyPassword('correctPassword', hash, salt)).toBe(true);
    });

    it('should return false for incorrect password', () => {
      const { hash, salt } = hashPassword('correctPassword');
      expect(verifyPassword('wrongPassword', hash, salt)).toBe(false);
    });
  });
});
