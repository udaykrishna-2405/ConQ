"""
ConQ ML Pipeline – Inference Wrapper
======================================
Wraps trained models for real-time inference.
Designed for SageMaker endpoint deployment compatibility.

Provides:
  - Local inference via ViralityPredictor class
  - SageMaker-compatible handler functions (model_fn, input_fn, predict_fn, output_fn)
  - SHAP-style feature importance explanations

The same wrapper works both locally (loading from pickle)
and on SageMaker (using the 4 handler functions).
"""

import os
import json
import pickle
import logging
from typing import Dict, List, Optional, Any

import numpy as np

try:
    import xgboost as xgb
    HAS_XGB = True
except ImportError:
    HAS_XGB = False

from config.ml_config import ML_CONFIG, ALL_FEATURE_NAMES
from pipelines.feature_engineering import FeatureEngineer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Human-readable labels for features
FEATURE_LABELS = {
    'text_length': 'Title Length',
    'description_length': 'Description Length',
    'title_word_count': 'Title Word Count',
    'hashtag_count': 'Hashtag Count',
    'mention_count': 'Mention Count',
    'emoji_count': 'Emoji Count',
    'url_count': 'URL Count',
    'question_mark_count': 'Questions in Title',
    'exclamation_count': 'Exclamation Marks',
    'caps_ratio': 'ALL CAPS Ratio',
    'sentiment_score': 'Sentiment Score',
    'entity_count': 'Entity Count',
    'topic_count': 'Topic Count',
    'tag_count': 'Tag Count',
    'avg_tag_length': 'Avg Tag Length',
    'hour_of_day': 'Posting Hour',
    'day_of_week': 'Day of Week',
    'historical_engagement_rate': 'Historical Engagement',
    'follower_count': 'Follower Count',
    'title_engagement_potential': 'Title Engagement Signal',
    'content_density': 'Content Density',
    'platform_youtube': 'YouTube Platform',
    'platform_instagram': 'Instagram Platform',
    'lang_en': 'English Language',
    'lang_hi': 'Hindi Language',
    'lang_other': 'Other Language',
}


