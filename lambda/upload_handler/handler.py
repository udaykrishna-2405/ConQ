"""
ConQ Upload Handler Lambda
Handles document upload via API Gateway, stores in S3, creates DynamoDB tracking record.
"""

import json
import boto3
import os
import uuid
import base64
from datetime import datetime, timezone

s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

S3_BUCKET_NAME = os.environ.get('S3_BUCKET_NAME', 'conq-document-storage')
DYNAMODB_TABLE_NAME = os.environ.get('DYNAMODB_TABLE_NAME', 'ConQInsights')

# Supported file types
SUPPORTED_TYPES = {
    'application/pdf': '.pdf',
    'text/plain': '.txt',
    'text/csv': '.csv',
    'application/json': '.json',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'application/msword': '.doc',
    'text/html': '.html',
    'text/markdown': '.md',
}

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


def lambda_handler(event, context):
    """
    Handle document upload.

    Accepts:
    - Base64-encoded file content in request body
    - Multipart form data
    - Pre-signed URL generation request

    Returns:
    - document_id, s3_key, upload status
    """
    try:
        headers = event.get('headers', {}) or {}
        http_method = event.get('httpMethod', 'POST')

        # Parse request body
        body = event.get('body', '{}')
        is_base64 = event.get('isBase64Encoded', False)

        if not body:
            return _response(400, {'error': 'Request body is required'})

        # Handle JSON request for pre-signed URL generation
        content_type = headers.get('Content-Type', headers.get('content-type', ''))

        if 'application/json' in content_type:
            return _handle_presigned_url_request(json.loads(body))

        # Handle direct file upload (base64 encoded)
        return _handle_direct_upload(body, is_base64, headers)

    except json.JSONDecodeError:
        return _response(400, {'error': 'Invalid JSON in request body'})
    except Exception as e:
        print(f'[UploadHandler] Error: {str(e)}')
        return _response(500, {'error': f'Internal server error: {str(e)}'})


def _handle_presigned_url_request(body):
    """Generate a pre-signed URL for direct S3 upload."""
    filename = body.get('filename')
    file_type = body.get('file_type', 'application/octet-stream')

    if not filename:
        return _response(400, {'error': 'filename is required'})

    if file_type not in SUPPORTED_TYPES and file_type != 'application/octet-stream':
        return _response(400, {
            'error': f'Unsupported file type: {file_type}',
            'supported_types': list(SUPPORTED_TYPES.keys())
        })

    document_id = str(uuid.uuid4())
    timestamp = datetime.now(timezone.utc).isoformat()
    s3_key = f'uploads/{document_id}/{filename}'

    # Generate pre-signed URL
    presigned_url = s3_client.generate_presigned_url(
        'put_object',
        Params={
            'Bucket': S3_BUCKET_NAME,
            'Key': s3_key,
            'ContentType': file_type,
        },
        ExpiresIn=3600  # 1 hour
    )

    # Create DynamoDB tracking record
    table = dynamodb.Table(DYNAMODB_TABLE_NAME)
    table.put_item(Item={
        'document_id': document_id,
        'upload_timestamp': timestamp,
        'filename': filename,
        'file_type': file_type,
        's3_key': s3_key,
        'processing_status': 'PENDING_UPLOAD',
        'summary': '',
        'entities': '[]',
        'keywords': '[]',
        'tags': '[]',
        'topics': '[]',
    })

    return _response(200, {
        'document_id': document_id,
        'upload_url': presigned_url,
        's3_key': s3_key,
        'expires_in': 3600,
        'message': 'Use the upload_url to PUT your file directly to S3'
    })


def _handle_direct_upload(body, is_base64, headers):
    """Handle direct file upload with base64 encoded content."""

    if is_base64:
        file_content = base64.b64decode(body)
    else:
        try:
            parsed = json.loads(body)
            file_content = base64.b64decode(parsed.get('file_content', ''))
            filename = parsed.get('filename', 'document.txt')
            file_type = parsed.get('file_type', 'text/plain')
        except (json.JSONDecodeError, KeyError):
            file_content = body.encode('utf-8') if isinstance(body, str) else body
            filename = 'document.txt'
            file_type = 'text/plain'

    # Validate file size
    if len(file_content) > MAX_FILE_SIZE:
        return _response(400, {
            'error': f'File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB'
        })

    document_id = str(uuid.uuid4())
    timestamp = datetime.now(timezone.utc).isoformat()
    s3_key = f'uploads/{document_id}/{filename}'

    # Upload to S3
    s3_client.put_object(
        Bucket=S3_BUCKET_NAME,
        Key=s3_key,
        Body=file_content,
        ContentType=file_type,
        Metadata={
            'document_id': document_id,
            'upload_timestamp': timestamp,
            'original_filename': filename,
        }
    )

    # Create DynamoDB tracking record
    table = dynamodb.Table(DYNAMODB_TABLE_NAME)
    table.put_item(Item={
        'document_id': document_id,
        'upload_timestamp': timestamp,
        'filename': filename,
        'file_type': file_type,
        's3_key': s3_key,
        'file_size': len(file_content),
        'processing_status': 'UPLOADED',
        'summary': '',
        'entities': '[]',
        'keywords': '[]',
        'tags': '[]',
        'topics': '[]',
    })

    print(f'[UploadHandler] Document {document_id} uploaded to s3://{S3_BUCKET_NAME}/{s3_key}')

    return _response(200, {
        'document_id': document_id,
        's3_key': s3_key,
        'filename': filename,
        'file_size': len(file_content),
        'processing_status': 'UPLOADED',
        'message': 'Document uploaded successfully. Use POST /process to start AI pipeline.'
    })


def _response(status_code, body):
    """Create API Gateway response."""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        },
        'body': json.dumps(body, default=str)
    }
