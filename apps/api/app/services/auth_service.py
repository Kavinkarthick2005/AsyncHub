from typing import Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate, UserResponse
from app.core.security import get_password_hash, verify_password, create_access_token, create_refresh_token
from app.models.user import User
import jwt
from app.core.config import settings

class AuthService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.user_repo = UserRepository(session)

    async def register(self, user_in: UserCreate) -> User:
        # Check if user exists
        existing_user = await self.user_repo.get_by_email(user_in.email)
        if existing_user:
            raise ValueError("Email already registered")

        hashed_password = get_password_hash(user_in.password)
        user = await self.user_repo.create(user_in, hashed_password)
        return user

    async def login(self, email: str, password: str) -> Tuple[str, str]:
        user = await self.user_repo.get_by_email(email)
        if not user or not verify_password(password, user.hashed_password):
            raise ValueError("Incorrect email or password")
        
        access_token = create_access_token(user.id)
        refresh_token = create_refresh_token(user.id)
        
        return access_token, refresh_token

    async def refresh_token(self, refresh_token: str) -> Tuple[str, str]:
        try:
            payload = jwt.decode(
                refresh_token, settings.SECRET_KEY, algorithms=["HS256"]
            )
            token_data = payload.get("sub")
            if token_data is None:
                raise ValueError("Invalid token")
        except jwt.PyJWTError:
            raise ValueError("Invalid token")
            
        access_token = create_access_token(token_data)
        new_refresh_token = create_refresh_token(token_data)
        
        return access_token, new_refresh_token
