"""
Race API endpoints
Exposes track-first simulation and real strategy optimization.
"""
from fastapi import APIRouter, HTTPException, Query
import os
import json
import glob
import logging
from typing import Dict, Any, Optional, List, Union
import math
from services.simulation_engine import simulation_engine
from services.simulation_cache import build_simulation_cache_key, normalize_simulation_request, read_cache, write_cache
from services.simulation_history_service import simulation_history_service
from database.supabase_client import get_db
from models.domain import SimulationRequest, SimulationResponse, RaceTimeline, SimulationRunOutput
from dependencies import get_redis_client
from datetime import datetime

logger = logging.getLogger(__name__)

router = APIRouter(tags=["races"])

def _resolve_replay_prefix(race_id: str, cache_dir: str) -> str:
    if not os.path.isdir(cache_dir):
        return race_id
    # Exact match first.
    if glob.glob(os.path.join(cache_dir, f"{race_id}_*.json")):
        return race_id
    target = race_id.lower()
    prefixes = set()
    for fname in os.listdir(cache_dir):
        if not fname.endswith(".json"):
            continue
        base = fname[:-5]
        if "_" not in base:
            continue
        prefix = base.rsplit("_", 1)[0]
        prefixes.add(prefix)
    matches = [p for p in prefixes if p.lower() == target]
    return matches[0] if matches else race_id

def _list_replay_prefixes(cache_dir: str) -> Dict[str, int]:
    available: Dict[str, set] = {}
    if not os.path.isdir(cache_dir):
        return {}
    for fname in os.listdir(cache_dir):
        if not fname.endswith(".json"):
            continue
        base = fname[:-5]
        if "_" not in base:
            continue
        prefix, driver = base.rsplit("_", 1)
        if not prefix or not driver:
            continue
        available.setdefault(prefix, set()).add(driver)
    return {prefix: len(drivers) for prefix, drivers in available.items()}

def _flatten_cache_payload(payload: Union[List[Dict[str, Any]], Dict[str, Any]]) -> List[Dict[str, Any]]:
    if isinstance(payload, list):
        return payload
    if not isinstance(payload, dict):
        return []
    entries = [(k, v) for k, v in payload.items() if isinstance(v, list)]
    if not entries:
        return []
    bucketed = all("_" in k for k, _ in entries)
    if bucketed:
        entries.sort(key=lambda kv: int(kv[0].split("_", 1)[0]))
        return [item for _, bucket in entries for item in bucket]
    # Treat as lap-keyed dict when possible
    entries.sort(key=lambda kv: int(kv[0]) if str(kv[0]).isdigit() else kv[0])
    flattened: List[Dict[str, Any]] = []
    for lap_key, bucket in entries:
        lap_number = int(lap_key) if str(lap_key).isdigit() else None
        for frame in bucket:
            if isinstance(frame, dict) and lap_number is not None and "lap" not in frame:
                frame = {**frame, "lap": lap_number}
            flattened.append(frame)
    return flattened

def _downsample_frames(frames: List[Dict[str, Any]], max_frames: Optional[int], stride: Optional[int]) -> List[Dict[str, Any]]:
    if not frames:
        return frames
    if stride is None:
        if not max_frames or max_frames <= 0 or len(frames) <= max_frames:
            return frames
        stride = max(1, math.ceil(len(frames) / max_frames))
    if stride <= 1:
        return frames
    sampled = frames[::stride]
    if sampled and sampled[-1] is not frames[-1]:
        sampled.append(frames[-1])
    return sampled

def _list_bucket_files_for_prefix(prefix: str, bucket: str = "race-telemetry") -> List[str]:
    """
    List telemetry files in Supabase storage for a race prefix.
    Works in deployed/serverless environments where local replay_cache is unavailable.
    """
    try:
        db = get_db()
    except Exception as e:
        logger.warning(f"Supabase client unavailable for bucket listing: {e}")
        return []

    try:
        # Keep listing bounded; current payload size is < 1k files in practice.
        rows = db.storage.from_(bucket).list(
            path="",
            options={"limit": 1000, "offset": 0, "search": f"{prefix}_" if prefix else ".json"}
        )
        names = [row.get("name") for row in (rows or []) if isinstance(row, dict) and row.get("name")]
        if prefix:
            return [name for name in names if name.startswith(f"{prefix}_") and name.endswith(".json")]
        return [name for name in names if name.endswith(".json")]
    except Exception as e:
        logger.warning(f"Failed to list Supabase storage files for prefix {prefix}: {e}")
        return []

@router.get("/replay/available")
async def get_replay_available():
    cache_dir = os.path.join(os.path.dirname(__file__), '..', 'data', 'replay_cache')
    prefixes = _list_replay_prefixes(cache_dir)
    supabase_url = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
    if supabase_url:
        remote_files = _list_bucket_files_for_prefix("")
        for fname in remote_files:
            base = fname[:-5] if fname.endswith(".json") else fname
            if "_" not in base:
                continue
            prefix, _driver = base.rsplit("_", 1)
            prefixes[prefix] = prefixes.get(prefix, 0) + 1
    return {
        "available": sorted(prefixes.keys()),
        "drivers": prefixes,
        "generated_at": datetime.utcnow().isoformat()
    }

