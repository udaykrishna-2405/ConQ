"""
ConQ Document Processor Lambda
Extracts raw text from uploaded documents (PDF, DOCX, TXT, HTML, etc.)
Stage 1 & 2 of the AI pipeline: Document Ingestion + Text Extraction
"""

import json
import boto3
import os
import re
from io import BytesIO
from datetime import datetime, timezone

s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
textract_client = boto3.client('textract')

S3_BUCKET_NAME = os.environ.get('S3_BUCKET_NAME', 'conq-document-storage')
DYNAMODB_TABLE_NAME = os.environ.get('DYNAMODB_TABLE_NAME', 'ConQInsights')


def lambda_handler(event, context):
    """
    Extract text from uploaded document.

    Input (from Step Functions):
    {
        "document_id": "uuid",
        "s3_key": "uploads/uuid/filename.pdf",
        "bucket_name": "conq-document-storage",
        "upload_timestamp": "ISO8601"
    }

    Output:
    {
        "document_id": "uuid",
        "s3_key": "...",
        "extracted_text": "full text content...",
        "word_count": 1234,
        "page_count": 5,
        "upload_timestamp": "ISO8601"
    }
    """
    try:
        document_id = event.get('document_id')
        s3_key = event.get('s3_key') or event.get('object', {}).get('key', '')
        bucket_name = event.get('bucket_name', S3_BUCKET_NAME)
        upload_timestamp = event.get('upload_timestamp', datetime.now(timezone.utc).isoformat())

        if not document_id or not s3_key:
            raise ValueError('document_id and s3_key are required')

        print(f'[DocumentProcessor] Processing document {document_id} from s3://{bucket_name}/{s3_key}')

        # Update status to PROCESSING
        _update_status(document_id, 'PROCESSING')

        # Get the file from S3
        response = s3_client.get_object(Bucket=bucket_name, Key=s3_key)
        file_content = response['Body'].read()
        content_type = response.get('ContentType', 'application/octet-stream')
        file_extension = s3_key.rsplit('.', 1)[-1].lower() if '.' in s3_key else ''

        # Extract text based on file type
        extracted_text = ''
        page_count = 1

        if file_extension == 'pdf' or content_type == 'application/pdf':
            extracted_text, page_count = _extract_from_pdf(bucket_name, s3_key)
        elif file_extension in ('txt', 'md', 'csv') or content_type.startswith('text/'):
            extracted_text = file_content.decode('utf-8', errors='replace')
        elif file_extension == 'json' or content_type == 'application/json':
            extracted_text = _extract_from_json(file_content)
        elif file_extension == 'html' or content_type == 'text/html':
            extracted_text = _extract_from_html(file_content)
        elif file_extension in ('docx', 'doc'):
            extracted_text, page_count = _extract_from_pdf(bucket_name, s3_key)
        else:
            # Fallback: try to read as text
            try:
                extracted_text = file_content.decode('utf-8', errors='replace')
            except Exception:
                extracted_text, page_count = _extract_from_pdf(bucket_name, s3_key)

        # Clean extracted text
        extracted_text = _clean_text(extracted_text)
        word_count = len(extracted_text.split())

        # Store extracted text in S3 for downstream processing
        processed_key = f'processed/{document_id}/extracted_text.txt'
        s3_client.put_object(
            Bucket=bucket_name,
            Key=processed_key,
            Body=extracted_text.encode('utf-8'),
            ContentType='text/plain',
            Metadata={'document_id': document_id}
        )

        print(f'[DocumentProcessor] Extracted {word_count} words, {page_count} pages from {document_id}')

        # Return output for next step in pipeline
        return {
            'document_id': document_id,
            's3_key': s3_key,
            'bucket_name': bucket_name,
            'processed_text_key': processed_key,
            'extracted_text': extracted_text[:50000],  # Limit for Step Functions payload
            'word_count': word_count,
            'page_count': page_count,
            'upload_timestamp': upload_timestamp,
            'processing_stage': 'TEXT_EXTRACTED',
        }

    except Exception as e:
        print(f'[DocumentProcessor] Error: {str(e)}')
        if 'document_id' in (event or {}):
            _update_status(event['document_id'], 'FAILED', str(e))
        raise


def _extract_from_pdf(bucket_name, s3_key):
    """Extract text from PDF using Amazon Textract."""
    try:
        response = textract_client.detect_document_text(
            Document={
                'S3Object': {
                    'Bucket': bucket_name,
                    'Name': s3_key,
                }
            }
        )

        lines = []
        for block in response.get('Blocks', []):
            if block['BlockType'] == 'LINE':
                lines.append(block.get('Text', ''))

        page_count = max(
            (block.get('Page', 1) for block in response.get('Blocks', [{}])),
            default=1
        )

        return '\n'.join(lines), page_count
    except Exception as e:
        print(f'[DocumentProcessor] Textract fallback: {str(e)}')
        # Fallback: try to read as raw text
        obj = s3_client.get_object(Bucket=bucket_name, Key=s3_key)
        content = obj['Body'].read()
        try:
            text = content.decode('utf-8', errors='replace')
            # Remove binary garbage
            text = re.sub(r'[^\x20-\x7E\n\r\t]', ' ', text)
            return text.strip(), 1
        except Exception:
            return 'Unable to extract text from document', 1


def _extract_from_json(file_content):
    """Extract readable text from JSON content."""
    try:
        data = json.loads(file_content)
        return json.dumps(data, indent=2, ensure_ascii=False)
    except json.JSONDecodeError:
        return file_content.decode('utf-8', errors='replace')


def _extract_from_html(file_content):
    """Extract text from HTML by stripping tags."""
    text = file_content.decode('utf-8', errors='replace')
    # Simple HTML tag removal
    text = re.sub(r'<script[^>]*>.*?</script>', '', text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r'<style[^>]*>.*?</style>', '', text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r'<[^>]+>', ' ', text)
    text = re.sub(r'&[a-zA-Z]+;', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def _clean_text(text):
    """Clean and normalize extracted text."""
    if not text:
        return ''
    # Normalize whitespace
    text = re.sub(r'\r\n', '\n', text)
    text = re.sub(r'\r', '\n', text)
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


def _update_status(document_id, status, error_message=None):
    """Update processing status in DynamoDB."""
    try:
        table = dynamodb.Table(DYNAMODB_TABLE_NAME)
        update_expr = 'SET processing_status = :status, updated_at = :ts'
        expr_values = {
            ':status': status,
            ':ts': datetime.now(timezone.utc).isoformat()
        }

        if error_message:
            update_expr += ', error_message = :err'
            expr_values[':err'] = error_message

        table.update_item(
            Key={'document_id': document_id},
            UpdateExpression=update_expr,
            ExpressionAttributeValues=expr_values,
        )
    except Exception as e:
        print(f'[DocumentProcessor] Failed to update status: {str(e)}')
