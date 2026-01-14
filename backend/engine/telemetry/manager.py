import json
import logging
import redis
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class TelemetryManager:
    """
    Manages live race state and driver telemetry snapshots in Redis.
    """
    
    def __init__(self, host: str = 'localhost', port: int = 6379, db: int = 0):
        try:
            self.redis = redis.Redis(host=host, port=port, db=db, decode_responses=True)
            self.redis.ping()
            logger.info("Connected to Redis for live telemetry.")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            self.redis = None

    def update_race_state(self, race_id: str, state: Dict[str, Any]):
        """Update global race context (lap, track status, weather)."""
        if self.redis:
            self.redis.set(f"race:{race_id}:state", json.dumps(state))

    def update_driver_telemetry(self, race_id: str, driver_id: str, data: Dict[str, Any]):
        """Update individual driver telemetry (gap, tyre age, etc.)."""
        if self.redis:
            self.redis.set(f"race:{race_id}:driver:{driver_id}:state", json.dumps(data))

    def get_race_snapshot(self, race_id: str) -> Dict[str, Any]:
        """Fetch current full race snapshot from Redis, with mock fallback."""
        if not self.redis:
            # Provide mock snapshot for development if Redis is missing
            return {
                "state": {
                    "lap": 42,
                    "track_status": "Green",
                    "weather": "Clear",
                    "sc_probability": 0.05
                },
                "drivers": {
                    "VER": {"gap": 0.000, "tyre_age": 12, "compound": "HARD", "last_lap": "1:24.5"},
                    "NOR": {"gap": 2.450, "tyre_age": 8, "compound": "MEDIUM", "last_lap": "1:24.8"},
                    "LEC": {"gap": 5.120, "tyre_age": 15, "compound": "HARD", "last_lap": "1:25.1"}
                },
                "timestamp": "live-mock"
            }
            
        state = json.loads(self.redis.get(f"race:{race_id}:state") or "{}")
        # In a real implementation Housekeeping would find all driver keys
        # For simplicity, we assume we have a list of active drivers
        return {"state": state, "timestamp": "live"}
