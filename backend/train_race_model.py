# backend/train_race_model.py
import pandas as pd
import numpy as np
import xgboost as xgb
import json
import os
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import log_loss, brier_score_loss, classification_report
from datetime import datetime

# === Config ===
INPUT_CSV = "../project/f1_prediction_system/historical_results.csv"
MODEL_OUT = "models/race_model.json"
ENCODERS_OUT = "models/encoders.json"
FEATURE_IMPORTANCE_OUT = "models/feature_importance.csv"

# Create models directory if it doesn't exist
os.makedirs("models", exist_ok=True)

# === Circuit Type Mapping ===
CIRCUIT_TYPES = {
    "Monaco Grand Prix": "street",
    "Singapore Grand Prix": "street", 
    "Azerbaijan Grand Prix": "street",
    "Miami Grand Prix": "street",
    "Las Vegas Grand Prix": "street",
    "Australian Grand Prix": "street",
    "Saudi Arabian Grand Prix": "street",
    "Monza Grand Prix": "permanent",
    "Silverstone Grand Prix": "permanent",
    "Belgian Grand Prix": "permanent",
    "Japanese Grand Prix": "permanent",
    "Brazilian Grand Prix": "permanent",
    "Abu Dhabi Grand Prix": "permanent",
    "Austrian Grand Prix": "permanent",
    "Hungarian Grand Prix": "permanent",
    "Spanish Grand Prix": "permanent",
    "Emilia Romagna Grand Prix": "permanent",
    "Canadian Grand Prix": "permanent",
    "United States Grand Prix": "permanent",
    "Mexico City Grand Prix": "permanent",
    "São Paulo Grand Prix": "permanent",
    "Qatar Grand Prix": "permanent",
    "Chinese Grand Prix": "permanent",
    "Dutch Grand Prix": "permanent"
}

def create_sample_data():
    """Create sample historical data if CSV doesn't exist"""
    print("📊 Creating sample historical data...")
    
    # 2024 season data (sample)
    races_2024 = [
        ("Australian Grand Prix", "2024-03-24"),
        ("Japanese Grand Prix", "2024-04-07"),
        ("Chinese Grand Prix", "2024-04-21"),
        ("Miami Grand Prix", "2024-05-05"),
        ("Emilia Romagna Grand Prix", "2024-05-19"),
        ("Monaco Grand Prix", "2024-05-26"),
        ("Canadian Grand Prix", "2024-06-09"),
        ("Spanish Grand Prix", "2024-06-23"),
        ("Austrian Grand Prix", "2024-06-30"),
        ("British Grand Prix", "2024-07-07"),
        ("Hungarian Grand Prix", "2024-07-21"),
        ("Belgian Grand Prix", "2024-07-28"),
        ("Dutch Grand Prix", "2024-08-25"),
        ("Italian Grand Prix", "2024-09-01"),
        ("Singapore Grand Prix", "2024-09-15"),
        ("Japanese Grand Prix", "2024-09-22"),
        ("Qatar Grand Prix", "2024-10-06"),
        ("United States Grand Prix", "2024-10-20"),
        ("Mexico City Grand Prix", "2024-10-27"),
        ("São Paulo Grand Prix", "2024-11-03"),
        ("Las Vegas Grand Prix", "2024-11-23"),
        ("Abu Dhabi Grand Prix", "2024-12-01")
    ]
    
    # Current F1 drivers and teams
    drivers_teams = [
        ("Max Verstappen", "Red Bull Racing"),
        ("Lando Norris", "McLaren"),
        ("Oscar Piastri", "McLaren"),
        ("George Russell", "Mercedes"),
        ("Lewis Hamilton", "Mercedes"),
        ("Charles Leclerc", "Ferrari"),
        ("Carlos Sainz", "Ferrari"),
        ("Fernando Alonso", "Aston Martin"),
        ("Lance Stroll", "Aston Martin"),
        ("Pierre Gasly", "Alpine"),
        ("Esteban Ocon", "Alpine"),
        ("Nico Hulkenberg", "Haas"),
        ("Kevin Magnussen", "Haas"),
        ("Yuki Tsunoda", "RB"),
        ("Daniel Ricciardo", "RB"),
        ("Alexander Albon", "Williams"),
        ("Logan Sargeant", "Williams"),
        ("Valtteri Bottas", "Kick Sauber"),
        ("Zhou Guanyu", "Kick Sauber")
    ]
    
    data = []
    for race_name, race_date in races_2024:
        # Shuffle drivers for variety
        np.random.shuffle(drivers_teams)
        
        for position, (driver, team) in enumerate(drivers_teams, 1):
            data.append({
                "race": race_name,
                "date": race_date,
                "driver": driver,
                "team": team,
                "position": position,
                "points": max(0, 26 - position) if position <= 10 else 0
            })
    
    df = pd.DataFrame(data)
    
    # Save sample data
    os.makedirs(os.path.dirname(INPUT_CSV), exist_ok=True)
    df.to_csv(INPUT_CSV, index=False)
    print(f"✅ Sample data saved to {INPUT_CSV}")
    return df

