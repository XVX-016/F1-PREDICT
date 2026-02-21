"""
Calibrate rigorous model parameters using stochastic search.

Supported objective modes:
- legacy_mae: historical MAE objective (kept for compatibility)
- stability: stability-constrained objective with structural penalties
"""
from __future__ import annotations

import argparse
import json
import math
import os
import random
import sys
from datetime import datetime, timezone
from typing import Any, Dict, List, Tuple

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from data.enhanced_drivers_2025 import DRIVERS_2025
from models.domain import SimulationRequest
from services.simulation_engine import simulation_engine


SEARCH_SPACE: Dict[str, Tuple[float, float]] = {
    "fuel_coeff": (0.02, 0.05),
    "tyre_thermal_penalty": (120.0, 260.0),
    "tyre_traffic_penalty": (20.0, 80.0),
    "hazard_thermal_term": (0.0008, 0.0030),
    "hazard_engine_term": (0.0006, 0.0025),
    "hazard_traffic_term": (0.0002, 0.0020),
    "overtake_dirty_air_penalty": (80.0, 220.0),
    "overtake_logit_tau": (100.0, 260.0),
    "overtake_pass_delta_ms": (70.0, 180.0),
    "sc_intensity_lap_factor": (0.015, 0.08),
}

STABILITY_SEARCH_SPACE: Dict[str, Tuple[float, float]] = {
    "fuel_coeff": (0.015, 0.05),
    "compound_base_medium_ms": (120.0, 400.0),
    "compound_base_hard_ms": (250.0, 850.0),
    "tyre_alpha_soft": (0.20, 1.00),
    "tyre_alpha_medium": (0.15, 0.80),
    "tyre_alpha_hard": (0.10, 0.60),
    "tyre_fuel_penalty": (0.0, 16.0),
    "fuel_deg_coupling_scale": (0.0, 0.4),
    "fuel_deg_center_ratio": (0.35, 0.65),
}


def expected_position(distribution: Dict[Any, Any]) -> float:
    total = 0.0
    for k, v in distribution.items():
        try:
            total += float(k) * float(v)
        except Exception:
            continue
    return total if total > 0 else 20.0


def target_positions() -> Dict[str, int]:
    out: Dict[str, int] = {}
    for driver_id, profile in DRIVERS_2025.items():
        out[driver_id] = int(profile.current_position)
    return out


def evaluate_params(
    race_ids: List[str],
    seed: int,
    iterations: int,
    params: Dict[str, float],
) -> Tuple[float, Dict[str, float], Dict[str, float]]:
    targets = target_positions()
    per_driver_error_accum: Dict[str, float] = {}
    per_race_mae: Dict[str, float] = {}

    for race_id in race_ids:
        req = SimulationRequest(
            track_id=race_id,
            iterations=iterations,
            seed=seed,
            use_ml=True,
            params={
                "focus_driver": "VER",
                "model_params": params,
            },
        )
        output = simulation_engine.run_rigorous_output(req)
        per_driver_error: Dict[str, float] = {}

        for driver in output.drivers:
            d_id = driver.driver_id
            if d_id not in targets:
                continue
            pred = expected_position(driver.finishing_position_distribution)
            err = abs(pred - float(targets[d_id]))
            per_driver_error[d_id] = err
            per_driver_error_accum[d_id] = per_driver_error_accum.get(d_id, 0.0) + err

        if per_driver_error:
            per_race_mae[race_id] = sum(per_driver_error.values()) / len(per_driver_error)
        else:
            per_race_mae[race_id] = 999.0

    if not per_driver_error_accum:
        return 999.0, {}, {}

    # Average across races for each driver, then average drivers.
    n_races = max(1, len(race_ids))
    per_driver_error_avg = {d: e / n_races for d, e in per_driver_error_accum.items()}
    mae = sum(per_driver_error_avg.values()) / len(per_driver_error_avg)
    return mae, per_driver_error_avg, per_race_mae


