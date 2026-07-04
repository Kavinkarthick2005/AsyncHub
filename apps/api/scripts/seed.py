import asyncio
import argparse
import sys
import uuid
import random
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete
import os

# Add apps/api to sys.path so we can import app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.models.organization import Organization, OrganizationMember
from app.models.project import Project
from app.models.queue import Queue
from app.models.job import Job, JobEvent
from app.services.org_service import OrgService
from app.schemas.organization import OrganizationCreate
from app.schemas.project import ProjectCreate

async def get_user_by_email(session: AsyncSession, email: str) -> User:
    result = await session.execute(select(User).where(User.email == email))
    user = result.scalars().first()
    return user

async def get_org_by_slug(session: AsyncSession, slug: str) -> Organization:
    result = await session.execute(select(Organization).where(Organization.slug == slug))
    return result.scalars().first()

async def delete_org_data(session: AsyncSession, org: Organization):
    # Find all projects
    projects_res = await session.execute(select(Project).where(Project.org_id == org.id))
    projects = projects_res.scalars().all()
    project_ids = [p.id for p in projects]

    if project_ids:
        # Find all queues
        queues_res = await session.execute(select(Queue).where(Queue.project_id.in_(project_ids)))
        queues = queues_res.scalars().all()
        queue_ids = [q.id for q in queues]

        if queue_ids:
            # Find all jobs
            jobs_res = await session.execute(select(Job).where(Job.queue_id.in_(queue_ids)))
            jobs = jobs_res.scalars().all()
            job_ids = [j.id for j in jobs]
            
            if job_ids:
                # Delete JobEvents
                await session.execute(delete(JobEvent).where(JobEvent.job_id.in_(job_ids)))
                # Delete Jobs
                await session.execute(delete(Job).where(Job.id.in_(job_ids)))
            
            # Delete Queues
            await session.execute(delete(Queue).where(Queue.id.in_(queue_ids)))
        
        # Delete Projects
        await session.execute(delete(Project).where(Project.id.in_(project_ids)))

    # Delete Org Members
    await session.execute(delete(OrganizationMember).where(OrganizationMember.org_id == org.id))
    # Delete Org
    await session.execute(delete(Organization).where(Organization.id == org.id))
    await session.commit()
    print(f"Deleted existing organization '{org.name}' and all its data.")

async def create_demo_data(session: AsyncSession, user: User):
    org_service = OrgService(session)
    
    print("Creating Demo Org...")
    org = await org_service.create_org(OrganizationCreate(name="Demo Org", slug="demo-org"), user.id)
    
    print("Creating Projects...")
    proj1 = await org_service.create_project(org.id, ProjectCreate(name="E-Commerce Backend", description="Background jobs for the shop"), user.id)
    proj2 = await org_service.create_project(org.id, ProjectCreate(name="Data Pipeline", description="ETL jobs"), user.id)

    print("Creating Queues...")
    q1 = Queue(project_id=proj1.id, name="emails", concurrency_limit=5, priority=1)
    q2 = Queue(project_id=proj1.id, name="image-processing", concurrency_limit=2, priority=2)
    q3 = Queue(project_id=proj2.id, name="daily-reports", concurrency_limit=1, priority=3)
    session.add_all([q1, q2, q3])
    await session.commit()
    await session.refresh(q1)
    await session.refresh(q2)
    await session.refresh(q3)

    print("Creating Jobs and Events...")
    queues = [q1, q2, q3]
    statuses = ["queued", "running", "completed", "failed", "dead"]
    
    # Generate ~30 jobs
    now = datetime.now(timezone.utc)
    jobs_to_insert = []
    events_to_insert = []
    
    for i in range(30):
        target_queue = random.choice(queues)
        status = random.choice(statuses)
        job_id = uuid.uuid4()
        
        created_time = now - timedelta(hours=random.randint(1, 48), minutes=random.randint(0, 59))
        started_time = None
        completed_time = None
        error_msg = None
        
        if status in ["running", "completed", "failed", "dead"]:
            started_time = created_time + timedelta(seconds=random.randint(5, 60))
        if status in ["completed"]:
            completed_time = started_time + timedelta(seconds=random.randint(10, 300))
        if status in ["failed", "dead"]:
            error_msg = "Random simulated failure exception traceback"
            
        job = Job(
            id=job_id,
            queue_id=target_queue.id,
            name=f"seeded-job-{i}",
            payload={"task_index": i, "target_id": random.randint(100, 999)},
            status=status,
            max_retries=3,
            retries=random.randint(0, 3) if status in ["failed", "dead"] else 0
        )
        # Override timestamps
        job.created_at = created_time
        if started_time:
            job.updated_at = started_time
        
        jobs_to_insert.append(job)

        # Generate fake event history
        events_to_insert.append(JobEvent(
            job_id=job_id,
            to_status="queued",
            message="Job enqueued via seed script",
            created_at=created_time
        ))

        if started_time:
            events_to_insert.append(JobEvent(
                job_id=job_id,
                from_status="queued",
                to_status="running",
                message="Worker started processing",
                created_at=started_time
            ))
            
        if completed_time:
            events_to_insert.append(JobEvent(
                job_id=job_id,
                from_status="running",
                to_status="completed",
                message="Job finished successfully",
                created_at=completed_time
            ))
        elif error_msg:
            events_to_insert.append(JobEvent(
                job_id=job_id,
                from_status="running",
                to_status=status, # failed or dead
                message=error_msg,
                created_at=started_time + timedelta(seconds=random.randint(5, 60))
            ))

    session.add_all(jobs_to_insert)
    await session.commit()
    session.add_all(events_to_insert)
    await session.commit()

    print("Seed complete! 1 Org, 2 Projects, 3 Queues, 30 Jobs created.")

async def main():
    parser = argparse.ArgumentParser(description="Seed database for AsyncHub")
    parser.add_argument("email", type=str, help="Email of the user to assign the org to")
    parser.add_argument("--reset", action="store_true", help="Delete the Demo Org and re-create it")
    args = parser.parse_args()

    async with AsyncSessionLocal() as session:
        user = await get_user_by_email(session, args.email)
        if not user:
            print(f"Error: User with email {args.email} not found.")
            sys.exit(1)
        
        org = await get_org_by_slug(session, "demo-org")
        
        if org:
            if args.reset:
                await delete_org_data(session, org)
            else:
                print("Organization 'demo-org' already exists. Use --reset to overwrite. Skipping seed.")
                sys.exit(0)
        
        await create_demo_data(session, user)

if __name__ == "__main__":
    asyncio.run(main())
