import asyncio
import os
import sys
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext

# Add the parent directory to sys.path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import AsyncSessionLocal
from app.models.organization import Organization, OrganizationMember
from app.models.user import User
from app.models.project import Project
from app.models.queue import Queue
from app.models.worker import Worker, WorkerHeartbeat
from app.models.job import Job, JobEvent
from app.models.schedule import Schedule
from app.models.workflow import Workflow, WorkflowExecution
from loguru import logger

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def seed_data():
    logger.info("Starting database seed...")
    async with AsyncSessionLocal() as session:
        # 1. Create Organization
        org = Organization(name="AsyncHub Inc.", slug="asynchub")
        session.add(org)
        await session.flush()

        # 2. Create User
        hashed_password = pwd_context.hash("demo123")
        user = User(email="demo@asynchub.com", hashed_password=hashed_password)
        session.add(user)
        await session.flush()

        # 3. Create Organization Member
        member = OrganizationMember(user_id=user.id, org_id=org.id, role="owner")
        session.add(member)
        await session.flush()

        # 3. Create Projects
        projects = {
            "Email Service": Project(name="Email Service", org_id=org.id),
            "Image Pipeline": Project(name="Image Pipeline", org_id=org.id),
            "Data Sync": Project(name="Data Sync", org_id=org.id)
        }
        for p in projects.values():
            session.add(p)
        await session.flush()

        # 4. Create Queues
        queues = {
            "emails": Queue(name="emails", project_id=projects["Email Service"].id),
            "images": Queue(name="images", project_id=projects["Image Pipeline"].id),
            "analytics": Queue(name="analytics", project_id=projects["Data Sync"].id),
            "reports": Queue(name="reports", project_id=projects["Data Sync"].id),
            "notifications": Queue(name="notifications", project_id=projects["Email Service"].id)
        }
        for q in queues.values():
            session.add(q)
        await session.flush()

        # 5. Create Workers
        worker_names = ["worker-east-1", "worker-west-1", "worker-gpu", "worker-priority", "worker-east-2", "worker-west-2"]
        workers = []
        now = datetime.now(timezone.utc)
        for w_name in worker_names:
            w = Worker(name=w_name, status="online", last_heartbeat=now)
            session.add(w)
            workers.append(w)
        await session.flush()

        # Heartbeats
        for w in workers:
            session.add(WorkerHeartbeat(worker_id=w.id, last_seen=now))

        # 6. Create Workflows
        wf_image = Workflow(name="Image Processing", description="Resize and watermork images", project_id=projects["Image Pipeline"].id, definition={})
        wf_onboard = Workflow(name="Customer Onboarding", description="Send emails and provision accounts", project_id=projects["Email Service"].id, definition={})
        wf_reports = Workflow(name="Monthly Reports", description="Generate and email PDFs", project_id=projects["Data Sync"].id, definition={})
        session.add_all([wf_image, wf_onboard, wf_reports])
        await session.flush()

        # 7. Create Scheduled Jobs
        for i, q in enumerate(queues.values()):
            s = Schedule(name=f"Cron {i}", queue_id=q.id, cron_expression="*/5 * * * *", payload_template={"task": "ping"})
            session.add(s)
        await session.flush()
        
        # 8. Create Jobs
        logger.info("Creating jobs... this may take a moment.")
        
        # 250 Jobs
        jobs_to_create = 250
        for idx in range(jobs_to_create):
            q = list(queues.values())[idx % len(queues)]
            status = "completed" if idx % 3 == 0 else "queued"
            j = Job(name=f"Task {idx}", queue_id=q.id, status=status, payload={"index": idx}, created_at=now - timedelta(minutes=idx))
            if status == "completed":
                j.completed_at = now - timedelta(minutes=idx, seconds=-5)
            session.add(j)
        
        # 20 Failed jobs
        for idx in range(20):
            q = queues["emails"]
            j = Job(name=f"Failed Email {idx}", queue_id=q.id, status="dead", payload={"action": "fail"}, retries=3, max_retries=3, created_at=now - timedelta(hours=idx))
            session.add(j)

        await session.commit()
        logger.info("Demo data seeded successfully!")

if __name__ == "__main__":
    asyncio.run(seed_data())
