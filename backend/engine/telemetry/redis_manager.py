import json
import redis
from typing import Optional, Dict, Any, List

class RedisTelemetryStore:
    def __init__(self, host="localhost", port=6379):
        try:
            self.r = redis.Redis(
                host=host,
                port=port,
                decode_responses=True
            )
            self.r.ping()
        except Exception:
            # Redis is optional - allow init to succeed but methods will need to handle self.r failures
            # We don't log here because the main manager already logs the warning
            self.r = None

    def set_status(self, race_id: str, payload: dict):
        """Sets the current live status of the race."""
        if self.r:
            self.r.set(f"race:{race_id}:status", json.dumps(payload))

    def get_status(self, race_id: str) -> Optional[dict]:
        """Gets the current live status."""
        if not self.r:
            return None
        raw = self.r.get(f"race:{race_id}:status")
        return json.loads(raw) if raw else None

    def set_replay_lap(self, race_id: str, lap: int, payload: dict):
        """Stores a specific lap state for replay."""
        # Using explicit schema keys for clarity
        if self.r:
            self.r.set(f"race:{race_id}:replay:lap:{lap}", json.dumps(payload))

    def get_replay_lap(self, race_id: str, lap: int) -> Optional[dict]:
        """Retrieves a specific lap state for replay."""
        if not self.r:
            return None
        raw = self.r.get(f"race:{race_id}:replay:lap:{lap}")
        return json.loads(raw) if raw else None

    def set_replay_meta(self, race_id: str, payload: dict):
        """Stores metadata about the replay (source, max laps, etc)."""
        if self.r:
            self.r.set(f"race:{race_id}:replay:meta", json.dumps(payload))
    
    def get_replay_meta(self, race_id: str) -> Optional[dict]:
        if not self.r:
            return None
        raw = self.r.get(f"race:{race_id}:replay:meta")
        return json.loads(raw) if raw else None

    def add_decision(self, race_id: str, lap: int, decision: dict):
        """Logs a strategy decision or failure for analysis."""
        if self.r:
            self.r.rpush(f"race:{race_id}:decisions:lap:{lap}", json.dumps(decision))

    def get_decisions(self, race_id: str, lap: int) -> List[dict]:
        """Retrieves decisions/actions for a specific lap."""
        if not self.r:
            return []
        raw_list = self.r.lrange(f"race:{race_id}:decisions:lap:{lap}", 0, -1)
        return [json.loads(x) for x in raw_list]
