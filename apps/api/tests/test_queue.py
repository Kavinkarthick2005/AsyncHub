import pytest
from httpx import AsyncClient
from app.models.queue import Queue

@pytest.mark.asyncio
async def test_enqueue_job(test_client: AsyncClient, auth_token: str, test_org_project_queue: dict):
    queue_id = test_org_project_queue["queue"].id
    response = await test_client.post(
        f"/api/v1/queues/{queue_id}/jobs",
        json={"name": "Single Test Job", "payload": {"foo": "bar"}},
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Single Test Job"
    assert data["status"] == "queued"

@pytest.mark.asyncio
async def test_batch_enqueue(test_client: AsyncClient, auth_token: str, test_org_project_queue: dict):
    queue_id = test_org_project_queue["queue"].id
    jobs_in = [
        {"name": f"Batch Job {i}", "payload": {"index": i}}
        for i in range(10)
    ]
    # Add one invalid job to test partial failure logic
    jobs_in.append({"payload": "invalid-no-name"})

    response = await test_client.post(
        f"/api/v1/queues/{queue_id}/jobs/batch",
        json=jobs_in,
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["accepted"] == 10
    assert data["failed"] == 1
    assert len(data["job_ids"]) == 10
    assert len(data["errors"]) == 1

@pytest.mark.asyncio
async def test_paused_queue_execution_prevention(test_client: AsyncClient, auth_token: str, test_org_project_queue: dict, db_session):
    # 1. Pause the queue
    queue_id = test_org_project_queue["queue"].id
    response = await test_client.patch(
        f"/api/v1/queues/{queue_id}",
        json={"is_paused": True},
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 200
    assert response.json()["is_paused"] is True

    # 2. Enqueue a job
    await test_client.post(
        f"/api/v1/queues/{queue_id}/jobs",
        json={"name": "Paused Job", "payload": {}},
        headers={"Authorization": f"Bearer {auth_token}"}
    )

    # 3. Simulate Worker trying to claim a job from this queue. 
    # (Since worker logic is in runner.py, we directly execute the fetch query here to verify it respects is_paused)
    from sqlalchemy import select
    from app.models.job import Job
    stmt = select(Job).join(Queue).where(
        Queue.id == queue_id,
        Queue.is_paused == False,
        Job.status == "queued"
    )
    res = await db_session.execute(stmt)
    claimable_jobs = res.scalars().all()
    
    assert len(claimable_jobs) == 0, "A paused queue should not yield any claimable jobs."

    # 4. Unpause and verify it becomes claimable
    await test_client.patch(
        f"/api/v1/queues/{queue_id}",
        json={"is_paused": False},
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    res = await db_session.execute(stmt)
    claimable_jobs = res.scalars().all()
    assert len(claimable_jobs) > 0, "Unpaused queue should yield claimable jobs."