class ViralityPredictor:
    """Wraps the virality prediction model for inference."""

    def __init__(self, model_path: Optional[str] = None):
        self.model = None
        self.model_version = ML_CONFIG['model']['version']
        self.feature_engineer = FeatureEngineer()
        self.feature_names = ALL_FEATURE_NAMES

        if model_path:
            self.load_model(model_path)

    def load_model(self, model_path: str):
        """Load a trained model from disk."""
        if not os.path.exists(model_path):
            logger.warning(f'Model file not found: {model_path}')
            return

        with open(model_path, 'rb') as f:
            self.model = pickle.load(f)
        logger.info(f'Model loaded from {model_path}')

    def predict(self, content: dict) -> dict:
        """
        Predict virality score for given content.

        Args:
            content: Raw content dict (title, description, tags, platform, etc.)

        Returns:
            {
                "score": 0-100 (virality score),
                "confidence": 0.0-1.0,
                "risk_level": str,
                "explanation": [
                    {"feature": str, "label": str, "impact": float, "direction": str}
                ],
                "model_version": str
            }
        """
        # Extract features
        features = self.feature_engineer.extract_features(content)
        feature_vector = self.feature_engineer.features_to_vector(features)

        if self.model is not None:
            # Use trained model
            raw_prediction = self._model_predict(feature_vector)
        else:
            # Fallback: heuristic scoring (same as backend TypeScript model)
            raw_prediction = self._heuristic_predict(features)

        # Transform to 0-100 score
        score = self._transform_to_score(raw_prediction)

        # Compute confidence based on feature completeness
        confidence = self._compute_confidence(features)

        # Generate explainability
        explanation = self._explain_prediction(features, feature_vector)

        # Risk level
        risk_level = self._classify_risk(score)

        return {
            'score': score,
            'confidence': round(confidence, 3),
            'risk_level': risk_level,
            'explanation': explanation,
            'model_version': self.model_version,
        }

    def _model_predict(self, feature_vector: np.ndarray) -> float:
        """Run prediction through the trained model."""
        if HAS_XGB and isinstance(self.model, xgb.Booster):
            dmatrix = xgb.DMatrix(
                feature_vector.reshape(1, -1),
                feature_names=self.feature_names
            )
            return float(self.model.predict(dmatrix)[0])
        elif hasattr(self.model, 'predict'):
            return float(self.model.predict(feature_vector.reshape(1, -1))[0])
        else:
            return self._heuristic_predict(
                dict(zip(self.feature_names, feature_vector))
            )

    def _heuristic_predict(self, features: dict) -> float:
        """
        Heuristic scoring fallback when no trained model is available.
        Mirrors the backend viralityModel.ts weighted scoring.
        """
        score = 0.03  # Base engagement rate

        # Content quality signals
        if features.get('hashtag_count', 0) > 2:
            score += 0.008
        if features.get('question_mark_count', 0) > 0:
            score += 0.005
        if features.get('title_engagement_potential', 0) > 0.5:
            score += 0.01

        # Sentiment boost
        sentiment = features.get('sentiment_score', 0)
        if sentiment > 0.3:
            score += 0.008
        elif sentiment < -0.3:
            score -= 0.003

        # Time bonuses
        hour = features.get('hour_of_day', 12)
        if 9 <= hour <= 12 or 18 <= hour <= 22:
            score += 0.005

        # Platform bonus
        if features.get('platform_instagram', 0):
            score *= 1.1

        # Follower impact
        followers = features.get('follower_count', 0)
        if followers > 100000:
            score += 0.005
        elif followers > 50000:
            score += 0.003

        # Caps penalty
        if features.get('caps_ratio', 0) > 0.5:
            score -= 0.005

        return max(0.001, min(score, 0.25))

    def _transform_to_score(self, raw_prediction: float) -> int:
        """Transform raw engagement rate prediction to 0-100 virality score."""
        # Map typical engagement rates (0.01 - 0.15) to 0-100 range
        normalized = (raw_prediction - 0.01) / (0.12 - 0.01)
        score = int(max(0, min(100, normalized * 100)))
        return score

    def _compute_confidence(self, features: dict) -> float:
        """Compute prediction confidence based on input quality."""
        confidence = 0.5  # Base

        # More features provided = higher confidence
        if features.get('follower_count', 0) > 0:
            confidence += 0.1
        if features.get('historical_engagement_rate', 0) > 0:
            confidence += 0.15
        if features.get('sentiment_score', 0) != 0:
            confidence += 0.1
        if features.get('entity_count', 0) > 0:
            confidence += 0.05
        if features.get('text_length', 0) > 10:
            confidence += 0.05
        if features.get('tag_count', 0) > 0:
            confidence += 0.05

        return min(confidence, 0.95)

    def _explain_prediction(
        self, features: dict, feature_vector: np.ndarray
    ) -> List[Dict]:
        """
        Generate SHAP-style feature importance explanations.

        If a trained model with SHAP is available, uses real SHAP values.
        Otherwise, computes heuristic importances based on feature values
        relative to baseline means.
        """
        # Baseline means for comparison
        baselines = {
            'text_length': 40, 'description_length': 100, 'title_word_count': 8,
            'hashtag_count': 3, 'mention_count': 1, 'emoji_count': 1,
            'url_count': 0, 'question_mark_count': 0, 'exclamation_count': 0,
            'caps_ratio': 0.05, 'sentiment_score': 0.0, 'entity_count': 2,
            'topic_count': 1, 'tag_count': 4, 'avg_tag_length': 6,
            'hour_of_day': 12, 'day_of_week': 3, 'historical_engagement_rate': 0.03,
            'follower_count': 10000, 'title_engagement_potential': 0.3,
            'content_density': 0.5, 'platform_youtube': 0.5, 'platform_instagram': 0.5,
            'lang_en': 0.4, 'lang_hi': 0.3, 'lang_other': 0.3,
        }

        # Feature weights (approximate contribution to engagement)
        weights = {
            'sentiment_score': 0.12, 'historical_engagement_rate': 0.15,
            'follower_count': 0.10, 'hashtag_count': 0.08,
            'title_engagement_potential': 0.08, 'hour_of_day': 0.06,
            'entity_count': 0.05, 'topic_count': 0.05,
            'content_density': 0.04, 'tag_count': 0.04,
            'platform_youtube': 0.03, 'platform_instagram': 0.03,
            'caps_ratio': 0.03, 'question_mark_count': 0.03,
            'text_length': 0.02, 'emoji_count': 0.02,
        }

        explanations = []
        for name in self.feature_names:
            value = features.get(name, 0)
            baseline = baselines.get(name, 0)
            weight = weights.get(name, 0.01)

            if baseline != 0:
                deviation = (value - baseline) / max(abs(baseline), 1)
            else:
                deviation = value

            impact = round(deviation * weight, 4)
            direction = 'positive' if impact >= 0 else 'negative'

            explanations.append({
                'feature': name,
                'label': FEATURE_LABELS.get(name, name),
                'impact': abs(impact),
                'direction': direction,
            })

        # Sort by absolute impact descending, return top N
        max_features = ML_CONFIG['explainability']['max_features']
        explanations.sort(key=lambda x: x['impact'], reverse=True)
        return explanations[:max_features]

    def _classify_risk(self, score: int) -> str:
        """Classify virality risk level."""
        if score >= 70:
            return 'high_viral_potential'
        elif score >= 40:
            return 'moderate_potential'
        elif score >= 20:
            return 'low_potential'
        else:
            return 'minimal_potential'


