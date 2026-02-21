"""
Run strategy concordance metrics against a frozen Gold race.

Metrics:
- Position MAE
- Kendall Tau
- Pit Timing MAE
- Strategy Topology Match
- Podium Accuracy
- Composite SCM
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import os
import statistics
import sys
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Sequence, Tuple

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from models.domain import SimulationRequest, StrategyResult
from services.simulation_engine import simulation_engine

try:
    from scipy.stats import kendalltau as scipy_kendalltau  # type: ignore
except Exception:  # pragma: no cover
    scipy_kendalltau = None


def _load_json(path: str) -> Any:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _sha256_file(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def _race_slug_to_track_id(race_id: str) -> str:
    # Expected format like: 2024_1_bahrain
    parts = race_id.split("_")
    if len(parts) >= 3:
        return parts[2]
    return race_id


def _gold_paths(gold_root: str, race_id: str) -> Dict[str, str]:
    race_dir = os.path.join(gold_root, race_id)
    return {
        "race_dir": race_dir,
        "classification": os.path.join(race_dir, "classification.json"),
        "pit_events": os.path.join(race_dir, "pit_events.json"),
        "stint_sequences": os.path.join(race_dir, "stint_sequences.json"),
        "manifest": os.path.join(gold_root, "gold_manifest.json"),
    }


def _gold_positions(classification: Sequence[Dict[str, Any]]) -> Dict[str, int]:
    out: Dict[str, int] = {}
    for row in classification:
        driver = str(row.get("driver") or "").upper()
        pos = row.get("position")
        if driver and isinstance(pos, (int, float)):
            out[driver] = int(pos)
    return out


def _gold_pits_by_driver(pit_events: Sequence[Dict[str, Any]]) -> Dict[str, List[int]]:
    out: Dict[str, List[int]] = {}
    for event in pit_events:
        driver = str(event.get("driver") or "").upper()
        lap_raw = event.get("lap")
        if not driver or not isinstance(lap_raw, (int, float)):
            continue
        out.setdefault(driver, []).append(int(lap_raw))
    for d in out:
        out[d] = sorted(set(out[d]))
    return out


def _expected_positions_from_distribution(run_output: Dict[str, Any]) -> Dict[str, float]:
    out: Dict[str, float] = {}
    for row in run_output.get("drivers", []):
        driver = str(row.get("driver_id") or "").upper()
        dist = row.get("finishing_position_distribution", {})
        if not driver or not isinstance(dist, dict):
            continue
        expected = 0.0
        for k, v in dist.items():
            try:
                expected += float(k) * float(v)
            except Exception:
                continue
        out[driver] = expected if expected > 0 else 20.0
    return out


def _rank_from_expected(expected_pos: Dict[str, float]) -> Dict[str, int]:
    ordered = sorted(expected_pos.items(), key=lambda kv: (kv[1], kv[0]))
    return {driver: i + 1 for i, (driver, _) in enumerate(ordered)}


def _kendall_tau(a: List[float], b: List[float]) -> float:
    if len(a) <= 1 or len(b) <= 1 or len(a) != len(b):
        return 0.0
    if scipy_kendalltau is not None:
        tau, _ = scipy_kendalltau(a, b)
        return float(0.0 if tau is None or math.isnan(tau) else tau)

    concordant = 0
    discordant = 0
    n = len(a)
    for i in range(n):
        for j in range(i + 1, n):
            da = a[i] - a[j]
            db = b[i] - b[j]
            prod = da * db
            if prod > 0:
                concordant += 1
            elif prod < 0:
                discordant += 1
    denom = concordant + discordant
    if denom == 0:
        return 0.0
    return float((concordant - discordant) / denom)


def _compute_position_mae(model_rank: Dict[str, int], gold_rank: Dict[str, int]) -> float:
    common = sorted(set(model_rank) & set(gold_rank))
    if not common:
        return 999.0
    return float(sum(abs(model_rank[d] - gold_rank[d]) for d in common) / len(common))


def _compute_kendall(model_rank: Dict[str, int], gold_rank: Dict[str, int]) -> float:
    common = sorted(set(model_rank) & set(gold_rank))
    if len(common) < 2:
        return 0.0
    model_vals = [float(model_rank[d]) for d in common]
    gold_vals = [float(gold_rank[d]) for d in common]
    return _kendall_tau(model_vals, gold_vals)


def _compute_podium_accuracy(model_rank: Dict[str, int], gold_rank: Dict[str, int]) -> float:
    model_top3 = {d for d, p in model_rank.items() if p <= 3}
    gold_top3 = {d for d, p in gold_rank.items() if p <= 3}
    if not gold_top3:
        return 0.0
    return float(len(model_top3 & gold_top3) / 3.0)


def _tier_crossing_count(model_rank: Dict[str, int], gold_rank: Dict[str, int]) -> int:
    """
    Count adjacent Gold-rank pair inversions in the model ranking.
    """
    inv_gold = {pos: d for d, pos in gold_rank.items()}
    max_pos = len(inv_gold)
    crossings = 0
    for pos in range(1, max_pos):
        a = inv_gold.get(pos)
        b = inv_gold.get(pos + 1)
        if not a or not b:
            continue
        ma = model_rank.get(a)
        mb = model_rank.get(b)
        if ma is None or mb is None:
            continue
        if ma > mb:
            crossings += 1
    return crossings


def _curvature_index_from_profiles(run_output: Dict[str, Any]) -> float:
    """
    Curvature proxy = max absolute second finite-difference across all drivers/laps.
    """
    max_abs = 0.0
    for row in run_output.get("drivers", []):
        prof = row.get("lap_time_profile", [])
        if not isinstance(prof, list) or len(prof) < 3:
            continue
        vals = [float(x) for x in prof]
        for i in range(1, len(vals) - 1):
            second_diff = vals[i + 1] - (2.0 * vals[i]) + vals[i - 1]
            a = abs(second_diff)
            if a > max_abs:
                max_abs = a
    return float(max_abs)


def _stints_to_pit_laps(strategy: Optional[StrategyResult], total_laps: int) -> List[int]:
    if strategy is None:
        return []
    pits: List[int] = []
    for stint in strategy.stints:
        end_lap = int(stint.end_lap)
        if end_lap < total_laps:
            pits.append(end_lap)
    return sorted(set(pits))


def _stints_to_compound_seq(strategy: Optional[StrategyResult]) -> List[str]:
    if strategy is None:
        return []
    return [str(s.compound).lower() for s in strategy.stints]


def _optimize_driver_strategies(
    track_id: str,
    seed: int,
    optimizer_iterations: int,
) -> Dict[str, Dict[str, Any]]:
    track = simulation_engine._get_track_context(track_id)  # pylint: disable=protected-access
    profiles = simulation_engine._get_driver_profiles(track_id, use_ml=True, seed=seed)  # pylint: disable=protected-access
    out: Dict[str, Dict[str, Any]] = {}
    for idx, (driver_id, profile) in enumerate(profiles.items()):
        strategy = simulation_engine.optimizer.optimize(
            track=track,
            driver_profile=profile,
            params={},
            iterations=optimizer_iterations,
            seed=seed + (idx * 13),
            events=[],
        )
        out[driver_id] = {
            "pit_laps": _stints_to_pit_laps(strategy, track.laps),
            "compound_seq": _stints_to_compound_seq(strategy),
        }
    return out


def _pit_timing_mae(
    model_pits: Dict[str, List[int]],
    gold_pits: Dict[str, List[int]],
    total_laps: int,
) -> float:
    common = sorted(set(model_pits) & set(gold_pits))
    if not common:
        return float(total_laps)
    per_driver: List[float] = []
    for d in common:
        m = model_pits.get(d, [])
        g = gold_pits.get(d, [])
        k = min(len(m), len(g))
        if k > 0:
            per_driver.append(float(sum(abs(m[i] - g[i]) for i in range(k)) / k))
        elif not m and not g:
            per_driver.append(0.0)
        else:
            per_driver.append(float(total_laps))
    return float(sum(per_driver) / len(per_driver)) if per_driver else float(total_laps)


def _topology_match(
    model_strat: Dict[str, Dict[str, Any]],
    gold_pits: Dict[str, List[int]],
    gold_stints: Optional[Dict[str, List[Dict[str, Any]]]] = None,
) -> Tuple[float, str]:
    common = sorted(set(model_strat) & set(gold_pits))
    if not common:
        return 0.0, "pit_count_only"
    if isinstance(gold_stints, dict) and gold_stints:
        matched = 0
        compared = 0
        for d in common:
            gold_seq = [
                str(x.get("compound") or "").lower()
                for x in gold_stints.get(d, [])
                if isinstance(x, dict)
            ]
            if not gold_seq:
                continue
            model_seq = [str(x).lower() for x in model_strat.get(d, {}).get("compound_seq", [])]
            compared += 1
            if model_seq == gold_seq:
                matched += 1
        if compared > 0:
            return float(matched / compared), "compound_sequence_exact"

    matched = 0
    for d in common:
        model_count = len(model_strat.get(d, {}).get("pit_laps", []))
        gold_count = len(gold_pits.get(d, []))
        if model_count == gold_count:
            matched += 1
    return float(matched / len(common)), "pit_count_only"


def _strategy_plan_from_gold_stints(
    gold_stints: Optional[Dict[str, List[Dict[str, Any]]]]
) -> Dict[str, Dict[str, Any]]:
    plan: Dict[str, Dict[str, Any]] = {}
    if not isinstance(gold_stints, dict):
        return plan
    for driver, seq in gold_stints.items():
        if not isinstance(seq, list) or not seq:
            continue
        compounds: List[str] = []
        pit_laps: List[int] = []
        for idx, row in enumerate(seq):
            if not isinstance(row, dict):
                continue
            comp = str(row.get("compound") or "hard").lower()
            compounds.append(comp)
            end_lap = row.get("end_lap")
            if idx < len(seq) - 1 and isinstance(end_lap, (int, float)):
                pit_laps.append(int(end_lap))
        plan[str(driver).upper()] = {"compounds": compounds, "pit_laps": pit_laps}
    return plan


def _metric_summary(values: List[float]) -> Dict[str, float]:
    if not values:
        return {"mean": 0.0, "std": 0.0}
    if len(values) == 1:
        return {"mean": float(values[0]), "std": 0.0}
    return {"mean": float(statistics.mean(values)), "std": float(statistics.pstdev(values))}


def _compute_scm(
    position_mae: float,
    kendall_tau: float,
    pit_mae: float,
    topology_match: float,
    total_drivers: int,
    total_laps: int,
    time_norm: float = 0.0,
) -> float:
    w_pos = 0.35
    w_rank = 0.25
    w_pit = 0.20
    w_strat = 0.15
    w_time = 0.05

    pos_norm = position_mae / max(1.0, float(total_drivers - 1))
    rank_err = 1.0 - max(-1.0, min(1.0, kendall_tau))
    pit_norm = pit_mae / max(1.0, float(total_laps))
    strat_err = 1.0 - topology_match
    return float(
        w_pos * pos_norm
        + w_rank * rank_err
        + w_pit * pit_norm
        + w_strat * strat_err
        + w_time * time_norm
    )


def _validate_driver_set(model_drivers: Sequence[str], gold_drivers: Sequence[str]) -> Dict[str, Any]:
    model_set = {str(x).upper() for x in model_drivers}
    gold_set = {str(x).upper() for x in gold_drivers}
    overlap = model_set & gold_set
    summary = {
        "model_count": len(model_set),
        "gold_count": len(gold_set),
        "overlap_count": len(overlap),
        "missing_in_model": sorted(gold_set - model_set),
        "extra_in_model": sorted(model_set - gold_set),
    }
    if model_set != gold_set:
        raise RuntimeError(
            "ConcordanceIntegrityError: model and gold driver sets differ: "
            + json.dumps(summary, separators=(",", ":"))
        )
    return summary


def run_once(
    race_id: str,
    track_id: str,
    gold_positions: Dict[str, int],
    gold_pits: Dict[str, List[int]],
    iterations: int,
    seed: int,
    focus_driver: str,
    optimizer_iterations: int,
    gold_stints: Optional[Dict[str, List[Dict[str, Any]]]] = None,
    lock_gold_strategy: bool = True,
    model_params: Optional[Dict[str, float]] = None,
    use_ml: bool = True,
    pace_spread_scale: float = 1.0,
    forced_rank_offsets_ms: Optional[Dict[str, float]] = None,
) -> Dict[str, Any]:
    strategy_plan = _strategy_plan_from_gold_stints(gold_stints) if lock_gold_strategy else {}
    req = SimulationRequest(
        track_id=track_id,
        iterations=iterations,
        seed=seed,
        use_ml=use_ml,
        params={
            "focus_driver": focus_driver,
            "strategy_plan": strategy_plan,
            "model_params": model_params or {},
            "pace_spread_scale": pace_spread_scale,
            "forced_rank_offsets_ms": forced_rank_offsets_ms or {},
            "driver_ids": sorted(gold_positions.keys()),
        },
    )
    out = simulation_engine.run_rigorous_output(req).model_dump()
    model_driver_ids = [str(r.get("driver_id") or "").upper() for r in out.get("drivers", [])]
    driver_set_summary = _validate_driver_set(model_driver_ids, list(gold_positions.keys()))
    expected_positions = _expected_positions_from_distribution(out)
    model_rank = _rank_from_expected(expected_positions)
    position_mae = _compute_position_mae(model_rank, gold_positions)
    kendall_tau = _compute_kendall(model_rank, gold_positions)
    podium_accuracy = _compute_podium_accuracy(model_rank, gold_positions)
    tier_crossings = _tier_crossing_count(model_rank, gold_positions)
    curvature_index = _curvature_index_from_profiles(out)
    rank_changes_vs_gold = int(
        sum(1 for d in set(model_rank) & set(gold_positions) if model_rank[d] != gold_positions[d])
    )

    model_strat = (
        {
            d: {"pit_laps": v.get("pit_laps", []), "compound_seq": v.get("compounds", [])}
            for d, v in strategy_plan.items()
        }
        if lock_gold_strategy and strategy_plan
        else _optimize_driver_strategies(track_id=track_id, seed=seed, optimizer_iterations=optimizer_iterations)
    )
    model_pits = {d: v.get("pit_laps", []) for d, v in model_strat.items()}
    pit_mae = _pit_timing_mae(model_pits, gold_pits, total_laps=int(out["metadata"]["total_laps"]))
    topology_match, topology_mode = _topology_match(model_strat, gold_pits, gold_stints)

    scm = _compute_scm(
        position_mae=position_mae,
        kendall_tau=kendall_tau,
        pit_mae=pit_mae,
        topology_match=topology_match,
        total_drivers=len(gold_positions),
        total_laps=int(out["metadata"]["total_laps"]),
    )
    lap_means: Dict[str, float] = {}
    for drow in out.get("drivers", []):
        did = str(drow.get("driver_id") or "").upper()
        lp = drow.get("lap_time_profile", [])
        if did and isinstance(lp, list) and lp:
            lap_means[did] = float(sum(float(x) for x in lp) / len(lp))
    lap_spread = 0.0
    if lap_means:
        lap_spread = float(max(lap_means.values()) - min(lap_means.values()))
    race_time_means = out.get("metadata", {}).get("driver_mean_race_time_ms", {})
    deltas = {
        "p1_vs_p20_ms": None,
        "p1_vs_p5_ms": None,
        "p10_vs_p15_ms": None,
    }
    if isinstance(race_time_means, dict) and model_rank:
        inv_rank = {p: d for d, p in model_rank.items()}
        def _delta(a: int, b: int) -> Optional[float]:
            da = inv_rank.get(a)
            db = inv_rank.get(b)
            if not da or not db:
                return None
            ta = race_time_means.get(da)
            tb = race_time_means.get(db)
            try:
                return float(tb) - float(ta)
            except (TypeError, ValueError):
                return None
        deltas["p1_vs_p20_ms"] = _delta(1, 20)
        deltas["p1_vs_p5_ms"] = _delta(1, 5)
        deltas["p10_vs_p15_ms"] = _delta(10, 15)

    return {
        "race_id": race_id,
        "track_id": track_id,
        "seed": seed,
        "metrics": {
            "position_mae": position_mae,
            "kendall_tau": kendall_tau,
            "pit_mae": pit_mae,
            "topology_match": topology_match,
            "topology_mode": topology_mode,
            "podium_accuracy": podium_accuracy,
            "scm": scm,
            "lap_spread_ms": lap_spread,
            "race_time_deltas_ms": deltas,
            "rank_changes_vs_gold": rank_changes_vs_gold,
            "tier_crossing_count": tier_crossings,
            "curvature_index_ms": curvature_index,
        },
        "engine": {
            "model_version": out.get("metadata", {}).get("model_version"),
            "model_params_signature": out.get("metadata", {}).get("model_params_signature"),
            "num_iterations": out.get("metadata", {}).get("num_iterations"),
        },
        "driver_set": driver_set_summary,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Run concordance metrics against one Gold race.")
    parser.add_argument("--race-id", required=True, help="Gold race folder name, e.g. 2024_1_bahrain")
    parser.add_argument("--track-id", default=None, help="Engine track id override (default: derived from race-id)")
    parser.add_argument("--gold-root", default=os.path.join("backend", "data", "gold", "v1"))
    parser.add_argument("--iterations", type=int, default=300, help="Rigorous engine iterations per run")
    parser.add_argument("--runs", type=int, default=5, help="Number of deterministic runs for mean/std")
    parser.add_argument("--seed", type=int, default=42, help="Base seed")
    parser.add_argument("--focus-driver", default="VER")
    parser.add_argument("--optimizer-iterations", type=int, default=120, help="Per-driver optimizer iterations for pit topology")
    parser.add_argument("--lock-gold-strategy", action="store_true", default=True)
    parser.add_argument("--deterministic-mode", action="store_true", help="Disable stochastic race dynamics for structural ranking test")
    parser.add_argument("--zero-gamma", action="store_true", help="Force quadratic tyre degradation terms to zero")
    parser.add_argument("--pure-additive-test", action="store_true", help="Pure additive constant-lap integrity test")
    parser.add_argument(
        "--isolation-mode",
        choices=[
            "none",
            "fuel_only",
            "compound_only",
            "linear_degradation_only",
            "fuel_compound",
            "fuel_linear_degradation",
            "compound_linear_degradation",
        ],
        default="none",
        help="Deterministic term isolation on top of pure-additive baseline",
    )
    parser.add_argument(
        "--keep-pits-in-isolation",
        action="store_true",
        help="When using isolation-mode, keep Gold pit events enabled.",
    )
    parser.add_argument("--no-ml", action="store_true", help="Disable ML-enriched driver priors")
    parser.add_argument("--pace-spread-scale", type=float, default=1.0, help="Scale intrinsic pace deltas around grid mean")
    parser.add_argument("--alpha-scale", type=float, default=1.0, help="Scale tyre alpha coefficients")
    parser.add_argument("--compound-scale", type=float, default=1.0, help="Scale compound baseline offsets")
    parser.add_argument("--force-gold-rank-intrinsic", action="store_true", help="Force intrinsic ordering from Gold classification ranks")
    parser.add_argument("--force-rank-step-ms", type=float, default=100.0, help="Per-rank intrinsic offset in ms when forcing Gold rank")
    parser.add_argument("--out", default=None)
    args = parser.parse_args()

    paths = _gold_paths(args.gold_root, args.race_id)
    classification = _load_json(paths["classification"])
    pit_events = _load_json(paths["pit_events"])
    gold_stints = _load_json(paths["stint_sequences"]) if os.path.exists(paths["stint_sequences"]) else {}
    manifest_hash = _sha256_file(paths["manifest"]) if os.path.exists(paths["manifest"]) else None

    gold_positions = _gold_positions(classification)
    gold_pits = _gold_pits_by_driver(pit_events)
    track_id = args.track_id or _race_slug_to_track_id(args.race_id)
    model_params: Dict[str, float] = {}
    if args.deterministic_mode:
        model_params = {
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
    if args.zero_gamma:
        model_params.update(
            {
                "tyre_gamma_soft": 0.0,
                "tyre_gamma_medium": 0.0,
                "tyre_gamma_hard": 0.0,
            }
        )
    if args.pure_additive_test:
        model_params.update(
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
                "tyre_thermal_penalty": 0.0,
                "tyre_traffic_penalty": 0.0,
                "tyre_fuel_penalty": 0.0,
                "lap_noise_sigma_ms": 0.0,
                "traffic_near_gap_ms": 0.0,
                "traffic_mid_gap_ms": 0.0,
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
                "disable_pit_events": 1.0,
            }
        )
    if args.isolation_mode != "none":
        # Start from pure additive baseline, then re-enable one deterministic term.
        model_params.update(
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
                "tyre_thermal_penalty": 0.0,
                "tyre_traffic_penalty": 0.0,
                "tyre_fuel_penalty": 0.0,
                "lap_noise_sigma_ms": 0.0,
                "traffic_near_gap_ms": 0.0,
                "traffic_mid_gap_ms": 0.0,
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
                "disable_pit_events": 1.0,
            }
        )
        if args.isolation_mode == "fuel_only":
            model_params.update({"fuel_coeff": 0.035})
        elif args.isolation_mode == "compound_only":
            model_params.update(
                {
                    "compound_base_soft_ms": 0.0,
                    "compound_base_medium_ms": 350.0,
                    "compound_base_hard_ms": 750.0,
                }
            )
        elif args.isolation_mode == "linear_degradation_only":
            model_params.update(
                {
                    "tyre_alpha_soft": 0.90,
                    "tyre_alpha_medium": 0.65,
                    "tyre_alpha_hard": 0.43,
                }
            )
        elif args.isolation_mode == "fuel_compound":
            model_params.update(
                {
                    "fuel_coeff": 0.035,
                    "compound_base_soft_ms": 0.0,
                    "compound_base_medium_ms": 350.0,
                    "compound_base_hard_ms": 750.0,
                }
            )
        elif args.isolation_mode == "fuel_linear_degradation":
            model_params.update(
                {
                    "fuel_coeff": 0.035,
                    "tyre_alpha_soft": 0.90,
                    "tyre_alpha_medium": 0.65,
                    "tyre_alpha_hard": 0.43,
                }
            )
        elif args.isolation_mode == "compound_linear_degradation":
            model_params.update(
                {
                    "compound_base_soft_ms": 0.0,
                    "compound_base_medium_ms": 350.0,
                    "compound_base_hard_ms": 750.0,
                    "tyre_alpha_soft": 0.90,
                    "tyre_alpha_medium": 0.65,
                    "tyre_alpha_hard": 0.43,
                }
            )
        if args.keep_pits_in_isolation:
            model_params["disable_pit_events"] = 0.0
    # Global interaction compression/expansion controls for diagnostics.
    if args.alpha_scale != 1.0:
        model_params.update(
            {
                "tyre_alpha_soft": 0.90 * float(args.alpha_scale),
                "tyre_alpha_medium": 0.65 * float(args.alpha_scale),
                "tyre_alpha_hard": 0.43 * float(args.alpha_scale),
            }
        )
    if args.compound_scale != 1.0:
        model_params.update(
            {
                "compound_base_soft_ms": 0.0 * float(args.compound_scale),
                "compound_base_medium_ms": 350.0 * float(args.compound_scale),
                "compound_base_hard_ms": 750.0 * float(args.compound_scale),
            }
        )
    forced_rank_offsets_ms: Dict[str, float] = {}
    if args.force_gold_rank_intrinsic:
        for driver, rank in gold_positions.items():
            forced_rank_offsets_ms[driver] = float(max(0, rank - 1) * args.force_rank_step_ms)

    rows: List[Dict[str, Any]] = []
    for run_idx in range(args.runs):
        run_seed = args.seed + run_idx
        rows.append(
            run_once(
                race_id=args.race_id,
                track_id=track_id,
                gold_positions=gold_positions,
                gold_pits=gold_pits,
                iterations=args.iterations,
                seed=run_seed,
                focus_driver=args.focus_driver,
                optimizer_iterations=args.optimizer_iterations,
                gold_stints=gold_stints,
                lock_gold_strategy=args.lock_gold_strategy,
                model_params=model_params,
                use_ml=not args.no_ml,
                pace_spread_scale=args.pace_spread_scale,
                forced_rank_offsets_ms=forced_rank_offsets_ms,
            )
        )

    pos_vals = [r["metrics"]["position_mae"] for r in rows]
    tau_vals = [r["metrics"]["kendall_tau"] for r in rows]
    pit_vals = [r["metrics"]["pit_mae"] for r in rows]
    topo_vals = [r["metrics"]["topology_match"] for r in rows]
    podium_vals = [r["metrics"]["podium_accuracy"] for r in rows]
    scm_vals = [r["metrics"]["scm"] for r in rows]
    spread_vals = [r["metrics"]["lap_spread_ms"] for r in rows]
    rank_change_vals = [float(r["metrics"]["rank_changes_vs_gold"]) for r in rows]
    tier_crossing_vals = [float(r["metrics"]["tier_crossing_count"]) for r in rows]
    curvature_vals = [float(r["metrics"]["curvature_index_ms"]) for r in rows]
    p1p20_vals = [r["metrics"]["race_time_deltas_ms"]["p1_vs_p20_ms"] for r in rows if r["metrics"]["race_time_deltas_ms"]["p1_vs_p20_ms"] is not None]
    p1p5_vals = [r["metrics"]["race_time_deltas_ms"]["p1_vs_p5_ms"] for r in rows if r["metrics"]["race_time_deltas_ms"]["p1_vs_p5_ms"] is not None]
    p10p15_vals = [r["metrics"]["race_time_deltas_ms"]["p10_vs_p15_ms"] for r in rows if r["metrics"]["race_time_deltas_ms"]["p10_vs_p15_ms"] is not None]

    report = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "race_id": args.race_id,
        "track_id": track_id,
        "iterations_per_run": args.iterations,
        "runs": args.runs,
        "seed_base": args.seed,
        "focus_driver": args.focus_driver,
        "gold_manifest_sha256": manifest_hash,
        "engine_model_version": rows[0]["engine"]["model_version"] if rows else None,
        "model_params_signature": rows[0]["engine"]["model_params_signature"] if rows else None,
        "deterministic_mode": bool(args.deterministic_mode),
        "zero_gamma": bool(args.zero_gamma),
        "pure_additive_test": bool(args.pure_additive_test),
        "isolation_mode": args.isolation_mode,
        "keep_pits_in_isolation": bool(args.keep_pits_in_isolation),
        "pace_spread_scale": float(args.pace_spread_scale),
        "alpha_scale": float(args.alpha_scale),
        "compound_scale": float(args.compound_scale),
        "force_gold_rank_intrinsic": bool(args.force_gold_rank_intrinsic),
        "force_rank_step_ms": float(args.force_rank_step_ms),
        "metrics": {
            "position_mae": _metric_summary(pos_vals),
            "kendall_tau": _metric_summary(tau_vals),
            "pit_mae": _metric_summary(pit_vals),
            "topology_match": _metric_summary(topo_vals),
            "podium_accuracy": _metric_summary(podium_vals),
            "lap_spread_ms": _metric_summary(spread_vals),
            "race_time_deltas_ms": {
                "p1_vs_p20_ms": _metric_summary(p1p20_vals) if p1p20_vals else {"mean": 0.0, "std": 0.0},
                "p1_vs_p5_ms": _metric_summary(p1p5_vals) if p1p5_vals else {"mean": 0.0, "std": 0.0},
                "p10_vs_p15_ms": _metric_summary(p10p15_vals) if p10p15_vals else {"mean": 0.0, "std": 0.0},
            },
            "rank_changes_vs_gold": _metric_summary(rank_change_vals),
            "tier_crossing_count": _metric_summary(tier_crossing_vals),
            "curvature_index_ms": _metric_summary(curvature_vals),
        },
        "driver_set_summary": rows[0].get("driver_set", {}) if rows else {},
        "scm": _metric_summary(scm_vals),
        "topology_mode": rows[0]["metrics"]["topology_mode"] if rows else "unknown",
        "run_details": rows,
    }

    out_path = args.out or os.path.join("backend", "reports", f"concordance_{args.race_id}.json")
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    print(
        json.dumps(
            {
                "race_id": args.race_id,
                "runs": args.runs,
                "iterations_per_run": args.iterations,
                "position_mae_mean": report["metrics"]["position_mae"]["mean"],
                "kendall_tau_mean": report["metrics"]["kendall_tau"]["mean"],
                "pit_mae_mean": report["metrics"]["pit_mae"]["mean"],
                "topology_match_mean": report["metrics"]["topology_match"]["mean"],
                "scm_mean": report["scm"]["mean"],
                "out": out_path,
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