def load_and_prepare_data():
    """Load and prepare data for training"""
    print("📈 Loading and preparing data...")
    
    # Load data or create sample
    if os.path.exists(INPUT_CSV):
        df = pd.read_csv(INPUT_CSV)
        print(f"📊 Loaded {len(df)} records from {INPUT_CSV}")
    else:
        df = create_sample_data()
    
    # Expected columns: race, date, driver, team, position
    required_cols = ["race", "date", "driver", "team", "position"]
    missing_cols = [col for col in required_cols if col not in df.columns]
    if missing_cols:
        raise ValueError(f"Missing required columns: {missing_cols}")
    
    # Add circuit type
    df["circuit_type"] = df["race"].map(CIRCUIT_TYPES).fillna("permanent")
    
    # Add season and round number
    df["date"] = pd.to_datetime(df["date"])
    df["year"] = df["date"].dt.year
    df["round"] = df.groupby("year")["date"].rank(method="dense").astype(int)
    
    # Add driver performance features
    df["driver_wins"] = df.groupby("driver")["position"].transform(lambda x: (x == 1).sum())
    df["driver_podiums"] = df.groupby("driver")["position"].transform(lambda x: (x <= 3).sum())
    df["driver_avg_position"] = df.groupby("driver")["position"].transform("mean")
    
    # Add team performance features
    df["team_wins"] = df.groupby("team")["position"].transform(lambda x: (x == 1).sum())
    df["team_podiums"] = df.groupby("team")["position"].transform(lambda x: (x <= 3).sum())
    df["team_avg_position"] = df.groupby("team")["position"].transform("mean")
    
    # Add circuit performance features
    df["driver_circuit_wins"] = df.groupby(["driver", "race"])["position"].transform(lambda x: (x == 1).sum())
    df["team_circuit_wins"] = df.groupby(["team", "race"])["position"].transform(lambda x: (x == 1).sum())
    
    # Target: win = 1 if position == 1 else 0
    df["win"] = (df["position"] == 1).astype(int)
    
    print(f"✅ Data prepared: {len(df)} records, {df['win'].sum()} wins")
    return df

def encode_features(df):
    """Encode categorical features"""
    print("🔧 Encoding categorical features...")
    
    encoders = {}
    categorical_cols = ["driver", "team", "race", "circuit_type"]
    
    for col in categorical_cols:
        le = LabelEncoder()
        df[f"{col}_encoded"] = le.fit_transform(df[col])
        # Convert numpy types to Python types for JSON serialization
        encoders[col] = dict(zip(le.classes_.tolist(), le.transform(le.classes_).tolist()))
    
    # Save encoders
    with open(ENCODERS_OUT, "w") as f:
        json.dump(encoders, f, indent=2)
    
    print(f"✅ Encoders saved to {ENCODERS_OUT}")
    return df, encoders

def train_model(X, y):
    """Train XGBoost model"""
    print("🤖 Training XGBoost model...")
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # Train model
    model = xgb.XGBClassifier(
        objective="binary:logistic",
        eval_metric="logloss",
        use_label_encoder=False,
        n_estimators=300,
        learning_rate=0.05,
        max_depth=6,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        early_stopping_rounds=50
    )
    
    # Fit with early stopping
    eval_set = [(X_test, y_test)]
    model.fit(X_train, y_train, eval_set=eval_set, verbose=False)
    
    # Evaluate
    y_pred_proba = model.predict_proba(X_test)[:, 1]
    y_pred = model.predict(X_test)
    
    print("📊 Model Performance:")
    print(f"Log Loss: {log_loss(y_test, y_pred_proba):.4f}")
    print(f"Brier Score: {brier_score_loss(y_test, y_pred_proba):.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    
    return model, X_test, y_test

def save_model_and_analysis(model, X_test, y_test):
    """Save model and feature importance analysis"""
    print("💾 Saving model and analysis...")
    
    # Save model
    model.save_model(MODEL_OUT)
    print(f"✅ Model saved to {MODEL_OUT}")
    
    # Feature importance
    importance_df = pd.DataFrame({
        'feature': model.feature_names_in_,
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    importance_df.to_csv(FEATURE_IMPORTANCE_OUT, index=False)
    print(f"✅ Feature importance saved to {FEATURE_IMPORTANCE_OUT}")
    
    # Print top features
    print("\n🔝 Top 10 Most Important Features:")
    for _, row in importance_df.head(10).iterrows():
        print(f"  {row['feature']}: {row['importance']:.4f}")

def main():
    """Main training pipeline"""
    print("🚀 Starting Race-Aware Model Training")
    print("=" * 50)
    
    try:
        # Load and prepare data
        df = load_and_prepare_data()
        
        # Encode features
        df, encoders = encode_features(df)
        
        # Prepare feature matrix
        feature_cols = [
            "driver_encoded", "team_encoded", "race_encoded", "circuit_type_encoded",
            "round", "driver_wins", "driver_podiums", "driver_avg_position",
            "team_wins", "team_podiums", "team_avg_position",
            "driver_circuit_wins", "team_circuit_wins"
        ]
        
        X = df[feature_cols]
        y = df["win"]
        
        print(f"📊 Feature matrix shape: {X.shape}")
        print(f"🎯 Target distribution: {y.value_counts().to_dict()}")
        
        # Train model
        model, X_test, y_test = train_model(X, y)
        
        # Save results
        save_model_and_analysis(model, X_test, y_test)
        
        print("\n🎉 Training completed successfully!")
        print(f"📁 Model files saved in: {os.path.dirname(MODEL_OUT)}")
        
    except Exception as e:
        print(f"❌ Training failed: {e}")
        raise

if __name__ == "__main__":
    main()
