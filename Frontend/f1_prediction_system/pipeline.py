#!/usr/bin/env python3
"""
Per-event prediction pipeline

Features:
- Loads raw per-event predictions from data/raw (predictions_<event_id>.csv)
- Merges simple track-specific features from data/raw/track_features.csv
- Calibrates each event separately (Platt or Isotonic)
- Evaluates calibration (Brier score, Log loss) when labels are available
- Saves clean per-event CSVs to data/processed (calibrated_<event_id>.csv)
- Archives consumed raw files into data/archive/old_predictions
- Stores calibrators per-event in calibrators/calibrator_<event_id>.joblib
- Stores rolling metrics in data/evaluation/metrics.csv

Usage examples:
  python pipeline.py --once
  python pipeline.py --daemon --interval-sec 21600

Expected raw schema (predictions_<event_id>.csv):
  - event_id: string (e.g., 2025-09-07_monza)
  - driver: string
  - raw_win_prob OR win_probability_raw: float in [0,1]
  - actual_outcome (optional): 1 if winner, else 0 (for calibration evaluation)

Track features schema (track_features.csv):
  - event_id
  - one or more of: downforce, power, tyre_wear, braking, overtaking (categorical: Low/Medium/High)
  - any numeric columns are passed through
"""

from __future__ import annotations

import argparse
import glob
import json
import os
import shutil
import sys
import time
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
from sklearn.isotonic import IsotonicRegression
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import brier_score_loss, log_loss


# ------------------------------
# Configuration
# ------------------------------
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
RAW_DIR = DATA_DIR / "raw"
PROC_DIR = DATA_DIR / "processed"
ARCH_DIR = DATA_DIR / "archive" / "old_predictions"
EVAL_DIR = DATA_DIR / "evaluation"
CALIB_DIR = BASE_DIR / "calibrators"

RAW_DIR.mkdir(parents=True, exist_ok=True)
PROC_DIR.mkdir(parents=True, exist_ok=True)
ARCH_DIR.mkdir(parents=True, exist_ok=True)
EVAL_DIR.mkdir(parents=True, exist_ok=True)
CALIB_DIR.mkdir(parents=True, exist_ok=True)


# ------------------------------
# Utilities
# ------------------------------
def _now_iso() -> str:
    return datetime.utcnow().isoformat() + "Z"


def find_prob_column(df: pd.DataFrame) -> Optional[str]:
    candidates = [
        "raw_win_prob",
        "win_probability_raw",
        "raw_prob",
        "win_prob",
    ]
    for c in candidates:
        if c in df.columns:
            return c
    # Heuristic fallback
    for c in df.columns:
        name = c.lower()
        if ("win" in name or "prob" in name) and df[c].dtype != "O":
            return c
    return None


def encode_track_categories(track_df: pd.DataFrame) -> pd.DataFrame:
    if track_df.empty:
        return track_df
    df = track_df.copy()
    # Simple ordinal mapping for common categorical attributes
    mapping = {"low": 0, "medium": 1, "med": 1, "high": 2}
    for col in ["downforce", "power", "tyre_wear", "braking", "overtaking"]:
        if col in df.columns:
            df[col] = (
                df[col]
                .astype(str)
                .str.strip()
                .str.lower()
                .map(mapping)
                .fillna(df[col])
            )
            # try to coerce to numeric if mapping applied
            df[col] = pd.to_numeric(df[col], errors="ignore")
    return df


def load_track_features() -> pd.DataFrame:
    tf_path = RAW_DIR / "track_features.csv"
    if not tf_path.exists():
        return pd.DataFrame()
    tf = pd.read_csv(tf_path)
    if "event_id" not in tf.columns:
        raise ValueError("track_features.csv must include an 'event_id' column")
    tf = encode_track_categories(tf)
    return tf


def get_event_id_from_filename(path: Path) -> str:
    name = path.name
    if name.startswith("predictions_") and name.endswith(".csv"):
        return name[len("predictions_") : -len(".csv")]
    return name.replace(".csv", "")


