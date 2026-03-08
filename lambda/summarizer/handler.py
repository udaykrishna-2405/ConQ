"""
ConQ Summarizer Lambda
Generates document summaries and classifications using Amazon Bedrock (Claude).
Stage 4 & 5 of the AI pipeline: AI Summarization + Classification
"""

import json
import boto3
import os
from datetime import datetime, timezone

bedrock_client = boto3.client('bedrock-runtime')
dynamodb = boto3.resource('dynamodb')
s3_client = boto3.client('s3')

S3_BUCKET_NAME = os.environ.get('S3_BUCKET_NAME', 'conq-document-storage')
DYNAMODB_TABLE_NAME = os.environ.get('DYNAMODB_TABLE_NAME', 'ConQInsights')

# Bedrock model ID - Claude 3 Haiku for cost-effective summarization
MODEL_ID = os.environ.get('BEDROCK_MODEL_ID', 'anthropic.claude-3-haiku-20240307-v1:0')
MAX_INPUT_TOKENS = 10000


def lambda_handler(event, context):
    """
    Generate document summary, classification, and contextual insights.

    Input (from EntityExtractor):
    {
        "document_id": "uuid",
        "extracted_text": "full text...",
        "entities": "[{...}]",
        "keywords": "[...]",
        "tags": "[...]",
        "topics": "[...]",
        "language": "en",
        "sentiment": {...},
        ...
    }

    Output:
    {
        "document_id": "uuid",
        "summary": "AI-generated summary...",
        "classification": "report | article | research | ...",
        "insights": [{...}],
        "entities": "...",
        "keywords": "...",
        "tags": "...",
        "topics": "...",
        "upload_timestamp": "...",
        "processing_status": "COMPLETED"
    }
    """
    try:
        document_id = event.get('document_id')
        extracted_text = event.get('extracted_text', '')
        entities_json = event.get('entities', '[]')
        keywords_json = event.get('keywords', '[]')
        tags_json = event.get('tags', '[]')
        topics_json = event.get('topics', '[]')
        language = event.get('language', 'en')
        sentiment = event.get('sentiment', {})
        upload_timestamp = event.get('upload_timestamp', datetime.now(timezone.utc).isoformat())

        if not document_id:
            raise ValueError('document_id is required')

        print(f'[Summarizer] Processing document {document_id}')

        # If text is empty, try to fetch from S3
        if not extracted_text and event.get('processed_text_key'):
            bucket = event.get('bucket_name', S3_BUCKET_NAME)
            obj = s3_client.get_object(Bucket=bucket, Key=event['processed_text_key'])
            extracted_text = obj['Body'].read().decode('utf-8')

        if not extracted_text:
            raise ValueError('No text available for summarization')

        # Truncate text for model input
        truncated_text = extracted_text[:MAX_INPUT_TOKENS * 4]  # Approximate chars to tokens

        # Parse entities and keywords for context
        try:
            entities = json.loads(entities_json) if isinstance(entities_json, str) else entities_json
            keywords = json.loads(keywords_json) if isinstance(keywords_json, str) else keywords_json
        except json.JSONDecodeError:
            entities = []
            keywords = []

        # Generate summary using Bedrock
        summary_result = _generate_summary(truncated_text, entities, keywords, language)

        summary = summary_result.get('summary', 'Summary generation failed.')
        classification = summary_result.get('classification', 'unknown')
        insights = summary_result.get('insights', [])
        additional_tags = summary_result.get('additional_tags', [])

        # Merge additional tags
        try:
            existing_tags = json.loads(tags_json) if isinstance(tags_json, str) else tags_json
        except json.JSONDecodeError:
            existing_tags = []

        all_tags = list(set(existing_tags + additional_tags))[:30]

        print(f'[Summarizer] Generated summary ({len(summary)} chars), classification: {classification}')

        # Update DynamoDB with final results
        _update_document(document_id, {
            'summary': summary,
            'classification': classification,
            'insights': json.dumps(insights),
            'tags': json.dumps(all_tags),
            'processing_status': 'SUMMARIZED',
        })

        # Store complete results in S3
        results_key = f'results/{document_id}/insights.json'
        complete_results = {
            'document_id': document_id,
            'upload_timestamp': upload_timestamp,
            'summary': summary,
            'classification': classification,
            'entities': entities_json,
            'keywords': keywords_json,
            'tags': json.dumps(all_tags),
            'topics': topics_json,
            'sentiment': sentiment if isinstance(sentiment, dict) else json.loads(sentiment) if isinstance(sentiment, str) else {},
            'insights': insights,
            'language': language,
            'word_count': event.get('word_count', 0),
            'page_count': event.get('page_count', 0),
            'processing_status': 'COMPLETED',
            'processed_at': datetime.now(timezone.utc).isoformat(),
        }

        s3_client.put_object(
            Bucket=event.get('bucket_name', S3_BUCKET_NAME),
            Key=results_key,
            Body=json.dumps(complete_results, indent=2, default=str),
            ContentType='application/json',
        )

        # Return final output for StoreResults step
        return {
            'document_id': document_id,
            'upload_timestamp': upload_timestamp,
            'summary': summary,
            'entities': entities_json if isinstance(entities_json, str) else json.dumps(entities_json),
            'keywords': keywords_json if isinstance(keywords_json, str) else json.dumps(keywords_json),
            'tags': json.dumps(all_tags),
            'topics': topics_json if isinstance(topics_json, str) else json.dumps(topics_json),
            'classification': classification,
            'processing_status': 'COMPLETED',
        }

    except Exception as e:
        print(f'[Summarizer] Error: {str(e)}')
        if event.get('document_id'):
            _update_status(event['document_id'], 'FAILED', str(e))
        raise


