"""
Ingestion Verification Tests
Enforces invariants for REPLAY frames.
"""
import pytest
import pandas as pd
from unittest.mock import MagicMock, patch
import sys
import os

from models.domain import LapFrame
from scripts.fastf1_to_redis import ingest_race

class TestReplayInvariants:
    """
    Validation for strict separation of REPLAY vs SIMULATION data.
    """
    
    def test_replay_has_no_simulated_fields(self):
        """
        Invariant Check: Replay frames MUST NOT have simulated fields derived from physics.
        """
        # Create a mock LapFrame as produced by the ingestion script
        frame = LapFrame(
            lap=1,
            driver_id="VER",
            lap_time_ms=90000.0,
            compound="SOFT",
            position=1,
            source="REPLAY",
            # Simulated fields explicitly set to None (or defaulted)
            tyre_wear=None,
            fuel_remaining_kg=None,
            pit_this_lap=None,
        )
        
        # 1. Verify Source
        assert frame.source == "REPLAY", "Source must be REPLAY"
        
        # 2. Verify Derived Fields are None
        assert frame.tyre_wear is None, "Replay must not infer tyre wear"
        assert frame.fuel_remaining_kg is None, "Replay must not infer fuel"
        assert frame.pit_this_lap is None, "Replay must not infer granular pit logic"
        
        # 3. Verify Valid Raw Data
        assert frame.lap_time_ms == 90000.0
        assert frame.compound == "SOFT"

    @patch('scripts.fastf1_to_redis.fastf1.get_session')
    def test_ingestion_script_enforces_invariants(self, mock_get_session):
        """
        Test that the actual script logic adheres to the invariants.
        """
        mock_redis = MagicMock()
        
        # Mock FastF1 Session
        mock_session = MagicMock()
        mock_session.total_laps = 1
        
        # Mock Laps Data
        mock_laps = pd.DataFrame({
            'LapNumber': [1],
            'Driver': ['VER'],
            'LapTime': [pd.Timedelta(seconds=90)],
            'Compound': ['SOFT'],
            'Position': [1.0]
        })
        mock_session.laps = mock_laps
        mock_session.event.Circuit.get.return_value.get.return_value = "Bahrain"
        
        mock_get_session.return_value = mock_session
        
        # Run Ingestion
        ingest_race(2024, "Bahrain", redis_client=mock_redis)
        
        # helper to inspect calls
        _, kwargs = mock_redis.hset.call_args_list[0]
        
        args = mock_redis.hset.call_args
        # args[0] is (name, key, value)
        stored_json = args[0][2]
        
        # Parse back to LapFrame
        frame = LapFrame.parse_raw(stored_json)
        
        assert frame.source == "REPLAY"
        assert frame.tyre_wear is None
        assert frame.fuel_remaining_kg is None
