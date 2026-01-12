"""
Live Session Updates - WebSocket/SSE
Pushes live lap and sector data via FastAPI WebSocket.
Broadcasts per race session.
No polling in frontend.
"""
from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List, Optional
import asyncio
import logging
from datetime import datetime
import json

logger = logging.getLogger(__name__)

class LiveSessionManager:
    """
    Manages WebSocket connections for live session updates.
    Broadcasts lap and sector data to connected clients.
    """
    
    def __init__(self):
        """Initialize session manager"""
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self.session_data: Dict[str, Dict] = {}
    
    async def connect(self, websocket: WebSocket, session_id: str):
        """
        Accept WebSocket connection and add to active connections
        
        Args:
            websocket: WebSocket connection
            session_id: Session identifier (race_id or session identifier)
        """
        await websocket.accept()
        
        if session_id not in self.active_connections:
            self.active_connections[session_id] = []
        
        self.active_connections[session_id].append(websocket)
        logger.info(f"WebSocket connected for session {session_id}. Total connections: {len(self.active_connections[session_id])}")
    
    def disconnect(self, websocket: WebSocket, session_id: str):
        """
        Remove WebSocket connection from active connections
        
        Args:
            websocket: WebSocket connection to remove
            session_id: Session identifier
        """
        if session_id in self.active_connections:
            if websocket in self.active_connections[session_id]:
                self.active_connections[session_id].remove(websocket)
                logger.info(f"WebSocket disconnected for session {session_id}. Remaining connections: {len(self.active_connections[session_id])}")
            
            # Clean up empty session
            if not self.active_connections[session_id]:
                del self.active_connections[session_id]
    
    async def broadcast_lap_update(
        self,
        session_id: str,
        lap_data: Dict
    ):
        """
        Broadcast lap update to all connected clients for a session
        
        Args:
            session_id: Session identifier
            lap_data: Lap data dictionary with:
                - driver_code: Driver code
                - lap_number: Lap number
                - lap_time_ms: Lap time in milliseconds
                - sector1_ms: Sector 1 time (optional)
                - sector2_ms: Sector 2 time (optional)
                - sector3_ms: Sector 3 time (optional)
                - position: Current position
                - timestamp: Timestamp of update
        """
        if session_id not in self.active_connections:
            return
        
        message = {
            "type": "lap_update",
            "session_id": session_id,
            "data": lap_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        message_json = json.dumps(message)
        disconnected = []
        
        for websocket in self.active_connections[session_id]:
            try:
                await websocket.send_text(message_json)
            except Exception as e:
                logger.error(f"Error sending message to WebSocket: {e}")
                disconnected.append(websocket)
        
        # Remove disconnected connections
        for ws in disconnected:
            self.disconnect(ws, session_id)
    
    async def broadcast_sector_update(
        self,
        session_id: str,
        sector_data: Dict
    ):
        """
        Broadcast sector update to all connected clients
        
        Args:
            session_id: Session identifier
            sector_data: Sector data dictionary with:
                - driver_code: Driver code
                - sector_number: Sector number (1, 2, or 3)
                - sector_time_ms: Sector time in milliseconds
                - timestamp: Timestamp of update
        """
        if session_id not in self.active_connections:
            return
        
        message = {
            "type": "sector_update",
            "session_id": session_id,
            "data": sector_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        message_json = json.dumps(message)
        disconnected = []
        
        for websocket in self.active_connections[session_id]:
            try:
                await websocket.send_text(message_json)
            except Exception as e:
                logger.error(f"Error sending sector update: {e}")
                disconnected.append(websocket)
        
        # Remove disconnected connections
        for ws in disconnected:
            self.disconnect(ws, session_id)
    
    async def broadcast_position_update(
        self,
        session_id: str,
        positions: List[Dict]
    ):
        """
        Broadcast position update (leaderboard) to all connected clients
        
        Args:
            session_id: Session identifier
            positions: List of position dictionaries with:
                - driver_code: Driver code
                - position: Current position
                - gap_to_leader_ms: Gap to leader in milliseconds
                - lap_number: Current lap number
        """
        if session_id not in self.active_connections:
            return
        
        message = {
            "type": "position_update",
            "session_id": session_id,
            "data": {
                "positions": positions,
                "timestamp": datetime.utcnow().isoformat()
            }
        }
        
        message_json = json.dumps(message)
        disconnected = []
        
        for websocket in self.active_connections[session_id]:
            try:
                await websocket.send_text(message_json)
            except Exception as e:
                logger.error(f"Error sending position update: {e}")
                disconnected.append(websocket)
        
        # Remove disconnected connections
        for ws in disconnected:
            self.disconnect(ws, session_id)
    
    async def handle_client(
        self,
        websocket: WebSocket,
        session_id: str
    ):
        """
        Handle WebSocket client connection
        
        Args:
            websocket: WebSocket connection
            session_id: Session identifier
        """
        await self.connect(websocket, session_id)
        
        try:
            while True:
                # Keep connection alive - client can send ping/pong
                data = await websocket.receive_text()
                
                # Handle ping/pong
                if data == "ping":
                    await websocket.send_text("pong")
                
        except WebSocketDisconnect:
            self.disconnect(websocket, session_id)
        except Exception as e:
            logger.error(f"WebSocket error: {e}")
            self.disconnect(websocket, session_id)
    
    def get_active_connections_count(self, session_id: str) -> int:
        """Get number of active connections for a session"""
        return len(self.active_connections.get(session_id, []))

# Global instance
live_session_manager = LiveSessionManager()

