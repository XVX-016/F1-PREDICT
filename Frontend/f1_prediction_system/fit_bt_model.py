#!/usr/bin/env python3
"""
Fit Bradley-Terry Model for F1 Driver Rankings
Implements Bradley-Terry model with regularization and cross-validation
"""

import pandas as pd
import numpy as np
import joblib
from pathlib import Path
import json
from sklearn.model_selection import train_test_split, cross_val_score, KFold
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, log_loss, roc_auc_score
from sklearn.preprocessing import StandardScaler
import matplotlib.pyplot as plt
import seaborn as sns

# File paths
PAIRWISE_FILE = "pairwise_comparisons.csv"
METADATA_FILE = "pairwise_dataset_metadata.json"
OUTPUT_DIR = "bradley_terry_models"
MODEL_FILE = f"{OUTPUT_DIR}/bt_model.joblib"
SCALER_FILE = f"{OUTPUT_DIR}/bt_scaler.joblib"
RESULTS_FILE = f"{OUTPUT_DIR}/bt_model_results.json"
DRIVER_RANKINGS_FILE = f"{OUTPUT_DIR}/driver_rankings.csv"

def load_pairwise_data():
    """Load pairwise comparison dataset"""
    print("Loading pairwise comparison data...")
    
    try:
        pairwise_df = pd.read_csv(PAIRWISE_FILE)
        print(f"  Loaded {len(pairwise_df)} pairwise comparisons")
        
        with open(METADATA_FILE, 'r') as f:
            metadata = json.load(f)
        print(f"  Dataset covers {metadata['dataset_info']['unique_races']} races")
        
        return pairwise_df, metadata
    except FileNotFoundError as e:
        print(f"  Error: {e}")
        return None, None

def prepare_features(pairwise_df, metadata):
    """Prepare features for Bradley-Terry model"""
    print("Preparing features for Bradley-Terry model...")
    
    # Create driver indicator variables
    drivers = metadata['driver_list']
    
    # Create feature matrix
    feature_data = []
    labels = []
    
    for _, row in pairwise_df.iterrows():
        # Create driver feature vector for winner vs loser
        driver_features = np.zeros(len(drivers))
        
        # Winner gets +1, loser gets -1
        winner_idx = drivers.index(row['winner'])
        loser_idx = drivers.index(row['loser'])
        
        driver_features[winner_idx] = 1
        driver_features[loser_idx] = -1
        
        # Add additional features if available
        additional_features = []
        
        # Margin features
        if 'margin' in row:
            additional_features.append(row['margin'])
        if 'margin_normalized' in row:
            additional_features.append(row['margin_normalized'])
        
        # Team features
        if 'same_team' in row:
            additional_features.append(1 if row['same_team'] else 0)
        
        # Position features
        if 'winner_position' in row and 'loser_position' in row:
            additional_features.append(row['winner_position'])
            additional_features.append(row['loser_position'])
        
        # Qualifying features
        if 'quali_margin' in row and pd.notna(row['quali_margin']):
            additional_features.append(row['quali_margin'])
        if 'grid_advantage' in row and pd.notna(row['grid_advantage']):
            additional_features.append(1 if row['grid_advantage'] else 0)
        
        # Driver statistics differences
        stat_cols = [col for col in pairwise_df.columns if col.endswith('_diff')]
        for col in stat_cols:
            if pd.notna(row[col]):
                additional_features.append(row[col])
            else:
                additional_features.append(0)
        
        # Combine driver features with additional features
        all_features = np.concatenate([driver_features, additional_features])
        
        # Add winner case (label 1)
        feature_data.append(all_features)
        labels.append(1)
        
        # Add loser case (label 0) - flip the driver features
        loser_features = all_features.copy()
        loser_features[winner_idx] = -1
        loser_features[loser_idx] = 1
        
        feature_data.append(loser_features)
        labels.append(0)
    
    # Convert to numpy arrays
    X = np.array(feature_data)
    y = np.array(labels)
    
    print(f"  Feature matrix shape: {X.shape}")
    print(f"  Driver features: {len(drivers)}")
    print(f"  Additional features: {X.shape[1] - len(drivers)}")
    print(f"  Total samples: {len(y)}")
    print(f"  Class distribution: {np.bincount(y)}")
    
    return X, y, drivers, additional_features

