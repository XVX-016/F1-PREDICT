from engine.simulation.rigorous import RigorousSimulationEngine
from models.domain import DriverModel, TrackModel, TrackTyreWearFactors


def _make_track() -> TrackModel:
    return TrackModel(
        id="test_track",
        name="Test Circuit",
        laps=20,
        lap_length_km=5.0,
        pit_loss_seconds=22.0,
        sc_probability_base=0.15,
        tyre_wear_factors=TrackTyreWearFactors(soft=0.1, medium=0.06, hard=0.03),
        overtaking_difficulty=0.5,
        weather_variance=0.1,
    )


def _make_drivers() -> dict[str, DriverModel]:
    return {
        "VER": DriverModel(
            id="VER",
            name="VER",
            team="A",
            pace_base_ms=90000,
            tyre_management=0.95,
            racecraft=0.92,
            dnf_rate=0.01,
        ),
        "NOR": DriverModel(
            id="NOR",
            name="NOR",
            team="B",
            pace_base_ms=90100,
            tyre_management=0.90,
            racecraft=0.88,
            dnf_rate=0.015,
        ),
        "LEC": DriverModel(
            id="LEC",
            name="LEC",
            team="C",
            pace_base_ms=90200,
            tyre_management=0.87,
            racecraft=0.86,
            dnf_rate=0.015,
        ),
        "PIA": DriverModel(
            id="PIA",
            name="PIA",
            team="D",
            pace_base_ms=90300,
            tyre_management=0.86,
            racecraft=0.84,
            dnf_rate=0.02,
        ),
    }


def test_rigorous_output_shape_and_probabilities():
    engine = RigorousSimulationEngine()
    output = engine.run(
        race_id="test_track",
        track=_make_track(),
        driver_profiles=_make_drivers(),
        iterations=120,
        seed=42,
        focus_driver="VER",
    )

    assert output.metadata["race_id"] == "test_track"
    assert output.metadata["total_laps"] == 20
    assert len(output.lap_states) == 20
    assert len(output.drivers) == 4

    for lap_state in output.lap_states:
        assert 0.0 <= lap_state.sc_probability <= 1.0
        assert 0.0 <= lap_state.field_compression_factor <= 1.0

    for d in output.drivers:
        total = sum(d.finishing_position_distribution.values())
        assert abs(total - 1.0) < 1e-6
        assert len(d.dnf_hazard_timeline) == 20

    assert output.pit_decision_profile is not None
    assert len(output.pit_decision_profile.ev_curve) > 0


def test_rigorous_reproducibility_same_seed():
    engine = RigorousSimulationEngine()
    track = _make_track()
    drivers = _make_drivers()

    out1 = engine.run(
        race_id="test_track",
        track=track,
        driver_profiles=drivers,
        iterations=150,
        seed=1234,
        focus_driver="VER",
    )
    out2 = engine.run(
        race_id="test_track",
        track=track,
        driver_profiles=drivers,
        iterations=150,
        seed=1234,
        focus_driver="VER",
    )

    assert out1.metadata["model_params_signature"] == out2.metadata["model_params_signature"]
    assert out1.drivers[0].finishing_position_distribution == out2.drivers[0].finishing_position_distribution