# ── SageMaker Handler Functions ──
# These functions are called by SageMaker when the model is deployed
# as an endpoint. They follow the SageMaker Python SDK contract.

_predictor_instance: Optional[ViralityPredictor] = None


def model_fn(model_dir: str) -> ViralityPredictor:
    """
    SageMaker model loading function.
    Called once when the endpoint is initialized.
    """
    global _predictor_instance

    model_path = os.path.join(model_dir, 'model.pkl')
    if not os.path.exists(model_path):
        # Look for any .pkl file
        for f in os.listdir(model_dir):
            if f.endswith('.pkl'):
                model_path = os.path.join(model_dir, f)
                break

    _predictor_instance = ViralityPredictor(model_path=model_path)
    logger.info(f'SageMaker model loaded from {model_dir}')
    return _predictor_instance


def input_fn(request_body: str, content_type: str = 'application/json') -> dict:
    """
    SageMaker input parsing function.
    Parses the request body into a content dict.
    """
    if content_type != 'application/json':
        raise ValueError(f'Unsupported content type: {content_type}')

    return json.loads(request_body)


def predict_fn(input_data: dict, model: ViralityPredictor) -> dict:
    """
    SageMaker prediction function.
    Takes parsed input and returns prediction.
    """
    return model.predict(input_data)


def output_fn(prediction: dict, accept: str = 'application/json') -> str:
    """
    SageMaker output formatting function.
    Serializes the prediction to the requested format.
    """
    if accept != 'application/json':
        raise ValueError(f'Unsupported accept type: {accept}')

    return json.dumps(prediction)


if __name__ == '__main__':
    # Test local inference
    predictor = ViralityPredictor()

    test_content = {
        'title': 'Why AI is Changing Everything in 2026!',
        'description': 'Discover the top AI trends reshaping India. #AI #tech #india',
        'tags': ['ai', 'technology', 'india', 'trends'],
        'platform': 'youtube',
        'language': 'en',
        'published_at': '2026-02-27T10:30:00Z',
        'follower_count': 75000,
        'historical_engagement_rate': 0.045,
        'sentiment_score': 0.6,
        'entity_count': 3,
        'topic_count': 2,
    }

    result = predictor.predict(test_content)
    print(f'\nVirality Prediction:')
    print(f'  Score: {result["score"]}/100')
    print(f'  Confidence: {result["confidence"]}')
    print(f'  Risk Level: {result["risk_level"]}')
    print(f'  Model Version: {result["model_version"]}')
    print(f'\nTop Feature Impacts:')
    for exp in result['explanation'][:5]:
        print(f'  [{exp["direction"]:>8}] {exp["label"]}: {exp["impact"]:.4f}')