def fit_bradley_terry_model(X, y, drivers, additional_features):
    """Fit Bradley-Terry model with regularization"""
    print("Fitting Bradley-Terry model...")
    
    # Split data for validation
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # Scale features (excluding driver indicators)
    driver_feature_count = len(drivers)
    scaler = StandardScaler()
    
    if X.shape[1] > driver_feature_count:
        X_train_scaled = X_train.copy()
        X_test_scaled = X_test.copy()
        
        # Scale only additional features
        X_train_scaled[:, driver_feature_count:] = scaler.fit_transform(X_train[:, driver_feature_count:])
        X_test_scaled[:, driver_feature_count:] = scaler.transform(X_test[:, driver_feature_count:])
    else:
        X_train_scaled = X_train
        X_test_scaled = X_test
        scaler = None
    
    # Try different regularization strengths
    C_values = [0.01, 0.1, 1.0, 10.0, 100.0]
    best_score = 0
    best_model = None
    best_C = None
    
    print("  Testing regularization strengths...")
    for C in C_values:
        model = LogisticRegression(
            C=C, 
            penalty='l2', 
            solver='lbfgs', 
            max_iter=1000,
            random_state=42
        )
        
        # Cross-validation
        cv_scores = cross_val_score(model, X_train_scaled, y_train, cv=5, scoring='accuracy')
        mean_cv_score = cv_scores.mean()
        
        print(f"    C={C}: CV accuracy = {mean_cv_score:.4f} (+/- {cv_scores.std() * 2:.4f})")
        
        if mean_cv_score > best_score:
            best_score = mean_cv_score
            best_C = C
    
    # Fit best model
    print(f"  Best C value: {best_C}")
    best_model = LogisticRegression(
        C=best_C, 
        penalty='l2', 
        solver='lbfgs', 
        max_iter=1000,
        random_state=42
    )
    
    best_model.fit(X_train_scaled, y_train)
    
    # Evaluate on test set
    y_pred = best_model.predict(X_test_scaled)
    y_pred_proba = best_model.predict_proba(X_test_scaled)[:, 1]
    
    test_accuracy = accuracy_score(y_test, y_pred)
    test_logloss = log_loss(y_test, y_pred_proba)
    test_auc = roc_auc_score(y_test, y_pred_proba)
    
    print(f"  Test set performance:")
    print(f"    Accuracy: {test_accuracy:.4f}")
    print(f"    Log Loss: {test_logloss:.4f}")
    print(f"    AUC: {test_auc:.4f}")
    
    return best_model, scaler, {
        'best_C': best_C,
        'cv_accuracy': best_score,
        'test_accuracy': test_accuracy,
        'test_logloss': test_logloss,
        'test_auc': test_auc
    }

def extract_driver_strengths(model, drivers, additional_features):
    """Extract driver strength parameters from fitted model"""
    print("Extracting driver strength parameters...")
    
    # Get coefficients for driver features
    driver_coeffs = model.coef_[0][:len(drivers)]
    
    # Create driver rankings
    driver_rankings = []
    for i, driver in enumerate(drivers):
        driver_rankings.append({
            'driver': driver,
            'strength': driver_coeffs[i],
            'rank': 0  # Will be set below
        })
    
    # Sort by strength and assign ranks
    driver_rankings.sort(key=lambda x: x['strength'], reverse=True)
    for i, driver in enumerate(driver_rankings):
        driver['rank'] = i + 1
    
    # Convert to DataFrame
    rankings_df = pd.DataFrame(driver_rankings)
    
    print(f"  Top 5 drivers by strength:")
    for _, driver in rankings_df.head().iterrows():
        print(f"    {driver['rank']}. {driver['driver']}: {driver['strength']:.4f}")
    
    return rankings_df

def analyze_feature_importance(model, drivers, additional_features):
    """Analyze importance of additional features"""
    print("Analyzing feature importance...")
    
    if len(additional_features) == 0:
        print("  No additional features to analyze")
        return None
    
    # Get coefficients for additional features
    driver_feature_count = len(drivers)
    additional_coeffs = model.coef_[0][driver_feature_count:]
    
    # Create feature importance DataFrame
    feature_importance = []
    for i, feature in enumerate(additional_features):
        feature_importance.append({
            'feature': feature,
            'coefficient': additional_coeffs[i],
            'abs_coefficient': abs(additional_coeffs[i])
        })
    
    feature_importance_df = pd.DataFrame(feature_importance)
    feature_importance_df = feature_importance_df.sort_values('abs_coefficient', ascending=False)
    
    print(f"  Top 5 additional features by importance:")
    for _, feature in feature_importance_df.head().iterrows():
        print(f"    {feature['feature']}: {feature['coefficient']:.4f}")
    
    return feature_importance_df

