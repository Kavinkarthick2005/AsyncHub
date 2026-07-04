from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.organization import OrganizationCreate, OrganizationUpdate, OrganizationResponse
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse
from app.services.org_service import OrgService
from typing import List
from uuid import UUID

router = APIRouter()

def get_org_service(db: AsyncSession = Depends(get_db)) -> OrgService:
    return OrgService(db)

@router.get("/", response_model=List[OrganizationResponse])
async def list_organizations(
    current_user: User = Depends(get_current_user),
    org_service: OrgService = Depends(get_org_service)
):
    return await org_service.get_user_orgs(current_user.id)

@router.post("/", response_model=OrganizationResponse, status_code=status.HTTP_201_CREATED)
async def create_organization(
    org_in: OrganizationCreate,
    current_user: User = Depends(get_current_user),
    org_service: OrgService = Depends(get_org_service)
):
    return await org_service.create_org(org_in, current_user.id)

@router.get("/{org_id}/projects", response_model=List[ProjectResponse])
async def list_projects(
    org_id: UUID,
    current_user: User = Depends(get_current_user),
    org_service: OrgService = Depends(get_org_service)
):
    try:
        return await org_service.get_org_projects(org_id, current_user.id)
    except Exception as e:
        raise HTTPException(status_code=403, detail=str(e))

@router.post("/{org_id}/projects", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    org_id: UUID,
    project_in: ProjectCreate,
    current_user: User = Depends(get_current_user),
    org_service: OrgService = Depends(get_org_service)
):
    try:
        return await org_service.create_project(org_id, project_in, current_user.id)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{org_id}", response_model=OrganizationResponse)
async def update_organization(
    org_id: UUID,
    org_in: OrganizationUpdate,
    current_user: User = Depends(get_current_user),
    org_service: OrgService = Depends(get_org_service)
):
    try:
        return await org_service.update_organization(org_id, org_in, current_user.id)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        if str(e) == "slug_taken":
            raise HTTPException(status_code=409, detail="Slug already taken")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{org_id}/projects/{project_id}", response_model=ProjectResponse)
async def update_project(
    org_id: UUID,
    project_id: UUID,
    project_in: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    org_service: OrgService = Depends(get_org_service)
):
    try:
        return await org_service.update_project(project_id, project_in, org_id, current_user.id)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
