from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, text
from typing import Dict, Any, List
from uuid import UUID
from datetime import datetime, timedelta, timezone

from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.models.job import Job
from app.models.queue import Queue
from app.models.project import Project
from app.models.worker import Worker, WorkerHeartbeat
from app.models.schedule import Schedule
from app.schemas.user import UserResponse
from app.schemas.dashboard import (
    DashboardResponse, SystemHealth, OverviewMetrics, WorkerMetrics,
    ScheduleMetrics, QueueMetric, JobLatency, RetryHeatmapItem, RecentFailureItem
)

router = APIRouter()

@router.get("/overview", response_model=DashboardResponse)
async def get_dashboard_overview(
    organization_id: UUID = Query(..., description="Organization ID to scope stats"),
    db: AsyncSession = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    one_hour_ago = now - timedelta(hours=1)
    five_mins_ago = now - timedelta(minutes=5)

    # Base Join for Organization Scoping
    # Queue -> Project
    
    # --- 1. System Health ---
    # API is Healthy if this endpoint is reachable
    api_health = "Healthy"
    
    # DB Health
    try:
        await db.execute(text("SELECT 1"))
        db_health = "Healthy"
    except Exception:
        db_health = "Degraded"

    # Worker Health
    active_workers_stmt = select(func.count(Worker.id)).where(Worker.last_heartbeat >= five_mins_ago)
    active_workers_res = await db.execute(active_workers_stmt)
    active_workers_count = active_workers_res.scalar_one_or_none() or 0
    workers_health = "Healthy" if active_workers_count > 0 else "Degraded"

    # Scheduler Health (assuming scheduler updates jobs or there's a heartbeat, for now, we simulate)
    scheduler_health = "Healthy" # We will need a real heartbeat in production

    system_health = SystemHealth(
        api=api_health,
        database=db_health,
        workers=workers_health,
        scheduler=scheduler_health
    )

    # --- 2. Overview Metrics ---
    # Queued
    queued_stmt = select(func.count(Job.id)).join(Queue).join(Project).where(
        and_(Project.org_id == organization_id, Job.status == "queued")
    )
    queued_jobs = (await db.execute(queued_stmt)).scalar_one_or_none() or 0

    # Running
    running_stmt = select(func.count(Job.id)).join(Queue).join(Project).where(
        and_(Project.org_id == organization_id, Job.status == "running")
    )
    running_jobs = (await db.execute(running_stmt)).scalar_one_or_none() or 0

    # Failed (total active failed in DLQ)
    failed_stmt = select(func.count(Job.id)).join(Queue).join(Project).where(
        and_(Project.org_id == organization_id, Job.status == "failed")
    )
    failed_jobs = (await db.execute(failed_stmt)).scalar_one_or_none() or 0

    # Completed Today
    completed_today_stmt = select(func.count(Job.id)).join(Queue).join(Project).where(
        and_(
            Project.org_id == organization_id,
            Job.status == "completed",
            Job.completed_at >= today_start
        )
    )
    completed_today = (await db.execute(completed_today_stmt)).scalar_one_or_none() or 0

    overview = OverviewMetrics(
        active_jobs=queued_jobs + running_jobs,
        queued_jobs=queued_jobs,
        running_jobs=running_jobs,
        failed_jobs=failed_jobs,
        completed_today=completed_today
    )

    # --- 3. Worker Metrics ---
    # Global for now
    total_workers_stmt = select(func.count(Worker.id))
    total_workers = (await db.execute(total_workers_stmt)).scalar_one_or_none() or 0
    
    online_workers = active_workers_count
    offline_workers = total_workers - online_workers

    # Averages from heartbeats
    avg_cpu = 0.0
    avg_mem = 0.0
    
    recent_heartbeats_stmt = select(WorkerHeartbeat).where(WorkerHeartbeat.last_seen >= five_mins_ago)
    recent_heartbeats = (await db.execute(recent_heartbeats_stmt)).scalars().all()
    
    if recent_heartbeats:
        total_cpu = sum([hb.metadata_.get("cpu_usage", 0) for hb in recent_heartbeats if hb.metadata_])
        total_mem = sum([hb.metadata_.get("memory_usage", 0) for hb in recent_heartbeats if hb.metadata_])
        avg_cpu = total_cpu / len(recent_heartbeats)
        avg_mem = total_mem / len(recent_heartbeats)

    workers = WorkerMetrics(
        online=online_workers,
        offline=offline_workers,
        avg_cpu=round(avg_cpu, 2),
        avg_memory=round(avg_mem, 2)
    )

    # --- 4. Schedule Metrics ---
    active_schedules_stmt = select(func.count(Schedule.id)).join(Queue).join(Project).where(
        and_(Project.org_id == organization_id, Schedule.is_active == True)
    )
    active_schedules = (await db.execute(active_schedules_stmt)).scalar_one_or_none() or 0
    
    triggered_today_stmt = select(func.count(Schedule.id)).join(Queue).join(Project).where(
        and_(Project.org_id == organization_id, Schedule.last_run_at >= today_start)
    )
    triggered_today = (await db.execute(triggered_today_stmt)).scalar_one_or_none() or 0

    schedules = ScheduleMetrics(
        active=active_schedules,
        triggered_today=triggered_today,
        failed_today=0 # Not tracking schedule failures yet
    )

    # --- 5. Queue Metrics ---
    queues_stmt = select(Queue).join(Project).where(Project.org_id == organization_id)
    org_queues = (await db.execute(queues_stmt)).scalars().all()
    
    queue_metrics: List[QueueMetric] = []
    
    # Let's get depth and throughput grouped by queue
    depth_stmt = select(Job.queue_id, func.count(Job.id)).where(Job.status == "queued").group_by(Job.queue_id)
    depth_res = (await db.execute(depth_stmt)).all()
    depth_map = {str(q_id): count for q_id, count in depth_res}

    throughput_stmt = select(Job.queue_id, func.count(Job.id)).where(
        and_(Job.status == "completed", Job.completed_at >= one_hour_ago)
    ).group_by(Job.queue_id)
    throughput_res = (await db.execute(throughput_stmt)).all()
    throughput_map = {str(q_id): count for q_id, count in throughput_res}
    
    # Latency: time from created_at to completed_at for jobs finished in last hour
    latency_stmt = select(
        Job.queue_id,
        func.avg(func.extract('epoch', Job.completed_at) - func.extract('epoch', Job.created_at))
    ).where(
        and_(Job.status == "completed", Job.completed_at >= one_hour_ago)
    ).group_by(Job.queue_id)
    latency_res = (await db.execute(latency_stmt)).all()
    latency_map = {str(q_id): float(avg) * 1000 if avg else 0.0 for q_id, avg in latency_res}

    for q in org_queues:
        qid = str(q.id)
        queue_metrics.append(
            QueueMetric(
                id=q.id,
                name=q.name,
                depth=depth_map.get(qid, 0),
                is_paused=q.is_paused,
                throughput_1h=throughput_map.get(qid, 0),
                avg_latency_ms=round(latency_map.get(qid, 0.0), 2)
            )
        )

    # --- 6. Top Slowest Jobs ---
    slowest_stmt = select(
        Job.id, Job.name, Queue.name.label('queue_name'),
        (func.extract('epoch', Job.completed_at) - func.extract('epoch', Job.started_at)).label('duration')
    ).join(Queue).join(Project).where(
        and_(
            Project.org_id == organization_id,
            Job.status == "completed",
            Job.started_at.is_not(None),
            Job.completed_at.is_not(None)
        )
    ).order_by(text("duration DESC")).limit(5)
    
    slowest_res = (await db.execute(slowest_stmt)).all()
    slowest_jobs = [
        JobLatency(
            id=r.id,
            name=r.name,
            duration_ms=float(r.duration) * 1000 if r.duration else 0.0,
            queue_name=r.queue_name
        ) for r in slowest_res
    ]

    # --- 7. Retry Heatmap ---
    retry_stmt = select(Queue.name, func.sum(Job.retries)).join(Job, Job.queue_id == Queue.id).join(Project).where(
        and_(
            Project.org_id == organization_id,
            Job.retries > 0
        )
    ).group_by(Queue.name).order_by(func.sum(Job.retries).desc()).limit(10)
    
    retry_res = (await db.execute(retry_stmt)).all()
    retry_heatmap = [
        RetryHeatmapItem(queue_name=r.name, retry_count=int(r[1]) if r[1] else 0)
        for r in retry_res
    ]

    # --- 8. Recent Failures ---
    recent_failures_stmt = select(Job).join(Queue).join(Project).where(
        and_(
            Project.org_id == organization_id,
            Job.status == "failed"
        )
    ).order_by(Job.completed_at.desc().nullslast()).limit(5)
    
    rf_res = (await db.execute(recent_failures_stmt)).scalars().all()
    recent_failures = [
        RecentFailureItem(
            id=j.id,
            name=j.name,
            error="Job execution failed",
            failed_at=j.completed_at
        ) for j in rf_res
    ]

    return DashboardResponse(
        system_health=system_health,
        overview=overview,
        workers=workers,
        schedules=schedules,
        queues=queue_metrics,
        slowest_jobs=slowest_jobs,
        retry_heatmap=retry_heatmap,
        recent_failures=recent_failures
    )
