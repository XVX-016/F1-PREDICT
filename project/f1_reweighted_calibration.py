#!/usr/bin/env python3
"""
Reweighted calibration and driver win probability plotting for F1.

- Applies time-decay weighting (2025 emphasized)
- Trains a multinomial model across all drivers
- Produces a 5x4 calibration grid (all drivers)
- Exports per-race win probabilities to CSV

Input CSV expectation (flexible, columns auto-detected when possible):
  required: race_id, season, driver, win (0/1) OR winner column
  optional: team, grid, avg_lap_time, quali_pos, finish_pos, dnf, pit_time

If `win` is missing but `winner` exists, it will be derived.
"""

import os
import sys
import math
import warnings
from typing import List, Tuple

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import make_pipeline
from sklearn.compose import ColumnTransformer
from sklearn.calibration import calibration_curve

warnings.filterwarnings("ignore")


def time_weight(season_value: int, current: int = 2025, decay: float = 0.8) -> float:
    try:
        return float(decay) ** max(0, int(current) - int(season_value))
    except Exception:
        return 1.0


def load_dataset(csv_path: str) -> pd.DataFrame:
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Could not find dataset at {csv_path}")

    df = pd.read_csv(csv_path)

    # Standardize required columns
    # Try to detect race identifier
    if "race_id" not in df.columns:
        # Fallbacks commonly used
        for alt in ["race", "round", "event_id"]:
            if alt in df.columns:
                df = df.rename(columns={alt: "race_id"})
                break
    if "race_id" not in df.columns:
        # create a synthetic race id if missing
        df["race_id"] = np.arange(len(df))

    # Season detection
    if "season" not in df.columns:
        for alt in ["year"]:
            if alt in df.columns:
                df = df.rename(columns={alt: "season"})
                break
    if "season" not in df.columns:
        raise ValueError("Dataset must include a 'season' column or a convertible alternative (e.g., 'year').")

    # Driver detection
    if "driver" not in df.columns:
        for alt in ["driver_name", "Driver", "driverId", "driver_id"]:
            if alt in df.columns:
                df = df.rename(columns={alt: "driver"})
                break
    if "driver" not in df.columns:
        raise ValueError("Dataset must include a 'driver' column (name/id).")

    # Win label detection
    if "win" not in df.columns:
        if "winner" in df.columns:
            # derive win as driver == winner within each race
            df["win"] = (df["driver"].astype(str) == df["winner"].astype(str)).astype(int)
        else:
            # try finish position
            for alt in ["finish", "position", "finish_pos", "result_pos"]:
                if alt in df.columns:
                    df["win"] = (df[alt] == 1).astype(int)
                    break
    if "win" not in df.columns:
        raise ValueError("Dataset must include 'win' (0/1) or columns to derive it (e.g., 'winner' or finish position).")

    # Optional standardizations
    rename_map = {
        "constructor": "team",
        "constructor_name": "team",
        "team_name": "team",
        "grid_position": "grid",
        "quali": "quali_pos",
        "qualifying": "quali_pos",
        "qualifying_position": "quali_pos",
        "average_lap": "avg_lap_time",
        "avgLapTime": "avg_lap_time",
        "pit": "pit_time",
    }
    for old, new in rename_map.items():
        if old in df.columns and new not in df.columns:
            df = df.rename(columns={old: new})

    # Ensure basic types
    df["season"] = pd.to_numeric(df["season"], errors="coerce").astype("Int64")
    df["win"] = pd.to_numeric(df["win"], errors="coerce").fillna(0).astype(int)

    return df


def build_features(df: pd.DataFrame) -> Tuple[pd.DataFrame, List[str]]:
    feature_columns: List[str] = []

    # Numeric candidates
    for col in ["grid", "avg_lap_time", "quali_pos", "finish_pos", "dnf", "pit_time"]:
        if col in df.columns:
            feature_columns.append(col)

    # Categorical candidates
    if "team" in df.columns:
        feature_columns.append("team")

    # Fallback: at least include grid if nothing else
    if not feature_columns:
        if "grid" in df.columns:
            feature_columns = ["grid"]
        else:
            # create a placeholder numeric feature to allow model to fit
            df["bias"] = 0.0
            feature_columns = ["bias"]

    X = df[feature_columns].copy()
    return X, feature_columns


