"""
Live updates API - Server-Sent Events (SSE)
"""
from fastapi import APIRouter
from fastapi.responses import EventSourceResponse
import json
import time
import asyncio
import logging
from typing import Optional

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/live", tags=["live"])

@router.get("/{race_id}")
async def live_updates(race_id: str):
    """
    SSE endpoint for live race updates
    
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

