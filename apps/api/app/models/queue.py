import uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy import String, ForeignKey
from app.db.session import Base
from app.models.base import TimestampMixin
from typing import List, Optional

class Queue(TimestampMixin, Base):
    __tablename__ = "queues"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    project_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("projects.id"), nullable=False)
    concurrency_limit: Mapped[int] = mapped_column(default=10)
    priority: Mapped[int] = mapped_column(default=0)
    is_paused: Mapped[bool] = mapped_column(default=False)
    retry_policy: Mapped[Optional[dict]] = mapped_column(JSONB)

    project: Mapped["Project"] = relationship("Project", back_populates="queues")
    jobs: Mapped[List["Job"]] = relationship("Job", back_populates="queue")
