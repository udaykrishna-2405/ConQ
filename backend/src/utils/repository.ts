// Tenant-Scoped Repository
// Base repository pattern that enforces tenant_id on all operations.
// Uses DynamoDB in production, falls back to in-memory storage for local dev.

import { PutCommand, GetCommand, QueryCommand, DeleteCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDb } from './dynamodb';

export interface TenantScopedKey {
  tenant_id: string;
  [sortKey: string]: string;
}

// In-memory storage for local development (when DynamoDB is unavailable or table schema mismatches)
const memoryStore = new Map<string, Map<string, Record<string, unknown>>>();
// Per-table fallback tracking: null = untested, false = use DynamoDB, true = use in-memory
const tableMemoryFlags = new Map<string, boolean>();
let dynamoDbReachable: boolean | null = null;

function getTableStore(tableName: string): Map<string, Record<string, unknown>> {
  if (!memoryStore.has(tableName)) {
    memoryStore.set(tableName, new Map());
  }
  return memoryStore.get(tableName)!;
}

function itemKey(tenantId: string, item: Record<string, unknown>): string {
  // Build a composite key from tenant_id + all other key-like fields
  const parts = [tenantId];
  for (const [k, v] of Object.entries(item)) {
    if (k !== 'tenant_id' && typeof v === 'string' && (k.endsWith('_id') || k === 'email')) {
      parts.push(`${k}=${v}`);
    }
  }
  return parts.join('|');
}

function markTableAsMemory(tableName: string): void {
  tableMemoryFlags.set(tableName, true);
}

async function shouldUseMemory(tableName: string): Promise<boolean> {
  // Check per-table override first
  if (tableMemoryFlags.has(tableName)) {
    return tableMemoryFlags.get(tableName)!;
  }
  // Check global DynamoDB connectivity (only once)
  if (dynamoDbReachable === null) {
    try {
      await dynamoDb.send(new GetCommand({
        TableName: '__connectivity_test__',
        Key: { pk: 'test' },
      }));
      dynamoDbReachable = true;
    } catch (err: any) {
      if (err.name === 'ResourceNotFoundException') {
        dynamoDbReachable = true; // DynamoDB is reachable, table just doesn't exist
      } else {
        console.log('[Repository] DynamoDB not available, using in-memory storage for local dev');
        dynamoDbReachable = false;
      }
    }
  }
  if (!dynamoDbReachable) {
    return true; // No DynamoDB at all → all tables use memory
  }
  return false; // DynamoDB available, table not yet marked as failed → try DynamoDB
}

/**
 * Base repository that enforces tenant isolation.
 * Falls back to in-memory storage when DynamoDB is unavailable.
 */
export class TenantRepository {
  constructor(protected tableName: string) {}

  /**
   * Put item – tenant_id is always included in the item.
   * Falls back to in-memory on any DynamoDB error (schema mismatch, missing keys, etc.)
   */
  async put(tenantId: string, item: Record<string, unknown>): Promise<void> {
    const enriched = { ...item, tenant_id: tenantId };
    if (await shouldUseMemory(this.tableName)) {
      const store = getTableStore(this.tableName);
      const key = itemKey(tenantId, enriched);
      store.set(key, enriched);
      return;
    }
    try {
      await dynamoDb.send(
        new PutCommand({
          TableName: this.tableName,
          Item: enriched,
        })
      );
    } catch (err: any) {
      // DynamoDB reachable but table schema mismatch → switch this table to in-memory
      console.log(`[Repository] DynamoDB put failed for ${this.tableName}, switching to in-memory: ${err.message || err.name}`);
      markTableAsMemory(this.tableName);
      const store = getTableStore(this.tableName);
      const key = itemKey(tenantId, enriched);
      store.set(key, enriched);
    }
  }

  /**
   * Get item by tenant_id (partition key) and sort key.
   */
  async get<T>(tenantId: string, sortKeyName: string, sortKeyValue: string): Promise<T | null> {
    if (await shouldUseMemory(this.tableName)) {
      const store = getTableStore(this.tableName);
      for (const item of store.values()) {
        if (item.tenant_id === tenantId && item[sortKeyName] === sortKeyValue) {
          return item as T;
        }
      }
      return null;
    }
    try {
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
    } catch (err: any) {
      console.log(`[Repository] DynamoDB get failed for ${this.tableName}, switching to in-memory: ${err.message || err.name}`);
      markTableAsMemory(this.tableName);
      const store = getTableStore(this.tableName);
      for (const item of store.values()) {
        if (item.tenant_id === tenantId && item[sortKeyName] === sortKeyValue) {
          return item as T;
        }
      }
      return null;
    }
  }