def _generate_summary(text, entities, keywords, language):
    """Generate summary using Amazon Bedrock (Claude)."""

    # Build context from extracted entities
    entity_context = ''
    if entities:
        entity_names = [e['name'] if isinstance(e, dict) else str(e) for e in entities[:10]]
        entity_context = f"\nKey entities found: {', '.join(entity_names)}"

    keyword_context = ''
    if keywords:
        kw_list = [str(k) for k in keywords[:10]]
        keyword_context = f"\nKey phrases found: {', '.join(kw_list)}"

    prompt = f"""Analyze the following document and provide a structured response in JSON format.

Document text:
---
{text}
---
{entity_context}
{keyword_context}

Provide your response as a JSON object with exactly these fields:
{{
    "summary": "A comprehensive 3-5 sentence summary of the document's main content and purpose",
    "classification": "One of: report, article, research_paper, legal_document, financial_document, technical_documentation, correspondence, marketing_material, educational, news, other",
    "insights": [
        {{
            "type": "key_finding | recommendation | risk | opportunity | trend",
            "title": "Short insight title",
            "description": "Detailed description of the insight",
            "confidence": 0.0-1.0
        }}
    ],
    "additional_tags": ["tag1", "tag2", "tag3"]
}}

Generate 3-5 meaningful insights. Respond ONLY with valid JSON, no other text."""

    try:
        response = bedrock_client.invoke_model(
            modelId=MODEL_ID,
            contentType='application/json',
            accept='application/json',
            body=json.dumps({
                'anthropic_version': 'bedrock-2023-05-31',
                'max_tokens': 2000,
                'temperature': 0.3,
                'messages': [
                    {
                        'role': 'user',
                        'content': prompt,
                    }
                ],
            }),
        )

        response_body = json.loads(response['body'].read())
        content = response_body.get('content', [{}])[0].get('text', '{}')

        # Parse the JSON response
        # Handle potential markdown wrapping
        if '```json' in content:
            content = content.split('```json')[1].split('```')[0]
        elif '```' in content:
            content = content.split('```')[1].split('```')[0]

        result = json.loads(content.strip())
        return result

    except Exception as e:
        print(f'[Summarizer] Bedrock invocation failed: {str(e)}')
        return _fallback_summary(text, entities, keywords)


def _fallback_summary(text, entities, keywords):
    """Generate a basic summary without AI when Bedrock is unavailable."""

    sentences = [s.strip() for s in text.replace('\n', '. ').split('.') if len(s.strip()) > 20]

    # Take first few sentences as summary
    summary_sentences = sentences[:5] if sentences else ['Document content could not be summarized.']
    summary = '. '.join(summary_sentences) + '.'

    if len(summary) > 500:
        summary = summary[:497] + '...'

    # Basic classification based on keywords
    classification = 'other'
    text_lower = text.lower()
    if any(w in text_lower for w in ['revenue', 'profit', 'financial', 'quarterly']):
        classification = 'financial_document'
    elif any(w in text_lower for w in ['abstract', 'methodology', 'hypothesis', 'conclusion']):
        classification = 'research_paper'
    elif any(w in text_lower for w in ['terms', 'agreement', 'clause', 'liability']):
        classification = 'legal_document'
    elif any(w in text_lower for w in ['api', 'function', 'module', 'configuration']):
        classification = 'technical_documentation'
    elif any(w in text_lower for w in ['report', 'analysis', 'findings']):
        classification = 'report'

    insights = [
        {
            'type': 'key_finding',
            'title': 'Document Overview',
            'description': f'Document contains {len(text.split())} words with {len(entities)} identified entities.',
            'confidence': 0.6,
        },
        {
            'type': 'key_finding',
            'title': 'Key Topics',
            'description': f'Primary keywords: {", ".join(keywords[:5]) if keywords else "N/A"}',
            'confidence': 0.7,
        },
    ]

    return {
        'summary': summary,
        'classification': classification,
        'insights': insights,
        'additional_tags': [classification, 'auto-processed'],
    }


def _update_document(document_id, attributes):
    """Update document attributes in DynamoDB."""
    try:
        table = dynamodb.Table(DYNAMODB_TABLE_NAME)
        update_parts = []
        expr_values = {}

        for key, value in attributes.items():
            update_parts.append(f'{key} = :{key}')
            expr_values[f':{key}'] = value

        update_parts.append('updated_at = :ts')
        expr_values[':ts'] = datetime.now(timezone.utc).isoformat()

        table.update_item(
            Key={'document_id': document_id},
            UpdateExpression='SET ' + ', '.join(update_parts),
            ExpressionAttributeValues=expr_values,
        )
    except Exception as e:
        print(f'[Summarizer] Failed to update document: {str(e)}')


def _update_status(document_id, status, error_message=None):
    """Update processing status in DynamoDB."""
    attrs = {'processing_status': status}
    if error_message:
        attrs['error_message'] = error_message
    _update_document(document_id, attrs)
