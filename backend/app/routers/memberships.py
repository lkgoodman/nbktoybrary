from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.auth import require_roles
from app.db.session import get_db
from app.models.membership import AccountStanding, Membership, MembershipUser
from app.models.user import User
from app.schemas.membership import MembershipRead, MembershipUpdate

router = APIRouter(prefix="/memberships", tags=["memberships"])

_load_options = [
    selectinload(Membership.users).selectinload(MembershipUser.user),
]


@router.get("", response_model=list[MembershipRead])
async def list_memberships(
    user_id: uuid.UUID | None = None,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_roles("superadmin")),
) -> list[Membership]:
    stmt = select(Membership).options(*_load_options)
    if user_id is not None:
        stmt = stmt.join(MembershipUser).where(MembershipUser.user_id == user_id)
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.patch("/{membership_id}", response_model=MembershipRead)
async def update_membership(
    membership_id: uuid.UUID,
    payload: MembershipUpdate,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_roles("superadmin")),
) -> Membership:
    result = await db.execute(
        select(Membership).options(*_load_options).where(Membership.id == membership_id)
    )
    membership = result.scalar_one_or_none()
    if membership is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Membership not found")
    membership.account_standing = payload.account_standing
    await db.commit()
    await db.refresh(membership)
    return membership
