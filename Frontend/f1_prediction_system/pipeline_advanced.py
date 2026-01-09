#!/usr/bin/env python3
"""
Advanced per-event calibration pipeline with track-aware features, rolling evaluation,
auto-retrain trigger hints, and calibration curve plots.

Inputs (under data/raw):
  - track_features.csv: event_id, track_name, street_circuit(Yes/No), rain_prob(0..1),
                        upgrade(None/Minor/Major), downforce/power/tyre_wear/braking/overtaking (Low/Medium/High)
  - predictions_<event_id>.csv: columns: event_id, driver, raw_win_prob (0..1), optional actual_outcome (0/1)

Outputs:
  - data/processed/calibrated_<event_id>.csv with calibrated_prob column
  - data/evaluation/metrics.csv (appended)
  - data/evaluation/plots/calibration_<event_id>.png
  - data/archive/old_predictions/<raw files moved>
"""

from __future__ import annotations

import argparse
import os
import shutil
import time
from datetime import datetime
from pathlib import Path
from typing import List, Optional

import numpy as np
import pandas as pd
from sklearn.isotonic import IsotonicRegression
from sklearn.linear_model import LogisticRegression
from sklearn.calibration import calibration_curve
import matplotlib.pyplot as plt


BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
RAW_DIR = DATA_DIR / "raw"
PROC_DIR = DATA_DIR / "processed"
EVAL_DIR = DATA_DIR / "evaluation"
ARCH_DIR = DATA_DIR / "archive" / "old_predictions"

RAW_DIR.mkdir(parents=True, exist_ok=True)
PROC_DIR.mkdir(parents=True, exist_ok=True)
EVAL_DIR.mkdir(parents=True, exist_ok=True)
ARCH_DIR.mkdir(parents=True, exist_ok=True)

TRACK_FEATURES_FILE = RAW_DIR / "track_features.csv"

# Rolling evaluation thresholds
ROLLING_WINDOW = 5
BRIER_TRIGGER = 0.25
LOGLOSS_TRIGGER = 1.0


def _now() -> str:
    return datetime.utcnow().isoformat() + "Z"


def brier_score(y_true: np.ndarray, y_prob: np.ndarray) -> float:
    y_prob = np.asarray(y_prob, dtype=float)
    y_true = np.asarray(y_true, dtype=int)
    return float(np.mean((y_prob - y_true) ** 2))


def log_loss_safe(y_true: np.ndarray, y_prob: np.ndarray, eps: float = 1e-15) -> float:
    y_prob = np.clip(np.asarray(y_prob, dtype=float), eps, 1 - eps)
    y_true = np.asarray(y_true, dtype=int)
    return float(-np.mean(y_true * np.log(y_prob) + (1 - y_true) * np.log(1 - y_prob)))


def save_calibration_plot(y_true: np.ndarray, y_prob: np.ndarray, event_id: str) -> None:
    try:
        prob_true, prob_pred = calibration_curve(y_true, y_prob, n_bins=10, strategy="uniform")
        (EVAL_DIR / "plots").mkdir(parents=True, exist_ok=True)
        plt.figure(figsize=(5, 5))
        plt.plot(prob_pred, prob_true, marker="o", label="Calibrated")
        plt.plot([0, 1], [0, 1], "k--", label="Perfect")
        plt.xlabel("Predicted probability")
        plt.ylabel("True frequency")
        plt.title(f"Calibration - {event_id}")
        plt.legend()
        plt.tight_layout()
        plt.savefig(EVAL_DIR / "plots" / f"calibration_{event_id}.png")
        plt.close()
    except Exception:
        # plotting is best-effort
        pass


def encode_track_categories(tf: pd.DataFrame) -> pd.DataFrame:
    if tf.empty:
        return tf
    mapping = {"low": 0, "medium": 1, "med": 1, "high": 2}
    out = tf.copy()
    for col in ["downforce", "power", "tyre_wear", "braking", "overtaking"]:
        if col in out.columns:
            out[col] = out[col].astype(str).str.strip().str.lower().map(mapping).fillna(out[col])
            out[col] = pd.to_numeric(out[col], errors="ignore")
    return out


def load_track_features() -> pd.DataFrame:
    if not TRACK_FEATURES_FILE.exists():
        raise FileNotFoundError(f"Missing track features: {TRACK_FEATURES_FILE}")
    tf = pd.read_csv(TRACK_FEATURES_FILE)
    if "event_id" not in tf.columns:
        raise ValueError("track_features.csv must contain 'event_id'")
    tf = encode_track_categories(tf)
    return tf


