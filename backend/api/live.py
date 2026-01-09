"""
Live updates API - WebSocket and Server-Sent Events (SSE)
Uses WebSocket for real-time updates, SSE as fallback
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.responses import EventSourceResponse
from realtime.live_session import live_session_manager
import json
import time
import asyncio
import logging
from typing import Optional

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/live", tags=["live"])

@router.websocket("/{race_id}/ws")
async def websocket_endpoint(websocket: WebSocket, race_id: str):
    """
    WebSocket endpoint for live race updates.
    Pushes lap and sector data without polling.
    """
    await live_session_manager.handle_client(websocket, race_id)

@router.get("/{race_id}")
async def live_updates_sse(race_id: str):
    """
    SSE endpoint for live race updates (fallback for clients that don't support WebSocket)
    
    Streams:
        - Current positions
        - Lap times
        - Probabilities (updated)
    """
    async def stream():
        while True:
            try:
                # Get live data (placeholder - would integrate with FastF1 live timing)
                data = {
                    "race_id": race_id,
                    "timestamp": time.time(),
                    "positions": [],  # Would be populated from live timing
                    "lap_times": [],
                    "probabilities": {}  # Would be updated probabilities
                }
                
                yield f"data: {json.dumps(data)}\n\n"
                await asyncio.sleep(5)  # Update every 5 seconds
                
            except Exception as e:
                logger.error(f"Error in live stream: {e}")
                yield f"event: error\ndata: {json.dumps({'error': str(e)})}\n\n"
                break
    
    return EventSourceResponse(stream())

