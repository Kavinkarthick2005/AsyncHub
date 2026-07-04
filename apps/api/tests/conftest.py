import pytest
import pytest_asyncio
import asyncio
from typing import AsyncGenerator
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.db.session import engine, Base, get_db
from app.core.security import get_password_hash
from app.models.user import User
from app.models.organization import Organization, OrganizationMember
from app.models.project import Project
from app.models.queue import Queue
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

TestingSessionLocal = async_sessionmaker(autocommit=False, autoflush=False, bind=engine, class_=AsyncSession)

@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_test_db():
    pass

@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with TestingSessionLocal() as session:
        yield session

@pytest_asyncio.fixture
async def test_client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    app.dependency_overrides[get_db] = lambda: db_session
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
    app.dependency_overrides.clear()

@pytest_asyncio.fixture
async def auth_user(db_session: AsyncSession):
    email = "test@example.com"
    pwd = "password123"
    
    # Check if exists
    from sqlalchemy import select
    stmt = select(User).where(User.email == email)
    result = await db_session.execute(stmt)
    user = result.scalars().first()
    
    if not user:
        user = User(email=email, hashed_password=get_password_hash(pwd))
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)
        
    return user

@pytest_asyncio.fixture
async def auth_token(test_client: AsyncClient, auth_user: User):
    response = await test_client.post(
        "/api/v1/auth/login",
        data={"username": "test@example.com", "password": "password123"}
    )
    return response.json()["access_token"]

@pytest_asyncio.fixture
async def test_org_project_queue(db_session: AsyncSession, auth_user: User):
    # Org
    org = Organization(name="Test Org", slug="test-org-123")
    db_session.add(org)
    await db_session.commit()
    await db_session.refresh(org)
    
    member = OrganizationMember(user_id=auth_user.id, org_id=org.id, role="owner")
    db_session.add(member)
    await db_session.commit()

    # Project
    project = Project(name="Test Project", org_id=org.id)
    db_session.add(project)
    await db_session.commit()
    await db_session.refresh(project)

    # Queue
    queue = Queue(name="Test Queue", project_id=project.id, priority=1)
    db_session.add(queue)
    await db_session.commit()
    await db_session.refresh(queue)

    return {"org": org, "project": project, "queue": queue}
