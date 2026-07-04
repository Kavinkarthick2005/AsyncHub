from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.project import Project
from app.schemas.project import ProjectCreate
from typing import List, Optional
from uuid import UUID

class ProjectRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, project_id: UUID) -> Optional[Project]:
        stmt = select(Project).where(Project.id == project_id)
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def get_by_org(self, org_id: UUID) -> List[Project]:
        stmt = select(Project).where(Project.org_id == org_id)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def create(self, org_id: UUID, project_in: ProjectCreate) -> Project:
        project = Project(org_id=org_id, name=project_in.name)
        self.session.add(project)
        await self.session.commit()
        await self.session.refresh(project)
        return project
