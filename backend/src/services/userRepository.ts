// User Repository
// Data access layer for users. Tenant-scoped.
// Uses DynamoDB in production, in-memory fallback for local dev.

import { TenantRepository } from '../utils/repository';
import { User } from '../models/schemas';
import { config } from '../config';

export class UserRepository extends TenantRepository {
  constructor() {
    super(config.tables.users);
  }

  async createUser(user: User): Promise<void> {
    await this.put(user.tenant_id, user as unknown as Record<string, unknown>);
  }

  async getUserById(tenantId: string, userId: string): Promise<User | null> {
    return this.get<User>(tenantId, 'user_id', userId);
  }

  async getUserByEmail(tenantId: string, email: string): Promise<User | null> {
    // Use findByField (works for both in-memory and DynamoDB GSI fallback)
    const found = await this.findByField<User>(tenantId, 'email', email);
    if (found) return found;

    // Try GSI query for DynamoDB
    try {
      const results = await this.queryByIndex<User>(
        tenantId,
        'email-index',
        'tenant_id = :tid AND email = :email',
        { ':email': email },
        1
      );
      return results[0] || null;
    } catch {
      return null;
    }
  }

  async listUsers(tenantId: string, limit = 50): Promise<User[]> {
    return this.queryByTenant<User>(tenantId, limit);
  }

  async updateUser(tenantId: string, userId: string, updates: Partial<User>): Promise<void> {
    const { tenant_id: _tid, user_id: _uid, ...updateFields } = updates as User;
    await this.update(tenantId, 'user_id', userId, {
      ...updateFields,
      updated_at: new Date().toISOString(),
    });
  }
}
