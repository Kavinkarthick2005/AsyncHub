import uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import String, ForeignKey
from app.db.session import Base
from app.models.base import TimestampMixin
from typing import List

class Project(TimestampMixin, Base):
    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    org_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organizations.id"), nullable=False)

    organization: Mapped["Organization"] = relationship("Organization", back_populates="projects")
    queues: Mapped[List["Queue"]] = relationship("Queue", back_populates="project")
    workflows: Mapped[List["Workflow"]] = relationship("Workflow", back_populates="project")
   