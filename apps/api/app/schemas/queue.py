from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID

class QueueBase(BaseModel):
    name: str
    concurrency_limit: Optional[int] = 10
    priority: Optional[int] = 0
    is_paused: Optional[bool] = False

class QueueCreate(QueueBase):
    pass

class QueueUpdate(BaseModel):
    concurrency_limit: Optional[int] = None
    priority: Optional[int] = None
    is_paused: Optional[bool] = None

class QueueResponse(QueueBase):
    id: UUID
    project_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
