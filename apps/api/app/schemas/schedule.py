from pydantic import BaseModel, Field, validator
from typing import Optional, Any
from datetime import datetime
from uuid import UUID

from croniter import croniter

class ScheduleBase(BaseModel):
    name: str
    cron_expression: str = Field(..., description="A standard cron expression (e.g., '*/5 * * * *')")
    payload_template: Optional[Any] = None
    is_active: Optional[bool] = True

    @validator("cron_expression")
    def validate_cron(cls, v):
        if not croniter.is_valid(v):
            raise ValueError(f"Invalid cron expression: {v}")
        return v

class ScheduleCreate(ScheduleBase):
    pass

class ScheduleUpdate(BaseModel):
    name: Optional[str] = None
    cron_expression: Optional[str] = None
    payload_template: Optional[Any] = None
    is_active: Optional[bool] = None

class ScheduleResponse(ScheduleBase):
    id: UUID
    queue_id: UUID
    next_run_at: Optional[datetime] = None
    last_run_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
