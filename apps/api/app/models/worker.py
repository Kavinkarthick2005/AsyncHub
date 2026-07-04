import uuid
from datetime import datetime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy import String, ForeignKey, DateTime
from app.db.session import Base
from app.models.base import TimestampMixin
from typing import List, Optional

class Worker(TimestampMixin, Base):
    __tablename__ = "workers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="online")
    last_heartbeat: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    current_job_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("jobs.id"), nullable=True)
    
    heartbeats: Mapped[List["WorkerHeartbeat"]] = relationship("WorkerHeartbeat", back_populates="worker")


class WorkerHeartbeat(TimestampMixin, Base):
    __tablename__ = "worker_heartbeats"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    worker_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workers.id"), nullable=False)
    last_seen: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    metadata_: Mapped[dict] = mapped_column(JSONB, nullable=True)

    worker: Mapped["Worker"] = relationship("Worker", back_populates="heartbeats")
