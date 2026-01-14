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
        """Fetch current full race snapshot from Redis."""
        if not self.redis:
            return {}
            
        state = json.loads(self.redis.get(f"race:{race_id}:state") or "{}")
        # In a real implementation Housekeeping would find all driver keys
        # For simplicity, we assume we have a list of active drivers
        return {"state": state, "timestamp": "live"}
