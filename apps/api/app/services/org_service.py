from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.org_repository import OrgRepository
from app.repositories.project_repository import ProjectRepository
from app.schemas.organization import OrganizationCreate, OrganizationUpdate
from app.schemas.project import ProjectCreate, ProjectUpdate
from app.models.organization import Organization, OrganizationMember
from app.models.project import Project
from typing import List
from uuid import UUID

class OrgService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.org_repo = OrgRepository(session)
        self.project_repo = ProjectRepository(session)

    async def _check_permission(self, user_id: UUID, org_id: UUID, required_roles: List[str]) -> OrganizationMember:
        member = await self.org_repo.get_membership(user_id, org_id)
        if not member:
            raise ValueError("Not a member of this organization")
        
        if member.role not in required_roles:
            raise PermissionError(f"Role '{member.role}' does not have permission for this action")
        
        return member

    async def get_user_orgs(self, user_id: UUID) -> List[Organization]:
        return await self.org_repo.get_user_orgs(user_id)

    async def create_org(self, org_in: OrganizationCreate, user_id: UUID) -> Organization:
        return await self.org_repo.create(org_in, user_id)

    async def get_org_projects(self, org_id: UUID, user_id: UUID) -> List[Project]:
        await self._check_permission(user_id, org_id, ["owner", "admin", "developer", "viewer"])
        return await self.project_repo.get_by_org(org_id)

    async def create_project(self, org_id: UUID, project_in: ProjectCreate, user_id: UUID) -> Project:
        await self._check_permission(user_id, org_id, ["owner", "admin", "developer"])
        return await self.project_repo.create(org_id, project_in)

    async def update_organization(self, org_id: UUID, org_in: OrganizationUpdate, user_id: UUID) -> Organization:
        await self._check_permission(user_id, org_id, ["owner", "admin"])
        
        org = await self.org_repo.get_by_id(org_id)
        if not org:
            raise ValueError("Organization not found")

        if org_in.slug is not None and org_in.slug != org.slug:
            existing_org = await self.org_repo.get_by_slug(org_in.slug)
            if existing_org:
                raise ValueError("slug_taken")

        return await self.org_repo.update(org, org_in)

    async def update_project(self, project_id: UUID, project_in: ProjectUpdate, org_id: UUID, user_id: UUID) -> Project:
        await self._check_permission(user_id, org_id, ["owner", "admin"])
        
        project = await self.project_repo.get_by_id(project_id)
        if not project or project.org_id != org_id:
            raise ValueError("Project not found")

        return await self.project_repo.update(project, project_in)
