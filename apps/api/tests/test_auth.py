import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_signup(test_client: AsyncClient):
    response = await test_client.post(
        "/api/v1/auth/register",
        json={"email": "newuser@example.com", "password": "password123"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert "id" in data

@pytest.mark.asyncio
async def test_login(test_client: AsyncClient, auth_user):
    response = await test_client.post(
        "/api/v1/auth/login",
        data={"username": "test@example.com", "password": "password123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

@pytest.mark.asyncio
async def test_unauthorized_access(test_client: AsyncClient):
    response = await test_client.get("/api/v1/organizations/")
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_authorized_access(test_client: AsyncClient, auth_token: str):
    response = await test_client.get(
        "/api/v1/organizations/",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 200
