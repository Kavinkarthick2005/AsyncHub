from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.queue import QueueUpdate, QueueResponse
from app.schemas.job import JobCreate, JobResponse
from app.services.queue_service import QueueService
from app.services.job_service import JobService
from typing import List, Optional
from uuid import UUID

router = APIRouter()

def get_queue_service(db: AsyncSession = Depends(get_db)) -> QueueService:
    return QueueService(db)

def get_job_service(db: AsyncSession = Depends(get_db)) -> JobService:
    return JobService(db)

@router.patch("/{queue_id}", response_model=QueueResponse)
async def update_queue(
    queue_id: UUID,
    queue_in: QueueUpdate,
    current_user: User = Depends(get_current_user),
    queue_service: QueueService = Depends(get_queue_service)
):
    try:
        return await queue_service.update_queue(queue_id, queue_in, current_user.id)
    except Exception as e:
        raise HTTPException(status_code=403, detail=str(e))

@router.post("/{queue_id}/jobs", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
async def enqueue_job(
    queue_id: UUID,
    job_in: JobCreate,
    current_user: User = Depends(get_current_user),
    job_service: JobService = Depends(get_job_service)
):
    try:
        return await job_service.enqueue_job(queue_id, job_in, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=403, detail=str(e))

@router.get("/{queue_id}/jobs", response_model=List[JobResponse])
async def list_jobs(
    queue_id: UUID,
    job_status: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(get_current_user),
    job_service: JobService = Depends(get_job_service)
):
    try:
        return await job_service.get_queue_jobs(queue_id, current_user.id, status=job_status)
    except Exception as e:
        raise HTTPException(status_code=403, detail=str(e))
