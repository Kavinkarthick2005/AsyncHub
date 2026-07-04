import pytest
import uuid
import asyncio
from httpx import AsyncClient
from app.models.workflow import Workflow, WorkflowStatus, WorkflowExecution, WorkflowExecutionStatus
from app.models.job import Job
from app.services.workflow_engine_service import WorkflowEngineService
from sqlalchemy.future import select

@pytest.fixture
def sample_dag_definition():
    return {
        "nodes": [
            {"id": "A", "type": "handler", "data": {"queue": "default"}},
            {"id": "B", "type": "handler", "data": {"queue": "default"}},
            {"id": "C", "type": "handler", "data": {"queue": "default"}}
        ],
        "edges": [
            {"source": "A", "target": "C"},
            {"source": "B", "target": "C"}
        ]
    }

@pytest.mark.asyncio
async def test_trigger_workflow_parallel_roots(db_session, test_project, sample_dag_definition, test_queue):
    # test_queue fixture must exist and match 'default' queue. For sake of test we'll assume it exists or we use queue id directly.
    workflow = Workflow(
        id=uuid.uuid4(),
        project_id=test_project.id,
        name="Parallel Roots",
        definition=sample_dag_definition,
        status=WorkflowStatus.VALID
    )
    db_session.add(workflow)
    await db_session.commit()

    engine = WorkflowEngineService(db_session)
    execution = await engine.trigger_workflow(workflow.id, {"test": "payload"}, test_project.owner_id)

    assert execution.status == WorkflowExecutionStatus.RUNNING
    assert "A" in execution.current_state["running"]
    assert "B" in execution.current_state["running"]
    assert "C" in execution.current_state["waiting"]

    # Verify jobs enqueued for roots A and B
    result = await db_session.execute(select(Job).filter(Job.workflow_execution_id == execution.id))
    jobs = result.scalars().all()
    
    assert len(jobs) == 2
    node_ids = [j.workflow_node_id for j in jobs]
    assert "A" in node_ids
    assert "B" in node_ids

@pytest.mark.asyncio
async def test_handle_job_completion_concurrency(db_session, test_project, sample_dag_definition):
    workflow = Workflow(
        id=uuid.uuid4(),
        project_id=test_project.id,
        name="Concurrency Test",
        definition=sample_dag_definition,
        status=WorkflowStatus.VALID
    )
    db_session.add(workflow)
    await db_session.commit()

    engine = WorkflowEngineService(db_session)
    execution = await engine.trigger_workflow(workflow.id, {}, test_project.owner_id)

    # Fetch jobs
    result = await db_session.execute(select(Job).filter(Job.workflow_execution_id == execution.id))
    jobs = result.scalars().all()

    job_A = next(j for j in jobs if j.workflow_node_id == "A")
    job_B = next(j for j in jobs if j.workflow_node_id == "B")

    # Complete job A
    job_A.status = "completed"
    await engine.handle_job_completion(job_A)
    
    # C should still be waiting because B is not complete
    await db_session.refresh(execution)
    assert "C" in execution.current_state["waiting"]
    assert "A" in execution.current_state["completed"]

    # Now simulate a race condition where B completes twice rapidly (or concurrently)
    job_B.status = "completed"
    
    # We call handle_job_completion twice concurrently
    await asyncio.gather(
        engine.handle_job_completion(job_B),
        engine.handle_job_completion(job_B)
    )

    # Assert C is enqueued exactly ONCE
    result = await db_session.execute(
        select(Job).filter(
            Job.workflow_execution_id == execution.id, 
            Job.workflow_node_id == "C"
        )
    )
    c_jobs = result.scalars().all()
    assert len(c_jobs) == 1

@pytest.mark.asyncio
async def test_fail_fast_policy(db_session, test_project, sample_dag_definition):
    workflow = Workflow(
        id=uuid.uuid4(),
        project_id=test_project.id,
        name="Fail Fast Test",
        definition=sample_dag_definition,
        status=WorkflowStatus.VALID
    )
    db_session.add(workflow)
    await db_session.commit()

    engine = WorkflowEngineService(db_session)
    execution = await engine.trigger_workflow(workflow.id, {}, test_project.owner_id)

    result = await db_session.execute(select(Job).filter(Job.workflow_execution_id == execution.id))
    jobs = result.scalars().all()

    job_A = next(j for j in jobs if j.workflow_node_id == "A")
    
    # Fail A
    job_A.status = "failed"
    await engine.handle_job_completion(job_A)
    
    await db_session.refresh(execution)
    assert execution.status == WorkflowExecutionStatus.FAILED
    assert "A" in execution.current_state["failed"]
    
    # Complete B later
    job_B = next(j for j in jobs if j.workflow_node_id == "B")
    job_B.status = "completed"
    await engine.handle_job_completion(job_B)
    
    # C should NEVER be enqueued because execution failed
    result = await db_session.execute(
        select(Job).filter(
            Job.workflow_execution_id == execution.id, 
            Job.workflow_node_id == "C"
        )
    )
    c_jobs = result.scalars().all()
    assert len(c_jobs) == 0
