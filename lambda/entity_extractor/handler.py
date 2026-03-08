"""
ConQ Entity Extractor Lambda
Extracts named entities, key phrases, sentiment, and language using Amazon Comprehend.
Stage 3 of the AI pipeline: Entity Extraction + Tag Generation
"""

import json
import boto3
import os
import re
from datetime import datetime, timezone
from collections import Counter

comprehend_client = boto3.client('comprehend')
dynamodb = boto3.resource('dynamodb')
s3_client = boto3.client('s3')

S3_BUCKET_NAME = os.environ.get('S3_BUCKET_NAME', 'conq-document-storage')
DYNAMODB_TABLE_NAME = os.environ.get('DYNAMODB_TABLE_NAME', 'ConQInsights')

# Comprehend limits
MAX_TEXT_BYTES = 5000  # Comprehend limit per API call


def lambda_handler(event, context):
    """
    Extract entities, keywords, and tags from document text.

    Input (from DocumentProcessor):
    {
        "document_id": "uuid",
        "extracted_text": "full text...",
        "word_count": 1234,
        "page_count": 5,
        ...
    }

    Output:
    {
        "document_id": "uuid",
        "entities": "[{name, type, score}]",
        "keywords": "[keyword1, keyword2, ...]",
        "tags": "[tag1, tag2, ...]",
        "sentiment": {"sentiment": "POSITIVE", "scores": {...}},
        "language": "en",
        ...
    }
    """
    try:
        document_id = event.get('document_id')
        extracted_text = event.get('extracted_text', '')

        if not document_id:
            raise ValueError('document_id is required')

        print(f'[EntityExtractor] Processing document {document_id}, text length: {len(extracted_text)}')

        # If text is empty, try to fetch from S3
        if not extracted_text and event.get('processed_text_key'):
            bucket = event.get('bucket_name', S3_BUCKET_NAME)
            obj = s3_client.get_object(Bucket=bucket, Key=event['processed_text_key'])
            extracted_text = obj['Body'].read().decode('utf-8')

        if not extracted_text:
            raise ValueError('No text available for entity extraction')

        # Truncate text for Comprehend API limits
        text_for_comprehend = extracted_text[:MAX_TEXT_BYTES].encode('utf-8')[:MAX_TEXT_BYTES].decode('utf-8', errors='ignore')

        # Step 1: Detect dominant language
        language = _detect_language(text_for_comprehend)
        print(f'[EntityExtractor] Detected language: {language}')

        # Step 2: Extract named entities
        entities = _extract_entities(text_for_comprehend, language)
        print(f'[EntityExtractor] Found {len(entities)} entities')

        # Step 3: Extract key phrases
        keywords = _extract_key_phrases(text_for_comprehend, language)
        print(f'[EntityExtractor] Found {len(keywords)} key phrases')

        # Step 4: Detect sentiment
        sentiment = _detect_sentiment(text_for_comprehend, language)
        print(f'[EntityExtractor] Sentiment: {sentiment["sentiment"]}')

        # Step 5: Generate tags from entities and keywords
        tags = _generate_tags(entities, keywords, extracted_text)
        print(f'[EntityExtractor] Generated {len(tags)} tags')

        # Step 6: Extract topics from key phrases
        topics = _extract_topics(keywords, entities)
        print(f'[EntityExtractor] Identified {len(topics)} topics')

        # Update DynamoDB with intermediate results
        _update_document(document_id, {
            'entities': json.dumps(entities),
            'keywords': json.dumps(keywords[:50]),  # Top 50 keywords
            'tags': json.dumps(tags),
            'topics': json.dumps(topics),
            'language': language,
            'sentiment': json.dumps(sentiment),
            'processing_status': 'ENTITIES_EXTRACTED',
        })

        # Return output for next step in pipeline
        return {
            **event,
            'entities': json.dumps(entities),
            'keywords': json.dumps(keywords[:50]),
            'tags': json.dumps(tags),
            'topics': json.dumps(topics),
            'language': language,
            'sentiment': sentiment,
            'processing_stage': 'ENTITIES_EXTRACTED',
        }

    except Exception as e:
        print(f'[EntityExtractor] Error: {str(e)}')
        if event.get('document_id'):
            _update_status(event['document_id'], 'FAILED', str(e))
        raise


def _detect_language(text):
    """Detect the dominant language of the text."""
    try:
        response = comprehend_client.detect_dominant_language(Text=text)
        languages = response.get('Languages', [])
        if languages:
            return languages[0]['LanguageCode']
        return 'en'
    except Exception as e:
        print(f'[EntityExtractor] Language detection failed: {str(e)}')
        return 'en'


def _extract_entities(text, language):
    """Extract named entities using Amazon Comprehend."""
    try:
        # Comprehend supports limited languages for entity detection
        supported_langs = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ar', 'hi', 'ja', 'ko', 'zh', 'zh-TW']
        lang = language if language in supported_langs else 'en'

        response = comprehend_client.detect_entities(
            Text=text,
            LanguageCode=lang
        )

        entities = []
        seen = set()

        for entity in response.get('Entities', []):
            key = (entity['Text'].lower(), entity['Type'])
            if key not in seen and entity.get('Score', 0) > 0.7:
                seen.add(key)
                entities.append({
                    'name': entity['Text'],
                    'type': entity['Type'],
                    'score': round(entity.get('Score', 0), 4),
                })

        # Sort by score descending
        entities.sort(key=lambda x: x['score'], reverse=True)
        return entities[:100]  # Top 100 entities

    except Exception as e:
        print(f'[EntityExtractor] Entity extraction failed: {str(e)}')
        return _fallback_entity_extraction(text)