def get_calibrator_path(event_id: str) -> Path:
    safe = event_id.replace("/", "_").replace(" ", "_")
    return CALIB_DIR / f"calibrator_{safe}.joblib"


# ------------------------------
# Calibration models
# ------------------------------
class PlattCalibrator:
    def __init__(self) -> None:
        self.model = LogisticRegression(solver="lbfgs", max_iter=200)

    def fit(self, probs: np.ndarray, y: np.ndarray) -> "PlattCalibrator":
        X = probs.reshape(-1, 1)
        self.model.fit(X, y)
        return self

    def predict(self, probs: np.ndarray) -> np.ndarray:
        X = probs.reshape(-1, 1)
        return self.model.predict_proba(X)[:, 1]


class IsotonicCalibrator:
    def __init__(self) -> None:
        self.model = IsotonicRegression(out_of_bounds="clip")

    def fit(self, probs: np.ndarray, y: np.ndarray) -> "IsotonicCalibrator":
        self.model.fit(probs, y)
        return self

    def predict(self, probs: np.ndarray) -> np.ndarray:
        return self.model.predict(probs)


def fit_best_calibrator(raw_probs: np.ndarray, y: np.ndarray, prefer: str = "platt"):
    if raw_probs.size == 0 or y.size == 0:
        return None
    # train both and pick by Brier
    cands: List[Tuple[str, object]] = []
    try:
        c_platt = PlattCalibrator().fit(raw_probs, y)
        cands.append(("platt", c_platt))
    except Exception:
        pass
    try:
        c_iso = IsotonicCalibrator().fit(raw_probs, y)
        cands.append(("isotonic", c_iso))
    except Exception:
        pass
    if not cands:
        return None
    best = None
    best_brier = float("inf")
    for name, c in cands:
        preds = c.predict(raw_probs)
        brier = brier_score_loss(y, preds)
        if brier < best_brier or (brier == best_brier and name == prefer):
            best_brier = brier
            best = (name, c)
    return best


# ------------------------------
# Core processing
# ------------------------------
@dataclass
class PipelineArgs:
    method: str = "platt"  # default preference when tie
    retrain_threshold: float = 0.10  # relative increase vs recent mean brier
    retrain_window: int = 50
    interval_sec: int = 6 * 60 * 60
    once: bool = True


def collect_event_files() -> List[Path]:
    return [Path(p) for p in glob.glob(str(RAW_DIR / "predictions_*.csv"))]


def evaluate_metrics(y_true: np.ndarray, p: np.ndarray) -> Dict[str, float]:
    return {
        "brier": float(brier_score_loss(y_true, p)),
        "logloss": float(log_loss(y_true, p, eps=1e-15)),
    }


def append_metrics(event_id: str, metrics: Dict[str, float], extra: Optional[Dict] = None) -> None:
    out = EVAL_DIR / "metrics.csv"
    row = {
        "timestamp": _now_iso(),
        "event_id": event_id,
        **metrics,
        "extra": json.dumps(extra or {}),
    }
    df = pd.DataFrame([row])
    if out.exists():
        df.to_csv(out, mode="a", header=False, index=False)
    else:
        df.to_csv(out, index=False)


def recent_mean_brier(window: int) -> Optional[float]:
    path = EVAL_DIR / "metrics.csv"
    if not path.exists():
        return None
    df = pd.read_csv(path)
    if "brier" not in df.columns or df.empty:
        return None
    return float(df.tail(window)["brier"].mean())


