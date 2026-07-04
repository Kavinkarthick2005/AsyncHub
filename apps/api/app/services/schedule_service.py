from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.schedule_repository import ScheduleRepository
from app.repositories.queue_repository import QueueRepository
from app.services.queue_service import QueueService
from app.schemas.schedule import ScheduleCreate, ScheduleUpdate
from app.models.schedule import Schedule
from typing import List
from uuid import UUID

class ScheduleService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.schedule_repo = ScheduleRepository(session)
        self.queue_repo = QueueRepository(session)
        self.queue_service = QueueService(session)

    async def _verify_queue_access(self, queue_id: UUID, user_id: UUID, required_roles: List[str]):
        queue = await self.queue_repo.get_by_id(queue_id)
        if not queue:
            raise ValueError("Queue not found")
        await self.queue_service._verify_project_access(queue.project_id, user_id, required_roles)
        return queue

    async def get_queue_schedules(self, queue_id: UUID, user_id: UUID) -> List[Schedule]:
        await self._verify_queue_access(queue_id, user_id, ["owner", "admin", "developer", "viewer"])
        return await self.schedule_repo.get_by_queue(queue_id)

    async def get_schedule_by_id(self, schedule_id: UUID, user_id: UUID) -> Schedule:
        schedule = await self.schedule_repo.get_by_id(schedule_id)
        if not schedule:
            raise ValueError("Schedule not found")
        await self._verify_queue_access(schedule.queue_id, user_id, ["owner", "admin", "developer", "viewer"])
        return schedule

    async def create_schedule(self, queue_id: UUID, obj_in: ScheduleCreate, user_id: UUID) -> Schedule:
        await self._verify_queue_access(queue_id, user_id, ["owner", "admin", "developer"])
        try:
            schedule = await self.schedule_repo.create(queue_id, obj_in)
            await self.session.commit()
            return schedule
        except Exception as e:
            await self.session.rollback()
            raise ValueError(f"Failed to create schedule: {str(e)}")

    async def update_schedule(self, schedule_id: UUID, obj_in: ScheduleUpdate, user_id: UUID) -> Schedule:
        schedule = await self.get_schedule_by_id(schedule_id, user_id)
        await self._verify_queue_access(schedule.queue_id, user_id, ["owner", "admin", "developer"])
        try:
            updated_schedule = await self.schedule_repo.update(schedule, obj_in)
            await self.session.commit()
            return updated_schedule
        except Exception as e:
            await self.session.rollback()
            raise ValueError(f"Failed to update schedule: {str(e)}")

    async def delete_schedule(self, schedule_id: UUID, user_id: UUID) -> None:
        schedule = await self.get_schedule_by_id(schedule_id, user_id)
        await self._verify_queue_access(schedule.queue_id, user_id, ["owner", "admin", "developer"])
        try:
            await self.schedule_repo.delete(schedule)
            await self.session.commit()
        except Exception as e:
            await self.session.rollback()
            raise ValueError(f"Failed to delete schedule: {str(e)}")
