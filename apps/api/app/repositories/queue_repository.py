from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.queue import Queue
from app.schemas.queue import QueueCreate, QueueUpdate
from typing import List, Optional
from uuid import UUID

class QueueRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, queue_id: UUID) -> Optional[Queue]:
        stmt = select(Queue).where(Queue.id == queue_id)
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def get_by_project(self, project_id: UUID) -> List[Queue]:
        stmt = select(Queue).where(Queue.project_id == project_id)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def create(self, project_id: UUID, queue_in: QueueCreate) -> Queue:
        queue = Queue(
            project_id=project_id,
            name=queue_in.name,
            concurrency_limit=queue_in.concurrency_limit,
            priority=queue_in.priority,
            is_paused=queue_in.is_paused
        )
        self.session.add(queue)
        await self.session.commit()
        await self.session.refresh(queue)
        return queue

    async def update(self, queue: Queue, queue_in: QueueUpdate) -> Queue:
        update_data = queue_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(queue, field, value)
        
        self.session.add(queue)
        await self.session.commit()
        await self.session.refresh(queue)
        return queue
