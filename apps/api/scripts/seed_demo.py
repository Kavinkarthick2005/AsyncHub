import asyncio
from datetime import datetime, timezone, timedelta
from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.models.organization import Organization, OrganizationMember
from app.models.project import Project
from app.models.queue import Queue
from app.models.job import Job
from app.models.schedule import Schedule
from app.models.worker import Worker, WorkerHeartbeat
from sqlalchemy import select
from app.core.security import get_password_hash

async def seed_demo_data():
    async with AsyncSessionLocal() as session:
        print("Starting Demo Seed...")
        
        # 1. User
        admin_email = "admin@asynchub.demo"
        stmt = select(User).where(User.email == admin_email)
        result = await session.execute(stmt)
        user = result.scalars().first()
        
        if not user:
            user = User(
                email=admin_email,
                hashed_password=get_password_hash("demo123")
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)
            print(f"Created Admin User: {admin_email} (demo123)")
        
        # 2. Organization
        org_slug = "demo-inc"
        stmt = select(Organization).where(Organization.slug == org_slug)
        result = await session.execute(stmt)
        org = result.scalars().first()
        
        if not org:
            org = Organization(name="Demo Inc", slug=org_slug)
            session.add(org)
            await session.commit()
            await session.refresh(org)
            
            member = OrganizationMember(
                user_id=user.id,
                org_id=org.id,
                role="owner"
            )
            session.add(member)
            await session.commit()
            print("Created Organization: Demo Inc")
        
        # 3. Project
        stmt = select(Project).where(Project.org_id == org.id, Project.name == "E-Commerce Pipeline")
        result = await session.execute(stmt)
        project = result.scalars().first()
        
        if not project:
            project = Project(
                name="E-Commerce Pipeline",
                org_id=org.id
            )
            session.add(project)
            await session.commit()
            await session.refresh(project)
            print("Created Project: E-Commerce Pipeline")

        # 4. Queues
        queues_data = [
            {"name": "high-priority", "priority": 1},
            {"name": "default", "priority": 5},
            {"name": "batch-processing", "priority": 10},
        ]
        
        queues = {}
        for qd in queues_data:
            stmt = select(Queue).where(Queue.project_id == project.id, Queue.name == qd["name"])
            result = await session.execute(stmt)
            q = result.scalars().first()
            if not q:
                q = Queue(name=qd["name"], project_id=project.id, priority=qd["priority"])
                session.add(q)
                await session.commit()
                await session.refresh(q)
            queues[qd["name"]] = q
            
        print("Created Queues: high-priority, default, batch-processing")

        # 5. Workers
        workers_data = [
            {"name": "worker-demo-alpha.local", "status": "online"},
            {"name": "worker-demo-beta.local", "status": "offline"},
        ]
        import uuid
        for wd in workers_data:
            stmt = select(Worker).where(Worker.name == wd["name"])
            res = await session.execute(stmt)
            w = res.scalars().first()
            if not w:
                w = Worker(id=uuid.uuid4(), name=wd["name"], status=wd["status"])
                session.add(w)
                await session.commit()
                await session.refresh(w)
                
                # Heartbeat
                hb = WorkerHeartbeat(
                    worker_id=w.id,
                    last_seen=datetime.now(timezone.utc),
                    metadata_={"cpu_usage": 45.2, "memory_usage": 1024}
                )
                session.add(hb)
                await session.commit()

        # 6. Jobs
        print("Seeding Jobs...")
        jobs = [
            Job(queue_id=queues["high-priority"].id, name="Process Payment #8892", payload={"order_id": 8892, "amount": 149.99}, status="queued"),
            Job(queue_id=queues["high-priority"].id, name="Send Order Confirmation", payload={"email": "customer@example.com"}, status="completed"),
            Job(queue_id=queues["default"].id, name="Generate Invoice", payload={"order_id": 8892}, status="failed", retries=3),
            Job(queue_id=queues["default"].id, name="Sync Inventory", payload={"sku": "TSHIRT-BLK-M"}, status="dead", retries=5),
            Job(queue_id=queues["batch-processing"].id, name="Monthly Sync", payload={"month": "october"}, status="running")
        ]
        session.add_all(jobs)
        await session.commit()

        # 7. Schedules
        print("Seeding Schedules...")
        schedules = [
            Schedule(
                name="Daily Sales Report",
                queue_id=queues["default"].id,
                cron_expression="0 0 * * *",
                payload_template={"task": "sales_report", "format": "pdf"},
                is_active=True,
                next_run_at=datetime.now(timezone.utc) + timedelta(hours=5)
            ),
            Schedule(
                name="Weekly Database Backup",
                queue_id=queues["batch-processing"].id,
                cron_expression="0 2 * * 0",
                payload_template={"task": "db_backup", "target": "s3://backups"},
                is_active=False
            )
        ]
        session.add_all(schedules)
        await session.commit()
        
        print("Demo Data Seeded Successfully!")
        print("Login with: admin@asynchub.demo / demo123")

if __name__ == "__main__":
    asyncio.run(seed_demo_data())