def predict_pairwise_probabilities(model, scaler, driver1, driver2, drivers, additional_features, context_features=None):
    """Predict probability of driver1 beating driver2"""
    # Create feature vector
    driver_features = np.zeros(len(drivers))
    
    driver1_idx = drivers.index(driver1)
    driver2_idx = drivers.index(driver2)
    
    driver_features[driver1_idx] = 1
    driver_features[driver2_idx] = -1
    
    # Add context features if provided, otherwise use zeros for additional features
    if context_features is not None:
        all_features = np.concatenate([driver_features, context_features])
    else:
        # Create zero additional features to match training dimensions
        zero_features = np.zeros(len(additional_features))
        all_features = np.concatenate([driver_features, zero_features])
    
    # Scale features if scaler exists
    if scaler is not None and len(all_features) > len(drivers):
        all_features_scaled = all_features.copy()
        all_features_scaled[len(drivers):] = scaler.transform(all_features[len(drivers):].reshape(1, -1)).flatten()
    else:
        all_features_scaled = all_features
    
    # Predict probability
    prob = model.predict_proba(all_features_scaled.reshape(1, -1))[0, 1]
    
    return prob

def create_prediction_examples(model, scaler, drivers, additional_features):
    """Create example pairwise predictions"""
    print("Creating example pairwise predictions...")
    
    # Select some interesting driver pairs
    example_pairs = [
        ('Max Verstappen', 'Lewis Hamilton'),
        ('Charles Leclerc', 'Lando Norris'),
        ('George Russell', 'Oscar Piastri'),
        ('Fernando Alonso', 'Carlos Sainz')
    ]
    
    predictions = []
    for driver1, driver2 in example_pairs:
        if driver1 in drivers and driver2 in drivers:
            prob = predict_pairwise_probabilities(model, scaler, driver1, driver2, drivers, additional_features)
            predictions.append({
                'driver1': driver1,
                'driver2': driver2,
                'driver1_win_prob': prob,
                'driver2_win_prob': 1 - prob
            })
    
    predictions_df = pd.DataFrame(predictions)
    print("  Example pairwise predictions:")
    for _, pred in predictions_df.iterrows():
        print(f"    {pred['driver1']} vs {pred['driver2']}: {pred['driver1_win_prob']:.3f} vs {pred['driver2_win_prob']:.3f}")
    
    return predictions_df

def save_results(model, scaler, rankings_df, feature_importance_df, predictions_df, metrics, drivers, additional_features):
    """Save all model results"""
    print("Saving Bradley-Terry model results...")
    
    # Create output directory
    Path(OUTPUT_DIR).mkdir(exist_ok=True)
    
    # Save model and scaler
    joblib.dump(model, MODEL_FILE)
    if scaler is not None:
        joblib.dump(scaler, SCALER_FILE)
    
    # Save driver rankings
    rankings_df.to_csv(DRIVER_RANKINGS_FILE, index=False)
    
    # Save feature importance
    if feature_importance_df is not None:
        feature_importance_df.to_csv(f"{OUTPUT_DIR}/feature_importance.csv", index=False)
    
    # Save predictions
    if predictions_df is not None:
        predictions_df.to_csv(f"{OUTPUT_DIR}/example_predictions.csv", index=False)
    
    # Save comprehensive results
    results = {
        'model_info': {
            'model_type': 'Bradley-Terry Logistic Regression',
            'n_drivers': len(drivers),
            'n_additional_features': len(additional_features),
            'feature_names': additional_features
        },
        'training_metrics': metrics,
        'driver_count': len(drivers),
        'additional_feature_count': len(additional_features)
    }
    
    with open(RESULTS_FILE, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"  Model saved to: {MODEL_FILE}")
    print(f"  Driver rankings saved to: {DRIVER_RANKINGS_FILE}")
    print(f"  Results summary saved to: {RESULTS_FILE}")

def main():
    """Main pipeline for fitting Bradley-Terry model"""
    print("Fitting Bradley-Terry Model for F1 Driver Rankings")
    print("=" * 60)
    
    # Load data
    pairwise_df, metadata = load_pairwise_data()
    if pairwise_df is None:
        print("Failed to load pairwise data. Exiting.")
        return
    
    # Prepare features
    X, y, drivers, additional_features = prepare_features(pairwise_df, metadata)
    
    # Fit model
    model, scaler, metrics = fit_bradley_terry_model(X, y, drivers, additional_features)
    
    # Extract driver strengths
    rankings_df = extract_driver_strengths(model, drivers, additional_features)
    
    # Analyze feature importance
    feature_importance_df = analyze_feature_importance(model, drivers, additional_features)
    
    # Create example predictions
    predictions_df = create_prediction_examples(model, scaler, drivers, additional_features)
    
    # Save results
    save_results(model, scaler, rankings_df, feature_importance_df, predictions_df, metrics, drivers, additional_features)
    
    print("\nBradley-Terry model fitting completed!")
    print(f"Model performance: {metrics['test_accuracy']:.4f} accuracy, {metrics['test_auc']:.4f} AUC")
    print(f"Driver rankings saved to: {DRIVER_RANKINGS_FILE}")

if __name__ == "__main__":
    main()
