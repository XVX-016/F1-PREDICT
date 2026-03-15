import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from database.supabase_client import get_db

logger = logging.getLogger(__name__)


class SimulationHistoryService:
    def _db(self):
        try:
            return get_db()
        except Exception as exc:
            logger.warning("Supabase unavailable for simulation history: %s", exc)
            return None

    def record_run(
        self,
        race_id: str,
        request_payload: Dict[str, Any],
        response_payload: Dict[str, Any],
        user_id: Optional[str] = None,
        comparison_payload: Optional[Dict[str, Any]] = None,
    ) -> None:
        db = self._db()
        if not db:
            return

        metadata = response_payload.get("metadata", {}) if isinstance(response_payload, dict) else {}
        record = {
            "race_id": race_id,
            "simulation_params": request_payload,
            "win_probabilities": response_payload.get("win_probability", {}),
            "podium_probabilities": response_payload.get("podium_probability", {}),
            "best_strategy_recommendation": response_payload.get("strategy_recommendation"),
            "seed": request_payload.get("seed"),
            "model_version": metadata.get("model_version", "unknown"),
            "response_blob": response_payload,
            "comparison_blob": comparison_payload,
            "user_id": user_id,
            "created_at": datetime.utcnow().isoformat(),
        }

        try:
            db.table("strategy_results").insert(record).execute()
        except Exception as exc:
            logger.warning("Failed to persist simulation history for %s: %s", race_id, exc)

    def list_recent_runs(
        self,
        race_id: Optional[str] = None,
        user_id: Optional[str] = None,
        limit: int = 10,
    ) -> List[Dict[str, Any]]:
        db = self._db()
        if not db:
            return []

        try:
            query = db.table("strategy_results").select("*").order("created_at", desc=True).limit(limit)
            if race_id:
                query = query.eq("race_id", race_id)
            if user_id:
                query = query.eq("user_id", user_id)
            response = query.execute()
            return response.data or []
        except Exception as exc:
            logger.warning("Failed to read simulation history: %s", exc)
            return []


simulation_history_service = SimulationHistoryService()
