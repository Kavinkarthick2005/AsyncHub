import pytest
import asyncio
from httpx import AsyncClient
from app.models.job import Job
from app.workers.runner import WorkerEngine
from datetime import datetime, timezone, timedelta
from app.db.session import AsyncSessionLocal

@pytest.mark.asyncio
async def test_worker_concurrency(test_client: AsyncClient, auth_token: str, test_org_project_queue: dict):
    queue_id = test_org_project_queue["queue"].id
    
    # 1. Enqueue exactly ONE job
    response = await test_client.post(
        f"/api/v1/queues/{queue_id}/jobs",
        json={"name": "Concurrent Job", "payload": {}},
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 201

    # 2. Setup two separate worker instances
    worker_a = WorkerEngine("worker-a")
    worker_b = WorkerEngine("worker-b")

    # 3. Both attempt to claim simultaneously
    # Since claim_jobs opens its own session and uses SKIP LOCKED, 
    # one transaction will lock the row and update it, the other will skip it.
    results = await asyncio.gather(
        worker_a.claim_jobs(),
        worker_b.claim_jobs()
    )

    claimed_by_a = len(results[0])
    claimed_by_b = len(results[1])

    # 4. Assert only one worker got the job
    assert (claimed_by_a + claimed_by_b) == 1, "Exactly one worker should have claimed the job"
    assert claimed_by_a == 1 or claimed_by_b == 1

@pytest.mark.asyncio
async def test_delayed_job_exclusion(test_client: AsyncClient, auth_token: str, test_org_project_queue: dict):
    queue_id = test_org_project_queue["queue"].id
    
    # 1. Enqueue a delayed job (run_after in the future)
    future_time = datetime.now(timezone.utc) + timedelta(minutes=10)
    response = await test_client.post(
        f"/api/v1/queues/{queue_id}/jobs",
        json={"name": "Delayed Job", "payload": {}, "run_after": future_time.isoformat()},
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 201

    # 2. Worker attempts to claim
    worker = WorkerEngine("worker-delay-test")
    claimed_jobs = await worker.claim_jobs()

    # 3. Assert it was NOT claimed because run_after > now
    # Make sure we don't accidentally fetch the job from the previous test if it wasn't processed,
    # but the previous test job was claimed and marked 'running'.
    # Any new claim should yield 0.
    assert len(claimed_jobs) == 0, "Delayed jobs should not be claimable until run_after is met."
