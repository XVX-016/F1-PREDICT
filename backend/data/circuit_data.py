from typing import Dict
from models.domain import TrackModel, TrackTyreWearFactors

# Centralized track baseline data (Deterministic Physics)
# Sources: Historical average lap times, FIA circuit maps, and SC statistics.
CIRCUIT_BASELINES: Dict[str, TrackModel] = {
    "abu_dhabi": TrackModel(
        id="abu_dhabi",
        name="Yas Marina Circuit",
        laps=58,
        lap_length_km=5.281,
        base_lap_time=86.5,
        pit_loss_seconds=22.5,
        sc_probability_base=0.18,
        tyre_wear_factors=TrackTyreWearFactors(soft=0.08, medium=0.04, hard=0.02),
        overtaking_difficulty=0.75,
        weather_variance=0.1
    ),
    "bahrain": TrackModel(
        id="bahrain",
        name="Sakhir International Circuit",
        laps=57,
        lap_length_km=5.412,
        base_lap_time=91.4,
        pit_loss_seconds=23.1,
        sc_probability_base=0.12,
        tyre_wear_factors=TrackTyreWearFactors(soft=0.12, medium=0.06, hard=0.03),
        overtaking_difficulty=0.4,
        weather_variance=0.05
    ),
    "jeddah": TrackModel(
        id="jeddah",
        name="Jeddah Corniche Circuit",
        laps=50,
        lap_length_km=6.174,
        base_lap_time=88.2,
        pit_loss_seconds=20.5,
        sc_probability_base=0.50,
        tyre_wear_factors=TrackTyreWearFactors(soft=0.07, medium=0.03, hard=0.015),
        overtaking_difficulty=0.6,
        weather_variance=0.01
    ),
    "melbourne": TrackModel(
        id="melbourne",
        name="Albert Park Circuit",
        laps=58,
        lap_length_km=5.278,
        base_lap_time=77.8,
        pit_loss_seconds=19.5,
        sc_probability_base=0.45,
        tyre_wear_factors=TrackTyreWearFactors(soft=0.10, medium=0.05, hard=0.025),
        overtaking_difficulty=0.8,
        weather_variance=0.15
    ),
    "suzuka": TrackModel(
        id="suzuka",
        name="Suzuka International Racing Course",
        laps=53,
        lap_length_km=5.807,
        base_lap_time=89.5,
        pit_loss_seconds=21.8,
        sc_probability_base=0.25,
        tyre_wear_factors=TrackTyreWearFactors(soft=0.15, medium=0.08, hard=0.04),
        overtaking_difficulty=0.9,
        weather_variance=0.2
    ),
    "monaco": TrackModel(
        id="monaco",
        name="Circuit de Monaco",
        laps=78,
        lap_length_km=3.337,
        base_lap_time=72.9,
        pit_loss_seconds=24.5,
        sc_probability_base=0.80,
        tyre_wear_factors=TrackTyreWearFactors(soft=0.05, medium=0.02, hard=0.01),
        overtaking_difficulty=1.0,
        weather_variance=0.05
    )
}

def get_track_baseline(track_id: str) -> TrackModel:
    """Returns the baseline for a track, or Abu Dhabi as default."""
    return CIRCUIT_BASELINES.get(track_id, CIRCUIT_BASELINES["abu_dhabi"])
