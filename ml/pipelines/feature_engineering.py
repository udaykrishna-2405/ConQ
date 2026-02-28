"""
ConQ ML Pipeline – Feature Engineering
========================================
Extracts and transforms features for virality prediction.

Feature categories:
- Content features (text length, hashtag count, caps ratio, etc.)
- Engagement features (historical engagement rate, follower count)
- Temporal features (posting hour, day of week, weekend flag)
- NLP features (sentiment score, entity count, topic count)
- Platform features (one-hot encoded platform)
- Language features (one-hot encoded language groups)

Mirrors the 25-feature extraction in the backend TypeScript
featureExtractor.ts for consistency between training and inference.
"""

import re
import math
from datetime import datetime
from typing import Dict, List, Optional

import numpy as np
import pandas as pd

from config.ml_config import ML_CONFIG, ALL_FEATURE_NAMES


class FeatureEngineer:
    """Extracts features from raw content data for ML models."""

    FEATURE_COLUMNS = ALL_FEATURE_NAMES

    # ── Emoji pattern (simplified Unicode ranges) ──
    EMOJI_PATTERN = re.compile(
        r'[\U0001F600-\U0001F64F'
        r'\U0001F300-\U0001F5FF'
        r'\U0001F680-\U0001F6FF'
        r'\U0001F900-\U0001F9FF'
        r'\U00002702-\U000027B0'
        r'\U0000FE00-\U0000FE0F'
        r'\U0001FA00-\U0001FA6F]+',
        flags=re.UNICODE
    )

    URL_PATTERN = re.compile(r'https?://\S+')
    HASHTAG_PATTERN = re.compile(r'#\w+')
    MENTION_PATTERN = re.compile(r'@\w+')

    def extract_features(self, content: dict) -> dict:
        """
        Extract feature vector from a single content item.

        Expected content dict keys:
            title (str): Content title
            description (str, optional): Content description
            tags (list[str], optional): Content tags
            platform (str): 'youtube' or 'instagram'
            language (str, optional): Language code
            is_code_mixed (bool, optional): Whether content mixes languages
            published_at (str, optional): ISO 8601 timestamp
            historical_engagement_rate (float, optional): Historical engagement
            follower_count (int, optional): Creator follower count
            sentiment_score (float, optional): Pre-computed sentiment
            entity_count (int, optional): Pre-computed entity count
            topic_count (int, optional): Pre-computed topic count

        Returns:
            dict with feature name -> value pairs
        """
        title = content.get('title', '')
        description = content.get('description', '')
        tags = content.get('tags', [])
        platform = content.get('platform', 'youtube')
        language = content.get('language', 'en')
        full_text = f"{title} {description}"

        # ── Content Features ──
        text_length = len(title)
        description_length = len(description)
        title_word_count = len(title.split()) if title else 0
        hashtag_count = len(self.HASHTAG_PATTERN.findall(full_text))
        mention_count = len(self.MENTION_PATTERN.findall(full_text))
        emoji_count = len(self.EMOJI_PATTERN.findall(full_text))
        url_count = len(self.URL_PATTERN.findall(full_text))
        question_mark_count = full_text.count('?')
        exclamation_count = full_text.count('!')

        # Caps ratio
        alpha_chars = [c for c in full_text if c.isalpha()]
        caps_ratio = (
            sum(1 for c in alpha_chars if c.isupper()) / len(alpha_chars)
            if alpha_chars else 0.0
        )

        # Tags
        tag_count = len(tags)
        avg_tag_length = (
            np.mean([len(t) for t in tags]) if tags else 0.0
        )

        # Title engagement potential (questions, exclamations, numbers)
        title_engagement = 0.0
        if '?' in title:
            title_engagement += 0.3
        if '!' in title:
            title_engagement += 0.2
        if any(c.isdigit() for c in title):
            title_engagement += 0.2
        if len(title) > 10:
            title_engagement += 0.1
        title_engagement = min(title_engagement, 1.0)

        # Content density
        content_density = (
            (hashtag_count + mention_count + emoji_count + url_count)
            / max(title_word_count, 1)
        )

        # ── NLP Features ──
        sentiment_score = content.get('sentiment_score', 0.0)
        entity_count = content.get('entity_count', 0)
        topic_count = content.get('topic_count', 0)

        # ── Temporal Features ──
        published_at = content.get('published_at', '')
        hour_of_day = 12
        day_of_week = 0
        is_weekend = 0
        if published_at:
            try:
                dt = datetime.fromisoformat(published_at.replace('Z', '+00:00'))
                hour_of_day = dt.hour
                day_of_week = dt.weekday()
                is_weekend = 1 if day_of_week >= 5 else 0
            except (ValueError, AttributeError):
                pass

        # ── Creator Features ──
        historical_engagement_rate = content.get('historical_engagement_rate', 0.03)
        follower_count = content.get('follower_count', 0)

        # ── Platform One-Hot ──
        platform_youtube = 1 if platform == 'youtube' else 0
        platform_instagram = 1 if platform == 'instagram' else 0

        # ── Language One-Hot ──
        lang_en = 1 if language == 'en' else 0
        lang_hi = 1 if language in ('hi', 'hi-Latn') else 0
        lang_other = 1 if language not in ('en', 'hi', 'hi-Latn') else 0

        return {
            'text_length': text_length,
            'description_length': description_length,
            'title_word_count': title_word_count,
            'hashtag_count': hashtag_count,
            'mention_count': mention_count,
            'emoji_count': emoji_count,
            'url_count': url_count,
            'question_mark_count': question_mark_count,
            'exclamation_count': exclamation_count,
            'caps_ratio': round(caps_ratio, 4),
            'sentiment_score': sentiment_score,
            'entity_count': entity_count,
            'topic_count': topic_count,
            'tag_count': tag_count,
            'avg_tag_length': round(float(avg_tag_length), 2),
            'hour_of_day': hour_of_day,
            'day_of_week': day_of_week,
            'historical_engagement_rate': historical_engagement_rate,
            'follower_count': follower_count,
            'title_engagement_potential': round(title_engagement, 2),
            'content_density': round(content_density, 4),
            'platform_youtube': platform_youtube,
            'platform_instagram': platform_instagram,
            'lang_en': lang_en,
            'lang_hi': lang_hi,
            'lang_other': lang_other,
        }

    def batch_extract(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Extract features for a batch of content items.

        Args:
            df: DataFrame where each row is a content item with columns
                matching the expected content dict keys.

        Returns:
            DataFrame with one column per feature in FEATURE_COLUMNS.
        """
        records = df.to_dict('records')
        features = [self.extract_features(record) for record in records]
        feature_df = pd.DataFrame(features)

        # Ensure all expected columns exist, fill missing with 0
        for col in self.FEATURE_COLUMNS:
            if col not in feature_df.columns:
                feature_df[col] = 0

        return feature_df[self.FEATURE_COLUMNS]

    def features_to_vector(self, features: dict) -> np.ndarray:
        """Convert feature dict to ordered numpy array."""
        return np.array([features.get(name, 0) for name in self.FEATURE_COLUMNS], dtype=np.float64)


if __name__ == '__main__':
    fe = FeatureEngineer()
    print(f'Feature columns ({len(fe.FEATURE_COLUMNS)}): {fe.FEATURE_COLUMNS}')

    # Test extraction
    sample = {
        'title': 'Top 10 AI Tips for Beginners!',
        'description': 'Learn about #AI and #MachineLearning in this guide.',
        'tags': ['ai', 'machine learning', 'tutorial'],
        'platform': 'youtube',
        'language': 'en',
        'published_at': '2026-02-27T10:30:00Z',
        'follower_count': 50000,
        'historical_engagement_rate': 0.05,
        'sentiment_score': 0.45,
        'entity_count': 3,
        'topic_count': 2,
    }
    result = fe.extract_features(sample)
    print(f'\nExtracted features:')
    for k, v in result.items():
        print(f'  {k}: {v}')
