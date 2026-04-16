from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.auth import get_current_user
from app.core.security import hash_password
from app.db.session import get_db
from app.models.membership import MembershipRequest
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserRead, UserReadWithRoles

router = APIRouter(prefix="/users", tags=["users"])

_load_roles = selectinload(User.roles).selectinload(UserRole.role)


def _build_user_with_roles(user: User) -> UserReadWithRoles:
    data = UserRead.model_validate(user).model_dump()
    data["roles"] = [ur.role.name for ur in user.roles]
    return UserReadWithRoles.model_validate(data)


@router.post("", response_model=UserReadWithRoles, status_code=status.HTTP_201_CREATED)
async def register_user(
    payload: UserCreate, db: AsyncSession = Depends(get_db)
) -> UserReadWithRoles:
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Email already registered"
        )
    user_data = payload.model_dump()
    password = user_data.pop("password")
    user = User(**user_data, password_hash=hash_password(password))
    db.add(user)
    await db.flush()

    membership_request = MembershipRequest(user_id=user.id)
    db.add(membership_request)

    await db.commit()

    result = await db.execute(select(User).options(_load_roles).where(User.id == user.id))
    user = result.scalar_one()
    return _build_user_with_roles(user)


@router.get("/{user_id}", response_model=UserReadWithRoles)
async def get_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> UserReadWithRoles:
    result = await db.execute(
        select(User).options(_load_roles).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return _build_user_with_roles(user)
