from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.job_repository import JobRepository
from app.repositories.queue_repository import QueueRepository
from app.services.queue_service import QueueService
from app.schemas.job import JobCreate
from app.models.job import Job
from typing import List, Optional
from uuid import UUID

class JobService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.job_repo = JobRepository(session)
        self.queue_repo = QueueRepository(session)
        self.queue_service = QueueService(session)

    async def _verify_queue_access(self, queue_id: UUID, user_id: UUID, required_roles: List[str]):
        queue = await self.queue_repo.get_by_id(queue_id)
        if not queue:
            raise ValueError("Queue not found")
        await self.queue_service._verify_project_access(queue.project_id, user_id, required_roles)
        return queue

    async def get_queue_jobs(self, queue_id: UUID, user_id: UUID, status: Optional[str] = None) -> List[Job]:
        await self._verify_queue_access(queue_id, user_id, ["owner", "admin", "developer", "viewer"])
        return await self.job_repo.get_by_queue(queue_id, status)

    async def get_job_by_id(self, job_id: UUID, user_id: UUID) -> Job:
        job = await self.job_repo.get_by_id(job_id)
        if not job:
            raise ValueError("Job not found")
        await self._verify_queue_access(job.queue_id, user_id, ["owner", "admin", "developer", "viewer"])
        return job

    async def enqueue_job(self, queue_id: UUID, job_in: JobCreate, user_id: UUID) -> Job:
        # Check permissions: only owner/admin/developer can enqueue
        await self._verify_queue_access(queue_id, user_id, ["owner", "admin", "developer"])

        # Create job and job_event in a single transaction
        # SQLAlchemy async session automatically begins a transaction on the first query.
        # We can also use an explicit begin/commit block if we prefer, but session.commit()
        # will commit all pending adds (both job and event).
        
        try:
            job = await self.job_repo.create_with_event(queue_id, job_in)
            await self.session.commit()
            
            # Retrieve job again to eager load events for the response
            return await self.job_repo.get_by_id(job.id)
        except Exception as e:
            await self.session.rollback()
            raise ValueError(f"Failed to enqueue job: {str(e)}")

    async def enqueue_batch_jobs(self, queue_id: UUID, jobs_in: List[JobCreate], user_id: UUID) -> dict:
        await self._verify_queue_access(queue_id, user_id, ["owner", "admin", "developer"])
        try:
            created_jobs = await self.job_repo.create_batch(queue_id, jobs_in)
            await self.session.commit()
            return {
                "accepted": len(created_jobs),
                "failed": len(jobs_in) - len(created_jobs),
                "job_ids": [j.id for j in created_jobs]
            }
        except Exception as e:
            await self.session.rollback()
            raise ValueError(f"Failed to enqueue batch jobs: {str(e)}")

    async def replay_job(self, job_id: UUID, user_id: UUID) -> Job:
        job = await self.get_job_by_id(job_id, user_id)
        if job.status != "dead":
            raise ValueError(f"Only dead jobs can be replayed. Current status: {job.status}")

        # Reset job state
        from app.models.job import JobEvent
        job.status = "queued"
        job.retries = 0
        job.error_message = None

        event = JobEvent(
            job_id=job.id,
            from_status="dead",
            to_status="queued",
            message="Job manually replayed"
        )
        self.session.add(event)
        
        try:
            await self.session.commit()
            return await self.get_job_by_id(job.id, user_id)
        except Exception as e:
            await self.session.rollback()
            raise ValueError(f"Failed to replay job: {str(e)}")
