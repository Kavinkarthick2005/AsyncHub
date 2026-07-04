from pydantic import BaseModel
from typing import Optional, Any, List
from datetime import datetime
from uuid import UUID

class JobEventResponse(BaseModel):
    id: UUID
    job_id: UUID
    from_status: Optional[str]
    to_status: str
    message: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class JobBase(BaseModel):
    name: str
    payload: Optional[Any] = None
    priority: Optional[int] = 0
    max_retries: Optional[int] = 3
    idempotency_key: Optional[str] = None

class JobCreate(JobBase):
    pass

class JobResponse(JobBase):
    id: UUID
    queue_id: UUID
    status: str
    retries: int
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
