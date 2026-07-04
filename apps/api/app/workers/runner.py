import asyncio
import logging
import signal
import sys
import uuid
import json
from datetime import datetime, timezone, timedelta
from typing import Optional

from sqlalchemy import select, update, and_, or_, text
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import AsyncSessionLocal
from app.models.job import Job, JobEvent
from app.models.queue import Queue
from app.models.worker import Worker, WorkerHeartbeat

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("worker_engine")

class WorkerEngine:
    def __init__(self, name: str = None):
        self.worker_id: Optional[uuid.UUID] = None
        self.name = name or f"worker-{uuid.uuid4().hex[:8]}"
        self.is_shutting_down = False
        self.current_job_id: Optional[uuid.UUID] = None

    async def register(self, session: AsyncSession):
        logger.info(f"Registering worker {self.name}...")
        worker = Worker(name=self.name, status="online", last_heartbeat=datetime.now(timezone.utc))
        session.add(worker)
        await session.flush()
        self.worker_id = worker.id
        logger.info(f"Worker {self.name} registered with ID: {self.worker_id}")

    async def deregister(self, session: AsyncSession):
        if not self.worker_id:
            return
        
        logger.info(f"Deregistering worker {self.name}...")
        stmt = select(Worker).where(Worker.id == self.worker_id)
        result = await session.execute(stmt)
        worker = result.scalars().first()
        
        if worker:
            worker.status = "offline"
            worker.current_job_id = None
        
        await session.commit()
        logger.info(f"Worker {self.name} marked offline.")

    async def heartbeat_and_recovery_loop(self):
        """Runs periodically to send heartbeats and recover dead workers."""
        while not self.is_shutting_down:
            try:
                async with AsyncSessionLocal() as session:
                    # 1. Update own heartbeat
                    if self.worker_id:
                        stmt = select(Worker).where(Worker.id == self.worker_id)
                        result = await session.execute(stmt)
                        worker = result.scalars().first()
                        if worker:
                            now = datetime.now(timezone.utc)
                            worker.last_heartbeat = now
                            worker.current_job_id = self.current_job_id
                            
                            # Keep history as well
                            hb = WorkerHeartbeat(worker_id=self.worker_id, last_seen=now)
                            session.add(hb)
                    
                    # 2. Dead worker recovery
                    threshold = datetime.now(timezone.utc) - timedelta(seconds=30)
                    dead_workers_stmt = select(Worker).where(
                        Worker.status == "online",
                        Worker.last_heartbeat < threshold,
                        Worker.id != self.worker_id
                    )
                    dead_workers_result = await session.execute(dead_workers_stmt)
                    dead_workers = dead_workers_result.scalars().all()
                    
                    for dead_worker in dead_workers:
                        logger.warning(f"Recovering dead worker {dead_worker.name} ({dead_worker.id})")
                        dead_worker.status = "offline"
                        
                        if dead_worker.current_job_id:
                            # Requeue the job
                            job_stmt = select(Job).where(Job.id == dead_worker.current_job_id)
                            job_res = await session.execute(job_stmt)
                            job = job_res.scalars().first()
                            
                            if job and job.status == "running":
                                logger.info(f"Requeueing job {job.id} from dead worker {dead_worker.id}")
                                job.status = "queued"
                                job.run_after = datetime.now(timezone.utc)
                                
                                event = JobEvent(
                                    job_id=job.id,
                                    from_status="running",
                                    to_status="queued",
                                    message=f"Requeued from dead worker {dead_worker.name}"
                                )
                                session.add(event)
                        
                        dead_worker.current_job_id = None
                    
                    await session.commit()
            except Exception as e:
                logger.error(f"Error in heartbeat/recovery loop: {e}")
            
            await asyncio.sleep(5)

    async def _calculate_run_after(self, job: Job, queue: Queue) -> Optional[datetime]:
        """Calculates backoff based on queue retry policy."""
        policy = queue.retry_policy or {"strategy": "exponential", "base_delay": 2}
        strategy = policy.get("strategy", "exponential")
        base_delay = policy.get("base_delay", 2)
        
        now = datetime.now(timezone.utc)
        if strategy == "exponential":
            delay_seconds = base_delay * (2 ** job.retries)
        elif strategy == "linear":
            delay_seconds = base_delay * (job.retries + 1)
        elif strategy == "fixed":
            delay_seconds = base_delay
        else:
            delay_seconds = base_delay
            
        return now + timedelta(seconds=delay_seconds)

    async def execute_job(self, payload: dict):
        """Simulate work."""
        logger.info(f"Executing job with payload: {payload}")
        if payload:
            if payload.get("action") == "fail_me":
                raise RuntimeError("Simulated job failure requested by payload")
            elif payload.get("action") == "crash_worker":
                logger.critical("Simulating hard crash! Process exiting without cleanup.")
                import os
                os._exit(1)
        
        # Simulate work
        sleep_time = payload.get("sleep", 1) if payload else 1
        await asyncio.sleep(sleep_time)

    async def main_polling_loop(self):
        """Polls for jobs and executes them serially."""
        logger.info("Starting main polling loop...")
        
        while not self.is_shutting_down:
            try:
                async with AsyncSessionLocal() as session:
                    now = datetime.now(timezone.utc)
                    
                    # Lock a job safely
                    stmt = (
                        select(Job)
                        .join(Queue, Job.queue_id == Queue.id)
                        .options(selectinload(Job.queue))
                        .where(
                            Job.status == "queued",
                            Queue.is_paused == False,
                            or_(Job.run_after == None, Job.run_after <= now)
                        )
                        .order_by(Job.priority.desc(), Job.created_at.asc())
                        .limit(1)
                        .with_for_update(skip_locked=True)
                    )
                    
                    result = await session.execute(stmt)
                    job = result.scalars().first()
                    
                    if not job:
                        await session.commit()
                        await asyncio.sleep(2)
                        continue
                    
                    # Claim job
                    logger.info(f"Claimed job {job.id} (name: {job.name})")
                    job.status = "running"
                    job.started_at = now
                    
                    event = JobEvent(
                        job_id=job.id,
                        from_status="queued",
                        to_status="running",
                        message=f"Claimed by worker {self.name}"
                    )
                    session.add(event)
                    
                    # Update local state and commit claim
                    self.current_job_id = job.id
                    
                    # Also update worker's current job in DB right now
                    worker_stmt = select(Worker).where(Worker.id == self.worker_id)
                    worker_res = await session.execute(worker_stmt)
                    worker = worker_res.scalars().first()
                    if worker:
                        worker.current_job_id = job.id
                        
                    await session.commit()
                
                # Execute the job (out of transaction to not hold locks)
                success = False
                error_msg = None
                try:
                    await self.execute_job(job.payload)
                    success = True
                except Exception as e:
                    success = False
                    error_msg = str(e)
                    logger.error(f"Job {job.id} failed: {e}")
                
                # Record result
                async with AsyncSessionLocal() as session:
                    # Re-fetch job
                    job_res = await session.execute(select(Job).options(selectinload(Job.queue)).where(Job.id == job.id))
                    db_job = job_res.scalars().first()
                    
                    if not db_job:
                        continue # Should not happen unless deleted
                        
                    if success:
                        db_job.status = "completed"
                        db_job.completed_at = datetime.now(timezone.utc)
                        event = JobEvent(job_id=db_job.id, from_status="running", to_status="completed", message="Job completed successfully")
                        session.add(event)
                        logger.info(f"Job {db_job.id} completed.")
                    else:
                        db_job.retries += 1
                        if db_job.retries <= db_job.max_retries:
                            db_job.status = "queued"
                            db_job.run_after = await self._calculate_run_after(db_job, db_job.queue)
                            event = JobEvent(job_id=db_job.id, from_status="running", to_status="queued", message=f"Failed (attempt {db_job.retries}): {error_msg}. Retrying.")
                            session.add(event)
                            logger.info(f"Job {db_job.id} requeued for retry {db_job.retries}/{db_job.max_retries}.")
                        else:
                            db_job.status = "dead"
                            event = JobEvent(job_id=db_job.id, from_status="running", to_status="dead", message=f"Max retries exceeded. Final error: {error_msg}")
                            session.add(event)
                            logger.error(f"Job {db_job.id} marked as dead.")
                    
                    # Clear worker state
                    self.current_job_id = None
                    worker_stmt = select(Worker).where(Worker.id == self.worker_id)
                    worker_res = await session.execute(worker_stmt)
                    worker = worker_res.scalars().first()
                    if worker:
                        worker.current_job_id = None
                        
                    await session.commit()

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in main polling loop: {e}")
                await asyncio.sleep(2)

    def trigger_shutdown(self, sig):
        logger.info(f"Received signal {sig}, initiating graceful shutdown...")
        self.is_shutting_down = True

async def run_worker(name: str = None):
    engine = WorkerEngine(name)
    
    loop = asyncio.get_running_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            loop.add_signal_handler(sig, lambda s=sig: engine.trigger_shutdown(s))
        except NotImplementedError:
            signal.signal(sig, lambda s, f: engine.trigger_shutdown(s))
    
    async with AsyncSessionLocal() as session:
        await engine.register(session)
    
    try:
        # Run loops concurrently
        await asyncio.gather(
            engine.heartbeat_and_recovery_loop(),
            engine.main_polling_loop()
        )
    except asyncio.CancelledError:
        pass
    finally:
        async with AsyncSessionLocal() as session:
            await engine.deregister(session)
        logger.info("Worker shutdown complete.")

if __name__ == "__main__":
    name = sys.argv[1] if len(sys.argv) > 1 else None
    try:
        asyncio.run(run_worker(name))
    except KeyboardInterrupt:
        pass
