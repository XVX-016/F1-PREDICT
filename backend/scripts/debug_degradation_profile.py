"""
Isolate tyre model components without race-chaos effects.

Outputs:
- per-compound lap-time curves
- lap-1..N component decomposition (base_delta, deg_term, fuel_term, final_laptime)
- effective degradation coefficients
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime, timezone
from typing import Dict, List, Tuple

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from engine.simulation.rigorous import RigorousModelParams
from services.simulation_engine import simulation_engine


COMPOUND_FACTORS = {
    "soft": 1.00,
    "medium": 0.72,
    "hard": 0.48,
}

COMPOUND_BASE_OFFSETS_MS = {
    "soft": 0.0,
    "medium": 350.0,
    "hard": 750.0,
}


def _degradation_curve(
    total_laps: int,
    tyre_mgmt: float,
    compound: str,
    params: RigorousModelParams,
    disable_degradation: bool,
) -> Tuple[List[float], float, float]:
    if disable_degradation:
        return [0.0 for _ in range(total_laps)], 0.0, 0.0

    factor = COMPOUND_FACTORS.get(compound, 1.0)
    if compound == "soft":
        alpha_base = params.tyre_alpha_soft
        gamma_base = params.tyre_gamma_soft
    elif compound == "medium":
        alpha_base = params.tyre_alpha_medium
        gamma_base = params.tyre_gamma_medium
    else:
        alpha_base = params.tyre_alpha_hard
        gamma_base = params.tyre_gamma_hard

    alpha = alpha_base * (1.0 + (1.0 - tyre_mgmt) * 0.1) * factor
    gamma = gamma_base * (1.0 + (1.0 - tyre_mgmt) * 0.1) * factor
    out: List[float] = []
    for lap in range(1, total_laps + 1):
        age = max(0, lap - 1)
        deg = alpha * age + gamma * (age ** 2)
        out.append(float(deg))
    return out, float(alpha), float(gamma)


def _lap_time_curve(
    track_id: str,
    driver_id: str,
    compound: str,
    model_params: Dict[str, float],
    disable_degradation: bool,
    disable_fuel: bool,
) -> Dict[str, object]:
    track = simulation_engine._get_track_context(track_id)  # pylint: disable=protected-access
    profiles = simulation_engine._get_driver_profiles(track_id, use_ml=True, seed=42)  # pylint: disable=protected-access
    driver = profiles.get(driver_id) or next(iter(profiles.values()))
    params = RigorousModelParams.from_overrides(model_params)

    base = float(driver.pace_base_ms)
    fuel0 = float(track.laps * params.fuel_burn_per_lap)
    base_delta = COMPOUND_BASE_OFFSETS_MS.get(compound, 0.0)
    fuel_terms: List[float] = []
    for lap in range(1, track.laps + 1):
        fuel_load = max(0.0, fuel0 - (lap - 1) * params.fuel_burn_per_lap)
        fuel_effect = 0.0 if disable_fuel else params.fuel_coeff * 1000.0 * (fuel_load / 100.0)
        fuel_terms.append(float(-fuel_effect))

    deg, alpha, gamma = _degradation_curve(
        track.laps,
        float(driver.tyre_management),
        compound,
        params,
        disable_degradation=disable_degradation,
    )
    lap_times = [float(base + base_delta + fuel_terms[i] + deg[i]) for i in range(track.laps)]
    components = []
    for lap in range(1, min(5, track.laps) + 1):
        components.append(
            {
                "lap": lap,
                "base_delta_ms": float(base_delta),
                "deg_term_ms": float(deg[lap - 1]),
                "fuel_term_ms": float(fuel_terms[lap - 1]),
                "final_laptime_ms": float(lap_times[lap - 1]),
            }
        )
    return {
        "lap_times_ms": lap_times,
        "alpha_ms_per_lap": alpha,
        "gamma_ms_per_lap2": gamma,
        "base_delta_ms": float(base_delta),
        "components_lap1_5": components,
    }


def _first_crossover(a: List[float], b: List[float]) -> int:
    # First lap where b becomes faster than a.
    for idx, (va, vb) in enumerate(zip(a, b), start=1):
        if vb < va:
            return idx
    return -1


def main() -> None:
    parser = argparse.ArgumentParser(description="Tyre degradation isolation profile.")
    parser.add_argument("--track-id", default="bahrain")
    parser.add_argument("--driver-id", default="VER")
    parser.add_argument("--params-file", default=os.path.join("backend", "data", "rigorous_model_params.v1.calibrated.json"))
    parser.add_argument("--out", default=os.path.join("backend", "reports", "degradation_profile_bahrain.json"))
    parser.add_argument("--disable-degradation", action="store_true")
    parser.add_argument("--disable-fuel", action="store_true")
    args = parser.parse_args()

    model_params: Dict[str, float] = {}
    if os.path.exists(args.params_file):
        payload = json.load(open(args.params_file, "r", encoding="utf-8"))
        model_params = {str(k): float(v) for k, v in payload.get("params", {}).items()}

    soft = _lap_time_curve(
        args.track_id,
        args.driver_id,
        "soft",
        model_params,
        disable_degradation=args.disable_degradation,
        disable_fuel=args.disable_fuel,
    )
    medium = _lap_time_curve(
        args.track_id,
        args.driver_id,
        "medium",
        model_params,
        disable_degradation=args.disable_degradation,
        disable_fuel=args.disable_fuel,
    )
    hard = _lap_time_curve(
        args.track_id,
        args.driver_id,
        "hard",
        model_params,
        disable_degradation=args.disable_degradation,
        disable_fuel=args.disable_fuel,
    )

    report = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "track_id": args.track_id,
        "driver_id": args.driver_id,
        "curves_ms": {
            "soft": soft["lap_times_ms"],
            "medium": medium["lap_times_ms"],
            "hard": hard["lap_times_ms"],
        },
        "components_lap1_5": {
            "soft": soft["components_lap1_5"],
            "medium": medium["components_lap1_5"],
            "hard": hard["components_lap1_5"],
        },
        "effective_coefficients": {
            "soft": {"alpha_ms_per_lap": soft["alpha_ms_per_lap"], "gamma_ms_per_lap2": soft["gamma_ms_per_lap2"]},
            "medium": {"alpha_ms_per_lap": medium["alpha_ms_per_lap"], "gamma_ms_per_lap2": medium["gamma_ms_per_lap2"]},
            "hard": {"alpha_ms_per_lap": hard["alpha_ms_per_lap"], "gamma_ms_per_lap2": hard["gamma_ms_per_lap2"]},
        },
        "baseline_offsets_ms": COMPOUND_BASE_OFFSETS_MS,
        "degradation_disabled": bool(args.disable_degradation),
        "fuel_disabled": bool(args.disable_fuel),
        "crossovers": {
            "soft_vs_medium": _first_crossover(soft["lap_times_ms"], medium["lap_times_ms"]),
            "soft_vs_hard": _first_crossover(soft["lap_times_ms"], hard["lap_times_ms"]),
            "medium_vs_hard": _first_crossover(medium["lap_times_ms"], hard["lap_times_ms"]),
        },
        "notes": [
            "Isolation mode: no SC/VSC, no traffic, no overtakes, no DNF.",
            "Use crossover laps to sanity-check pit windows before full concordance runs.",
        ],
    }

    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    print(
        json.dumps(
            {
                "track_id": args.track_id,
                "driver_id": args.driver_id,
                "lap1_ms": {
                    "soft": report["curves_ms"]["soft"][0],
                    "medium": report["curves_ms"]["medium"][0],
                    "hard": report["curves_ms"]["hard"][0],
                },
                "alpha_ms_per_lap": {
                    "soft": report["effective_coefficients"]["soft"]["alpha_ms_per_lap"],
                    "medium": report["effective_coefficients"]["medium"]["alpha_ms_per_lap"],
                    "hard": report["effective_coefficients"]["hard"]["alpha_ms_per_lap"],
                },
                "crossovers": report["crossovers"],
                "out": args.out,
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
