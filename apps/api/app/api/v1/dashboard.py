from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import Dict, Any
from uuid import UUID
from datetime import datetime, timedelta, timezone

from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.models.job import Job
from app.models.queue import Queue
from app.models.project import Project
from app.models.worker import Worker
from app.schemas.user import UserResponse

router = APIRouter()

@router.get("/overview")
async def get_dashboard_overview(
    organization_id: UUID = Query(..., description="Organization ID to scope stats"),
    db: AsyncSession = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
) -> Dict[str, Any]:
    
    # 1. Active Jobs
    # scoped to org -> projects -> queues -> jobs
    active_jobs_stmt = (
        select(func.count(Job.id))
        .join(Queue, Job.queue_id == Queue.id)
        .join(Project, Queue.project_id == Project.id)
        .where(
            and_(
                Project.org_id == organization_id,
                Job.status.in_(["queued", "running"])
            )
        )
    )
    active_jobs_res = await db.execute(active_jobs_stmt)
    active_jobs = active_jobs_res.scalar_one_or_none() or 0

    # 2. Workers Online (Currently global as workers aren't org-scoped yet)
    workers_online_stmt = select(func.count(Worker.id)).where(Worker.status == "online")
    workers_online_res = await db.execute(workers_online_stmt)
    workers_online = workers_online_res.scalar_one_or_none() or 0

    # 3. Failure Rate Last Hour
    one_hour_ago = datetime.now(timezone.utc) - timedelta(hours=1)
    
    # Count failed jobs
    failed_stmt = (
        select(func.count(Job.id))
        .join(Queue, Job.queue_id == Queue.id)
        .join(Project, Queue.project_id == Project.id)
        .where(
            and_(
                Project.org_id == organization_id,
                Job.status == "failed",
                Job.completed_at >= one_hour_ago
            )
        )
    )
    failed_res = await db.execute(failed_stmt)
    failed_count = failed_res.scalar_one_or_none() or 0
    
    # Count completed + failed jobs
    completed_stmt = (
        select(func.count(Job.id))
        .join(Queue, Job.queue_id == Queue.id)
        .join(Project, Queue.project_id == Project.id)
        .where(
            and_(
                Project.org_id == organization_id,
                Job.status.in_(["completed", "failed"]),
                Job.completed_at >= one_hour_ago
            )
        )
    )
    completed_res = await db.execute(completed_stmt)
    total_finished = completed_res.scalar_one_or_none() or 0
    
    failure_rate = (failed_count / total_finished * 100) if total_finished > 0 else 0

    return {
        "active_jobs": active_jobs,
        "workers_online": workers_online,
        "failure_rate_last_hour": round(failure_rate, 2)
    }
