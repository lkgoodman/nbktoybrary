from __future__ import annotations

import uuid
from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.auth import get_current_user, require_roles
from app.db.session import get_db
from app.models.membership import (
    AccountStanding,
    Membership,
    MembershipRequest,
    MembershipRequestStatus,
    MembershipUser,
)
from app.models.user import Role, User, UserRole
from app.schemas.membership import (
    MembershipRequestReadWithUser,
    MembershipRequestUpdate,
)

router = APIRouter(prefix="/membership-requests", tags=["membership-requests"])

_load_user = selectinload(MembershipRequest.user)


@router.get("", response_model=list[MembershipRequestReadWithUser])
async def list_membership_requests(
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_roles("admin", "superadmin")),
) -> list[MembershipRequest]:
    result = await db.execute(
        select(MembershipRequest)
        .options(_load_user)
        .order_by(MembershipRequest.created_at.desc())
    )
    return list(result.scalars().all())


@router.get("/{request_id}", response_model=MembershipRequestReadWithUser)
async def get_membership_request(
    request_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_roles("admin", "superadmin")),
) -> MembershipRequest:
    result = await db.execute(
        select(MembershipRequest)
        .options(_load_user)
        .where(MembershipRequest.id == request_id)
    )
    req = result.scalar_one_or_none()
    if req is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    return req


@router.patch("/{request_id}", response_model=MembershipRequestReadWithUser)
async def update_membership_request(
    request_id: uuid.UUID,
    payload: MembershipRequestUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "superadmin")),
) -> MembershipRequest:
    result = await db.execute(
        select(MembershipRequest)
        .options(_load_user)
        .where(MembershipRequest.id == request_id)
    )
    req = result.scalar_one_or_none()
    if req is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    if req.status != MembershipRequestStatus.pending:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Request already reviewed"
        )

    req.status = payload.status
    req.notes = payload.notes
    req.reviewed_by = current_user.id
    req.reviewed_at = datetime.now(timezone.utc)

    if payload.status == MembershipRequestStatus.approved:
        today = date.today()
        membership = Membership(
            membership_request_id=req.id,
            start_date=today,
            end_date=today + timedelta(days=365),
            account_standing=AccountStanding.active,
        )
        db.add(membership)
        await db.flush()

        db.add(MembershipUser(membership_id=membership.id, user_id=req.user_id))

        member_role = await db.execute(select(Role).where(Role.name == "member"))
        role = member_role.scalar_one_or_none()
        if role is not None:
            existing_role = await db.execute(
                select(UserRole).where(
                    UserRole.user_id == req.user_id, UserRole.role_id == role.id
                )
            )
            if existing_role.scalar_one_or_none() is None:
                db.add(UserRole(user_id=req.user_id, role_id=role.id))

    await db.commit()

    result = await db.execute(
        select(MembershipRequest)
        .options(_load_user)
        .where(MembershipRequest.id == request_id)
    )
    return result.scalar_one()