def train_multinomial(X: pd.DataFrame, y: pd.Series, w: pd.Series, feature_columns: List[str]):
    categorical_features = [c for c in feature_columns if c in X.columns and X[c].dtype == "object"]
    preprocessor = ColumnTransformer([
        ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_features),
    ], remainder="passthrough")

    model = make_pipeline(
        preprocessor,
        LogisticRegression(multi_class="multinomial", max_iter=1000)
    )
    model.fit(X, y, sample_weight=w)
    return model


def plot_driver_calibration(df: pd.DataFrame, model, X: pd.DataFrame, out_path: str = "plots_calibration.png") -> None:
    drivers = sorted(df["driver"].unique())
    rows, cols = 5, 4
    fig, axes = plt.subplots(rows, cols, figsize=(20, 20))
    axes = axes.flatten()

    # For mapping class index
    classes = list(model.named_steps[list(model.named_steps.keys())[-1]].classes_) if hasattr(model, "named_steps") else list(model.classes_)

    y_proba = model.predict_proba(X)

    for idx, driver in enumerate(drivers):
        ax = axes[idx]

        # True labels for this driver: did they win this row's race?
        y_true = (df["win"] & (df["driver"] == driver)).astype(int).values

        if driver in classes:
            driver_idx = classes.index(driver)
            y_prob = y_proba[:, driver_idx]
        else:
            y_prob = np.zeros_like(y_true, dtype=float)

        # Avoid degenerate curves when all y_true are zeros
        if np.sum(y_true) == 0:
            # still plot diagonal and predicted bins to visualize distribution
            prob_true, prob_pred = np.array([0.0, 1.0]), np.array([0.0, 1.0])
            ax.plot([0, 1], [0, 1], "k--", alpha=0.7)
        else:
            prob_true, prob_pred = calibration_curve(y_true, y_prob, n_bins=5, strategy="uniform")
            ax.plot(prob_pred, prob_true, marker="o", label="Post (weighted)")
            ax.plot([0, 1], [0, 1], "k--", alpha=0.7)

        ax.set_xlim(0, 1)
        ax.set_ylim(0, 1)
        ax.set_title(driver)
        ax.set_xlabel("Predicted Probability")
        ax.set_ylabel("Observed Frequency")
        ax.legend(loc="lower right", fontsize=8)

    # Hide extra axes
    total_axes = len(axes)
    last_idx = len(drivers)
    for j in range(last_idx, total_axes):
        fig.delaxes(axes[j])

    fig.suptitle("Driver Win Probability Calibration (Weighted for 2025)", fontsize=18)
    plt.tight_layout()
    plt.savefig(out_path, dpi=200, bbox_inches="tight")
    try:
        plt.show()
    except Exception:
        pass


def main():
    # CLI: python f1_reweighted_calibration.py [path_to_csv]
    csv_path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), "race_data.csv")

    df = load_dataset(csv_path)

    # weights
    df["weight"] = df["season"].apply(lambda s: time_weight(s, current=2025, decay=0.8)).astype(float)

    # Prepare labels per driver for multinomial (winner's driver label)
    # We need one row per race outcome. If dataset is per-driver per-race, we keep as-is and predict P(driver|features)
    # y = driver (class label)
    y = df["driver"].astype(str)

    # Build features
    X, feature_columns = build_features(df)

    # Train model
    model = train_multinomial(X, y, df["weight"], feature_columns)

    # Plot calibration
    plot_driver_calibration(df, model, X, out_path=os.path.join(os.path.dirname(__file__), "plots_calibration.png"))

    # Export per-row probabilities
    proba = model.predict_proba(X)
    classes = list(model.named_steps[list(model.named_steps.keys())[-1]].classes_) if hasattr(model, "named_steps") else list(model.classes_)
    proba_df = pd.DataFrame(proba, columns=[f"prob_{c}" for c in classes])
    export_df = pd.concat([df[["race_id", "season", "driver", "win"]].reset_index(drop=True), proba_df], axis=1)
    out_csv = os.path.join(os.path.dirname(__file__), "driver_win_probs.csv")
    export_df.to_csv(out_csv, index=False)
    print(f"Saved per-row probabilities to {out_csv}")


if __name__ == "__main__":
    main()



