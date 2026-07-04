import asyncio
from datetime import datetime, timezone, timedelta
import random
from app.db.session import AsyncSessionLocal
from app.models.organization import Organization
from app.models.project import Project
from app.models.queue import Queue
from app.models.job import Job
from sqlalchemy import select

async def seed_large_data():
    async with AsyncSessionLocal() as session:
        print("Starting Large Seed (1000 Jobs)...")
        
        # 1. Organization
        org_slug = "demo-inc"
        stmt = select(Organization).where(Organization.slug == org_slug)
        result = await session.execute(stmt)
        org = result.scalars().first()
        if not org:
            print("Demo Inc org not found. Run seed_demo.py first.")
            return

        # 2. Project
        stmt = select(Project).where(Project.org_id == org.id, Project.name == "E-Commerce Pipeline")
        result = await session.execute(stmt)
        project = result.scalars().first()
        if not project:
            print("Project not found.")
            return

        # 3. Queues
        stmt = select(Queue).where(Queue.project_id == project.id)
        result = await session.execute(stmt)
        queues = result.scalars().all()
        if not queues:
            print("No queues found.")
            return
            
        print("Seeding 1000 Jobs...")
        jobs = []
        statuses = ["queued", "running", "completed", "failed"]
        weights = [0.1, 0.1, 0.7, 0.1]
        now = datetime.now(timezone.utc)
        
        # Helper for weighted random
        def get_status():
            r = random.random()
            if r < 0.1: return "queued"
            if r < 0.2: return "running"
            if r < 0.9: return "completed"
            return "failed"
            
        for i in range(1000):
            status = get_status()
            q = random.choice(queues)
            
            created_at = now - timedelta(minutes=random.randint(10, 1440))
            started_at = None
            completed_at = None
            
            if status in ["running", "completed", "failed"]:
                started_at = created_at + timedelta(seconds=random.randint(1, 30))
            if status in ["completed", "failed"]:
                completed_at = started_at + timedelta(seconds=random.randint(1, 100))
                
            jobs.append(
                Job(
                    queue_id=q.id, 
                    name=f"Bulk Job #{i}", 
                    payload={"id": i}, 
                    status=status,
                    created_at=created_at,
                    started_at=started_at,
                    completed_at=completed_at,
                    retries=random.randint(0, 3) if status == "failed" else 0
                )
            )
            
        # Batch insert to avoid huge memory usage
        for i in range(0, 1000, 100):
            session.add_all(jobs[i:i+100])
            await session.commit()
            
        print("1000 Jobs Seeded Successfully!")

if __name__ == "__main__":
    asyncio.run(seed_large_data())
