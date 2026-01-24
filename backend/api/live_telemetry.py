from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import json
import asyncio
import logging
from engine.telemetry.manager import TelemetryManager

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ws", tags=["telemetry"])
telemetry = TelemetryManager()

@router.websocket("/race/{race_id}")
async def race_telemetry_stream(websocket: WebSocket, race_id: str):
    await websocket.accept()
    logger.info(f"WebSocket client connected to race {race_id}")
    
    try:
        while True:
<<<<<<< HEAD
            try:
                # In a real race, this would block on a Redis Pub/Sub or poll at 1Hz
                snapshot = telemetry.get_race_snapshot(race_id)
                await websocket.send_json(snapshot)
            except Exception as e:
                logger.error(f"Error sending telemetry snapshot: {e}")
                # Don't break the connection on transient errors, just wait and retry
            
            await asyncio.sleep(1) # 1Hz refresh rate
    except WebSocketDisconnect:
        logger.info(f"WebSocket client disconnected from race {race_id}")
    except Exception as e:
        logger.error(f"WebSocket fatal error: {e}")
=======
            # Multi-layered check for connection state
            if websocket.client_state.value == 3: # WebSocketState.DISCONNECTED
                break
            
            try:
                snapshot = telemetry.get_race_snapshot(race_id)
                await websocket.send_json(snapshot)
            except Exception as e:
                err_str = str(e).lower()
                # Catch various ways "closed" can be signaled
                if any(msg in err_str for msg in ["close", "closed", "send", "disconnect", "runtimeerror"]):
                    logger.info(f"WebSocket session for {race_id} ended.")
                else:
                    logger.error(f"Unexpected WebSocket error on race {race_id}: {e}")
                break
            
            await asyncio.sleep(1)
    except Exception as e:
        # Final catch-all for any loop-level issues
        pass
>>>>>>> feature/redis-telemetry-replay
