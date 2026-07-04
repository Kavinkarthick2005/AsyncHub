from pydantic import BaseModel, Field, UUID4
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.models.workflow import WorkflowStatus

class WorkflowBase(BaseModel):
    name: str = Field(..., max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    status: WorkflowStatus = Field(default=WorkflowStatus.DRAFT)
    is_active: bool = Field(default=True)
    definition_version: int = Field(default=1)
    definition: Dict[str, Any] = Field(default_factory=lambda: {"nodes": [], "edges": []})

class WorkflowCreate(WorkflowBase):
    pass

class WorkflowUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    status: Optional[WorkflowStatus] = None
    is_active: Optional[bool] = None
    definition_version: Optional[int] = None
    definition: Optional[Dict[str, Any]] = None

class WorkflowResponse(WorkflowBase):
    id: UUID4
    project_id: UUID4
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ValidationResult(BaseModel):
    valid: bool
    errors: List[str]

class WorkflowExecutionBase(BaseModel):
    status: str
    trigger_payload: Optional[Dict[str, Any]] = None
    current_state: Optional[Dict[str, Any]] = None

class WorkflowExecutionResponse(WorkflowExecutionBase):
    id: UUID4
    workflow_id: UUID4
    started_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class WorkflowExecuteRequest(BaseModel):
    payload: Optional[Dict[str, Any]] = Field(default_factory=dict)
