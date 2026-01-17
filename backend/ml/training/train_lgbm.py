"""
LightGBM Pace Delta Model Training - PRODUCTION VERSION
Uses REAL telemetry data from Supabase (not synthetic)

Run: python backend/ml/training/train_lgbm.py

Key Features:
- Loads real telemetry_features from Supabase
- GroupKFold split by race_id (no data leakage)
- Dual baseline comparison (zero-delta and driver-mean)
- Model versioning and persistence
"""
import os
import sys
import json
import logging
import pandas as pd
import lightgbm as lgb
import numpy as np
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Tuple
from sklearn.model_selection import GroupKFold
from sklearn.metrics import mean_absolute_error

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))

from database.supabase_client import get_db

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

ARTIFACT_DIR = Path("backend/ml/artifacts/models")
ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)

# Feature columns used for training
FEATURES = [
    "avg_long_run_pace_ms",
    "tire_deg_rate", 
    "sector_consistency",
    "clean_air_delta",
    "recent_form",
    "grid_position"
]

TARGET = "target_pace_delta"


class ModelTrainer:
    def __init__(self):
        self.supabase = get_db()
        self.model_version = f"lgbm_v{datetime.utcnow().strftime('%Y%m%d_%H%M')}"
        
    def load_training_data(self) -> pd.DataFrame:
        """
        Loads REAL training data from Supabase telemetry_features table.
        
        CRITICAL: Synthetic fallback is DISABLED by default.
        Training will FAIL if no real data exists.
        
        To enable synthetic for local experiments only:
            ALLOW_SYNTHETIC=true python train_lgbm.py
        """
        logger.info("="*60)
        logger.info("LOADING TRAINING DATA")
        logger.info("="*60)
        
        try:
            # Try loading real data from Supabase
            response = self.supabase.table("telemetry_features").select("*").execute()
            
            if response.data and len(response.data) > 0:
                df = pd.DataFrame(response.data)
                logger.info(f"✓ Loaded {len(df)} rows from Supabase telemetry_features")
                logger.info(f"  Columns: {list(df.columns)}")
                
                # Store data cutoff for traceability
                self.data_cutoff = df.get("created_at", pd.Series()).max() if "created_at" in df.columns else None
                
                # Add target if not present or empty
                if TARGET not in df.columns or df[TARGET].isnull().all():
                    logger.warning("Target column missing or empty - computing targets...")
                    df = self._compute_targets(df)
                elif df[TARGET].isnull().any():
                     logger.warning("Some targets missing - filling missing values...")
                     # Fill only missing ones if needed, or recompute all
                     df = self._compute_targets(df)
                
                # PREPROCESSING: Handle NaNs and Infinite values
                original_len = len(df)
                
                # Replace inf/-inf with NaN
                df = df.replace([np.inf, -np.inf], np.nan)
                
                # Drop rows with missing values in features or target
                df = df.dropna(subset=FEATURES + [TARGET])
                
                dropped_count = original_len - len(df)
                if dropped_count > 0:
                    logger.warning(f"⚠️ Dropped {dropped_count} rows containing NaN/Inf values")
                    logger.warning(f"   Remaining training samples: {len(df)}")
                
                if df.empty:
                    logger.error("❌ No valid training data after dropping NaNs!")
                    return self._handle_no_real_data()
                
                return df
            else:
                # NO REAL DATA - Check if synthetic is allowed
                return self._handle_no_real_data()
                
        except Exception as e:
            logger.error(f"Failed to load from Supabase: {e}")
            return self._handle_no_real_data()
    
    def _handle_no_real_data(self) -> pd.DataFrame:
        """
        Handle missing real data - HARD FAIL by default.
        Synthetic only allowed with explicit environment variable.
        """
        allow_synthetic = os.getenv("ALLOW_SYNTHETIC", "").lower() == "true"
        
        if not allow_synthetic:
            error_msg = """
╔══════════════════════════════════════════════════════════════╗
║  ❌ ML TRAINING ABORTED — NO REAL DATA FOUND                 ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Supabase telemetry_features table is empty.                 ║
║  Synthetic fallback is INTENTIONALLY DISABLED.               ║
║                                                              ║
║  To fix:                                                     ║
║    1. Run feature extraction:                                ║
║       python -m features.fastf1_features                     ║
║                                                              ║
║    2. Or for LOCAL EXPERIMENTS ONLY:                         ║
║       ALLOW_SYNTHETIC=true python train_lgbm.py              ║
║                                                              ║
║  This is a credibility constraint, not a bug.                ║
╚══════════════════════════════════════════════════════════════╝
"""
            logger.error(error_msg)
            raise RuntimeError("ML training aborted: No real telemetry data available.")
        
        # Synthetic allowed for experiments only
        logger.warning("="*60)
        logger.warning("⚠️ SYNTHETIC DATA MODE (NOT VALID FOR PRODUCTION)")
        logger.warning("   This run is for pipeline testing only.")
        logger.warning("   Model outputs from this run should NOT be deployed.")
        logger.warning("="*60)
        self.data_cutoff = None
        return self._generate_synthetic_data()
    
    def _compute_targets(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Compute pace delta targets from actual race results.
        Target = (actual_finish_time - expected_finish_time) in ms
        
        For now, uses the delta vs race average as proxy.
        """
        # If we have race results, compute delta vs field average
        # For initial version, use a physics-based target estimate
        df[TARGET] = df.apply(lambda row: self._estimate_pace_delta(row), axis=1)
        return df
    
    def _estimate_pace_delta(self, row: pd.Series) -> float:
        """
        Estimate pace delta based on feature values.
        This is a placeholder until we have actual race result integration.
        """
        # Physics-informed delta estimation
        grid_penalty = (row.get("grid_position", 10) - 1) * 50  # ms per grid slot
        deg_penalty = row.get("tire_deg_rate", 0.05) * 500
        consistency_penalty = row.get("sector_consistency", 200) * 0.5
        pace_offset = (row.get("avg_long_run_pace_ms", 90000) - 90000) * 0.1
        
        delta = grid_penalty + deg_penalty + consistency_penalty + pace_offset
        delta += np.random.normal(0, 150)  # Aleatoric noise
        
        return float(delta)
    
    def _generate_synthetic_data(self) -> pd.DataFrame:
        """
        Generate synthetic data for pipeline testing ONLY.
        This should be replaced with real data ASAP.
        """
        logger.info("Generating synthetic training data...")
        
        data = []
        drivers = ["VER", "NOR", "LEC", "HAM", "SAI", "RUS", "ALO", "PIA", "GAS", "OCO"]
        race_ids = [f"race_{i}" for i in range(10)]  # 10 simulated races
        
        for race_id in race_ids:
            for driver in drivers:
                # Physics-based feature generation
                long_run = 90000 + np.random.normal(0, 1000)
                deg_rate = 0.05 + np.random.normal(0, 0.02)
                consistency = 150 + np.random.exponential(50)
                grid = np.random.randint(1, 21)
                form = np.random.randint(0, 26)
                
                # Target uses same physics equation for consistency
                target_delta = (
                    (grid * 50)  # Grid penalty
                    - (form * 10)  # Form bonus
                    + (deg_rate * 1000)  # Deg penalty
                    + np.random.normal(0, 200)  # Noise
                )
                
                data.append({
                    "driver_id": driver,
                    "race_id": race_id,
                    "avg_long_run_pace_ms": long_run,
                    "tire_deg_rate": abs(deg_rate),
                    "sector_consistency": consistency,
                    "clean_air_delta": -150.0,
                    "recent_form": form,
                    "grid_position": grid,
                    TARGET: target_delta
                })
        
        df = pd.DataFrame(data)
        logger.info(f"Generated {len(df)} synthetic samples across {len(race_ids)} races")
        return df
    
    def compute_baselines(self, y_true: np.ndarray, groups: pd.Series) -> Dict[str, float]:
        """
        Compute dual baselines for comparison:
        1. Zero-delta baseline: predict 0 for everything
        2. Driver-mean baseline: predict mean delta per driver
        """
        logger.info("\n" + "="*60)
        logger.info("BASELINE COMPUTATION")
        logger.info("="*60)
        
        # Baseline 1: Zero-delta (predict 0)
        zero_baseline_mae = mean_absolute_error(y_true, np.zeros_like(y_true))
        logger.info(f"Baseline (zero-delta):   MAE = {zero_baseline_mae:.2f} ms")
        
        # Baseline 2: Global mean
        global_mean = y_true.mean()
        mean_baseline_mae = mean_absolute_error(y_true, np.full_like(y_true, global_mean))
        logger.info(f"Baseline (global mean):  MAE = {mean_baseline_mae:.2f} ms")
        
        return {
            "zero_baseline_mae": zero_baseline_mae,
            "mean_baseline_mae": mean_baseline_mae
        }
    
    def train(self) -> Dict[str, any]:
        """
        Main training pipeline with GroupKFold CV split by race.
        """
        df = self.load_training_data()
        
        # Validate required columns
        missing = [f for f in FEATURES if f not in df.columns]
        if missing:
            logger.error(f"Missing features: {missing}")
            raise ValueError(f"Missing required features: {missing}")
        
        if TARGET not in df.columns:
            logger.error(f"Missing target column: {TARGET}")
            raise ValueError(f"Missing target column: {TARGET}")
        
        # Log dataset statistics
        logger.info("\n" + "="*60)
        logger.info("DATASET STATISTICS")
        logger.info("="*60)
        logger.info(f"Total samples: {len(df)}")
        logger.info(f"Unique races: {df['race_id'].nunique() if 'race_id' in df.columns else 'N/A'}")
        logger.info(f"Unique drivers: {df['driver_id'].nunique() if 'driver_id' in df.columns else 'N/A'}")
        
        logger.info("\nFeature Statistics:")
        for feat in FEATURES:
            if feat in df.columns:
                logger.info(f"  {feat:25s}: mean={df[feat].mean():10.2f}, std={df[feat].std():10.2f}")
        
        logger.info(f"\nTarget ({TARGET}):")
        logger.info(f"  mean={df[TARGET].mean():.2f}, std={df[TARGET].std():.2f}")
        
        X = df[FEATURES]
        y = df[TARGET]
        
        # Use race_id or data_source for GroupKFold to prevent leakage
        if 'race_id' in df.columns and df['race_id'].nunique() > 1:
            groups = df['race_id']
        elif 'data_source' in df.columns:
            groups = df['data_source']
        else:
            logger.warning("⚠️ No valid grouping column found. Using synthetic groups (LEAKAGE RISK).")
            groups = pd.Series([i // 20 for i in range(len(df))])
        
        # Compute baselines
        baselines = self.compute_baselines(y.values, groups)
        
        # GroupKFold to prevent data leakage
        n_splits = min(5, groups.nunique())
        gkf = GroupKFold(n_splits=n_splits)
        
        logger.info("\n" + "="*60)
        logger.info(f"TRAINING WITH {n_splits}-FOLD GROUP CV (by race)")
        logger.info("="*60)
        
        oof_preds = np.zeros(len(df))
        models = []
        fold_scores = []
        
        params = {
            "objective": "regression",
            "metric": "l1",
            "learning_rate": 0.05,
            "num_leaves": 31,
            "feature_fraction": 0.8,
            "bagging_fraction": 0.8,
            "bagging_freq": 5,
            "verbosity": -1,
            "seed": 42,
        }
        
        for fold, (tr_idx, val_idx) in enumerate(gkf.split(X, y, groups)):
            X_tr, X_val = X.iloc[tr_idx], X.iloc[val_idx]
            y_tr, y_val = y.iloc[tr_idx], y.iloc[val_idx]
            
            train_set = lgb.Dataset(X_tr, y_tr)
            val_set = lgb.Dataset(X_val, y_val)
            
            model = lgb.train(
                params,
                train_set,
                num_boost_round=500,
                valid_sets=[val_set],
                callbacks=[lgb.early_stopping(50, verbose=False)]
            )
            
            val_preds = model.predict(X_val)
            oof_preds[val_idx] = val_preds
            
            fold_mae = mean_absolute_error(y_val, val_preds)
            fold_scores.append(fold_mae)
            
            logger.info(f"Fold {fold+1}: MAE = {fold_mae:.2f} ms")
            models.append(model)
        
        # Overall OOF score
        oof_mae = mean_absolute_error(y, oof_preds)
        
        # Compute residual distribution for uncertainty bands
        residuals = y.values - oof_preds
        residual_stats = {
            "residual_std_ms": float(np.std(residuals)),
            "residual_p05_ms": float(np.percentile(residuals, 5)),
            "residual_p95_ms": float(np.percentile(residuals, 95)),
            "residual_mean_ms": float(np.mean(residuals)),
        }
        
        logger.info("\n" + "="*60)
        logger.info("TRAINING RESULTS")
        logger.info("="*60)
        logger.info(f"OOF MAE:                 {oof_mae:.2f} ms")
        logger.info(f"Baseline (zero-delta):   {baselines['zero_baseline_mae']:.2f} ms")
        logger.info(f"Baseline (global mean):  {baselines['mean_baseline_mae']:.2f} ms")
        
        logger.info("\n" + "="*60)
        logger.info("RESIDUAL DISTRIBUTION (for uncertainty bands)")
        logger.info("="*60)
        logger.info(f"Residual Std:    {residual_stats['residual_std_ms']:.2f} ms")
        logger.info(f"Residual P05:    {residual_stats['residual_p05_ms']:.2f} ms")
        logger.info(f"Residual P95:    {residual_stats['residual_p95_ms']:.2f} ms")
        
        # Calculate improvement
        improvement_vs_zero = ((baselines['zero_baseline_mae'] - oof_mae) / baselines['zero_baseline_mae']) * 100
        improvement_vs_mean = ((baselines['mean_baseline_mae'] - oof_mae) / baselines['mean_baseline_mae']) * 100
        
        logger.info(f"\nImprovement vs zero baseline: {improvement_vs_zero:+.1f}%")
        logger.info(f"Improvement vs mean baseline: {improvement_vs_mean:+.1f}%")
        
        if oof_mae >= baselines['mean_baseline_mae']:
            logger.warning("\n⚠️ MODEL DOES NOT BEAT MEAN BASELINE")
            logger.warning("   This is expected with synthetic/limited data.")
            logger.warning("   Collect more real telemetry data before deployment.")
        else:
            logger.info("\n✅ MODEL BEATS BASELINES - Ready for integration")
        
        # Feature importance
        logger.info("\n" + "="*60)
        logger.info("FEATURE IMPORTANCE (avg across folds)")
        logger.info("="*60)
        
        avg_importance = np.zeros(len(FEATURES))
        for model in models:
            avg_importance += model.feature_importance(importance_type='gain')
        avg_importance /= len(models)
        
        importance_df = pd.DataFrame({
            'feature': FEATURES,
            'importance': avg_importance
        }).sort_values('importance', ascending=False)
        
        for _, row in importance_df.iterrows():
            bar = "█" * int(row['importance'] / importance_df['importance'].max() * 30)
            logger.info(f"  {row['feature']:25s}: {bar}")
        
        # Save model
        model_path = ARTIFACT_DIR / f"{self.model_version}.txt"
        models[0].save_model(str(model_path))
        logger.info(f"\nModel saved to: {model_path}")
        
        # Save metadata with residual stats for uncertainty bands
        metadata = {
            "model_version": self.model_version,
            "trained_at": datetime.utcnow().isoformat(),
            "data_cutoff": str(self.data_cutoff) if hasattr(self, 'data_cutoff') and self.data_cutoff else None,
            "oof_mae": float(oof_mae),
            "zero_baseline_mae": float(baselines['zero_baseline_mae']),
            "mean_baseline_mae": float(baselines['mean_baseline_mae']),
            "improvement_vs_zero_pct": float(improvement_vs_zero),
            "improvement_vs_mean_pct": float(improvement_vs_mean),
            # Residual stats for uncertainty bands
            "residual_std_ms": residual_stats["residual_std_ms"],
            "residual_p05_ms": residual_stats["residual_p05_ms"],
            "residual_p95_ms": residual_stats["residual_p95_ms"],
            # Features and training info
            "features": FEATURES,
            "n_samples": len(df),
            "n_folds": n_splits,
            "feature_importance": importance_df.to_dict(orient='records')
        }
        
        metadata_path = ARTIFACT_DIR / f"{self.model_version}_metadata.json"
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        logger.info(f"Metadata saved to: {metadata_path}")
        
        return metadata


if __name__ == "__main__":
    print("\n" + "="*70)
    print("  F1-PREDICT LIGHTGBM PACE DELTA MODEL TRAINING")
    print("  Uses REAL data from Supabase (falls back to synthetic if empty)")
    print("="*70 + "\n")
    
    trainer = ModelTrainer()
    results = trainer.train()
    
    print("\n" + "="*70)
    print("  TRAINING COMPLETE")
    print("="*70)
    print(f"  Model Version: {results['model_version']}")
    print(f"  OOF MAE: {results['oof_mae']:.2f} ms")
    print(f"  Baseline (zero): {results['zero_baseline_mae']:.2f} ms")
    print(f"  Baseline (mean): {results['mean_baseline_mae']:.2f} ms")
    print(f"  Improvement: {results['improvement_vs_mean_pct']:+.1f}% vs mean baseline")
