from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.security import create_access_token, verify_password
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.auth import LoginRequest, TokenResponse
from app.schemas.user import UserRead, UserReadWithRoles

router = APIRouter(prefix="/auth", tags=["auth"])

_load_roles = selectinload(User.roles).selectinload(UserRole.role)


def _build_user_with_roles(user: User) -> UserReadWithRoles:
    data = UserRead.model_validate(user).model_dump()
    data["roles"] = [ur.role.name for ur in user.roles]
    return UserReadWithRoles.model_validate(data)


@router.post("/token", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    result = await db.execute(
        select(User).options(_load_roles).where(User.email == payload.email)
    )
    user = result.scalar_one_or_none()
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        user=_build_user_with_roles(user),
    )
