from typing import List, Dict
import numpy as np
import optuna

# === 2025 TEAMS AND DRIVERS ===
TEAMS = [
    "Red Bull Racing",
    "McLaren",
    "Ferrari",
    "Mercedes",
    "Aston Martin",
    "Alpine",
    "Williams",
    "Visa Cash App RB",
    "Stake F1 Team Kick Sauber",
    "Haas F1 Team"
]

DRIVERS = [
    "Max Verstappen", "Yuki Tsunoda",
    "Lando Norris", "Oscar Piastri",
    "Charles Leclerc", "Lewis Hamilton",
    "George Russell", "Andrea Kimi Antonelli",
    "Fernando Alonso", "Lance Stroll",
    "Pierre Gasly", "Franco Colapinto",
    "Alexander Albon", "Carlos Sainz",
    "Liam Lawson", "Isack Hadjar",
    "Nico Hulkenberg", "Gabriel Bortoleto",
    "Esteban Ocon", "Oliver Bearman"
]

# === 2025 CALENDAR (24 TRACKS) ===
TRACKS_2025 = [
    "Australian GP", "Chinese GP", "Japanese GP", "Bahrain GP",
    "Saudi Arabian GP", "Miami GP", "Emilia Romagna GP", "Monaco GP",
    "Canadian GP", "Spanish GP", "Austrian GP", "British GP",
    "Hungarian GP", "Belgian GP", "Dutch GP", "Italian GP",
    "Azerbaijan GP", "Singapore GP", "United States GP (Austin)",
    "Mexico GP", "Brazilian GP", "Las Vegas GP", "Qatar GP", "Abu Dhabi GP"
]


# === SAMPLE HISTORICAL DATA GENERATOR ===
def create_sample_historical_data() -> List[Dict]:
    """
    Create sample historical race data for tuning (2025 season, 24 tracks).
    Replace this with your actual race results/predictions.
    """
    sample_races = []
    
    for track in TRACKS_2025:
        sample_races.append({
            "race": f"{track} 2025",
            "actual_winner": np.random.choice(DRIVERS),  # placeholder
            "predictions": [
                {
                    "driver": driver,
                    "team": np.random.choice(TEAMS),
                    "win_probability": np.random.dirichlet(np.ones(len(DRIVERS)))[i]
                }
                for i, driver in enumerate(DRIVERS)
            ]
        })
    
    return sample_races


# === LOG LOSS CALCULATION ===
def calculate_log_loss(predictions: List[Dict], actual_winner: str) -> float:
    """Calculate log loss for a single race prediction."""
    winner_prob = 0.0
    for pred in predictions:
        if pred["driver"] == actual_winner:
            winner_prob = pred["win_probability"]
            break
    epsilon = 1e-9
    return -np.log(winner_prob + epsilon)


# === OBJECTIVE FUNCTION ===
def objective(trial):
    """Optuna objective function to minimize log loss across historical races."""
    team_factors = {team: trial.suggest_float(f"team_{team}", 0.85, 1.15) for team in TEAMS}
    driver_factors = {driver: trial.suggest_float(f"driver_{driver}", 0.85, 1.15) for driver in DRIVERS}

    historical_data = create_sample_historical_data()
    total_log_loss = 0.0

    for race_data in historical_data:
        calibrated_predictions = calibration_pipeline(
            race_data["predictions"],
            team_factors=team_factors,
            driver_factors=driver_factors
        )
        total_log_loss += calculate_log_loss(calibrated_predictions, race_data["actual_winner"])

    return total_log_loss / len(historical_data)


# === TUNING ===
def tune_calibration(n_trials: int = 200, config_path: str = "calibration_config.json"):
    print(f"Starting calibration tuning with {n_trials} trials...")

    study = optuna.create_study(
        direction="minimize",
        sampler=optuna.samplers.TPESampler(seed=42)
    )
    study.optimize(objective, n_trials=n_trials)

    print(f"✅ Optimization completed!")
    print(f"Best log loss: {study.best_value:.4f}")
    print(f"Best trial: {study.best_trial.number}")

    best_params = study.best_params
    calibration_config = extract_calibration_params(best_params)
    save_calibration_config(calibration_config, config_path)

    print("\n=== Best Team Factors ===")
    for team, factor in calibration_config["team_factors"].items():
        print(f"{team}: {factor:.3f}")

    print("\n=== Best Driver Factors ===")
    for driver, factor in calibration_config["driver_factors"].items():
        print(f"{driver}: {factor:.3f}")

    return study, calibration_config


# === TESTING ===
def test_calibration(config_path: str = "calibration_config.json"):
    print("\n=== Testing Calibrated Predictions ===")
    sample_predictions = [
        {"driver": "Max Verstappen", "team": "Red Bull Racing", "win_probability": 0.35},
        {"driver": "Lando Norris", "team": "McLaren", "win_probability": 0.25},
        {"driver": "Charles Leclerc", "team": "Ferrari", "win_probability": 0.20},
        {"driver": "Oscar Piastri", "team": "McLaren", "win_probability": 0.15},
        {"driver": "Lewis Hamilton", "team": "Ferrari", "win_probability": 0.05}
    ]
    print("Original predictions:")
    for pred in sample_predictions:
        print(f"  {pred['driver']}: {pred['win_probability']:.3f}")

    calibrated = calibration_pipeline(sample_predictions, config_path=config_path)
    print("\nCalibrated predictions:")
    for pred in calibrated:
        print(f"  {pred['driver']}: {pred['win_probability']:.3f}")


if __name__ == "__main__":
    study, config = tune_calibration(n_trials=100)
    test_calibration()
    print(f"\n✅ Calibration tuning complete! Config saved to calibration_config.json")