def random_candidate(base: Dict[str, float], step_scale: float, rng: random.Random) -> Dict[str, float]:
    cand = dict(base)
    for key, (low, high) in SEARCH_SPACE.items():
        current = cand.get(key, (low + high) / 2.0)
        span = high - low
        proposal = current + rng.gauss(0.0, step_scale * span)
        cand[key] = min(high, max(low, proposal))
    return cand


def random_candidate_from_space(
    base: Dict[str, float],
    step_scale: float,
    rng: random.Random,
    search_space: Dict[str, Tuple[float, float]],
) -> Dict[str, float]:
    cand = dict(base)
    for key, (low, high) in search_space.items():
        current = cand.get(key, (low + high) / 2.0)
        span = high - low
        proposal = current + rng.gauss(0.0, step_scale * span)
        cand[key] = min(high, max(low, proposal))
    return cand


def _track_id_from_race_id(race_id: str) -> str:
    parts = race_id.split("_")
    return parts[2] if len(parts) >= 3 else race_id


def _load_gold_payload(gold_root: str, race_id: str) -> Tuple[Dict[str, int], Dict[str, Dict[str, Any]]]:
    race_dir = os.path.join(gold_root, race_id)
    with open(os.path.join(race_dir, "classification.json"), "r", encoding="utf-8") as f:
        cls = json.load(f)
    with open(os.path.join(race_dir, "stint_sequences.json"), "r", encoding="utf-8") as f:
        stints = json.load(f)

    gold_positions: Dict[str, int] = {
        str(row.get("driver")).upper(): int(row.get("position"))
        for row in cls
        if row.get("driver") and row.get("position") is not None
    }

    strategy_plan: Dict[str, Dict[str, Any]] = {}
    for d, seq in stints.items():
        if not isinstance(seq, list) or not seq:
            continue
        compounds = [str(x.get("compound") or "hard").lower() for x in seq if isinstance(x, dict)]
        pit_laps = [
            int(seq[i].get("end_lap"))
            for i in range(len(seq) - 1)
            if isinstance(seq[i], dict) and isinstance(seq[i].get("end_lap"), (int, float))
        ]
        strategy_plan[str(d).upper()] = {"compounds": compounds, "pit_laps": pit_laps}
    return gold_positions, strategy_plan


def _expected_rank(run_output: Dict[str, Any]) -> Dict[str, int]:
    expected: Dict[str, float] = {}
    for row in run_output.get("drivers", []):
        d = str(row.get("driver_id") or "").upper()
        dist = row.get("finishing_position_distribution", {})
        if not d or not isinstance(dist, dict):
            continue
        exp = 0.0
        for k, v in dist.items():
            try:
                exp += float(k) * float(v)
            except Exception:
                continue
        expected[d] = exp
    ordered = sorted(expected.items(), key=lambda kv: (kv[1], kv[0]))
    return {d: i + 1 for i, (d, _) in enumerate(ordered)}


def _kendall_tau_from_ranks(model_rank: Dict[str, int], gold_rank: Dict[str, int]) -> float:
    common = sorted(set(model_rank) & set(gold_rank))
    if len(common) < 2:
        return 0.0
    concordant = 0
    discordant = 0
    for i in range(len(common)):
        for j in range(i + 1, len(common)):
            da = model_rank[common[i]] - model_rank[common[j]]
            db = gold_rank[common[i]] - gold_rank[common[j]]
            prod = da * db
            if prod > 0:
                concordant += 1
            elif prod < 0:
                discordant += 1
    denom = concordant + discordant
    return float((concordant - discordant) / denom) if denom else 0.0


def _position_mae(model_rank: Dict[str, int], gold_rank: Dict[str, int]) -> float:
    common = sorted(set(model_rank) & set(gold_rank))
    if not common:
        return 999.0
    return float(sum(abs(model_rank[d] - gold_rank[d]) for d in common) / len(common))