def _extract_key_phrases(text, language):
    """Extract key phrases using Amazon Comprehend."""
    try:
        supported_langs = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ar', 'hi', 'ja', 'ko', 'zh', 'zh-TW']
        lang = language if language in supported_langs else 'en'

        response = comprehend_client.detect_key_phrases(
            Text=text,
            LanguageCode=lang
        )

        phrases = []
        seen = set()

        for phrase in response.get('KeyPhrases', []):
            text_lower = phrase['Text'].lower().strip()
            if text_lower not in seen and phrase.get('Score', 0) > 0.7 and len(text_lower) > 2:
                seen.add(text_lower)
                phrases.append(phrase['Text'].strip())

        return phrases[:50]

    except Exception as e:
        print(f'[EntityExtractor] Key phrase extraction failed: {str(e)}')
        return _fallback_keyword_extraction(text)


def _detect_sentiment(text, language):
    """Detect sentiment using Amazon Comprehend."""
    try:
        supported_langs = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ar', 'hi', 'ja', 'ko', 'zh', 'zh-TW']
        lang = language if language in supported_langs else 'en'

        response = comprehend_client.detect_sentiment(
            Text=text,
            LanguageCode=lang
        )

        return {
            'sentiment': response.get('Sentiment', 'NEUTRAL'),
            'scores': {
                'positive': round(response.get('SentimentScore', {}).get('Positive', 0), 4),
                'negative': round(response.get('SentimentScore', {}).get('Negative', 0), 4),
                'neutral': round(response.get('SentimentScore', {}).get('Neutral', 0), 4),
                'mixed': round(response.get('SentimentScore', {}).get('Mixed', 0), 4),
            }
        }
    except Exception as e:
        print(f'[EntityExtractor] Sentiment detection failed: {str(e)}')
        return {'sentiment': 'NEUTRAL', 'scores': {'positive': 0.25, 'negative': 0.25, 'neutral': 0.25, 'mixed': 0.25}}


def _generate_tags(entities, keywords, full_text):
    """Generate tags by combining entity types and key phrases."""
    tags = set()

    # Tags from entity types
    entity_type_map = {
        'PERSON': 'people',
        'ORGANIZATION': 'organization',
        'LOCATION': 'geography',
        'EVENT': 'events',
        'DATE': 'temporal',
        'QUANTITY': 'quantitative',
        'COMMERCIAL_ITEM': 'products',
        'TITLE': 'titles',
    }

    for entity in entities[:20]:
        # Add entity name as tag
        name = entity['name'].strip()
        if 2 < len(name) < 50:
            tags.add(name.lower())
        # Add category tag
        category = entity_type_map.get(entity['type'])
        if category:
            tags.add(category)

    # Tags from top keywords (single or two-word)
    for kw in keywords[:15]:
        words = kw.split()
        if 1 <= len(words) <= 3 and len(kw) < 40:
            tags.add(kw.lower())

    return sorted(list(tags))[:30]


def _extract_topics(keywords, entities):
    """Derive high-level topics from keywords and entities."""
    topics = []

    # Group entities by type
    type_counts = Counter(e['type'] for e in entities)

    for entity_type, count in type_counts.most_common(5):
        top_examples = [e['name'] for e in entities if e['type'] == entity_type][:3]
        topics.append({
            'category': entity_type.lower().replace('_', ' '),
            'count': count,
            'examples': top_examples,
        })

    # Add keyword-based topics
    if keywords:
        topics.append({
            'category': 'key themes',
            'count': len(keywords),
            'examples': keywords[:5],
        })

    return topics


def _fallback_entity_extraction(text):
    """Simple regex-based entity extraction as fallback."""
    entities = []

    # Extract capitalized phrases (potential proper nouns)
    pattern = r'\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\b'
    matches = re.findall(pattern, text)
    seen = set()
    for match in matches:
        if match.lower() not in seen and len(match) > 2:
            seen.add(match.lower())
            entities.append({
                'name': match,
                'type': 'UNKNOWN',
                'score': 0.5,
            })

    return entities[:50]


def _fallback_keyword_extraction(text):
    """Simple keyword extraction as fallback."""
    # Common stop words
    stop_words = {'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
                  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
                  'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought',
                  'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from',
                  'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
                  'and', 'but', 'or', 'not', 'no', 'nor', 'so', 'yet', 'both', 'either',
                  'neither', 'each', 'every', 'all', 'any', 'few', 'more', 'most', 'other',
                  'some', 'such', 'than', 'too', 'very', 'just', 'because', 'this', 'that',
                  'these', 'those', 'it', 'its', 'he', 'she', 'they', 'them', 'their',
                  'we', 'our', 'you', 'your', 'i', 'me', 'my', 'which', 'who', 'what'}

    words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
    word_counts = Counter(w for w in words if w not in stop_words)

    return [word for word, _ in word_counts.most_common(30)]


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
        print(f'[EntityExtractor] Failed to update document: {str(e)}')


def _update_status(document_id, status, error_message=None):
    """Update processing status in DynamoDB."""
    attrs = {'processing_status': status}
    if error_message:
        attrs['error_message'] = error_message
    _update_document(document_id, attrs)
