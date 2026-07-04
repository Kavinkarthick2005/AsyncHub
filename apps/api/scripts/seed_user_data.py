import asyncio
import os
import sys
import uuid
from datetime import datetime, timezone, timedelta

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import AsyncSessionLocal
from app.models.organization import Organization
from app.models.project import Project
from app.models.queue import Queue
from app.models.worker import Worker, WorkerHeartbeat
from app.models.job import Job, JobEvent
from app.models.schedule import Schedule
from app.models.workflow import Workflow, WorkflowExecution
from sqlalchemy.future import select
from loguru import logger

async def seed_org_data(org_id_str: str):
    logger.info(f"Starting database seed for org: {org_id_str}")
    org_id = uuid.UUID(org_id_str)
    
    async with AsyncSessionLocal() as session:
        # Check org exists
        result = await session.execute(select(Organization).where(Organization.id == org_id))
        org = result.scalars().first()
        if not org:
            logger.error("Org not found!")
            return

        # 1. Create Projects
        projects = {
            "Email Service": Project(name="Email Service", org_id=org.id),
            "Image Pipeline": Project(name="Image Pipeline", org_id=org.id),
            "Data Sync": Project(name="Data Sync", org_id=org.id)
        }
        for p in projects.values():
            session.add(p)
        await session.flush()

        # 2. Create Queues
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

        # 3. Create Workers
        workers = []
        for i in range(5):
            w = Worker(
                name=f"worker-{i+1}", 
                status="online"
            )
            session.add(w)
            workers.append(w)
        await session.flush()

        # Create Worker Heartbeats
        for w in workers:
            for j in range(5):
                hb = WorkerHeartbeat(
                    worker_id=w.id,
                    last_seen=datetime.now(timezone.utc) - timedelta(minutes=j),
                    metadata_={"cpu_usage": 10.0 + j, "memory_usage": 100.0 + j, "active_jobs": 1}
                )
                session.add(hb)
        await session.flush()

        # 4. Create Scheduled Jobs
        for i, q in enumerate(queues.values()):
            s = Schedule(name=f"Cron {i}", queue_id=q.id, cron_expression="*/5 * * * *", payload_template={"task": "ping"})
            session.add(s)
        await session.flush()
        
        # 5. Create Jobs
        logger.info("Creating jobs... this may take a moment.")
        statuses = ["completed", "completed", "completed", "completed", "failed", "processing", "pending"]
        for i in range(50):
            q = list(queues.values())[i % len(queues)]
            status = statuses[i % len(statuses)]
            j = Job(
                queue_id=q.id,
                name=f"test_job_{i}",
                payload={"data": f"test_{i}"},
                status=status,
                max_retries=3,
                priority=1
            )
            session.add(j)
            await session.flush()
            
            # Create Job Events
            event1 = JobEvent(job_id=j.id, from_status=None, to_status="pending", message="Job created")
            session.add(event1)
            
            if status in ["processing", "completed", "failed"]:
                event2 = JobEvent(job_id=j.id, from_status="pending", to_status="processing", message="Worker started processing")
                session.add(event2)
                
            if status == "completed":
                event3 = JobEvent(job_id=j.id, from_status="processing", to_status="completed", message="Job finished successfully")
                session.add(event3)
            elif status == "failed":
                event3 = JobEvent(job_id=j.id, from_status="processing", to_status="failed", message="Connection timeout error")
                session.add(event3)
                
        await session.flush()

        # 6. Create Workflows
        wf_image = Workflow(name="Image Processing", description="Resize and watermark images", project_id=projects["Image Pipeline"].id, definition={})
        wf_onboard = Workflow(name="Customer Onboarding", description="Send emails and provision accounts", project_id=projects["Email Service"].id, definition={})
        wf_reports = Workflow(name="Monthly Reports", description="Generate and email PDFs", project_id=projects["Data Sync"].id, definition={})
        session.add_all([wf_image, wf_onboard, wf_reports])
        await session.flush()

        # Add Workflow Executions
        for wf in [wf_image, wf_onboard, wf_reports]:
            for i in range(3):
                we = WorkflowExecution(
                    workflow_id=wf.id,
                    status="completed" if i > 0 else "running",
                    trigger_payload={"type": "manual"},
                    started_at=datetime.now(timezone.utc) - timedelta(hours=i)
                )
                session.add(we)
                
        await session.commit()
        logger.info("Demo data seeded successfully for org!")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        asyncio.run(seed_org_data(sys.argv[1]))
    else:
        print("Usage: python seed_user_data.py <org_id>")
