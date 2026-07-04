from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class OrganizationBase(BaseModel):
    name: str
    slug: str

class OrganizationCreate(OrganizationBase):
    pass

class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None

class OrganizationResponse(OrganizationBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class OrganizationMemberResponse(BaseModel):
    user_id: UUID
    org_id: UUID
    role: str

    class Config:
        from_attributes = True
