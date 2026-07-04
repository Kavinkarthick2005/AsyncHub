import asyncio
import logging
from uuid import UUID
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db

from app.repositories.user_repository import UserRepository
from app.models.queue import Queue
from app.ws.manager import manager

logger = logging.getLogger(__name__)

router = APIRouter()

import jwt
from app.core.config import settings

async def get_current_user_ws(
    token: str = Query(...), 
    db: AsyncSession = Depends(get_db)
):
    """Dependency to validate JWT token from query parameter for WebSockets."""
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=["HS256"]
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
        
    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(UUID(user_id))
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

@router.websocket("/queues/{queue_id}")
async def queue_websocket_endpoint(
    websocket: WebSocket,
    queue_id: UUID,
    user = Depends(get_current_user_ws),
    db: AsyncSession = Depends(get_db)
):
    # Verify the queue exists and user has access
    # For now, minimal RBAC: any authenticated user can view if the queue exists.
    queue_res = await db.execute(select(Queue).where(Queue.id == queue_id))
    queue = queue_res.scalars().first()
    
    if not queue:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Queue not found")
        return
        
    await manager.connect(websocket, "queue", str(queue_id))
    
    # Send an initial connection success message
    await websocket.send_json({
        "type": "connection.established",
        "payload": {"queue_id": str(queue_id)}
    })
    
    try:
        while True:
            # Simple ping/pong heartbeat mechanism
            # Client must send {"type": "ping"} to keep connection alive
            data = await asyncio.wait_for(websocket.receive_json(), timeout=60.0)
            if data.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
    except asyncio.TimeoutError:
        logger.info(f"WebSocket client {user.id} timed out on queue {queue_id}")
        await manager.disconnect(websocket, "queue", str(queue_id))
    except WebSocketDisconnect:
        logger.info(f"WebSocket client {user.id} disconnected from queue {queue_id}")
        await manager.disconnect(websocket, "queue", str(queue_id))
    except Exception as e:
        logger.error(f"WebSocket error for {user.id} on queue {queue_id}: {e}")
        await manager.disconnect(websocket, "queue", str(queue_id))
