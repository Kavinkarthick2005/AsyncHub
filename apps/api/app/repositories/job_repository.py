from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.models.job import Job, JobEvent
from app.schemas.job import JobCreate
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone

class JobRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, job_id: UUID) -> Optional[Job]:
        stmt = select(Job).options(selectinload(Job.events)).where(Job.id == job_id)
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def get_by_queue(self, queue_id: UUID, status: Optional[str] = None, skip: int = 0, limit: int = 100) -> List[Job]:
        stmt = select(Job).options(selectinload(Job.events)).where(Job.queue_id == queue_id)
        if status:
            stmt = stmt.where(Job.status == status)
        
        stmt = stmt.order_by(Job.created_at.desc()).offset(skip).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    # IMPORTANT: This method does NOT commit! The service must call commit() to ensure atomicity.
    async def create_with_event(self, queue_id: UUID, job_in: JobCreate) -> Job:
        job = Job(
            queue_id=queue_id,
            name=job_in.name,
            payload=job_in.payload,
            priority=job_in.priority,
            max_retries=job_in.max_retries,
            idempotency_key=job_in.idempotency_key,
            status="queued"
        )
        self.session.add(job)
        await self.session.flush() # Flush to get the job.id for the event

        event = JobEvent(
            job_id=job.id,
            from_status=None,
            to_status="queued",
            message="Job enqueued"
        )
        self.session.add(event)
        
        # We do NOT commit here to let the service handle the transaction.
        return job