@router.get("/")
async def get_races(season: int = 2026):
    """Get race calendar."""
    try:
        db = get_db()
        response = db.table("races").select("*").order("round").execute()
        races = response.data
        if season:
             races = [r for r in races if r.get('season') == season]
        return races
    except Exception as e:
        logger.error(f"Error fetching races: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch races")

@router.post("/{race_id}/simulate", response_model=SimulationResponse)
async def simulate_race(race_id: str, request: SimulationRequest):
    """
    Executes a high-fidelity Monte Carlo simulation (default 10k iterations).
    """
    try:
        request.track_id = race_id
        logger.info(f"Triggering track-first simulation for {race_id}")
        request_payload = request.model_dump()
        cache_key = build_simulation_cache_key(race_id, request_payload)
        cached = read_cache(cache_key)
        if cached:
            return SimulationResponse(**cached)

        results = simulation_engine.run_simulation(request)
        
        # Add metadata transparency
        if not results.metadata:
            results.metadata = {}
        
        results.metadata.update({
            "source": "simulation_engine",
            "is_fallback": False,
            "generated_at": datetime.utcnow().isoformat(),
            "cache_key": cache_key,
        })

        response_payload = results.model_dump()
        write_cache(cache_key, response_payload)
        simulation_history_service.record_run(
            race_id=race_id,
            request_payload=normalize_simulation_request(request_payload),
            response_payload=response_payload,
            user_id=(request.params or {}).get("user_id"),
        )
        return results
    except Exception as e:
        logger.error(f"Simulation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")


@router.post("/{race_id}/simulate-rigorous", response_model=SimulationRunOutput)
async def simulate_race_rigorous(race_id: str, request: SimulationRequest):
    """
    Executes the canonical race-state Monte Carlo engine.
    This endpoint returns strict SimulationRunOutput for decision analytics.
    """
    try:
        request.track_id = race_id
        logger.info(f"Triggering rigorous simulation for {race_id}")
        return simulation_engine.run_rigorous_output(request)
    except Exception as e:
        logger.error(f"Rigorous simulation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Rigorous simulation failed: {str(e)}")


@router.get("/{race_id}/history")
async def get_simulation_history(
    race_id: str,
    user_id: Optional[str] = Query(default=None),
    limit: int = Query(default=10, ge=1, le=50),
):
    return {
        "race_id": race_id,
        "runs": simulation_history_service.list_recent_runs(race_id=race_id, user_id=user_id, limit=limit),
    }


@router.get("/history/recent")
async def get_recent_simulation_history(
    user_id: Optional[str] = Query(default=None),
    limit: int = Query(default=10, ge=1, le=50),
):
    return {
        "runs": simulation_history_service.list_recent_runs(user_id=user_id, limit=limit),
    }

