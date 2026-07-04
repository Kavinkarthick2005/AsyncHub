from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.queue_repository import QueueRepository
from app.repositories.project_repository import ProjectRepository
from app.services.org_service import OrgService
from app.schemas.queue import QueueCreate, QueueUpdate
from app.models.queue import Queue
from typing import List
from uuid import UUID

class QueueService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.queue_repo = QueueRepository(session)
        self.project_repo = ProjectRepository(session)
        self.org_service = OrgService(session)

    async def _verify_project_access(self, project_id: UUID, user_id: UUID, required_roles: List[str]):
        project = await self.project_repo.get_by_id(project_id)
        if not project:
            raise ValueError("Project not found")
        await self.org_service._check_permission(user_id, project.org_id, required_roles)
        return project

    async def get_project_queues(self, project_id: UUID, user_id: UUID) -> List[Queue]:
        await self._verify_project_access(project_id, user_id, ["owner", "admin", "developer", "viewer"])
        return await self.queue_repo.get_by_project(project_id)

    async def create_queue(self, project_id: UUID, queue_in: QueueCreate, user_id: UUID) -> Queue:
        await self._verify_project_access(project_id, user_id, ["owner", "admin", "developer"])
        return await self.queue_repo.create(project_id, queue_in)

    async def update_queue(self, queue_id: UUID, queue_in: QueueUpdate, user_id: UUID) -> Queue:
        queue = await self.queue_repo.get_by_id(queue_id)
        if not queue:
            raise ValueError("Queue not found")
        
        await self._verify_project_access(queue.project_id, user_id, ["owner", "admin"])
        return await self.queue_repo.update(queue, queue_in)