def process_event_file(event_file: Path, args: PipelineArgs, track_df: pd.DataFrame) -> Optional[Path]:
    event_id = get_event_id_from_filename(event_file)
    print(f"\n🔄 Processing event: {event_id}")

    df = pd.read_csv(event_file)
    if "event_id" not in df.columns:
        df["event_id"] = event_id

    prob_col = find_prob_column(df)
    if prob_col is None:
        print(f"  ✖ No probability column found in {event_file.name}")
        return None

    # Merge track features (left join on event_id)
    if not track_df.empty:
        df = df.merge(track_df, on="event_id", how="left")

    # Prepare labels if available
    has_labels = "actual_outcome" in df.columns and df["actual_outcome"].notna().any()
    raw_probs = df[prob_col].astype(float).clip(0.0, 1.0).values

    calibrator = None
    calib_name = None
    if has_labels:
        y = df["actual_outcome"].astype(int).values
        best = fit_best_calibrator(raw_probs, y, prefer=args.method)
        if best is not None:
            calib_name, calibrator = best
            preds = calibrator.predict(raw_probs)
            metrics = evaluate_metrics(y, preds)
            append_metrics(event_id, metrics, {"calibrator": calib_name})
            recent = recent_mean_brier(args.retrain_window)
            if recent is not None:
                rel_increase = (metrics["brier"] - recent) / (recent + 1e-12)
                if rel_increase > args.retrain_threshold:
                    # Refit with alternate method if available
                    alt = "isotonic" if calib_name == "platt" else "platt"
                    try:
                        alt_best = fit_best_calibrator(raw_probs, y, prefer=alt)
                        if alt_best is not None:
                            calib_name, calibrator = alt_best
                            preds = calibrator.predict(raw_probs)
                            metrics = evaluate_metrics(y, preds)
                            append_metrics(event_id, metrics, {"calibrator": calib_name, "note": "retrained_alt"})
                    except Exception:
                        pass
        else:
            # fallback pass-through
            preds = raw_probs
            append_metrics(event_id, evaluate_metrics(y, preds), {"calibrator": "passthrough"})
    else:
        # No labels → try to load existing per-event calibrator, else pass-through
        preds = raw_probs
        # Optionally load saved calibrator for this event
        # We keep pass-through to avoid hard dependency on joblib here.

    # Save calibrated output
    out = df.copy()
    out["calibrated_prob"] = preds
    out_path = PROC_DIR / f"calibrated_{event_id}.csv"
    out.to_csv(out_path, index=False)
    print(f"  📁 Saved: {out_path}")

    # Archive raw file
    try:
        shutil.move(str(event_file), ARCH_DIR / event_file.name)
    except Exception:
        pass

    return out_path


def run_once(args: PipelineArgs) -> None:
    track_df = load_track_features()
    files = collect_event_files()
    if not files:
        print("⚠️  No raw predictions found in data/raw (pattern predictions_*.csv)")
        return
    for f in files:
        try:
            process_event_file(f, args, track_df)
        except Exception as e:
            print(f"  ✖ Failed {f.name}: {e}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Per-event calibration pipeline")
    parser.add_argument("--method", default="platt", choices=["platt", "isotonic"], help="Preferred calibrator when tie")
    parser.add_argument("--retrain-threshold", type=float, default=0.10, help="Relative Brier increase vs recent mean to trigger alternate fit")
    parser.add_argument("--retrain-window", type=int, default=50, help="Rolling window for recent mean Brier")
    parser.add_argument("--daemon", action="store_true", help="Run periodically")
    parser.add_argument("--interval-sec", type=int, default=6 * 60 * 60, help="Daemon interval seconds")
    args_ns = parser.parse_args()

    args = PipelineArgs(
        method=args_ns.method,
        retrain_threshold=args_ns.retrain_threshold,
        retrain_window=args_ns.retrain_window,
        interval_sec=args_ns.interval_sec,
        once=not args_ns.daemon,
    )

    if args.once:
        run_once(args)
        return 0

    print(f"🕒 Daemon mode every {args.interval_sec}s")
    try:
        while True:
            run_once(args)
            time.sleep(args.interval_sec)
    except KeyboardInterrupt:
        print("Stopped by user")
        return 0


if __name__ == "__main__":
    raise SystemExit(main())


