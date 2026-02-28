"""
ConQ ML Pipeline – Training Pipeline
=====================================
Orchestrates model training: data loading, feature engineering,
model training, evaluation, and model artifact storage.

Steps:
  1. Load training data (CSV/Parquet from S3 or local)
  2. Run feature engineering via FeatureEngineer
  3. Split into train/validation/test sets
  4. Train XGBoost model with early stopping
  5. Evaluate model (RMSE, MAE, R2, feature importances)
  6. Save model artifact + metadata
  7. (Optional) Deploy to SageMaker endpoint

Designed to run locally or as a SageMaker Training Job.
"""

import os
import json
import logging
import pickle
from datetime import datetime
from typing import Tuple, Dict, Optional

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

try:
    import xgboost as xgb
    HAS_XGB = True
except ImportError:
    HAS_XGB = False

from config.ml_config import ML_CONFIG
from pipelines.feature_engineering import FeatureEngineer

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger(__name__)


class TrainingPipeline:
    """Orchestrates the full model training pipeline."""

    def __init__(self):
        self.feature_engineer = FeatureEngineer()
        self.config = ML_CONFIG
        self.model = None
        self.metrics: Dict = {}
        self.feature_importances: Dict[str, float] = {}

    def load_data(self, data_path: Optional[str] = None) -> pd.DataFrame:
        """
        Load training data from file or generate synthetic data.

        In production, reads from S3 data lake (Parquet format).
        For MVP, generates synthetic training data.
        """
        if data_path and os.path.exists(data_path):
            if data_path.endswith('.parquet'):
                df = pd.read_parquet(data_path)
            else:
                df = pd.read_csv(data_path)
            logger.info(f'Loaded {len(df)} records from {data_path}')
            return df

        # Generate synthetic training data for MVP
        logger.info('Generating synthetic training data...')
        return self._generate_synthetic_data(n_samples=2000)

    def _generate_synthetic_data(self, n_samples: int = 2000) -> pd.DataFrame:
        """
        Generate synthetic training data that mirrors real creator content.
        Each row represents a content item with features + target engagement rate.
        """
        rng = np.random.RandomState(self.config['training']['random_state'])

        records = []
        platforms = ['youtube', 'instagram']
        languages = ['en', 'hi', 'hi-Latn', 'ta', 'te', 'bn']

        for i in range(n_samples):
            platform = rng.choice(platforms)
            language = rng.choice(languages, p=[0.35, 0.30, 0.10, 0.10, 0.10, 0.05])
            follower_count = int(rng.lognormal(mean=10, sigma=1.5))
            hour = rng.randint(0, 24)
            day = rng.randint(0, 7)

            title_len = rng.randint(10, 120)
            desc_len = rng.randint(0, 500)
            hashtag_count = rng.poisson(3)
            mention_count = rng.poisson(1)
            tag_count = rng.poisson(4)
            sentiment = rng.uniform(-1.0, 1.0)
            entity_count = rng.poisson(2)
            topic_count = rng.poisson(1)

            # Simulate engagement rate as a function of features
            # (This creates a learnable relationship for the model)
            base_engagement = 0.03
            engagement = base_engagement

            # Positive signals
            if hashtag_count > 2:
                engagement += 0.01
            if 8 <= hour <= 12 or 18 <= hour <= 22:
                engagement += 0.005  # Prime posting hours
            if sentiment > 0.3:
                engagement += 0.008
            if follower_count > 50000:
                engagement += 0.005
            if topic_count > 0:
                engagement += 0.003
            if platform == 'instagram':
                engagement *= 1.1  # Instagram tends to have higher engagement

            # Add noise
            engagement += rng.normal(0, 0.01)
            engagement = max(0.001, min(engagement, 0.25))

            records.append({
                'title': f'Sample Title {i}' + ('?' if rng.random() > 0.7 else ''),
                'description': f'Description text ' * max(1, desc_len // 20),
                'tags': [f'tag{j}' for j in range(tag_count)],
                'platform': platform,
                'language': language,
                'is_code_mixed': rng.random() > 0.8,
                'published_at': f'2026-{rng.randint(1,3):02d}-{rng.randint(1,28):02d}T{hour:02d}:00:00Z',
                'follower_count': follower_count,
                'historical_engagement_rate': base_engagement + rng.normal(0, 0.005),
                'sentiment_score': sentiment,
                'entity_count': entity_count,
                'topic_count': topic_count,
                'engagement_rate': engagement,  # Target variable
            })

        df = pd.DataFrame(records)
        logger.info(f'Generated {len(df)} synthetic training records')
        return df

    def prepare_features(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
        """Extract features and separate target."""
        target_col = self.config['target']['column']
        y = df[target_col].copy()

        X = self.feature_engineer.batch_extract(df)
        logger.info(f'Extracted {X.shape[1]} features from {X.shape[0]} samples')

        return X, y

    def split_data(
        self, X: pd.DataFrame, y: pd.Series
    ) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.Series, pd.Series, pd.Series]:
        """Split into train/validation/test sets."""
        test_size = self.config['training']['test_split']
        val_size = self.config['training']['validation_split']
        random_state = self.config['training']['random_state']

        # First split: train+val vs test
        X_temp, X_test, y_temp, y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state
        )

        # Second split: train vs val
        val_relative = val_size / (1 - test_size)
        X_train, X_val, y_train, y_val = train_test_split(
            X_temp, y_temp, test_size=val_relative, random_state=random_state
        )

        logger.info(f'Data split: train={len(X_train)}, val={len(X_val)}, test={len(X_test)}')
        return X_train, X_val, X_test, y_train, y_val, y_test

    def train_model(
        self,
        X_train: pd.DataFrame,
        y_train: pd.Series,
        X_val: pd.DataFrame,
        y_val: pd.Series,
    ):
        """Train XGBoost model with early stopping on validation set."""
        if not HAS_XGB:
            logger.warning('XGBoost not installed. Using sklearn GradientBoosting fallback.')
            return self._train_sklearn_fallback(X_train, y_train)

        params = self.config['model']['hyperparameters'].copy()
        n_estimators = params.pop('n_estimators', 100)

        dtrain = xgb.DMatrix(X_train, label=y_train, feature_names=list(X_train.columns))
        dval = xgb.DMatrix(X_val, label=y_val, feature_names=list(X_val.columns))

        self.model = xgb.train(
            params,
            dtrain,
            num_boost_round=n_estimators,
            evals=[(dtrain, 'train'), (dval, 'val')],
            early_stopping_rounds=self.config['training']['early_stopping_rounds'],
            verbose_eval=10,
        )

        # Feature importances
        importance = self.model.get_score(importance_type='gain')
        self.feature_importances = dict(sorted(
            importance.items(), key=lambda x: x[1], reverse=True
        ))

        logger.info(f'Model trained. Best iteration: {self.model.best_iteration}')

    def _train_sklearn_fallback(self, X_train: pd.DataFrame, y_train: pd.Series):
        """Fallback to sklearn GradientBoosting if XGBoost unavailable."""
        from sklearn.ensemble import GradientBoostingRegressor

        params = self.config['model']['hyperparameters']
        self.model = GradientBoostingRegressor(
            max_depth=params.get('max_depth', 6),
            learning_rate=params.get('learning_rate', 0.1),
            n_estimators=params.get('n_estimators', 100),
            random_state=self.config['training']['random_state'],
        )
        self.model.fit(X_train, y_train)

        # Feature importances
        if hasattr(self.model, 'feature_importances_'):
            self.feature_importances = dict(zip(
                X_train.columns, self.model.feature_importances_
            ))

        logger.info('Sklearn fallback model trained.')

    def evaluate_model(
        self,
        X_test: pd.DataFrame,
        y_test: pd.Series,
    ) -> Dict:
        """Evaluate model on test set."""
        if HAS_XGB and isinstance(self.model, xgb.Booster):
            dtest = xgb.DMatrix(X_test, feature_names=list(X_test.columns))
            y_pred = self.model.predict(dtest)
        else:
            y_pred = self.model.predict(X_test)

        self.metrics = {
            'rmse': float(np.sqrt(mean_squared_error(y_test, y_pred))),
            'mae': float(mean_absolute_error(y_test, y_pred)),
            'r2': float(r2_score(y_test, y_pred)),
            'n_test_samples': len(y_test),
            'y_pred_mean': float(np.mean(y_pred)),
            'y_test_mean': float(np.mean(y_test)),
        }

        logger.info(f'Evaluation: RMSE={self.metrics["rmse"]:.6f}, '
                     f'MAE={self.metrics["mae"]:.6f}, R2={self.metrics["r2"]:.4f}')
        return self.metrics

    def save_model(self, output_dir: Optional[str] = None) -> str:
        """Save model artifact and metadata."""
        output_dir = output_dir or self.config['data']['local_model_dir']
        os.makedirs(output_dir, exist_ok=True)

        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        model_name = f'virality_model_{timestamp}'

        # Save model
        model_path = os.path.join(output_dir, f'{model_name}.pkl')
        with open(model_path, 'wb') as f:
            pickle.dump(self.model, f)

        # Save metadata
        metadata = {
            'model_name': model_name,
            'model_version': self.config['model']['version'],
            'model_type': self.config['model']['type'],
            'hyperparameters': self.config['model']['hyperparameters'],
            'feature_columns': self.feature_engineer.FEATURE_COLUMNS,
            'num_features': len(self.feature_engineer.FEATURE_COLUMNS),
            'metrics': self.metrics,
            'feature_importances': self.feature_importances,
            'trained_at': datetime.now().isoformat(),
        }

        metadata_path = os.path.join(output_dir, f'{model_name}_metadata.json')
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)

        logger.info(f'Model saved to {model_path}')
        logger.info(f'Metadata saved to {metadata_path}')
        return model_path