def expand_features(preds: pd.DataFrame, tf: pd.DataFrame) -> pd.DataFrame:
    df = preds.merge(tf, on="event_id", how="left")
    # chaos factor from street circuit
    if "street_circuit" in df.columns:
        df["chaos_factor"] = df["street_circuit"].astype(str).str.lower().map({"yes": 1.0, "no": 0.3})
    else:
        df["chaos_factor"] = 0.5
    # weather risk numeric
    if "rain_prob" in df.columns:
        df["weather_risk"] = pd.to_numeric(df["rain_prob"], errors="coerce").fillna(0.2)
    else:
        df["weather_risk"] = 0.2
    # upgrade bonus
    if "upgrade" in df.columns:
        df["upgrade_bonus"] = df["upgrade"].astype(str).str.lower().map({"major": 0.10, "minor": 0.05}).fillna(0.0)
    else:
        df["upgrade_bonus"] = 0.0
    # pre-calibration adjusted prob (light-touch)
    prob_col = "raw_win_prob" if "raw_win_prob" in df.columns else df.filter(like="prob").columns[0]
    base = df[prob_col].astype(float).clip(0.0, 1.0)
    df["adjusted_prob"] = (base * (1.0 + df["upgrade_bonus"] + (df["chaos_factor"] - 0.5) * 0.2)).clip(0.0, 1.0)
    return df


def calibrate_event(df: pd.DataFrame, method: str = "isotonic") -> pd.DataFrame:
    if "actual_outcome" not in df.columns or df["actual_outcome"].isna().all():
        # no labels yet → pass-through
        df["calibrated_prob"] = df["adjusted_prob"].values
        return df
    X = df["adjusted_prob"].values.reshape(-1, 1)
    y = df["actual_outcome"].astype(int).values
    if method == "platt":
        model = LogisticRegression(solver="lbfgs", max_iter=200)
        model.fit(X, y)
        df["calibrated_prob"] = model.predict_proba(X)[:, 1]
    else:
        model = IsotonicRegression(out_of_bounds="clip")
        model.fit(df["adjusted_prob"].values, y)
        df["calibrated_prob"] = model.predict(df["adjusted_prob"].values)
    return df


def process_event_file(path: Path, tf: pd.DataFrame) -> Optional[Path]:
    event_id = path.name.replace("predictions_", "").replace(".csv", "")
    df = pd.read_csv(path)
    if "event_id" not in df.columns:
        df["event_id"] = event_id
    if "raw_win_prob" not in df.columns:
        # heuristic: find a numeric probability column
        num_cols = [c for c in df.columns if df[c].dtype != "O"]
        if not num_cols:
            print(f"  ✖ {path.name}: no numeric probability column found")
            return None
        df = df.rename(columns={num_cols[0]: "raw_win_prob"})

    df = expand_features(df, tf)
    df = calibrate_event(df, method="isotonic")

    # Evaluate if labels available
    if "actual_outcome" in df.columns and df["actual_outcome"].notna().any():
        y = df["actual_outcome"].astype(int).values
        p = df["calibrated_prob"].values
        brier = brier_score(y, p)
        logl = log_loss_safe(y, p)
        print(f"[{event_id}] Brier={brier:.3f} LogLoss={logl:.3f}")
        # append metrics
        row = pd.DataFrame([[event_id, brier, logl, _now()]], columns=["event_id", "brier", "logloss", "timestamp"])
        out_metrics = EVAL_DIR / "metrics.csv"
        if out_metrics.exists():
            row.to_csv(out_metrics, mode="a", header=False, index=False)
        else:
            row.to_csv(out_metrics, index=False)
        # save plot
        save_calibration_plot(y, p, event_id)

        # simple trigger
        if brier > BRIER_TRIGGER or logl > LOGLOSS_TRIGGER:
            print(f"  ⚠ metrics degraded for {event_id}; consider retraining core model")

    # Save processed
    out_path = PROC_DIR / f"calibrated_{event_id}.csv"
    df.to_csv(out_path, index=False)
    print(f"  📁 Saved {out_path}")

    # Archive raw
    try:
        shutil.move(str(path), ARCH_DIR / path.name)
    except Exception:
        pass

    return out_path


def run_once() -> None:
    tf = load_track_features()
    files: List[Path] = [p for p in RAW_DIR.glob("predictions_*.csv")]
    if not files:
        print("⚠️  No raw prediction files found (data/raw/predictions_*.csv)")
        return
    for f in sorted(files):
        try:
            process_event_file(f, tf)
        except Exception as e:
            print(f"  ✖ Failed {f.name}: {e}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Advanced per-event pipeline")
    parser.add_argument("--daemon", action="store_true")
    parser.add_argument("--interval-sec", type=int, default=3600)
    args = parser.parse_args()

    if not args.daemon:
        run_once()
        return 0

    print(f"🕒 Daemon mode every {args.interval_sec}s")
    try:
        while True:
            run_once()
            time.sleep(args.interval_sec)
    except KeyboardInterrupt:
        print("Stopped by user.")
        return 0


if __name__ == "__main__":
    raise SystemExit(main())


