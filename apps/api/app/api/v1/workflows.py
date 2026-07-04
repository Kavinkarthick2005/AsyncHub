from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any
from uuid import UUID

from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.workflow import WorkflowCreate, WorkflowUpdate, WorkflowResponse, ValidationResult
from app.services.workflow_service import WorkflowService

router = APIRouter()

def get_workflow_service(db: AsyncSession = Depends(get_db)) -> WorkflowService:
    return WorkflowService(db)

@router.get("/projects/{project_id}/workflows", response_model=List[WorkflowResponse])
async def list_workflows(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    workflow_service: WorkflowService = Depends(get_workflow_service)
):
    try:
        return await workflow_service.get_project_workflows(project_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/projects/{project_id}/workflows", response_model=WorkflowResponse, status_code=status.HTTP_201_CREATED)
async def create_workflow(
    project_id: UUID,
    workflow_in: WorkflowCreate,
    current_user: User = Depends(get_current_user),
    workflow_service: WorkflowService = Depends(get_workflow_service)
):
    try:
        # We allow saving even if invalid (since status=draft), 
        # but if we wanted to block it, we could call validation here.
        return await workflow_service.create_workflow(project_id, workflow_in)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/workflows/{workflow_id}", response_model=WorkflowResponse)
async def get_workflow(
    workflow_id: UUID,
    current_user: User = Depends(get_current_user),
    workflow_service: WorkflowService = Depends(get_workflow_service)
):
    workflow = await workflow_service.get_workflow(workflow_id)
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return workflow

@router.put("/workflows/{workflow_id}", response_model=WorkflowResponse)
async def update_workflow(
    workflow_id: UUID,
    workflow_in: WorkflowUpdate,
    current_user: User = Depends(get_current_user),
    workflow_service: WorkflowService = Depends(get_workflow_service)
):
    workflow = await workflow_service.update_workflow(workflow_id, workflow_in)
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return workflow

@router.delete("/workflows/{workflow_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workflow(
    workflow_id: UUID,
    current_user: User = Depends(get_current_user),
    workflow_service: WorkflowService = Depends(get_workflow_service)
):
    success = await workflow_service.delete_workflow(workflow_id)
    if not success:
        raise HTTPException(status_code=404, detail="Workflow not found")

@router.post("/workflows/validate", response_model=ValidationResult)
async def validate_workflow(
    definition: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    workflow_service: WorkflowService = Depends(get_workflow_service)
):
    """
    Pure validation endpoint. Takes a JSON definition and returns true/false with errors.
    No database writes.
    """
    return workflow_service.validate_dag(definition)

from app.schemas.workflow import WorkflowExecuteRequest, WorkflowExecutionResponse
from app.services.workflow_engine_service import WorkflowEngineService
from sqlalchemy.future import select
from app.models.workflow import WorkflowExecution

def get_workflow_engine_service(db: AsyncSession = Depends(get_db)) -> WorkflowEngineService:
    return WorkflowEngineService(db)

@router.post("/workflows/{workflow_id}/execute", response_model=WorkflowExecutionResponse)
async def execute_workflow(
    workflow_id: UUID,
    request: WorkflowExecuteRequest,
    current_user: User = Depends(get_current_user),
    engine_service: WorkflowEngineService = Depends(get_workflow_engine_service)
):
    try:
        execution = await engine_service.trigger_workflow(workflow_id, request.payload or {}, current_user.id)
        return execution
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/workflows/{workflow_id}/executions", response_model=List[WorkflowExecutionResponse])
async def list_workflow_executions(
    workflow_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(WorkflowExecution)
        .filter(WorkflowExecution.workflow_id == workflow_id)
        .order_by(WorkflowExecution.created_at.desc())
    )
    return result.scalars().all()

@router.get("/workflows/executions/{execution_id}", response_model=WorkflowExecutionResponse)
async def get_workflow_execution(
    execution_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(WorkflowExecution).filter(WorkflowExecution.id == execution_id)
    )
    execution = result.scalar_one_or_none()
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
    return execution