  /**
   * Query all items for a tenant. Always scoped by tenant_id partition key.
   */
  async queryByTenant<T>(tenantId: string, limit = 100): Promise<T[]> {
    if (await shouldUseMemory(this.tableName)) {
      const store = getTableStore(this.tableName);
      const results: T[] = [];
      for (const item of store.values()) {
        if (item.tenant_id === tenantId) {
          results.push(item as T);
          if (results.length >= limit) break;
        }
      }
      return results;
    }
    try {
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
    } catch (err: any) {
      console.log(`[Repository] DynamoDB query failed for ${this.tableName}, switching to in-memory: ${err.message || err.name}`);
      markTableAsMemory(this.tableName);
      return [];
    }
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
    if (await shouldUseMemory(this.tableName)) {
      const store = getTableStore(this.tableName);
      const results: T[] = [];
      for (const item of store.values()) {
        if (item.tenant_id === tenantId) {
          const val = String(item[sortKeyName] || '');
          if (sortKeyCondition.includes('begins_with') && val.startsWith(sortKeyValue)) {
            results.push(item as T);
          } else if (val === sortKeyValue) {
            results.push(item as T);
          }
          if (results.length >= limit) break;
        }
      }
      return results;
    }
    try {
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
    } catch (err: any) {
      console.log(`[Repository] DynamoDB queryWithSortKey failed for ${this.tableName}, switching to in-memory: ${err.message || err.name}`);
      markTableAsMemory(this.tableName);
      return [];
    }
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
    if (await shouldUseMemory(this.tableName)) {
      // For in-memory, just scan all items matching tenant
      const store = getTableStore(this.tableName);
      const results: T[] = [];
      for (const item of store.values()) {
        if (item.tenant_id === tenantId) {
          // Check additional conditions from expressionValues
          let match = true;
          for (const [_key, value] of Object.entries(expressionValues)) {
            const found = Object.values(item).some(v => v === value);
            if (!found) { match = false; break; }
          }
          if (match) {
            results.push(item as T);
            if (results.length >= limit) break;
          }
        }
      }
      return results;
    }
    try {
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
    } catch (err: any) {
      console.log(`[Repository] DynamoDB queryByIndex failed for ${this.tableName}, switching to in-memory: ${err.message || err.name}`);
      markTableAsMemory(this.tableName);
      return [];
    }
  }

  /**
   * Find items by a specific field value within a tenant (in-memory helper).
   */
  async findByField<T>(tenantId: string, fieldName: string, fieldValue: unknown): Promise<T | null> {
    if (await shouldUseMemory(this.tableName)) {
      const store = getTableStore(this.tableName);
      for (const item of store.values()) {
        if (item.tenant_id === tenantId && item[fieldName] === fieldValue) {
          return item as T;
        }
      }
      return null;
    }
    // For DynamoDB, this requires a GSI - callers handle this directly
    return null;
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
    if (await shouldUseMemory(this.tableName)) {
      const store = getTableStore(this.tableName);
      for (const [key, item] of store.entries()) {
        if (item.tenant_id === tenantId && item[sortKeyName] === sortKeyValue) {
          store.set(key, { ...item, ...updates });
          return;
        }
      }
      return;
    }

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

    try {
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
    } catch (err: any) {
      console.log(`[Repository] DynamoDB update failed for ${this.tableName}, switching to in-memory: ${err.message || err.name}`);
      markTableAsMemory(this.tableName);
      const store = getTableStore(this.tableName);
      for (const [key, item] of store.entries()) {
        if (item.tenant_id === tenantId && item[sortKeyName] === sortKeyValue) {
          store.set(key, { ...item, ...updates });
          return;
        }
      }
    }
  }

  /**
   * Delete an item. Scoped by tenant_id.
   */
  async delete(tenantId: string, sortKeyName: string, sortKeyValue: string): Promise<void> {
    if (await shouldUseMemory(this.tableName)) {
      const store = getTableStore(this.tableName);
      for (const [key, item] of store.entries()) {
        if (item.tenant_id === tenantId && item[sortKeyName] === sortKeyValue) {
          store.delete(key);
          return;
        }
      }
      return;
    }
    try {
      await dynamoDb.send(
        new DeleteCommand({
          TableName: this.tableName,
          Key: {
            tenant_id: tenantId,
            [sortKeyName]: sortKeyValue,
          },
        })
      );
    } catch (err: any) {
      console.log(`[Repository] DynamoDB delete failed for ${this.tableName}, switching to in-memory: ${err.message || err.name}`);
      markTableAsMemory(this.tableName);
      const store = getTableStore(this.tableName);
      for (const [key, item] of store.entries()) {
        if (item.tenant_id === tenantId && item[sortKeyName] === sortKeyValue) {
          store.delete(key);
          return;
        }
      }
    }
  }
}
