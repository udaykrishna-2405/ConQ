// Validation Schema Tests

import { loginSchema, registerSchema, updateProfileSchema } from '../../src/models/validation';

describe('Validation Schemas', () => {
  describe('loginSchema', () => {
    it('should accept valid login input', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: 'password123',
        tenantId: 'tenant-abc',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = loginSchema.safeParse({
        email: 'not-an-email',
        password: 'password123',
        tenantId: 'tenant-abc',
      });
      expect(result.success).toBe(false);
    });

    it('should reject short password', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: 'short',
        tenantId: 'tenant-abc',
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing tenantId', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('registerSchema', () => {
    it('should accept valid registration input', () => {
      const result = registerSchema.safeParse({
        email: 'user@example.com',
        password: 'password123',
        name: 'Test User',
      });
      expect(result.success).toBe(true);
    });

    it('should accept optional fields', () => {
      const result = registerSchema.safeParse({
        email: 'user@example.com',
        password: 'password123',
        name: 'Test User',
        tenantId: 'tenant-abc',
        role: 'admin',
        tier: 'enterprise',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid role', () => {
      const result = registerSchema.safeParse({
        email: 'user@example.com',
        password: 'password123',
        name: 'Test User',
        role: 'superadmin',
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing name', () => {
      const result = registerSchema.safeParse({
        email: 'user@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('updateProfileSchema', () => {
    it('should accept name update', () => {
      const result = updateProfileSchema.safeParse({ name: 'New Name' });
      expect(result.success).toBe(true);
    });

    it('should accept platforms update', () => {
      const result = updateProfileSchema.safeParse({
        platforms: ['youtube', 'instagram'],
      });
      expect(result.success).toBe(true);
    });

    it('should accept empty update', () => {
      const result = updateProfileSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should reject invalid platform', () => {
      const result = updateProfileSchema.safeParse({
        platforms: ['tiktok'],
      });
      expect(result.success).toBe(false);
    });
  });
});
