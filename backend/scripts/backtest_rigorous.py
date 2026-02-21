"""
Backtest and governance report for the rigorous simulation engine.

Outputs:
- Runtime per race/seed
- Reproducibility check (same seed => same fingerprint)
- Convergence drift vs target iterations
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
import time
from datetime import datetime, timezone
from typing import Any, Dict, List

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from models.domain import SimulationRequest
from services.simulation_engine import simulation_engine


def _fingerprint(output_dict: Dict[str, Any]) -> str:
    payload = json.dumps(output_dict, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def _focus_distribution(output_dict: Dict[str, Any], focus_driver: str) -> Dict[int, float]:
    drivers = output_dict.get("drivers", [])
    row = next((d for d in drivers if d.get("driver_id") == focus_driver), None)
    if not row:
        return {}
    raw = row.get("finishing_position_distribution", {})
    return {int(k): float(v) for k, v in raw.items()}


def _distribution_l1(a: Dict[int, float], b: Dict[int, float]) -> float:
    keys = set(a.keys()) | set(b.keys())
    return float(sum(abs(a.get(k, 0.0) - b.get(k, 0.0)) for k in keys))


def run_case(race_id: str, seed: int, iterations: int, focus_driver: str, model_params: Dict[str, float]) -> Dict[str, Any]:
    req = SimulationRequest(
        track_id=race_id,
        iterations=iterations,
        seed=seed,
        use_ml=True,
        params={"focus_driver": focus_driver, "model_params": model_params},
    )

    t0 = time.perf_counter()
    out1 = simulation_engine.run_rigorous_output(req)
    runtime_ms = (time.perf_counter() - t0) * 1000.0
    d1 = out1.model_dump()

    # Reproducibility (same request and seed)
    out2 = simulation_engine.run_rigorous_output(req)
    d2 = out2.model_dump()
    fp1 = _fingerprint(d1)
    fp2 = _fingerprint(d2)

    # Convergence diagnostics: compare 250/500 to target iterations.
    small_250 = simulation_engine.run_rigorous_output(
        SimulationRequest(
            track_id=race_id,
            iterations=min(250, iterations),
            seed=seed,
            use_ml=True,
            params={"focus_driver": focus_driver, "model_params": model_params},
        )
    ).model_dump()
    small_500 = simulation_engine.run_rigorous_output(
        SimulationRequest(
            track_id=race_id,
            iterations=min(500, iterations),
            seed=seed,
            use_ml=True,
            params={"focus_driver": focus_driver, "model_params": model_params},
        )
    ).model_dump()

    focus_target = _focus_distribution(d1, focus_driver)
    focus_250 = _focus_distribution(small_250, focus_driver)
    focus_500 = _focus_distribution(small_500, focus_driver)

    return {
        "race_id": race_id,
        "seed": seed,
        "iterations": iterations,
        "runtime_ms": round(runtime_ms, 3),
        "reproducible": fp1 == fp2,
        "fingerprint": fp1,
        "model_params_signature": d1.get("metadata", {}).get("model_params_signature"),
        "focus_driver": focus_driver,
        "convergence_l1": {
            "250_vs_target": round(_distribution_l1(focus_250, focus_target), 6),
            "500_vs_target": round(_distribution_l1(focus_500, focus_target), 6),
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Backtest rigorous engine and write governance report.")
    parser.add_argument("--races", nargs="+", default=["bahrain", "abu_dhabi"])
    parser.add_argument("--seeds", nargs="+", type=int, default=[17, 42])
    parser.add_argument("--iterations", type=int, default=1000)
    parser.add_argument("--focus-driver", default="VER")
    parser.add_argument("--out", default="reports/rigorous_backtest_report.json")
    parser.add_argument("--params-file", default="data/rigorous_model_params.v1.json")
    parser.add_argument("--max-runtime-ms", type=float, default=None)
    parser.add_argument("--max-convergence-l1", type=float, default=None)
    parser.add_argument("--require-reproducible", action="store_true")
    args = parser.parse_args()

    model_params: Dict[str, float] = {}
    try:
        with open(args.params_file, "r", encoding="utf-8") as f:
            payload = json.load(f)
        model_params = {str(k): float(v) for k, v in payload.get("params", {}).items()}
    except Exception:
        model_params = {}

    rows: List[Dict[str, Any]] = []
    for race_id in args.races:
        for seed in args.seeds:
            rows.append(run_case(race_id, seed, args.iterations, args.focus_driver, model_params))

    report = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "engine": "rigorous",
        "cases": rows,
        "summary": {
            "num_cases": len(rows),
            "all_reproducible": all(r["reproducible"] for r in rows),
            "avg_runtime_ms": round(sum(r["runtime_ms"] for r in rows) / max(1, len(rows)), 3),
            "max_runtime_ms": round(max((r["runtime_ms"] for r in rows), default=0.0), 3),
        },
    }

    out_path = args.out
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    failures: List[str] = []
    if args.require_reproducible:
        non_repro = [r for r in rows if not r.get("reproducible", False)]
        if non_repro:
            failures.append(f"Reproducibility failed for {len(non_repro)} case(s)")

    if args.max_runtime_ms is not None:
        too_slow = [r for r in rows if float(r.get("runtime_ms", 0.0)) > args.max_runtime_ms]
        if too_slow:
            failures.append(f"Runtime threshold exceeded ({args.max_runtime_ms}ms) in {len(too_slow)} case(s)")

    if args.max_convergence_l1 is not None:
        unstable = [
            r for r in rows
            if float(r.get("convergence_l1", {}).get("250_vs_target", 0.0)) > args.max_convergence_l1
        ]
        if unstable:
            failures.append(
                f"Convergence threshold exceeded ({args.max_convergence_l1}) in {len(unstable)} case(s)"
            )

    print(json.dumps(report["summary"], indent=2))
    print(f"Report written: {out_path}")

    if failures:
        print("Validation failed:")
        for failure in failures:
            print(f"- {failure}")
        raise SystemExit(1)


if __name__ == "__main__":
    main()
