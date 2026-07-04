from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.models.organization import Organization, OrganizationMember
from app.schemas.organization import OrganizationCreate
from typing import List, Optional
from uuid import UUID

class OrgRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, org_id: UUID) -> Optional[Organization]:
        stmt = select(Organization).where(Organization.id == org_id)
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def get_user_orgs(self, user_id: UUID) -> List[Organization]:
        stmt = (
            select(Organization)
            .join(OrganizationMember)
            .where(OrganizationMember.user_id == user_id)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_membership(self, user_id: UUID, org_id: UUID) -> Optional[OrganizationMember]:
        stmt = select(OrganizationMember).where(
            OrganizationMember.user_id == user_id,
            OrganizationMember.org_id == org_id
        )
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def create(self, org_in: OrganizationCreate, user_id: UUID) -> Organization:
        org = Organization(name=org_in.name, slug=org_in.slug)
        self.session.add(org)
        await self.session.flush() # flush to get org.id

        member = OrganizationMember(
            user_id=user_id,
            org_id=org.id,
            role="owner"
        )
        self.session.add(member)
        await self.session.commit()
        await self.session.refresh(org)
        return org