def run_training_pipeline(data_path: Optional[str] = None, output_dir: Optional[str] = None):
    """Execute the full training pipeline."""
    logger.info('=' * 60)
    logger.info('ConQ Virality Prediction – Training Pipeline')
    logger.info('=' * 60)

    pipeline = TrainingPipeline()

    # 1. Load data
    df = pipeline.load_data(data_path)

    # 2. Feature engineering
    X, y = pipeline.prepare_features(df)

    # 3. Split data
    X_train, X_val, X_test, y_train, y_val, y_test = pipeline.split_data(X, y)

    # 4. Train model
    pipeline.train_model(X_train, y_train, X_val, y_val)

    # 5. Evaluate
    metrics = pipeline.evaluate_model(X_test, y_test)

    # 6. Save model
    model_path = pipeline.save_model(output_dir)

    logger.info('=' * 60)
    logger.info('Training pipeline complete!')
    logger.info(f'  Model: {model_path}')
    logger.info(f'  RMSE: {metrics["rmse"]:.6f}')
    logger.info(f'  R2:   {metrics["r2"]:.4f}')
    logger.info(f'  Top features: {list(pipeline.feature_importances.keys())[:5]}')
    logger.info('=' * 60)

    return pipeline


if __name__ == '__main__':
    run_training_pipeline()