@router.get("/{race_id}/timeline", response_model=RaceTimeline)
async def get_race_timeline(race_id: str, source: str = "REPLAY"):
    """
    Fetches the full race timeline from Redis or Simulation cache.
    """
    try:
        # For now, we fetch from Redis (REPLAY source)
        # In a real app, this would query the race:{race_id}:replay:lap:* keys
        r = get_redis_client()
        
        source = "redis"
        is_fallback = False
        
        meta = {}
        laps = []
        telemetry = []
        
        if r:
            # Get metadata
            meta_json = r.get(f"race:{race_id}:replay:meta") or r.get(f"race:{race_id}:meta")
            if meta_json:
                meta = json.loads(meta_json)
            
            # Get all laps
            try:
                lap_keys = r.keys(f"race:{race_id}:replay:lap:*")
                for k in sorted(lap_keys, key=lambda x: int(x.split(":")[-1])):
                    raw = r.get(k)
                    if raw:
                        laps.append(json.loads(raw))
                        continue

                    lap_data = r.hgetall(k)
                    for _, frame_json in lap_data.items():
                        laps.append(json.loads(frame_json))
            except Exception as e:
                logger.warning(f"Redis lap fetch failed: {e}")
        else:
            logger.warning("Redis unavailable, falling back to local cache.")
            source = "local_cache"
            is_fallback = True

        # Fallback logic for both metadata and data
        if not meta:
            meta = {
                "race_id": race_id,
                "source": source,
                "is_fallback": is_fallback,
                "generated_at": datetime.utcnow().isoformat()
            }
        else:
            meta.update({
                "source": source,
                "is_fallback": is_fallback,
                "generated_at": datetime.utcnow().isoformat()
            })

        telemetry_urls = {}
        lap_count = int(meta.get("lap_count") or meta.get("max_lap") or 0)
        total_time_ms = int(meta.get("total_time_ms") or 0)
        cache_dir = os.path.join(os.path.dirname(__file__), '..', 'data', 'replay_cache')
        resolved_race_id = _resolve_replay_prefix(race_id, cache_dir)
        files = glob.glob(os.path.join(cache_dir, f"{resolved_race_id}_*.json"))
        supabase_url = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
        remote_files: List[str] = []

        # In cloud/serverless deployments, local cache is usually empty.
        # If Supabase is configured, discover files directly from storage bucket.
        if not files and supabase_url:
            remote_files = _list_bucket_files_for_prefix(resolved_race_id)

        has_local = len(files) > 0
        has_remote = len(remote_files) > 0
        if (has_local or has_remote) and not telemetry:
            # Infer lap/time metadata from one representative driver cache when missing.
            if (lap_count <= 0 or total_time_ms <= 0) and has_local:
                try:
                    with open(files[0], "r", encoding="utf-8") as sample_f:
                        sample_data = json.load(sample_f)
                    if isinstance(sample_data, dict):
                        numeric_laps = [int(k) for k in sample_data.keys() if str(k).isdigit()]
                        if numeric_laps and lap_count <= 0:
                            lap_count = max(numeric_laps)
                        if total_time_ms <= 0:
                            max_t = 0.0
                            for frames in sample_data.values():
                                if isinstance(frames, list):
                                    for frame in frames:
                                        if isinstance(frame, dict):
                                            max_t = max(max_t, float(frame.get("t", 0.0) or 0.0))
                            total_time_ms = int(max_t * 1000) if max_t < 1e5 else int(max_t)
                    elif isinstance(sample_data, list):
                        if lap_count <= 0:
                            lap_count = max((int(frame.get("lap", 1)) for frame in sample_data if isinstance(frame, dict)), default=0)
                        if total_time_ms <= 0:
                            max_t = max((float(frame.get("t", 0.0) or 0.0) for frame in sample_data if isinstance(frame, dict)), default=0.0)
                            total_time_ms = int(max_t * 1000) if max_t < 1e5 else int(max_t)
                except Exception as e:
                    logger.warning(f"Could not infer replay metadata from cache for {race_id}: {e}")

            if supabase_url:
                source_files = [os.path.basename(fpath) for fpath in files] if has_local else remote_files
                logger.info(f"Mapping {len(source_files)} telemetry files to Supabase for {resolved_race_id}")
                for fname in source_files:
                    parts = fname.replace(".json", "").split("_")
                    if len(parts) >= 2:
                        driver_code = parts[-1]
                        storage_url = f"{supabase_url}/storage/v1/object/public/race-telemetry/{fname}"
                        telemetry_urls[driver_code] = storage_url
            else:
                # Local development fallback: stream telemetry via API endpoints.
                logger.info(f"Mapping {len(files)} telemetry files to local API for {resolved_race_id}")
                for fpath in files:
                    fname = os.path.basename(fpath)
                    parts = fname.replace(".json", "").split("_")
                    if len(parts) >= 2:
                        driver_code = parts[-1]
                        telemetry_urls[driver_code] = f"/api/races/{resolved_race_id}/telemetry/{driver_code}"
        elif not has_local and not has_remote:
            logger.warning(f"No telemetry found for {race_id}")
        
        if lap_count > 0:
            meta["lap_count"] = lap_count

        return RaceTimeline(
            meta=meta,
            laps=laps,
            telemetry=telemetry,
            telemetry_urls=telemetry_urls if telemetry_urls else None,
            summary={"total_time_ms": total_time_ms}
        )
    except Exception as e:
        logger.error(f"Failed to fetch timeline: {e}")
        raise HTTPException(status_code=500, detail=f"Timeline fetch failed: {str(e)}")

@router.get("/{race_id}/telemetry/{driver_code}")
async def get_driver_telemetry(
    race_id: str,
    driver_code: str,
    max_frames: Optional[int] = None,
    stride: Optional[int] = None
):
    """
    Local telemetry passthrough endpoint for replay development.
    Returns cached JSON exactly as produced by ingestion scripts.
    """
    try:
        cache_dir = os.path.join(os.path.dirname(__file__), '..', 'data', 'replay_cache')
        resolved_race_id = _resolve_replay_prefix(race_id, cache_dir)
        cache_file = os.path.join(cache_dir, f"{resolved_race_id}_{driver_code.upper()}.json")
        if not os.path.exists(cache_file):
            raise HTTPException(status_code=404, detail="Telemetry not found")
        with open(cache_file, "r", encoding="utf-8") as f:
            payload = json.load(f)
        if max_frames or stride:
            frames = _flatten_cache_payload(payload)
            return _downsample_frames(frames, max_frames, stride)
        return payload
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Telemetry fetch failed for {race_id}/{driver_code}: {e}")
        raise HTTPException(status_code=500, detail="Telemetry fetch failed")

@router.get("/{race_id}/markets")
async def get_race_markets(race_id: str):
    """Returns fantasy markets derived from the simulation node."""
    # This could eventually call simulation_engine for live odds
    return {
        "race_id": race_id,
        "markets": [
            {"driver_id": "VER", "market_type": "WINNER", "probability": 0.45, "odds": 2.2},
            {"driver_id": "NOR", "market_type": "WINNER", "probability": 0.25, "odds": 4.0}
        ]
    }
