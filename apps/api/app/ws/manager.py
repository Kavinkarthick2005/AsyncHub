import asyncio
import logging
from collections import defaultdict
from typing import Dict, List
from fastapi import WebSocket

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        # Maps (channel, id) -> list of WebSockets
        self.active_connections: Dict[tuple, List[WebSocket]] = defaultdict(list)
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket, channel: str, entity_id: str):
        await websocket.accept()
        key = (channel, entity_id)
        async with self._lock:
            self.active_connections[key].append(websocket)
        logger.info(f"Client connected to {channel}:{entity_id}. Total: {len(self.active_connections[key])}")

    async def disconnect(self, websocket: WebSocket, channel: str, entity_id: str):
        key = (channel, entity_id)
        async with self._lock:
            if key in self.active_connections and websocket in self.active_connections[key]:
                self.active_connections[key].remove(websocket)
                if not self.active_connections[key]:
                    del self.active_connections[key]
        logger.info(f"Client disconnected from {channel}:{entity_id}.")

    async def broadcast(self, channel: str, entity_id: str, message: dict):
        key = (channel, entity_id)
        websockets = self.active_connections.get(key, [])
        if not websockets:
            return
            
        dead_sockets = []
        for ws in websockets:
            try:
                await ws.send_json(message)
            except Exception as e:
                logger.warning(f"Failed to send to websocket: {e}")
                dead_sockets.append(ws)
                
        if dead_sockets:
            async with self._lock:
                for ws in dead_sockets:
                    if key in self.active_connections and ws in self.active_connections[key]:
                        self.active_connections[key].remove(ws)
                if key in self.active_connections and not self.active_connections[key]:
                    del self.active_connections[key]

# Global instance
manager = ConnectionManager()
