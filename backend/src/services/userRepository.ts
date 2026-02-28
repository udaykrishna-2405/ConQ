// User Repository
// DynamoDB data access layer for users. Tenant-scoped.

import { TenantRepository } from '../utils/repository';
import { User } from '../models/schemas';
import { config } from '../config';
import { dynamoDb } from '../utils/dynamodb';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';

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
    // Query using GSI on email within tenant scope
    const result = await dynamoDb.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'tenant-email-index',
        KeyConditionExpression: 'tenant_id = :tid AND email = :email',
        ExpressionAttributeValues: {
          ':tid': tenantId,
          ':email': email,
        },
        Limit: 1,
      })
    );
    return (result.Items?.[0] as User) || null;
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