def _tier_crossings(model_rank: Dict[str, int], gold_rank: Dict[str, int]) -> int:
    inv_gold = {p: d for d, p in gold_rank.items()}
    out = 0
    for p in range(1, len(inv_gold)):
        a = inv_gold.get(p)
        b = inv_gold.get(p + 1)
        if not a or not b:
            continue
        if model_rank.get(a, 999) > model_rank.get(b, -1):
            out += 1
    return out


def _curvature_index(run_output: Dict[str, Any]) -> float:
    mx = 0.0
    for row in run_output.get("drivers", []):
        lp = row.get("lap_time_profile", [])
        if not isinstance(lp, list) or len(lp) < 3:
            continue
        vals = [float(x) for x in lp]
        for i in range(1, len(vals) - 1):
            second = vals[i + 1] - 2.0 * vals[i] + vals[i - 1]
            mx = max(mx, abs(second))
    return float(mx)


def _scm(position_mae: float, tau: float, n_drivers: int) -> float:
    # pit/topology are fixed in this calibration mode (gold strategy lock) => omit constant terms.
    pos_norm = position_mae / max(1.0, float(n_drivers - 1))
    rank_err = 1.0 - max(-1.0, min(1.0, tau))
    return float(0.35 * pos_norm + 0.25 * rank_err)


def _eval_stability_objective(
    race_id: str,
    seed: int,
    iterations: int,
    params: Dict[str, float],
    gold_root: str,
    ratio_target: float,
    intrinsic_guard_frac: float,
) -> Tuple[float, Dict[str, float]]:
    gold_positions, strategy_plan = _load_gold_payload(gold_root, race_id)
    track_id = _track_id_from_race_id(race_id)
    drivers = sorted(gold_positions.keys())
    forced = {d: float(max(0, gold_positions[d] - 1) * 100.0) for d in drivers}

    det_common = {
        "lap_noise_sigma_ms": 0.0,
        "traffic_near_gap_ms": 0.0,
        "traffic_mid_gap_ms": 0.0,
        "tyre_traffic_penalty": 0.0,
        "tyre_thermal_penalty": 0.0,
        "tyre_cliff_base": 0.0,
        "tyre_cliff_thermal_boost": 0.0,
        "hazard_lap_term": 0.0,
        "hazard_thermal_term": 0.0,
        "hazard_engine_term": 0.0,
        "hazard_traffic_term": 0.0,
        "hazard_prob_cap": 0.0,
        "overtake_max_gap_ms": 0.0,
        "overtake_pass_delta_ms": 0.0,
        "sc_penalty_ms": 0.0,
        "vsc_penalty_ms": 0.0,
        "sc_intensity_lap_factor": 0.0,
    }

    full_params = dict(det_common)
    full_params.update(params)
    pure_params = dict(det_common)
    pure_params.update(
        {
            "fuel_coeff": 0.0,
            "compound_base_soft_ms": 0.0,
            "compound_base_medium_ms": 0.0,
            "compound_base_hard_ms": 0.0,
            "tyre_alpha_soft": 0.0,
            "tyre_alpha_medium": 0.0,
            "tyre_alpha_hard": 0.0,
            "tyre_gamma_soft": 0.0,
            "tyre_gamma_medium": 0.0,
            "tyre_gamma_hard": 0.0,
            "tyre_fuel_penalty": 0.0,
            "disable_pit_events": 1.0,
        }
    )

    full_req = SimulationRequest(
        track_id=track_id,
        iterations=iterations,
        seed=seed,
        use_ml=False,
        params={
            "focus_driver": "VER",
            "driver_ids": drivers,
            "forced_rank_offsets_ms": forced,
            "strategy_plan": strategy_plan,
            "model_params": full_params,
        },
    )
    pure_req = SimulationRequest(
        track_id=track_id,
        iterations=iterations,
        seed=seed,
        use_ml=False,
        params={
            "focus_driver": "VER",
            "driver_ids": drivers,
            "forced_rank_offsets_ms": forced,
            "strategy_plan": strategy_plan,
            "model_params": pure_params,
        },
    )

    out_full = simulation_engine.run_rigorous_output(full_req).model_dump()
    out_pure = simulation_engine.run_rigorous_output(pure_req).model_dump()

    model_drivers = {str(r.get("driver_id") or "").upper() for r in out_full.get("drivers", [])}
    gold_drivers = set(drivers)
    if model_drivers != gold_drivers:
        return 1e9, {"identity_mismatch": 1.0}

    rank_full = _expected_rank(out_full)
    tau = _kendall_tau_from_ranks(rank_full, gold_positions)
    mae = _position_mae(rank_full, gold_positions)
    crossings = _tier_crossings(rank_full, gold_positions)
    curvature = _curvature_index(out_full)

    pure_times = out_pure.get("metadata", {}).get("driver_mean_race_time_ms", {})
    full_times = out_full.get("metadata", {}).get("driver_mean_race_time_ms", {})
    ordered = sorted(drivers, key=lambda d: gold_positions[d])
    gaps = [float(pure_times[ordered[i + 1]]) - float(pure_times[ordered[i]]) for i in range(len(ordered) - 1)]
    intrinsic_min = min(gaps) if gaps else 1.0
    interaction = {d: float(full_times[d]) - float(pure_times[d]) for d in ordered}
    interaction_max = max(
        abs(interaction[a] - interaction[b])
        for i, a in enumerate(ordered)
        for b in ordered[i + 1:]
    ) if len(ordered) > 1 else 0.0
    ratio = float(interaction_max / intrinsic_min) if intrinsic_min > 0 else 1e6

    scm = _scm(mae, tau, len(drivers))
    curvature_norm = float(curvature / intrinsic_min) if intrinsic_min > 0 else 1e6
    ratio_excess = max(0.0, ratio - ratio_target)
    guard_penalty = max(0.0, (intrinsic_guard_frac * intrinsic_min) - intrinsic_min)

    # Hierarchical stability-first objective.
    loss = (
        1e6 * float(crossings) +
        1e4 * ratio_excess +
        1e2 * curvature_norm +
        scm +
        1e3 * guard_penalty
    )

    details = {
        "tau": tau,
        "position_mae": mae,
        "scm": scm,
        "tier_crossings": float(crossings),
        "curvature_index_ms": curvature,
        "intrinsic_min_gap_ms": intrinsic_min,
        "interaction_max_ms": interaction_max,
        "interaction_ratio": ratio,
        "ratio_excess": ratio_excess,
        "loss": loss,
    }
    return float(loss), details


