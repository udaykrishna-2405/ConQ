// DynamoDB Client Utility
// Shared DynamoDB DocumentClient instance.
// Placeholder – implementation in Phase 1.

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { config } from '../config';

const client = new DynamoDBClient({ region: config.region });

export const dynamoDb = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});
