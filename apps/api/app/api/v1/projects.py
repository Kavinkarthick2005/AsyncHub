from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.queue import QueueCreate, QueueResponse
from app.services.queue_service import QueueService
from typing import List
from uuid import UUID

router = APIRouter()

def get_queue_service(db: AsyncSession = Depends(get_db)) -> QueueService:
    return QueueService(db)

@router.get("/{project_id}/queues", response_model=List[QueueResponse])
async def list_queues(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    queue_service: QueueService = Depends(get_queue_service)
):
    try:
        return await queue_service.get_project_queues(project_id, current_user.id)
    except Exception as e:
        raise HTTPException(status_code=403, detail=str(e))

@router.post("/{project_id}/queues", response_model=QueueResponse, status_code=status.HTTP_201_CREATED)
async def create_queue(
    project_id: UUID,
    queue_in: QueueCreate,
    current_user: User = Depends(get_current_user),
    queue_service: QueueService = Depends(get_queue_service)
):
    try:
        return await queue_service.create_queue(project_id, queue_in, current_user.id)
    except Exception as e:
        raise HTTPException(status_code=403, detail=str(e))
