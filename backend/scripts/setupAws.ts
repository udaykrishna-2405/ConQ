/**
 * AWS Setup Script – Creates DynamoDB tables for ConQ
 * Run once: npx ts-node scripts/setupAws.ts
 */

import { DynamoDBClient, CreateTableCommand, DescribeTableCommand, GlobalSecondaryIndex, KeySchemaElement, AttributeDefinition, BillingMode, ProjectionType } from '@aws-sdk/client-dynamodb';

const client = new DynamoDBClient({ region: 'ap-south-1' });

interface TableDef {
  name: string;
  pk: string;
  sk: string;
  gsis?: {
    indexName: string;
    pk: string;
    sk: string;
  }[];
  ttlAttribute?: string;
}

const tables: TableDef[] = [
  {
    name: 'conq-users',
    pk: 'tenant_id',
    sk: 'user_id',
    gsis: [
      { indexName: 'email-index', pk: 'tenant_id', sk: 'email' },
    ],
  },
  {
    name: 'conq-content',
    pk: 'tenant_id',
    sk: 'content_id',
    gsis: [
      { indexName: 'platform-index', pk: 'tenant_id', sk: 'platform' },
    ],
  },
  {
    name: 'conq-predictions',
    pk: 'tenant_id',
    sk: 'prediction_id',
    ttlAttribute: 'ttl',
  },
  {
    name: 'conq-trends',
    pk: 'tenant_id',
    sk: 'trend_id',
    gsis: [
      { indexName: 'date-index', pk: 'tenant_id', sk: 'date' },
    ],
  },
  {
    name: 'conq-analytics',
    pk: 'tenant_id',
    sk: 'snapshot_id',
    ttlAttribute: 'ttl',
  },
];

async function tableExists(tableName: string): Promise<boolean> {
  try {
    await client.send(new DescribeTableCommand({ TableName: tableName }));
    return true;
  } catch (err: any) {
    if (err.name === 'ResourceNotFoundException') return false;
    throw err;
  }
}

async function createTable(def: TableDef): Promise<void> {
  const exists = await tableExists(def.name);
  if (exists) {
    console.log(`  ✓ Table "${def.name}" already exists`);
    return;
  }

  const keySchema: KeySchemaElement[] = [
    { AttributeName: def.pk, KeyType: 'HASH' },
    { AttributeName: def.sk, KeyType: 'RANGE' },
  ];

  const attrDefs: AttributeDefinition[] = [
    { AttributeName: def.pk, AttributeType: 'S' },
    { AttributeName: def.sk, AttributeType: 'S' },
  ];

  const gsis: GlobalSecondaryIndex[] = [];

  if (def.gsis) {
    for (const gsi of def.gsis) {
      gsis.push({
        IndexName: gsi.indexName,
        KeySchema: [
          { AttributeName: gsi.pk, KeyType: 'HASH' },
          { AttributeName: gsi.sk, KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: ProjectionType.ALL },
      });

      // Add GSI attributes if not already defined
      for (const attr of [gsi.pk, gsi.sk]) {
        if (!attrDefs.find((a) => a.AttributeName === attr)) {
          attrDefs.push({ AttributeName: attr, AttributeType: 'S' });
        }
      }
    }
  }

  await client.send(
    new CreateTableCommand({
      TableName: def.name,
      KeySchema: keySchema,
      AttributeDefinitions: attrDefs,
      BillingMode: BillingMode.PAY_PER_REQUEST,
      ...(gsis.length > 0 ? { GlobalSecondaryIndexes: gsis } : {}),
    })
  );

  console.log(`  ✓ Created table "${def.name}"`);
}

async function main() {
  console.log('\n🔧 ConQ AWS Setup – Creating DynamoDB Tables\n');
  console.log('Region: ap-south-1\n');

  try {
    // Quick auth check
    await client.send(new DescribeTableCommand({ TableName: 'non-existent-test-table-xyz' }));
  } catch (err: any) {
    if (err.name === 'ResourceNotFoundException') {
      console.log('✓ AWS credentials are valid!\n');
    } else if (err.name === 'UnrecognizedClientException' || err.name === 'InvalidSignatureException' || err.message?.includes('security token')) {
      console.error('✗ AWS credentials are INVALID. Please check your access key and secret.');
      process.exit(1);
    }
  }

  for (const table of tables) {
    try {
      await createTable(table);
    } catch (err: any) {
      console.error(`  ✗ Failed to create "${table.name}": ${err.message}`);
    }
  }

  console.log('\n✅ DynamoDB setup complete!\n');
}

main().catch(console.error);
