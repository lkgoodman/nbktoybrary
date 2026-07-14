from __future__ import annotations

import uuid as uuid_lib
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user, require_roles
from app.db.session import get_db
from app.models.membership import Membership, MembershipUser
from app.models.scheduling import Checkout, Request, RequestStatus
from app.models.user import User
from app.schemas.checkout import CheckoutCreate, CheckoutRead, CheckoutUpdate

router = APIRouter(prefix="/checkouts", tags=["checkouts"])

_load_options = [
    selectinload(Checkout.toy),
    selectinload(Checkout.membership).selectinload(Membership.users).selectinload(MembershipUser.user),
]


def _to_read(c: Checkout) -> CheckoutRead:
    member_user = next(
        (mu.user for mu in c.membership.users if mu.user is not None),
        None,
    )
    return CheckoutRead(
        id=c.id,
        toy_id=c.toy_id,
        membership_id=c.membership_id,
        request_id=c.request_id,
        checked_out_at=c.checked_out_at,
        due_at=c.due_at,
        returned_at=c.returned_at,
        member_name=member_user.name if member_user is not None else "Unknown",
        toy_name=c.toy.name,
        created_at=c.created_at,
        updated_at=c.updated_at,
        created_by=c.created_by,
    )


@router.get("", response_model=list[CheckoutRead])
async def list_checkouts(
    toy_id: uuid_lib.UUID | None = None,
    returned: bool | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[CheckoutRead]:
    is_admin = any(ur.role.name in ("admin", "superadmin") for ur in current_user.roles)
    stmt = select(Checkout).options(*_load_options).order_by(Checkout.checked_out_at.desc())
    if not is_admin:
        mem_result = await db.execute(
            select(Membership)
            .join(MembershipUser, MembershipUser.membership_id == Membership.id)
            .where(MembershipUser.user_id == current_user.id)
            .order_by(Membership.end_date.desc())
        )
        membership = mem_result.scalars().first()
        if membership is None:
            return []
        stmt = stmt.where(Checkout.membership_id == membership.id)
    if toy_id is not None:
        stmt = stmt.where(Checkout.toy_id == toy_id)
    if returned is False:
        stmt = stmt.where(Checkout.returned_at.is_(None))
    elif returned is True:
        stmt = stmt.where(Checkout.returned_at.is_not(None))
    result = await db.execute(stmt)
    return [_to_read(c) for c in result.scalars().all()]


@router.post("", response_model=CheckoutRead, status_code=status.HTTP_201_CREATED)
async def create_checkout(
    payload: CheckoutCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "superadmin")),
) -> CheckoutRead:
    req_result = await db.execute(
        select(Request)
        .options(
            selectinload(Request.return_timeframe),
            selectinload(Request.membership).selectinload(Membership.users).selectinload(MembershipUser.user),
        )
        .where(Request.id == payload.request_id)
    )
    req = req_result.scalar_one_or_none()
    if req is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    if req.status == RequestStatus.denied:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Denied requests cannot be checked out",
        )

    existing = await db.execute(
        select(Checkout).where(
            Checkout.request_id == req.id,
            Checkout.returned_at.is_(None),
        )
    )
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This toy is already checked out for this request",
        )

    if req.return_timeframe is not None:
        due_at = req.return_timeframe.start_time
    elif req.return_date is not None:
        due_at = datetime(req.return_date.year, req.return_date.month, req.return_date.day, tzinfo=timezone.utc)
    else:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Request has no return date set",
        )

    member_user = next(
        (mu.user for mu in req.membership.users if mu.user is not None),
        None,
    )
    if member_user is None:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="No user found for this membership")

    now = datetime.now(tz=timezone.utc)
    checkout = Checkout(
        toy_id=req.toy_id,
        membership_id=req.membership_id,
        user_id=member_user.id,
        request_id=req.id,
        checked_out_at=now,
        due_at=due_at,
        created_by=current_user.id,
    )
    db.add(checkout)
    await db.commit()
    await db.refresh(checkout)

    result = await db.execute(
        select(Checkout).options(*_load_options).where(Checkout.id == checkout.id)
    )
    return _to_read(result.scalar_one())


@router.patch("/{checkout_id}", response_model=CheckoutRead)
async def update_checkout(
    checkout_id: uuid_lib.UUID,
    payload: CheckoutUpdate | None = Body(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CheckoutRead:
    result = await db.execute(
        select(Checkout).options(*_load_options).where(Checkout.id == checkout_id)
    )
    checkout = result.scalar_one_or_none()
    if checkout is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Checkout not found")

    is_admin = any(ur.role.name in ("admin", "superadmin") for ur in current_user.roles)

    if payload is not None and payload.due_at is not None:
        # Due date update — members can update their own checkout within the 4-week window
        if not is_admin:
            mem_result = await db.execute(
                select(Membership)
                .join(MembershipUser, MembershipUser.membership_id == Membership.id)
                .where(MembershipUser.user_id == current_user.id)
                .order_by(Membership.end_date.desc())
            )
            membership = mem_result.scalars().first()
            if membership is None or membership.id != checkout.membership_id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this checkout")

        if checkout.returned_at is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Cannot change return date of a returned checkout")

        new_due = payload.due_at if payload.due_at.tzinfo is not None else payload.due_at.replace(tzinfo=timezone.utc)
        max_due = checkout.checked_out_at.replace(tzinfo=timezone.utc) + timedelta(weeks=4)

        if new_due > max_due:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Return date must be within 4 weeks of checkout date",
            )
        if new_due <= datetime.now(tz=timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Return date must be in the future",
            )

        checkout.due_at = new_due
    else:
        # Check-in — admin only
        if not is_admin:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
        if checkout.returned_at is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This toy has already been returned")
        checkout.returned_at = datetime.now(tz=timezone.utc)

    await db.commit()
    await db.refresh(checkout)

    result2 = await db.execute(
        select(Checkout).options(*_load_options).where(Checkout.id == checkout.id)
    )
    return _to_read(result2.scalar_one())