def main() -> None:
    parser = argparse.ArgumentParser(description="Calibrate rigorous model params")
    parser.add_argument("--races", nargs="+", default=["bahrain", "abu_dhabi"])
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--iterations", type=int, default=400)
    parser.add_argument("--trials", type=int, default=30)
    parser.add_argument("--step-scale", type=float, default=0.08)
    parser.add_argument("--in-params", default="data/rigorous_model_params.v1.json")
    parser.add_argument("--out-params", default="data/rigorous_model_params.v1.calibrated.json")
    parser.add_argument("--report", default="reports/rigorous_calibration_report.json")
    parser.add_argument("--objective-mode", choices=["legacy_mae", "stability"], default="legacy_mae")
    parser.add_argument("--gold-root", default=os.path.join("backend", "data", "gold", "v1"))
    parser.add_argument("--gold-race-id", default="2024_1_bahrain")
    parser.add_argument("--ratio-target", type=float, default=3.0)
    parser.add_argument("--intrinsic-guard-frac", type=float, default=0.9)
    args = parser.parse_args()

    rng = random.Random(args.seed)

    with open(args.in_params, "r", encoding="utf-8") as f:
        base_payload = json.load(f)
    base_params = {k: float(v) for k, v in base_payload.get("params", {}).items()}

    best_params = dict(base_params)
    if args.objective_mode == "legacy_mae":
        best_loss, best_error_breakdown, best_race_breakdown = evaluate_params(
            race_ids=args.races,
            seed=args.seed,
            iterations=args.iterations,
            params=best_params,
        )
        stability_details: Dict[str, float] = {}
        search_space = SEARCH_SPACE
    else:
        best_loss, stability_details = _eval_stability_objective(
            race_id=args.gold_race_id,
            seed=args.seed,
            iterations=args.iterations,
            params=best_params,
            gold_root=args.gold_root,
            ratio_target=args.ratio_target,
            intrinsic_guard_frac=args.intrinsic_guard_frac,
        )
        best_error_breakdown = {}
        best_race_breakdown = {}
        search_space = STABILITY_SEARCH_SPACE

    history: List[Dict[str, Any]] = [
        {
            "trial": 0,
            "loss_mae": best_loss,
            "accepted": True,
            "stability": stability_details if args.objective_mode == "stability" else None,
            "params": best_params if args.objective_mode == "stability" else None,
        }
    ]

    temperature = max(0.05, args.step_scale)
    for trial in range(1, args.trials + 1):
        cand = random_candidate_from_space(best_params, temperature, rng, search_space)
        if args.objective_mode == "legacy_mae":
            cand_loss, _, _ = evaluate_params(
                race_ids=args.races,
                seed=args.seed,
                iterations=args.iterations,
                params=cand,
            )
            cand_stability = {}
        else:
            cand_loss, cand_stability = _eval_stability_objective(
                race_id=args.gold_race_id,
                seed=args.seed,
                iterations=args.iterations,
                params=cand,
                gold_root=args.gold_root,
                ratio_target=args.ratio_target,
                intrinsic_guard_frac=args.intrinsic_guard_frac,
            )

        accept = cand_loss < best_loss
        # weak simulated annealing acceptor for exploration
        if not accept:
            delta = cand_loss - best_loss
            accept_prob = math.exp(-delta / max(0.001, temperature))
            accept = rng.random() < accept_prob * 0.05

        if accept and cand_loss <= best_loss:
            best_params = cand
            best_loss = cand_loss
            if args.objective_mode == "legacy_mae":
                best_error_breakdown = evaluate_params(
                    race_ids=args.races,
                    seed=args.seed,
                    iterations=args.iterations,
                    params=best_params,
                )[1]
                best_race_breakdown = evaluate_params(
                    race_ids=args.races,
                    seed=args.seed,
                    iterations=args.iterations,
                    params=best_params,
                )[2]
            else:
                stability_details = dict(cand_stability)

        history.append({
            "trial": trial,
            "loss_mae": round(cand_loss, 6),
            "accepted": bool(accept and cand_loss <= best_loss),
            "stability": cand_stability if args.objective_mode == "stability" else None,
            "params": cand if args.objective_mode == "stability" else None,
        })
        temperature = max(0.02, temperature * 0.97)

    out_payload = {
        "version": "v1-calibrated",
        "base_version": base_payload.get("version", "v1"),
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "races": args.races,
        "seed": args.seed,
        "iterations": args.iterations,
        "objective": "Mean MAE across races: expected_finish_position vs target_position_2025",
        "loss_mae": round(best_loss, 6),
        "params": best_params,
        "objective_mode": args.objective_mode,
    }
    os.makedirs(os.path.dirname(args.out_params), exist_ok=True)
    with open(args.out_params, "w", encoding="utf-8") as f:
        json.dump(out_payload, f, indent=2)

    report = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "races": args.races,
        "seed": args.seed,
        "iterations": args.iterations,
        "trials": args.trials,
        "best_loss_mae": round(best_loss, 6),
        "best_error_breakdown": best_error_breakdown,
        "best_race_breakdown": best_race_breakdown,
        "best_stability_details": stability_details if args.objective_mode == "stability" else {},
        "history": history,
        "output_params_file": args.out_params,
    }
    os.makedirs(os.path.dirname(args.report), exist_ok=True)
    with open(args.report, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    print(json.dumps({
        "best_loss_mae": round(best_loss, 6),
        "output_params_file": args.out_params,
        "report": args.report,
    }, indent=2))


if __name__ == "__main__":
    main()
