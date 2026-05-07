from __future__ import annotations

import uuid
from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.auth import require_roles
from app.db.session import get_db
from app.models.membership import AccountStanding, Membership, MembershipRequest, MembershipRequestStatus, MembershipUser
from app.models.user import Role, User, UserRole
from app.schemas.membership import MembershipCreate, MembershipRead, MembershipUpdate

router = APIRouter(prefix="/memberships", tags=["memberships"])

_load_options = [
    selectinload(Membership.users).selectinload(MembershipUser.user),
]


@router.post("", response_model=MembershipRead, status_code=status.HTTP_201_CREATED)
async def create_membership(
    payload: MembershipCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "superadmin")),
) -> Membership:
    user = await db.get(User, payload.user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    existing = await db.execute(
        select(Membership)
        .join(MembershipUser, Membership.id == MembershipUser.membership_id)
        .where(MembershipUser.user_id == payload.user_id)
    )
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User already has a membership")

    now = datetime.now(timezone.utc)
    today = date.today()
    req = MembershipRequest(
        user_id=payload.user_id,
        status=MembershipRequestStatus.approved,
        reviewed_by=current_user.id,
        reviewed_at=now,
        created_by=current_user.id,
    )
    db.add(req)
    await db.flush()

    membership = Membership(
        membership_request_id=req.id,
        start_date=today,
        end_date=today + timedelta(days=365),
        account_standing=AccountStanding.active,
        created_by=current_user.id,
    )
    db.add(membership)
    await db.flush()

    db.add(MembershipUser(membership_id=membership.id, user_id=payload.user_id))

    member_role = await db.execute(select(Role).where(Role.name == "member"))
    role = member_role.scalar_one_or_none()
    if role is not None:
        existing_role = await db.execute(
            select(UserRole).where(UserRole.user_id == payload.user_id, UserRole.role_id == role.id)
        )
        if existing_role.scalar_one_or_none() is None:
            db.add(UserRole(user_id=payload.user_id, role_id=role.id))

    await db.commit()
    result = await db.execute(
        select(Membership).options(*_load_options).where(Membership.id == membership.id)
    )
    return result.scalar_one()


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
