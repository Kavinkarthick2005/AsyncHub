import uuid
import enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy import String, ForeignKey, Boolean, Enum, Integer, DateTime
from app.db.session import Base
from app.models.base import TimestampMixin
from typing import Optional, List
from datetime import datetime

class WorkflowStatus(str, enum.Enum):
    DRAFT = "draft"
    VALID = "valid"
    INVALID = "invalid"

class WorkflowExecutionStatus(str, enum.Enum):
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class Workflow(TimestampMixin, Base):
    __tablename__ = "workflows"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(1000))
    project_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    
    status: Mapped[WorkflowStatus] = mapped_column(Enum(WorkflowStatus), default=WorkflowStatus.DRAFT, nullable=False)
    
    # Store React Flow nodes and edges natively
    # { "nodes": [...], "edges": [...] }
    definition: Mapped[dict] = mapped_column(JSONB, nullable=False, default=lambda: {"nodes": [], "edges": []})
    definition_version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    project: Mapped["Project"] = relationship("Project", back_populates="workflows")
    executions: Mapped[List["WorkflowExecution"]] = relationship("WorkflowExecution", back_populates="workflow", cascade="all, delete-orphan")

class WorkflowExecution(TimestampMixin, Base):
    __tablename__ = "workflow_executions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workflow_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False)
    status: Mapped[WorkflowExecutionStatus] = mapped_column(Enum(WorkflowExecutionStatus), default=WorkflowExecutionStatus.RUNNING, nullable=False)
    
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    
    trigger_payload: Mapped[Optional[dict]] = mapped_column(JSONB)
    current_state: Mapped[Optional[dict]] = mapped_column(JSONB, default=lambda: {"completed": [], "running": [], "failed": [], "waiting": []})

    workflow: Mapped["Workflow"] = relationship("Workflow", back_populates="executions")
    jobs: Mapped[List["Job"]] = relationship("Job", back_populates="workflow_execution")
