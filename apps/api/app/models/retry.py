import uuid
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import String, Integer
from app.db.session import Base
from app.models.base import TimestampMixin

class RetryPolicy(TimestampMixin, Base):
    __tablename__ = "retry_policies"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    max_retries: Mapped[int] = mapped_column(Integer, default=3)
    backoff_strategy: Mapped[str] = mapped_column(String(50), default="exponential")
