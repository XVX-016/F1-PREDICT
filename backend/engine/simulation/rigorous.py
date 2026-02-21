"""
Rigorous Monte Carlo race-state simulator.
Vectorized batch core with common random numbers (CRN) for pit EV evaluation.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple
import hashlib
import json
import numpy as np

from models.domain import (
    DriverModel,
    DriverSimulationProfile,
    LapState,
    PitDecisionProfile,
    PitEVPoint,
    SimulationRunOutput,
    StintModel,
    TrackModel,
)


@dataclass
class RandomStreams:
    sc_roll: np.ndarray
    vsc_roll: np.ndarray
    dnf_roll: np.ndarray
    lap_noise: np.ndarray
    cliff_roll: np.ndarray
    cliff_mag: np.ndarray
    traffic_near: np.ndarray
    traffic_mid: np.ndarray
    sc_intensity: np.ndarray
    pass_stream: np.ndarray
    push_stream: np.ndarray


@dataclass
class RigorousModelParams:
    fuel_coeff: float = 0.035
    fuel_burn_per_lap: float = 1.6
    traffic_near_gap_ms: float = 700.0
    traffic_mid_gap_ms: float = 1400.0
    traffic_energy_scale: float = 900.0
    push_base: float = 0.55
    push_gap_weight: float = 0.25
    push_fuel_weight: float = 0.10
    push_noise_weight: float = 0.15
    thermal_push_gain: float = 0.06
    thermal_traffic_gain: float = 0.03
    thermal_sc_cool: float = 0.08
    thermal_fuel_cool: float = 0.02
    thermal_max: float = 1.8
    engine_push_gain: float = 0.03
    engine_high_fuel_gain: float = 0.02
    engine_sc_cool: float = 0.03
    engine_max: float = 1.8
    compound_base_soft_ms: float = 0.0
    compound_base_medium_ms: float = 350.0
    compound_base_hard_ms: float = 750.0
    tyre_alpha_soft: float = 0.90
    tyre_alpha_medium: float = 0.65
    tyre_alpha_hard: float = 0.43
    tyre_gamma_soft: float = 0.012
    tyre_gamma_medium: float = 0.010
    tyre_gamma_hard: float = 0.008
    tyre_thermal_penalty: float = 180.0
    tyre_traffic_penalty: float = 45.0
    tyre_fuel_penalty: float = 22.0
    # Fuel-degradation orthogonalization controls:
    # coupling_scale -> 0 removes bilinear curvature channel, 1 keeps full legacy strength.
    # center_ratio is the neutral point for centered fuel residual.
    fuel_deg_coupling_scale: float = 0.08
    fuel_deg_center_ratio: float = 0.50
    # Stability target for normalized fuel-deg interaction relative to intrinsic gap.
    interaction_ratio_target: float = 3.0
    tyre_cliff_base: float = 0.015
    tyre_cliff_thermal_boost: float = 0.025
    tyre_cliff_cap: float = 0.75
    hazard_lap_term: float = 0.0012
    hazard_thermal_term: float = 0.0018
    hazard_engine_term: float = 0.0011
    hazard_traffic_term: float = 0.0008
    hazard_sc_multiplier: float = 1.25
    hazard_vsc_multiplier: float = 1.10
    hazard_prob_cap: float = 0.20
    sc_penalty_ms: float = 12000.0
    vsc_penalty_ms: float = 5000.0
    sc_intensity_lap_factor: float = 0.04
    overtake_dirty_air_penalty: float = 160.0
    overtake_gap_scale: float = 520.0
    overtake_logit_tau: float = 210.0
    overtake_pass_delta_ms: float = 90.0
    overtake_max_gap_ms: float = 900.0
    overtake_min_delta_ms: float = 180.0
    lap_noise_sigma_ms: float = 45.0
    sc_compress_gap_ms: float = 500.0
    vsc_compress_gap_ms: float = 1000.0
    disable_pit_events: float = 0.0

    @classmethod
    def from_overrides(cls, overrides: Optional[Dict[str, float]]) -> "RigorousModelParams":
        if not overrides:
            return cls()
        base = cls()
        for key, value in overrides.items():
            if hasattr(base, key):
                try:
                    setattr(base, key, float(value))
                except (TypeError, ValueError):
                    continue
        return base

    def signature(self) -> str:
        payload = json.dumps(self.__dict__, sort_keys=True, separators=(",", ":"))
        return hashlib.sha256(payload.encode("utf-8")).hexdigest()[:16]


class RigorousSimulationEngine:
    """
    Stochastic race-state simulation with explicit lap decomposition:
    lap_time = base - fuel + tyre + traffic + track_state + noise.
    """

    def run(
        self,
        race_id: str,
        track: TrackModel,
        driver_profiles: Dict[str, DriverModel],
        iterations: int,
        seed: Optional[int] = None,
        focus_driver: str = "VER",
        model_params: Optional[Dict[str, float]] = None,
        strategy_plan: Optional[Dict[str, Any]] = None,
    ) -> SimulationRunOutput:
        params = RigorousModelParams.from_overrides(model_params)
        rng = np.random.default_rng(seed)
        driver_ids = list(driver_profiles.keys())
        if not driver_ids:
            return SimulationRunOutput(
                metadata={"race_id": race_id, "total_laps": track.laps, "num_iterations": iterations, "seed": seed, "model_version": "v4.1.0-rigorous-crn"},
                lap_states=[],
                drivers=[],
                pit_decision_profile=None,
            )

        focus = focus_driver if focus_driver in driver_profiles else driver_ids[0]
        focus_idx = driver_ids.index(focus)
        streams = self._build_random_streams(
            rng,
            iterations,
            track.laps,
            len(driver_ids),
            lap_noise_sigma_ms=params.lap_noise_sigma_ms,
        )
        race_times, state_idx, compression, dnf_lap, pos_history, lap_time_mean, gap_mean = self._simulate_batch(
            track=track,
            driver_ids=driver_ids,
            profiles=driver_profiles,
            streams=streams,
            params=params,
            pit_lap=None,
            focus_idx=focus_idx,
            track_positions=True,
            strategy_plan=strategy_plan,
        )

        lap_state_series = self._build_lap_states(state_idx, compression)
        finish_counts = self._build_finish_counts(race_times, len(driver_ids))
        dnf_hazard_counts = self._build_dnf_counts(dnf_lap, track.laps)
        volatility_index = self._build_position_volatility_index(pos_history)
        finite_mask = np.isfinite(race_times)
        safe_times = np.where(finite_mask, race_times, np.nan)
        mean_race_time = np.nanmean(safe_times, axis=0)

        pit_iterations = min(300, max(100, iterations // 4))
        pit_streams = self._build_random_streams(
            np.random.default_rng(seed if seed is None else seed + 73),
            pit_iterations,
            track.laps,
            len(driver_ids),
            lap_noise_sigma_ms=params.lap_noise_sigma_ms,
        )
        pit_ev_curve = self._compute_pit_ev_curve(
            track=track,
            driver_ids=driver_ids,
            profiles=driver_profiles,
            streams=pit_streams,
            params=params,
            focus_idx=focus_idx,
        )

        driver_outputs: List[DriverSimulationProfile] = []
        for i, d in enumerate(driver_ids):
            dist = {
                pos + 1: float(count / iterations)
                for pos, count in enumerate(finish_counts[i])
            }
            dnf_timeline = [
                float(count / iterations) for count in dnf_hazard_counts[i].tolist()
            ]

            tyre_management = driver_profiles[d].tyre_management
            stint_model = StintModel(
                compound="medium",
                degradation_curve=[
                    round(self._deterministic_tyre_degradation(lap, tyre_management), 3)
                    for lap in range(1, track.laps + 1)
                ],
                cliff_lap_probability=[
                    round(min(0.015 * lap * (1.05 - tyre_management), 0.60), 4)
                    for lap in range(1, track.laps + 1)
                ],
            )

            driver_outputs.append(
                DriverSimulationProfile(
                    driver_id=d,
                    finishing_position_distribution=dist,
                    stint_models=[stint_model],
                    pit_ev=pit_ev_curve if i == focus_idx else [],
                    dnf_hazard_timeline=dnf_timeline,
                    lap_time_profile=[float(x) for x in lap_time_mean[:, i].tolist()],
                    gap_profile=[float(x) for x in gap_mean[:, i].tolist()],
                    position_profile=(
                        [float(x) for x in np.mean(pos_history[:, :, i], axis=0).tolist()]
                        if pos_history is not None
                        else []
                    ),
                )
            )

        pit_profile = self._build_pit_decision_profile(pit_ev_curve)
        return SimulationRunOutput(
            metadata={
                "race_id": race_id,
                "total_laps": track.laps,
                "num_iterations": iterations,
                "seed": seed,
                "model_version": "v4.1.0-rigorous-crn",
                "model_params_signature": params.signature(),
                "position_volatility_index": {
                    driver_ids[i]: float(volatility_index[i]) for i in range(len(driver_ids))
                },
                "driver_mean_race_time_ms": {
                    driver_ids[i]: float(mean_race_time[i]) if np.isfinite(mean_race_time[i]) else float("inf")
                    for i in range(len(driver_ids))
                },
            },
            lap_states=lap_state_series,
            drivers=driver_outputs,
            pit_decision_profile=pit_profile,
        )

    def _build_random_streams(
        self,
        rng: np.random.Generator,
        iterations: int,
        total_laps: int,
        n_drivers: int,
        lap_noise_sigma_ms: float = 45.0,
    ) -> RandomStreams:
        shape = (iterations, total_laps, n_drivers)
        return RandomStreams(
            sc_roll=rng.random((iterations, total_laps)),
            vsc_roll=rng.random((iterations, total_laps)),
            dnf_roll=rng.random(shape),
            lap_noise=rng.normal(0.0, lap_noise_sigma_ms, size=shape),
            cliff_roll=rng.random(shape),
            cliff_mag=rng.uniform(450.0, 1450.0, size=shape),
            traffic_near=rng.random(shape),
            traffic_mid=rng.random(shape),
            sc_intensity=rng.random((iterations, total_laps)),
            pass_stream=rng.random(shape),
            push_stream=rng.random(shape),
        )

    def _compute_pit_ev_curve(
        self,
        track: TrackModel,
        driver_ids: List[str],
        profiles: Dict[str, DriverModel],
        streams: RandomStreams,
        params: RigorousModelParams,
        focus_idx: int,
    ) -> List[PitEVPoint]:
        candidates = sorted(
            set(
                max(8, int(track.laps * ratio))
                for ratio in (0.30, 0.35, 0.40, 0.45, 0.50, 0.55, 0.60)
            )
        )
        out: List[PitEVPoint] = []
        for pit_lap in candidates:
            race_times, _, _, _, _, _, _ = self._simulate_batch(
                track=track,
                driver_ids=driver_ids,
                profiles=profiles,
                streams=streams,
                params=params,
                pit_lap=pit_lap,
                focus_idx=focus_idx,
            )
            order = np.argsort(race_times, axis=1)
            inv = np.empty_like(order)
            inv[np.arange(order.shape[0])[:, None], order] = np.arange(order.shape[1])[None, :]
            positions = inv[:, focus_idx] + 1
            arr = positions.astype(float)
            out.append(
                PitEVPoint(
                    lap=pit_lap,
                    expected_finish=float(arr.mean()),
                    variance=float(arr.var()),
                )
            )
        return out

    def _build_strategy_arrays(
        self,
        driver_ids: List[str],
        total_laps: int,
        strategy_plan: Optional[Dict[str, Any]],
    ) -> Tuple[Dict[str, List[int]], Dict[str, List[str]]]:
        default_pits = [max(12, int(total_laps * 0.30)), max(28, int(total_laps * 0.66))]
        pit_laps_by_driver: Dict[str, List[int]] = {}
        compounds_by_driver: Dict[str, List[str]] = {}
        for d in driver_ids:
            pits = list(default_pits)
            compounds = ["soft", "hard", "soft"]
            if isinstance(strategy_plan, dict):
                row = strategy_plan.get(d) or {}
                candidate_pits = row.get("pit_laps", [])
                candidate_compounds = row.get("compounds", [])
                if isinstance(candidate_pits, list) and candidate_pits:
                    pits = sorted(
                        set(
                            max(1, min(total_laps - 1, int(x)))
                            for x in candidate_pits
                            if isinstance(x, (int, float))
                        )
                    )
                if isinstance(candidate_compounds, list) and candidate_compounds:
                    compounds = [str(x).lower() for x in candidate_compounds]
            if len(compounds) < len(pits) + 1:
                compounds = compounds + [compounds[-1] if compounds else "hard"] * (len(pits) + 1 - len(compounds))
            pit_laps_by_driver[d] = pits
            compounds_by_driver[d] = compounds[: len(pits) + 1]
        return pit_laps_by_driver, compounds_by_driver

    def _simulate_batch(
        self,
        track: TrackModel,
        driver_ids: List[str],
        profiles: Dict[str, DriverModel],
        streams: RandomStreams,
        params: RigorousModelParams,
        pit_lap: Optional[int] = None,
        focus_idx: Optional[int] = None,
        track_positions: bool = False,
        strategy_plan: Optional[Dict[str, Any]] = None,
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, Optional[np.ndarray], np.ndarray, np.ndarray]:
        """
        Simulates all iterations in one batched pass using pre-sampled randomness.
        Returns:
        - race_times: [iters, drivers]
        - state_idx: [iters, laps] (0=GREEN,1=VSC,2=SC)
        - compression: [iters, laps]
        - dnf_lap: [iters, drivers] lap index (1-based), 0 if no DNF
        - pos_history: [iters, laps, drivers] if requested
        - lap_time_mean: [laps, drivers]
        - gap_mean: [laps, drivers]
        """
        total_laps = track.laps
        n_iters, _, n_drivers = streams.lap_noise.shape
        pit_loss_ms = track.pit_loss_seconds * 1000.0

        base_pace = np.array([profiles[d].pace_base_ms for d in driver_ids], dtype=float)
        sorted_base = np.sort(base_pace)
        adjacent = np.diff(sorted_base)
        intrinsic_min_gap = float(np.min(adjacent)) if adjacent.size > 0 else 1.0
        interaction_target_per_lap = (
            max(0.0, float(params.interaction_ratio_target)) * intrinsic_min_gap / max(1, total_laps)
        )
        tyre_mgmt = np.array([profiles[d].tyre_management for d in driver_ids], dtype=float)
        dnf_base = np.array([profiles[d].dnf_rate / max(total_laps, 1) for d in driver_ids], dtype=float)

        race_times = np.zeros((n_iters, n_drivers), dtype=float)
        tyre_age = np.zeros((n_iters, n_drivers), dtype=float)
        stint_age = np.zeros((n_iters, n_drivers), dtype=float)
        fuel_load = np.full((n_iters, n_drivers), float(total_laps * params.fuel_burn_per_lap), dtype=float)
        thermal_state = np.full((n_iters, n_drivers), 0.45, dtype=float)
        engine_stress = np.full((n_iters, n_drivers), 0.20, dtype=float)
        retired = np.zeros((n_iters, n_drivers), dtype=bool)
        dnf_lap = np.zeros((n_iters, n_drivers), dtype=np.int16)
        state_idx = np.zeros((n_iters, total_laps), dtype=np.int8)
        compression = np.ones((n_iters, total_laps), dtype=float)
        pos_history = np.zeros((n_iters, total_laps, n_drivers), dtype=np.int16) if track_positions else None
        fuel_initial = float(total_laps * params.fuel_burn_per_lap)
        lap_time_mean = np.zeros((total_laps, n_drivers), dtype=float)
        gap_mean = np.zeros((total_laps, n_drivers), dtype=float)
        pit_laps_by_driver, compounds_by_driver = self._build_strategy_arrays(driver_ids, total_laps, strategy_plan)
        compound_idx = np.zeros(n_drivers, dtype=np.int16)

        for lap in range(total_laps):
            p_sc, p_vsc = self._track_state_probabilities(lap + 1, total_laps, track.sc_probability_base)
            sc_mask = streams.sc_roll[:, lap] < p_sc
            vsc_mask = (~sc_mask) & (streams.vsc_roll[:, lap] < p_vsc)
            state_idx[:, lap] = np.where(sc_mask, 2, np.where(vsc_mask, 1, 0))
            compression[:, lap] = np.where(sc_mask, 0.20, np.where(vsc_mask, 0.45, 1.0))
            sc_intensity = np.where(
                state_idx[:, lap] == 2,
                0.72 + 0.28 * streams.sc_intensity[:, lap],
                np.where(
                    state_idx[:, lap] == 1,
                    0.35 + 0.25 * streams.sc_intensity[:, lap],
                    0.0,
                ),
            )

            state_col = state_idx[:, lap][:, None]
            active = ~retired

            order = np.argsort(race_times, axis=1)
            inv = np.empty_like(order)
            inv[np.arange(n_iters)[:, None], order] = np.arange(n_drivers)[None, :]
            sorted_times = np.take_along_axis(race_times, order, axis=1)
            sorted_active = np.take_along_axis(active, order, axis=1)

            gap_sorted = np.full_like(sorted_times, np.inf)
            prev_times = sorted_times[:, :-1]
            next_times = sorted_times[:, 1:]
            finite_pairs = np.isfinite(prev_times) & np.isfinite(next_times)
            gap_deltas = np.full_like(prev_times, np.inf)
            np.subtract(next_times, prev_times, out=gap_deltas, where=finite_pairs)
            gap_sorted[:, 1:] = gap_deltas
            gap_driver = np.take_along_axis(gap_sorted, inv, axis=1)

            near_mask = active & (gap_driver < params.traffic_near_gap_ms)
            mid_mask = active & (gap_driver >= params.traffic_near_gap_ms) & (gap_driver < params.traffic_mid_gap_ms)
            traffic = np.zeros_like(race_times)
            traffic += near_mask * (120.0 + 120.0 * streams.traffic_near[:, lap, :]) * compression[:, lap][:, None]
            traffic += mid_mask * (45.0 + 70.0 * streams.traffic_mid[:, lap, :]) * compression[:, lap][:, None]
            traffic_energy = np.where(
                np.isfinite(gap_driver),
                np.exp(-gap_driver / params.traffic_energy_scale),
                0.0,
            ) * active

            fuel = params.fuel_coeff * 1000.0 * (fuel_load / 100.0)
            fuel_ratio = np.clip(fuel_load / fuel_initial, 0.0, 1.0)

            push_intensity = np.clip(
                params.push_base
                + params.push_gap_weight * (1.0 - np.clip(gap_driver / 2000.0, 0.0, 1.0))
                + params.push_fuel_weight * fuel_ratio
                + params.push_noise_weight * streams.push_stream[:, lap, :],
                0.0,
                1.6,
            ) * active

            thermal_state = np.clip(
                thermal_state
                + params.thermal_push_gain * push_intensity
                + params.thermal_traffic_gain * traffic_energy
                - params.thermal_sc_cool * sc_intensity[:, None]
                - params.thermal_fuel_cool * (1.0 - fuel_ratio),
                0.0,
                params.thermal_max,
            )
            engine_stress = np.clip(
                engine_stress
                + params.engine_push_gain * push_intensity
                + params.engine_high_fuel_gain * (fuel_ratio > 0.6)
                - params.engine_sc_cool * sc_intensity[:, None],
                0.0,
                params.engine_max,
            )

            compound_base = np.zeros(n_drivers, dtype=float)
            compound_alpha = np.zeros(n_drivers, dtype=float)
            compound_gamma = np.zeros(n_drivers, dtype=float)
            for j, d in enumerate(driver_ids):
                seq = compounds_by_driver.get(d, ["soft"])
                cidx = min(compound_idx[j], len(seq) - 1)
                cname = seq[cidx]
                if cname == "soft":
                    compound_base[j] = params.compound_base_soft_ms
                    compound_alpha[j] = params.tyre_alpha_soft
                    compound_gamma[j] = params.tyre_gamma_soft
                elif cname == "medium":
                    compound_base[j] = params.compound_base_medium_ms
                    compound_alpha[j] = params.tyre_alpha_medium
                    compound_gamma[j] = params.tyre_gamma_medium
                elif cname == "hard":
                    compound_base[j] = params.compound_base_hard_ms
                    compound_alpha[j] = params.tyre_alpha_hard
                    compound_gamma[j] = params.tyre_gamma_hard
                else:
                    compound_base[j] = params.compound_base_medium_ms
                    compound_alpha[j] = params.tyre_alpha_medium
                    compound_gamma[j] = params.tyre_gamma_medium

            # Normalized fuel-degradation interaction term:
            # raw coupling is dynamically scaled so per-lap interaction spread stays
            # within target_ratio * intrinsic_min_gap / total_laps.
            fuel_resid = (fuel_ratio - params.fuel_deg_center_ratio)
            linear_deg = compound_alpha[None, :] * stint_age
            interaction_raw = (
                params.tyre_fuel_penalty
                * params.fuel_deg_coupling_scale
                * fuel_resid
                * linear_deg
            )
            # Structural normalization of the combined fuel+degradation channel.
            # This constrains geometry at source instead of clipping final lap times.
            deg_component = (
                compound_alpha[None, :] * stint_age
                + compound_gamma[None, :] * (stint_age ** 2)
            )
            fuel_deg_raw = (-fuel) + deg_component + interaction_raw
            active_counts = np.maximum(1, np.sum(active, axis=1, keepdims=True))
            fuel_deg_mean = np.sum(np.where(active, fuel_deg_raw, 0.0), axis=1, keepdims=True) / active_counts
            fuel_deg_centered = fuel_deg_raw - fuel_deg_mean
            raw_spread = np.maximum(
                np.max(np.where(active, fuel_deg_centered, -np.inf), axis=1, keepdims=True)
                - np.min(np.where(active, fuel_deg_centered, np.inf), axis=1, keepdims=True),
                1e-9,
            )
            gamma_norm = np.minimum(1.0, interaction_target_per_lap / raw_spread)
            fuel_deg_channel = fuel_deg_mean + (fuel_deg_centered * gamma_norm)

            tyre_base = (
                compound_base[None, :]
                + fuel_deg_channel
                + params.tyre_thermal_penalty * thermal_state
                + params.tyre_traffic_penalty * traffic_energy
            )
            cliff_prob = np.minimum(
                params.tyre_cliff_base * stint_age * (1.05 - tyre_mgmt)[None, :]
                + params.tyre_cliff_thermal_boost * np.clip(thermal_state - 1.0, 0.0, 1.0),
                params.tyre_cliff_cap,
            )
            cliff_hit = streams.cliff_roll[:, lap, :] < cliff_prob
            tyre = tyre_base + cliff_hit * streams.cliff_mag[:, lap, :]

            hazard = (
                dnf_base[None, :]
                + params.hazard_lap_term * ((lap + 1) / total_laps)
                + params.hazard_thermal_term * thermal_state
                + params.hazard_engine_term * engine_stress
                + params.hazard_traffic_term * traffic_energy
            )
            hazard *= np.where(state_col == 2, params.hazard_sc_multiplier, np.where(state_col == 1, params.hazard_vsc_multiplier, 1.0))
            dnf_prob = np.clip(1.0 - np.exp(-hazard), 0.0, params.hazard_prob_cap)
            new_dnf = active & (streams.dnf_roll[:, lap, :] < dnf_prob)
            dnf_lap = np.where(new_dnf & (dnf_lap == 0), lap + 1, dnf_lap)
            retired |= new_dnf
            active = ~retired

            state_penalty = (params.sc_penalty_ms * (state_col == 2)) + (params.vsc_penalty_ms * (state_col == 1))
            lap_time = (
                base_pace[None, :]
                + tyre
                + traffic
                + state_penalty
                + streams.lap_noise[:, lap, :]
            )
            lap_time = lap_time * (1.0 + params.sc_intensity_lap_factor * sc_intensity[:, None])
            race_times = np.where(active, race_times + lap_time, np.inf)

            fuel_load = np.where(active, np.maximum(0.0, fuel_load - params.fuel_burn_per_lap), fuel_load)
            tyre_age = np.where(active, tyre_age + 1.0, tyre_age)
            stint_age = np.where(active, stint_age + 1.0, stint_age)

            for j, d in enumerate(driver_ids):
                if params.disable_pit_events < 0.5 and (lap + 1) in pit_laps_by_driver.get(d, []):
                    d_active = active[:, j]
                    race_times[:, j] += d_active * pit_loss_ms
                    tyre_age[:, j] = np.where(d_active, 0.0, tyre_age[:, j])
                    stint_age[:, j] = np.where(d_active, 0.0, stint_age[:, j])
                    thermal_state[:, j] = np.where(d_active, np.maximum(0.25, thermal_state[:, j] - 0.25), thermal_state[:, j])
                    engine_stress[:, j] = np.where(d_active, np.maximum(0.15, engine_stress[:, j] - 0.08), engine_stress[:, j])
                    compound_idx[j] = min(compound_idx[j] + 1, len(compounds_by_driver.get(d, ["soft"])) - 1)

            if params.disable_pit_events < 0.5 and pit_lap is not None and focus_idx is not None and (lap + 1) == pit_lap:
                focus_active = active[:, focus_idx]
                race_times[:, focus_idx] += focus_active * pit_loss_ms
                tyre_age[:, focus_idx] = np.where(focus_active, 0.0, tyre_age[:, focus_idx])
                stint_age[:, focus_idx] = np.where(focus_active, 0.0, stint_age[:, focus_idx])
                thermal_state[:, focus_idx] = np.where(focus_active, np.maximum(0.25, thermal_state[:, focus_idx] - 0.25), thermal_state[:, focus_idx])
                engine_stress[:, focus_idx] = np.where(focus_active, np.maximum(0.15, engine_stress[:, focus_idx] - 0.08), engine_stress[:, focus_idx])

            # Probabilistic overtake dynamics for adjacent pairs in sorted field.
            order_after = np.argsort(race_times, axis=1)
            inv_after = np.empty_like(order_after)
            inv_after[np.arange(n_iters)[:, None], order_after] = np.arange(n_drivers)[None, :]
            sorted_times_after = np.take_along_axis(race_times, order_after, axis=1)
            sorted_active_after = np.take_along_axis(active, order_after, axis=1)
            sorted_lap_time = np.take_along_axis(lap_time, order_after, axis=1)
            sorted_pass_draw = np.take_along_axis(streams.pass_stream[:, lap, :], order_after, axis=1)

            delta_pace = sorted_lap_time[:, :-1] - sorted_lap_time[:, 1:]
            ahead_gap = np.full_like(sorted_times_after[:, :-1], np.inf)
            finite_ahead = np.isfinite(sorted_times_after[:, :-1]) & np.isfinite(sorted_times_after[:, 1:])
            np.subtract(
                sorted_times_after[:, 1:],
                sorted_times_after[:, :-1],
                out=ahead_gap,
                where=finite_ahead,
            )
            dirty_air_penalty = params.overtake_dirty_air_penalty * np.clip(np.exp(-ahead_gap / params.overtake_gap_scale), 0.0, 1.0)
            logits = np.clip((delta_pace - dirty_air_penalty) / params.overtake_logit_tau, -8.0, 8.0)
            pass_prob = 1.0 / (1.0 + np.exp(-logits))
            pass_event = (
                (sorted_pass_draw[:, 1:] < pass_prob)
                & sorted_active_after[:, :-1]
                & sorted_active_after[:, 1:]
                & (ahead_gap < params.overtake_max_gap_ms)
                & (delta_pace > params.overtake_min_delta_ms)
                & (state_idx[:, lap][:, None] == 0)
            )

            pass_delta_sorted = np.zeros_like(sorted_times_after)
            pass_delta_sorted[:, :-1] += pass_event * params.overtake_pass_delta_ms
            pass_delta_sorted[:, 1:] -= pass_event * params.overtake_pass_delta_ms
            pass_delta_driver = np.take_along_axis(pass_delta_sorted, inv_after, axis=1)
            race_times = np.where(active, race_times + pass_delta_driver, race_times)

            lap_time_effective = np.where(active, lap_time + pass_delta_driver, np.nan)
            valid_lap = np.isfinite(lap_time_effective)
            lap_time_sum = np.nansum(lap_time_effective, axis=0)
            lap_time_count = np.sum(valid_lap, axis=0)
            lap_time_mean[lap, :] = np.divide(
                lap_time_sum,
                np.maximum(1, lap_time_count),
                out=np.full(n_drivers, 90000.0, dtype=float),
                where=lap_time_count > 0,
            )

            scvsc_mask = state_idx[:, lap] > 0
            if np.any(scvsc_mask):
                order_after = np.argsort(race_times, axis=1)
                inv_after = np.empty_like(order_after)
                inv_after[np.arange(n_iters)[:, None], order_after] = np.arange(n_drivers)[None, :]
                sorted_times_after = np.take_along_axis(race_times, order_after, axis=1)
                sorted_active_after = np.take_along_axis(active, order_after, axis=1)
                max_gap = np.where(state_idx[:, lap] == 2, params.sc_compress_gap_ms, params.vsc_compress_gap_ms)

                sorted_times_after[:, 0] = np.where(sorted_active_after[:, 0], sorted_times_after[:, 0], np.inf)
                for pos in range(1, n_drivers):
                    bounded = np.minimum(sorted_times_after[:, pos], sorted_times_after[:, pos - 1] + max_gap)
                    sorted_times_after[:, pos] = np.where(sorted_active_after[:, pos], bounded, np.inf)
                race_times = np.take_along_axis(sorted_times_after, inv_after, axis=1)

            leader_time = np.min(race_times, axis=1, where=np.isfinite(race_times), initial=np.inf)
            gap_matrix = race_times - leader_time[:, None]
            gap_matrix = np.where(active & np.isfinite(gap_matrix), gap_matrix, np.nan)
            valid_gap = np.isfinite(gap_matrix)
            gap_sum = np.nansum(gap_matrix, axis=0)
            gap_count = np.sum(valid_gap, axis=0)
            gap_mean[lap, :] = np.divide(
                gap_sum,
                np.maximum(1, gap_count),
                out=np.zeros(n_drivers, dtype=float),
                where=gap_count > 0,
            )

            if track_positions:
                lap_order = np.argsort(race_times, axis=1)
                lap_inv = np.empty_like(lap_order)
                lap_inv[np.arange(n_iters)[:, None], lap_order] = np.arange(n_drivers)[None, :]
                pos_history[:, lap, :] = (lap_inv + 1).astype(np.int16)

        return race_times, state_idx, compression, dnf_lap, pos_history, lap_time_mean, gap_mean

    def _build_finish_counts(self, race_times: np.ndarray, n_drivers: int) -> np.ndarray:
        order = np.argsort(race_times, axis=1)
        inv = np.empty_like(order)
        inv[np.arange(order.shape[0])[:, None], order] = np.arange(order.shape[1])[None, :]
        positions = inv + 1
        counts = np.zeros((n_drivers, n_drivers), dtype=np.int64)
        for d in range(n_drivers):
            counts[d] = np.bincount(positions[:, d] - 1, minlength=n_drivers)
        return counts

    def _build_lap_states(self, state_idx: np.ndarray, compression: np.ndarray) -> List[LapState]:
        total_laps = state_idx.shape[1]
        iters = state_idx.shape[0]
        out: List[LapState] = []
        for lap in range(total_laps):
            green = int(np.sum(state_idx[:, lap] == 0))
            vsc = int(np.sum(state_idx[:, lap] == 1))
            sc = int(np.sum(state_idx[:, lap] == 2))
            dominant_idx = int(np.argmax([green, vsc, sc]))
            dominant = ("GREEN", "VSC", "SC")[dominant_idx]
            out.append(
                LapState(
                    lap=lap + 1,
                    track_state=dominant,
                    sc_probability=float((vsc + sc) / iters),
                    field_compression_factor=float(np.mean(compression[:, lap])),
                )
            )
        return out

    def _build_dnf_counts(self, dnf_lap: np.ndarray, total_laps: int) -> np.ndarray:
        n_drivers = dnf_lap.shape[1]
        out = np.zeros((n_drivers, total_laps), dtype=np.int64)
        for d in range(n_drivers):
            vals = dnf_lap[:, d]
            vals = vals[vals > 0]
            if vals.size:
                out[d] = np.bincount(vals - 1, minlength=total_laps)
        return out

    def _build_position_volatility_index(self, pos_history: Optional[np.ndarray]) -> np.ndarray:
        if pos_history is None:
            return np.array([], dtype=float)
        # Average per-lap position std across iterations for each driver.
        per_lap_std = np.std(pos_history.astype(float), axis=0)  # [laps, drivers]
        return np.mean(per_lap_std, axis=0)  # [drivers]

    def _build_pit_decision_profile(self, curve: List[PitEVPoint]) -> Optional[PitDecisionProfile]:
        if not curve:
            return None
        by_ev = sorted(curve, key=lambda p: p.expected_finish)
        best = by_ev[0]
        viable = [p.lap for p in curve if p.expected_finish <= best.expected_finish + 0.75]
        risky = [p.lap for p in curve if p.expected_finish <= best.expected_finish + 1.25]
        optimal = [p.lap for p in curve if p.expected_finish <= best.expected_finish + 0.40]
        return PitDecisionProfile(
            optimal_lap=best.lap,
            ev_curve=curve,
            confidence_bands={
                "optimal": [min(optimal), max(optimal)] if optimal else [best.lap, best.lap],
                "viable": [min(viable), max(viable)] if viable else [best.lap, best.lap],
                "closed": [max(risky) + 1 if risky else best.lap + 1, 99],
            },
        )

    def _track_state_probabilities(self, lap: int, total_laps: int, base_rate: float) -> Tuple[float, float]:
        first_lap_spike = 0.08 if lap == 1 else 0.0
        late_race_spike = 0.01 if lap > int(total_laps * 0.8) else 0.0
        hazard_sc = max(0.0, base_rate / total_laps + first_lap_spike + late_race_spike)
        hazard_vsc = max(0.0, 0.45 * hazard_sc)
        p_sc = min(0.35, 1 - np.exp(-hazard_sc))
        p_vsc = min(0.20, 1 - np.exp(-hazard_vsc))
        return p_sc, p_vsc

    def _deterministic_tyre_degradation(self, age: int, tyre_management: float) -> float:
        eff_alpha = self._blend(
            self._blend(0.90, 0.65, 0.5),
            0.43,
            0.3,
        ) * (1.0 + (1.0 - tyre_management) * 0.1)
        eff_gamma = self._blend(
            self._blend(0.012, 0.010, 0.5),
            0.008,
            0.3,
        ) * (1.0 + (1.0 - tyre_management) * 0.1)
        stint_age = max(0, age - 1)
        return float(eff_alpha * stint_age + eff_gamma * (stint_age ** 2))

    @staticmethod
    def _blend(a: float, b: float, w: float) -> float:
        return (1.0 - w) * a + w * b
