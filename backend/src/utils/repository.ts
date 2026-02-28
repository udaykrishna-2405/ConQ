// Tenant-Scoped DynamoDB Repository
// Base repository pattern that enforces tenant_id on all operations.
// Every query is automatically scoped to the authenticated tenant.

import { PutCommand, GetCommand, QueryCommand, DeleteCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDb } from './dynamodb';

export interface TenantScopedKey {
  tenant_id: string;
  [sortKey: string]: string;
}

/**
 * Base repository that enforces tenant isolation on all DynamoDB operations.
 * All subclasses inherit tenant-scoped CRUD methods.
 */
export class TenantRepository {
  constructor(protected tableName: string) {}

  /**
   * Put item – tenant_id is always included in the item.
   */
  async put(tenantId: string, item: Record<string, unknown>): Promise<void> {
    await dynamoDb.send(
      new PutCommand({
        TableName: this.tableName,
        Item: {
          ...item,
          tenant_id: tenantId,
        },
      })
    );
  }

  /**
   * Get item by tenant_id (partition key) and sort key.
   */
  async get<T>(tenantId: string, sortKeyName: string, sortKeyValue: string): Promise<T | null> {
    const result = await dynamoDb.send(
      new GetCommand({
        TableName: this.tableName,
        Key: {
          tenant_id: tenantId,
          [sortKeyName]: sortKeyValue,
        },
      })
    );
    return (result.Item as T) || null;
  }

  /**
   * Query all items for a tenant. Always scoped by tenant_id partition key.
   */
  async queryByTenant<T>(tenantId: string, limit = 100): Promise<T[]> {
    const result = await dynamoDb.send(
      new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: 'tenant_id = :tid',
        ExpressionAttributeValues: {
          ':tid': tenantId,
        },
        Limit: limit,
      })
    );
    return (result.Items as T[]) || [];
  }

  /**
   * Query with a sort key condition (begins_with, between, etc.).
   */
  async queryWithSortKey<T>(
    tenantId: string,
    sortKeyName: string,
    sortKeyCondition: string,
    sortKeyValue: string,
    limit = 100
  ): Promise<T[]> {
    const result = await dynamoDb.send(
      new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: `tenant_id = :tid AND ${sortKeyCondition}`,
        ExpressionAttributeValues: {
          ':tid': tenantId,
          ':skv': sortKeyValue,
        },
        Limit: limit,
      })
    );
    return (result.Items as T[]) || [];
  }

  /**
   * Query using a GSI, still scoped by tenant_id.
   */
  async queryByIndex<T>(
    tenantId: string,
    indexName: string,
    keyCondition: string,
    expressionValues: Record<string, unknown>,
    limit = 100
  ): Promise<T[]> {
    const result = await dynamoDb.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: indexName,
        KeyConditionExpression: keyCondition,
        ExpressionAttributeValues: {
          ':tid': tenantId,
          ...expressionValues,
        },
        Limit: limit,
      })
    );
    return (result.Items as T[]) || [];
  }

  /**
   * Update specific attributes of an item.
   */
  async update(
    tenantId: string,
    sortKeyName: string,
    sortKeyValue: string,
    updates: Record<string, unknown>
  ): Promise<void> {
    const updateParts: string[] = [];
    const expressionValues: Record<string, unknown> = {};
    const expressionNames: Record<string, string> = {};

    Object.entries(updates).forEach(([key, value], index) => {
      const attrName = `#attr${index}`;
      const attrValue = `:val${index}`;
      updateParts.push(`${attrName} = ${attrValue}`);
      expressionNames[attrName] = key;
      expressionValues[attrValue] = value;
    });

    await dynamoDb.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: {
          tenant_id: tenantId,
          [sortKeyName]: sortKeyValue,
        },
        UpdateExpression: `SET ${updateParts.join(', ')}`,
        ExpressionAttributeNames: expressionNames,
        ExpressionAttributeValues: expressionValues,
      })
    );
  }

  /**
   * Delete an item. Scoped by tenant_id.
   */
  async delete(tenantId: string, sortKeyName: string, sortKeyValue: string): Promise<void> {
    await dynamoDb.send(
      new DeleteCommand({
        TableName: this.tableName,
        Key: {
          tenant_id: tenantId,
          [sortKeyName]: sortKeyValue,
        },
      })
    );
  }
}
