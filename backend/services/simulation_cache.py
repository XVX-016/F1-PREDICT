import hashlib
import json
import logging
from typing import Any, Dict, Optional

from dependencies import get_redis_client

logger = logging.getLogger(__name__)

SIMULATION_CACHE_TTL_SECONDS = 15 * 60


def _stable_json(payload: Dict[str, Any]) -> str:
    return json.dumps(payload, sort_keys=True, separators=(",", ":"), default=str)


def normalize_simulation_request(payload: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "iterations": int(payload.get("iterations", 10000)),
        "seed": payload.get("seed"),
        "use_ml": bool(payload.get("use_ml", True)),
        "params": payload.get("params", {}) or {},
        "events": payload.get("events", []) or [],
    }


def build_simulation_cache_key(race_id: str, payload: Dict[str, Any], suffix: str = "simulation") -> str:
    normalized = normalize_simulation_request(payload)
    digest = hashlib.sha256(_stable_json(normalized).encode("utf-8")).hexdigest()
    return f"{suffix}:{race_id}:{digest}"


def read_cache(cache_key: str) -> Optional[Dict[str, Any]]:
    redis_client = get_redis_client()
    if not redis_client:
        return None

    try:
        cached = redis_client.get(cache_key)
        return json.loads(cached) if cached else None
    except Exception as exc:
        logger.warning("Simulation cache read failed for %s: %s", cache_key, exc)
        return None


def write_cache(cache_key: str, payload: Dict[str, Any], ttl_seconds: int = SIMULATION_CACHE_TTL_SECONDS) -> None:
    redis_client = get_redis_client()
    if not redis_client:
        return

    try:
        redis_client.set(cache_key, _stable_json(payload), ex=ttl_seconds)
    except Exception as exc:
        logger.warning("Simulation cache write failed for %s: %s", cache_key, exc)
