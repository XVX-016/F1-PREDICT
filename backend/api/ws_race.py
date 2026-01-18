import asyncio
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from engine.telemetry.redis_manager import RedisTelemetryStore

router = APIRouter()
store = RedisTelemetryStore()

@router.get("/api/race-status/{race_id}")
def get_race_status(race_id: str):
    """
    Get current live race status (polling fallback).
    """
    status = store.get_status(race_id)
    if not status:
        # Fallback if no live data is present - likely simulation hasn't started or empty
        return {"source": "OFFLINE", "status": None}

    return {
        "source": "LIVE", 
        "data": status
    }

@router.get("/api/replay/{race_id}/meta")
def get_replay_meta(race_id: str):
    """Get metadata for a replay (max laps, source)."""
    meta = store.get_replay_meta(race_id)
    if not meta:
        return {"error": "Replay not found"}
    return meta

@router.get("/api/replay/{race_id}/{lap}")
def get_replay_lap(race_id: str, lap: int):
    """
    Get full state for a specific lap (time-travel/scrubbing).
    """
    state = store.get_replay_lap(race_id, lap)
    decisions = store.get_decisions(race_id, lap)
    
    if not state:
        return {"error": "Lap not found"}
        
    return {
        "state": state,
        "decisions": decisions
    }

@router.websocket("/ws/race/{race_id}")
async def race_ws(websocket: WebSocket, race_id: str):
    """
    Stream live race updates from Redis to Frontend.
    Strictly read-only for clients.
    """
    await websocket.accept()
    
    try:
        while True:
            try:
                # Poll Redis for latest status
                status = store.get_status(race_id)

                if status:
                    await websocket.send_text(json.dumps({
                        "type": "RACE_STATUS",
                        "source": "REDIS",
                        "payload": status
                    }))
            except Exception as e:
                # Log error and send offline status
                print(f"WS Redis Error: {e}")
                await websocket.send_text(json.dumps({
                    "type": "CONNECTION_ERROR",
                    "detail": "Data source unavailable"
                }))
            
            # 2Hz update rate is sufficient for UI
            await asyncio.sleep(0.5)
            
    except WebSocketDisconnect:
        print(f"WS disconnected: {race_id}")
    except Exception as e:
        print(f"WS Global Error: {e}")
        await websocket.close()
