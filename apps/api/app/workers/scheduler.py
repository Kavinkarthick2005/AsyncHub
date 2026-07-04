import asyncio
import logging
import signal
import sys
from datetime import datetime, timezone

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from croniter import croniter

from app.db.session import AsyncSessionLocal
from app.models.schedule import Schedule
from app.models.job import Job, JobEvent

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("scheduler_engine")

class SchedulerEngine:
    def __init__(self):
        self.is_shutting_down = False

    async def _evaluate_schedules(self):
        # First, find IDs of schedules that are due (without locking all of them for a long time)
        async with AsyncSessionLocal() as session:
            now = datetime.now(timezone.utc)
            stmt = select(Schedule.id).where(
                Schedule.is_active == True,
                (Schedule.next_run_at <= now) | (Schedule.next_run_at == None)
            )
            result = await session.execute(stmt)
            schedule_ids = result.scalars().all()

        # Then, process each schedule in its own isolated transaction
        for schedule_id in schedule_ids:
            try:
                async with AsyncSessionLocal() as session:
                    now = datetime.now(timezone.utc)
                    # Lock only this specific schedule
                    stmt = (
                        select(Schedule)
                        .where(Schedule.id == schedule_id)
                        .with_for_update(skip_locked=True)
                    )
                    result = await session.execute(stmt)
                    schedule = result.scalars().first()
                    
                    if not schedule or not schedule.is_active or (schedule.next_run_at and schedule.next_run_at > now):
                        # Another scheduler instance might have already processed it, or it was paused
                        continue

                    logger.info(f"Triggering schedule {schedule.id} ({schedule.name})")
                    
                    # 1. Create the job
                    job = Job(
                        queue_id=schedule.queue_id,
                        name=f"{schedule.name} - Scheduled Execution",
                        payload=schedule.payload_template,
                        status="queued"
                    )
                    session.add(job)
                    await session.flush()
                    
                    event = JobEvent(
                        job_id=job.id,
                        from_status=None,
                        to_status="queued",
                        message=f"Created from schedule {schedule.id}"
                    )
                    session.add(event)
                    
                    # 2. Calculate next run at using croniter
                    cron = croniter(schedule.cron_expression, now)
                    next_run = cron.get_next(datetime)
                    
                    # NOTE ON MISSED SCHEDULES:
                    # By calculating from `now` instead of `schedule.next_run_at`, we explicitly choose to 
                    # SKIP missed executions if the scheduler was down for a long time, rather than rapidly catching up.
                    
                    # 3. Update schedule
                    schedule.last_run_at = now
                    schedule.next_run_at = next_run
                    
                    logger.info(f"Schedule {schedule.id} triggered. Next run at: {next_run}")
                    
                    # 4. Commit everything as a single atomic unit
                    await session.commit()
                    
            except Exception as e:
                logger.error(f"Failed to process schedule {schedule_id}: {e}")
                # We can choose to deactivate it on persistent failure, but we do this carefully.
                async with AsyncSessionLocal() as error_session:
                    try:
                        err_stmt = select(Schedule).where(Schedule.id == schedule_id)
                        err_res = await error_session.execute(err_stmt)
                        err_sch = err_res.scalars().first()
                        if err_sch:
                            err_sch.is_active = False
                            await error_session.commit()
                            logger.info(f"Deactivated failing schedule {schedule_id}")
                    except Exception as inner_e:
                        logger.error(f"Failed to deactivate schedule {schedule_id}: {inner_e}")

    async def main_loop(self):
        logger.info("Starting scheduler loop...")
        while not self.is_shutting_down:
            try:
                await self._evaluate_schedules()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in scheduler loop: {e}")
            
            # Sleep until the start of the next 10-second interval
            await asyncio.sleep(10)

    def trigger_shutdown(self, sig):
        logger.info(f"Received signal {sig}, initiating graceful shutdown...")
        self.is_shutting_down = True

async def run_scheduler():
    engine = SchedulerEngine()
    
    loop = asyncio.get_running_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            loop.add_signal_handler(sig, lambda s=sig: engine.trigger_shutdown(s))
        except NotImplementedError:
            signal.signal(sig, lambda s, f: engine.trigger_shutdown(s))
    
    try:
        await engine.main_loop()
    except asyncio.CancelledError:
        pass
    finally:
        logger.info("Scheduler shutdown complete.")

if __name__ == "__main__":
    try:
        asyncio.run(run_scheduler())
    except KeyboardInterrupt:
        pass
