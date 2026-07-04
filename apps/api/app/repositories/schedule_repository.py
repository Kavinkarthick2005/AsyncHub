from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.schedule import Schedule
from app.schemas.schedule import ScheduleCreate, ScheduleUpdate
from typing import List, Optional
from uuid import UUID

class ScheduleRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, schedule_id: UUID) -> Optional[Schedule]:
        stmt = select(Schedule).where(Schedule.id == schedule_id)
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def get_by_queue(self, queue_id: UUID) -> List[Schedule]:
        stmt = select(Schedule).where(Schedule.queue_id == queue_id).order_by(Schedule.created_at.desc())
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def create(self, queue_id: UUID, obj_in: ScheduleCreate) -> Schedule:
        # Initial next_run_at will be calculated by the scheduler or can be calculated here
        schedule = Schedule(
            queue_id=queue_id,
            name=obj_in.name,
            cron_expression=obj_in.cron_expression,
            payload_template=obj_in.payload_template,
            is_active=obj_in.is_active
        )
        self.session.add(schedule)
        await self.session.flush()
        return schedule

    async def update(self, schedule: Schedule, obj_in: ScheduleUpdate) -> Schedule:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(schedule, field, value)
        self.session.add(schedule)
        await self.session.flush()
        return schedule

    async def delete(self, schedule: Schedule) -> None:
        await self.session.delete(schedule)
        await self.session.flush()
