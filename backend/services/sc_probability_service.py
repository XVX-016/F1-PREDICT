from typing import Dict, List

from models.domain import TrackModel


class SafetyCarProbabilityService:
    model_version = "sc_hazard_v1"

    def lap_window_probabilities(
        self,
        track: TrackModel,
        weather_delta: float = 0.0,
        lap_count: int | None = None,
    ) -> List[float]:
        total_laps = lap_count or track.laps
        base = max(0.0, min(1.0, float(track.sc_probability_base)))
        weather_boost = max(0.0, weather_delta) * 0.15
        overtake_boost = (1.0 - float(track.overtaking_difficulty)) * 0.04

        profile: List[float] = []
        for lap in range(1, total_laps + 1):
            opening = 0.03 if lap <= 5 else 0.0
            closing = 0.02 if lap >= total_laps - 5 else 0.0
            value = min(0.95, base + weather_boost + overtake_boost + opening + closing)
            profile.append(value)
        return profile

    def summary(self, track: TrackModel, weather_delta: float = 0.0) -> Dict[str, float | str]:
        profile = self.lap_window_probabilities(track, weather_delta, track.laps)
        return {
            "model_version": self.model_version,
            "base_probability": float(track.sc_probability_base),
            "peak_probability": max(profile) if profile else float(track.sc_probability_base),
        }


sc_probability_service = SafetyCarProbabilityService()
