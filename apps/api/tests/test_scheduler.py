import pytest
import asyncio
from httpx import AsyncClient
from datetime import datetime, timezone, timedelta
from app.db.session import AsyncSessionLocal
from app.models.schedule import Schedule
from app.models.job import Job
from app.workers.scheduler import SchedulerEngine
from sqlalchemy import select

@pytest.mark.asyncio
async def test_scheduler_dispatch_and_concurrency(test_client: AsyncClient, auth_token: str, test_org_project_queue: dict):
    queue_id = test_org_project_queue["queue"].id
    
    # 1. Create a schedule due NOW
    now = datetime.now(timezone.utc)
    async with AsyncSessionLocal() as session:
        schedule = Schedule(
            name="Concurrent Schedule",
            queue_id=queue_id,
            cron_expression="* * * * *",
            payload_template={},
            is_active=True,
            next_run_at=now - timedelta(minutes=1) # definitively due
        )
        session.add(schedule)
        await session.commit()
        await session.refresh(schedule)
        schedule_id = schedule.id
        
    # 2. Setup two separate scheduler instances
    scheduler_a = SchedulerEngine()
    scheduler_b = SchedulerEngine()

    # 3. Both attempt to evaluate schedules simultaneously
    # Only one should lock the row and insert the job.
    await asyncio.gather(
        scheduler_a._evaluate_schedules(),
        scheduler_b._evaluate_schedules()
    )

    # 4. Assert exactly ONE job was created for this schedule
    async with AsyncSessionLocal() as session:
        stmt = select(Job).where(Job.queue_id == queue_id, Job.name == "Concurrent Schedule - Scheduled Execution")
        res = await session.execute(stmt)
        created_jobs = res.scalars().all()
        
        assert len(created_jobs) == 1, "Exactly one job should be created despite concurrent schedulers."
        
        # 5. Assert next_run_at was updated
        stmt_sch = select(Schedule).where(Schedule.id == schedule_id)
        sch_res = await session.execute(stmt_sch)
        updated_schedule = sch_res.scalars().first()
        
        assert updated_schedule.next_run_at > now, "next_run_at should be advanced into the future."
        assert updated_schedule.last_run_at is not None, "last_run_at should be populated."
