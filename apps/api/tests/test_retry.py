import pytest
from httpx import AsyncClient
from app.models.job import Job
from app.workers.runner import WorkerEngine
from sqlalchemy import select
from app.db.session import AsyncSessionLocal

@pytest.mark.asyncio
async def test_retry_recovery(test_client: AsyncClient, auth_token: str, test_org_project_queue: dict):
    queue_id = test_org_project_queue["queue"].id
    
    # 1. Enqueue job
    response = await test_client.post(
        f"/api/v1/queues/{queue_id}/jobs",
        json={"name": "Recovery Job", "payload": {"fail_once": True}},
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    job_id = response.json()["id"]

    worker = WorkerEngine("worker-retry-test")
    
    # 2. Worker claims and fails (we simulate the process_job throwing an exception)
    claimed_jobs = await worker.claim_jobs()
    job = claimed_jobs[0]
    
    try:
        # Simulate execution failure
        raise ValueError("Simulated temporary failure")
    except Exception as e:
        await worker.handle_job_failure(job, e)
        
    # 3. Verify it went back to queued and retries incremented
    async with AsyncSessionLocal() as session:
        stmt = select(Job).where(Job.id == job_id)
        job_db = (await session.execute(stmt)).scalars().first()
        assert job_db.status == "queued"
        assert job_db.retries == 1

    # 4. Worker claims AGAIN and succeeds
    claimed_jobs_2 = await worker.claim_jobs()
    job_2 = claimed_jobs_2[0]
    assert job_2.id == job_id
    
    # Simulate success
    await worker.handle_job_success(job_2)
    
    # 5. Verify final state
    async with AsyncSessionLocal() as session:
        stmt = select(Job).where(Job.id == job_id)
        job_db_final = (await session.execute(stmt)).scalars().first()
        assert job_db_final.status == "completed"
        assert job_db_final.retries == 1

@pytest.mark.asyncio
async def test_dlq_transition(test_client: AsyncClient, auth_token: str, test_org_project_queue: dict):
    queue_id = test_org_project_queue["queue"].id
    
    # 1. Enqueue job
    response = await test_client.post(
        f"/api/v1/queues/{queue_id}/jobs",
        json={"name": "DLQ Job", "payload": {}},
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    job_id = response.json()["id"]

    worker = WorkerEngine("worker-dlq-test")
    
    # Max retries is 5. We fail it 6 times (0 to 5)
    for i in range(6):
        claimed_jobs = await worker.claim_jobs()
        if not claimed_jobs:
            break
        job = claimed_jobs[0]
        await worker.handle_job_failure(job, ValueError("Persistent failure"))
        
    # Verify final state is dead
    async with AsyncSessionLocal() as session:
        stmt = select(Job).where(Job.id == job_id)
        job_db = (await session.execute(stmt)).scalars().first()
        assert job_db.status == "dead"
        assert job_db.retries == 5
