import pytest
from app.services.workflow_service import WorkflowService
import uuid

@pytest.fixture
def service():
    # Mock db is not needed for validate_dag since it's a pure function
    return WorkflowService(db=None)

def test_validate_dag_empty(service):
    res = service.validate_dag({})
    assert not res.valid
    assert "Workflow is empty" in res.errors[0]

def test_validate_dag_valid(service):
    definition = {
        "nodes": [
            {"id": "A", "type": "queue", "data": {"queue": "default"}},
            {"id": "B", "type": "handler", "data": {"handler": "process_job"}}
        ],
        "edges": [
            {"id": "e1", "source": "A", "target": "B"}
        ]
    }
    res = service.validate_dag(definition)
    assert res.valid
    assert len(res.errors) == 0

def test_validate_dag_cycle(service):
    definition = {
        "nodes": [
            {"id": "A", "type": "queue", "data": {"queue": "default"}},
            {"id": "B", "type": "handler", "data": {"handler": "process_job"}},
            {"id": "C", "type": "handler", "data": {"handler": "process_job"}}
        ],
        "edges": [
            {"id": "e1", "source": "A", "target": "B"},
            {"id": "e2", "source": "B", "target": "C"},
            {"id": "e3", "source": "C", "target": "A"}  # Cycle here
        ]
    }
    res = service.validate_dag(definition)
    assert not res.valid
    assert any("Cycle detected" in err for err in res.errors)

def test_validate_dag_missing_config(service):
    definition = {
        "nodes": [
            {"id": "A", "type": "queue", "data": {}}  # missing queue
        ],
        "edges": []
    }
    res = service.validate_dag(definition)
    assert not res.valid
    assert any("missing queue name" in err for err in res.errors)

def test_validate_dag_isolated_node(service):
    definition = {
        "nodes": [
            {"id": "A", "type": "queue", "data": {"queue": "default"}},
            {"id": "B", "type": "handler", "data": {"handler": "process_job"}}
        ],
        "edges": []  # No edges, so B is isolated (and A)
    }
    res = service.validate_dag(definition)
    assert not res.valid
    assert any("isolated" in err for err in res.errors)

def test_validate_dag_missing_node_ref(service):
    definition = {
        "nodes": [
            {"id": "A", "type": "queue", "data": {"queue": "default"}}
        ],
        "edges": [
            {"id": "e1", "source": "A", "target": "B"}  # B doesn't exist
        ]
    }
    res = service.validate_dag(definition)
    assert not res.valid
    assert any("missing target node 'B'" in err for err in res.errors)

@pytest.mark.asyncio
async def test_workflow_jsonb_serialization(db_session):
    """
    Integration test to ensure JSONB serialization preserves the exact structure.
    Save workflow -> Reload workflow -> Verify definition is byte-for-byte identical.
    """
    from app.models.workflow import Workflow, WorkflowStatus
    from app.models.project import Project
    from app.models.organization import Organization
    
    # Create test org and project
    org = Organization(name="Test Org")
    db_session.add(org)
    await db_session.commit()
    
    project = Project(name="Test Project", org_id=org.id)
    db_session.add(project)
    await db_session.commit()
    
    original_def = {
        "nodes": [{"id": "1", "position": {"x": 100, "y": 200}, "data": {"label": "Node 1"}}],
        "edges": [{"id": "e1-2", "source": "1", "target": "2"}]
    }
    
    workflow = Workflow(
        project_id=project.id,
        name="Test Workflow",
        status=WorkflowStatus.VALID,
        definition=original_def
    )
    db_session.add(workflow)
    await db_session.commit()
    
    # Reload from DB
    await db_session.refresh(workflow)
    
    # Verify exact match
    assert workflow.definition == original_def
