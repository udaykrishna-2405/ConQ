"""
ConQ Results API Lambda
Retrieves extracted intelligence from DynamoDB for a given document_id.
"""

import json
import boto3
import os
from datetime import datetime, timezone
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
DYNAMODB_TABLE_NAME = os.environ.get('DYNAMODB_TABLE_NAME', 'ConQInsights')


class DecimalEncoder(json.JSONEncoder):
    """Handle DynamoDB Decimal types in JSON serialization."""
    def default(self, obj):
        if isinstance(obj, Decimal):
            if obj % 1 == 0:
                return int(obj)
            return float(obj)
        return super().default(obj)


def lambda_handler(event, context):
    """
    Retrieve document insights from DynamoDB.

    Routes:
    - GET /results/{document_id}  → Get results for a specific document
    - GET /results                → List recent results (with pagination)

    Path Parameters:
    - document_id (optional): The document ID to retrieve

    Query Parameters (for list):
    - limit: Max results to return (default 20, max 100)
    - status: Filter by processing_status
    - next_token: Pagination token
    """
    try:
        http_method = event.get('httpMethod', 'GET')
        path_params = event.get('pathParameters') or {}
        query_params = event.get('queryStringParameters') or {}

        document_id = path_params.get('document_id')

        if document_id:
            return _get_document(document_id)
        else:
            return _list_documents(query_params)

    except Exception as e:
        print(f'[ResultsApi] Error: {str(e)}')
        return _response(500, {'error': f'Internal server error: {str(e)}'})


def _get_document(document_id):
    """Get a specific document's insights."""
    table = dynamodb.Table(DYNAMODB_TABLE_NAME)

    response = table.get_item(Key={'document_id': document_id})
    item = response.get('Item')

    if not item:
        return _response(404, {
            'error': 'Document not found',
            'document_id': document_id,
        })

    # Parse JSON strings back to objects for API response
    result = _format_document(item)

    return _response(200, result)


def _list_documents(query_params):
    """List recent documents with optional filtering."""
    table = dynamodb.Table(DYNAMODB_TABLE_NAME)

    limit = min(int(query_params.get('limit', '20')), 100)
    status_filter = query_params.get('status')

    scan_kwargs = {
        'Limit': limit,
    }

    # If filtering by status, use the GSI
    if status_filter:
        scan_kwargs = {
            'IndexName': 'status-index',
            'KeyConditionExpression': 'processing_status = :status',
            'ExpressionAttributeValues': {
                ':status': status_filter,
            },
            'Limit': limit,
            'ScanIndexForward': False,  # Most recent first
        }

        next_token = query_params.get('next_token')
        if next_token:
            scan_kwargs['ExclusiveStartKey'] = json.loads(next_token)

        response = table.query(**scan_kwargs)
    else:
        next_token = query_params.get('next_token')
        if next_token:
            scan_kwargs['ExclusiveStartKey'] = json.loads(next_token)

        response = table.scan(**scan_kwargs)

    items = response.get('Items', [])
    results = [_format_document(item) for item in items]

    response_body = {
        'documents': results,
        'count': len(results),
    }

    # Include pagination token if more results exist
    if 'LastEvaluatedKey' in response:
        response_body['next_token'] = json.dumps(response['LastEvaluatedKey'], cls=DecimalEncoder)

    return _response(200, response_body)


def _format_document(item):
    """Format a DynamoDB item for API response."""
    result = {
        'document_id': item.get('document_id', ''),
        'upload_timestamp': item.get('upload_timestamp', ''),
        'processing_status': item.get('processing_status', 'UNKNOWN'),
        'filename': item.get('filename', ''),
        'file_type': item.get('file_type', ''),
        'file_size': item.get('file_size', 0),
        'word_count': item.get('word_count', 0),
        'page_count': item.get('page_count', 0),
        'language': item.get('language', ''),
        'classification': item.get('classification', ''),
    }

    # Parse JSON string fields
    json_fields = ['summary', 'entities', 'keywords', 'tags', 'topics', 'sentiment', 'insights']
    for field in json_fields:
        value = item.get(field, '')
        if isinstance(value, str):
            try:
                result[field] = json.loads(value) if value.startswith(('[', '{')) else value
            except json.JSONDecodeError:
                result[field] = value
        else:
            result[field] = value

    # Add metadata
    if item.get('error_message'):
        result['error_message'] = item['error_message']
    if item.get('updated_at'):
        result['updated_at'] = item['updated_at']
    if item.get('s3_key'):
        result['s3_key'] = item['s3_key']

    return result


def _response(status_code, body):
    """Create API Gateway response."""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key',
            'Access-Control-Allow-Methods': 'GET,OPTIONS',
        },
        'body': json.dumps(body, cls=DecimalEncoder, default=str)
    }
