"""
ConQ ML Configuration
======================
Centralized ML pipeline configuration.
Controls model hyperparameters, feature definitions, training splits,
data paths, and SageMaker deployment settings.
"""

import os

# ── Paths ──

S3_DATA_LAKE = os.environ.get('S3_DATA_LAKE_BUCKET', 'conq-data-lake')
S3_MODEL_REGISTRY = os.environ.get('MODEL_REGISTRY_BUCKET', 'conq-model-registry')
AWS_REGION = os.environ.get('AWS_REGION', 'ap-south-1')
SAGEMAKER_ROLE_ARN = os.environ.get('SAGEMAKER_ROLE_ARN', '')

ML_CONFIG = {
    'model': {
        'type': 'xgboost',
        'version': '0.1.0',
        'hyperparameters': {
            'max_depth': 6,
            'learning_rate': 0.1,
            'n_estimators': 100,
            'objective': 'reg:squarederror',
            'eval_metric': 'rmse',
            'subsample': 0.8,
            'colsample_bytree': 0.8,
            'min_child_weight': 3,
            'gamma': 0.1,
            'reg_alpha': 0.1,
            'reg_lambda': 1.0,
            'seed': 42,
        },
    },

    'features': {
        'numerical': [
            'text_length',
            'description_length',
            'title_word_count',
            'hashtag_count',
            'mention_count',
            'emoji_count',
            'url_count',
            'question_mark_count',
            'exclamation_count',
            'caps_ratio',
            'sentiment_score',
            'entity_count',
            'topic_count',
            'tag_count',
            'avg_tag_length',
            'hour_of_day',
            'day_of_week',
            'historical_engagement_rate',
            'follower_count',
            'title_engagement_potential',
            'content_density',
        ],
        'categorical': [
            'platform',
            'language',
            'is_code_mixed',
            'is_weekend',
        ],
        'derived': [
            'platform_youtube',
            'platform_instagram',
            'lang_en',
            'lang_hi',
            'lang_other',
        ],
    },

    'target': {
        'column': 'engagement_rate',
        'score_transform': 'percentile',  # Convert raw prediction to 0-100 score
    },

    'training': {
        'test_split': 0.2,
        'validation_split': 0.1,
        'random_state': 42,
        'early_stopping_rounds': 10,
        'cv_folds': 5,
    },

    'data': {
        's3_training_prefix': f's3://{S3_DATA_LAKE}/training-data/',
        's3_model_prefix': f's3://{S3_MODEL_REGISTRY}/models/virality/',
        'local_data_dir': 'data/',
        'local_model_dir': 'models/',
    },

    'sagemaker': {
        'instance_type': 'ml.m5.large',
        'instance_count': 1,
        'endpoint_name': 'conq-virality-endpoint',
        'role_arn': SAGEMAKER_ROLE_ARN,
        'region': AWS_REGION,
        'framework_version': '1.7-1',
    },

    'explainability': {
        'method': 'shap',
        'max_features': 15,
        'background_samples': 100,
    },
}

# ── Feature Name Constants ──

ALL_FEATURE_NAMES = (
    ML_CONFIG['features']['numerical']
    + ML_CONFIG['features']['derived']
)

NUM_FEATURES = len(ALL_FEATURE_NAMES)
