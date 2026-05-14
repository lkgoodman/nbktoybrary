from __future__ import annotations

import uuid as uuid_lib
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user, require_roles, _is_admin
from app.db.session import get_db
from app.models.membership import AccountStanding, Membership, MembershipUser
from app.models.scheduling import CheckoutTimeframe, Request, RequestStatus, Timeframe
from app.models.toy import Toy
from app.models.user import User
from app.schemas.borrow_request import BorrowRequestCreate, BorrowRequestRead, BorrowRequestReadWithDetails, BorrowRequestUpdate

router = APIRouter(prefix="/borrow-requests", tags=["borrow-requests"])

_load_options = [
    selectinload(Request.toy),
    selectinload(Request.membership).selectinload(Membership.users).selectinload(MembershipUser.user),
    selectinload(Request.checkout_timeframes).selectinload(CheckoutTimeframe.timeframe),
    selectinload(Request.return_timeframe),
]


async def _get_membership(user: User, db: AsyncSession) -> Membership:
    result = await db.execute(
        select(Membership)
        .join(MembershipUser, MembershipUser.membership_id == Membership.id)
        .where(MembershipUser.user_id == user.id)
        .order_by(Membership.end_date.desc())
    )
    membership = result.scalars().first()
    if membership is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No active membership found",
        )
    return membership


async def _get_active_membership(user: User, db: AsyncSession) -> Membership:
    membership = await _get_membership(user, db)
    if membership.account_standing != AccountStanding.active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your membership is currently paused. Please contact us for more information.",
        )
    return membership


def _to_details(req: Request) -> BorrowRequestReadWithDetails:
    member_user = next(
        (mu.user for mu in req.membership.users if mu.user is not None),
        None,
    )
    ct = req.checkout_timeframes[0] if req.checkout_timeframes else None
    return BorrowRequestReadWithDetails(
        id=req.id,
        batch_id=req.batch_id,
        toy_id=req.toy_id,
        membership_id=req.membership_id,
        status=req.status,
        denial_note=req.denial_note,
        return_date=req.return_date,
        toy_name=req.toy.name,
        member_name=member_user.name if member_user is not None else "Unknown",
        member_user_id=member_user.id if member_user is not None else None,
        pickup_start=ct.timeframe.start_time if ct is not None else None,
        pickup_end=ct.timeframe.end_time if ct is not None else None,
        return_start=req.return_timeframe.start_time if req.return_timeframe is not None else None,
        return_end=req.return_timeframe.end_time if req.return_timeframe is not None else None,
        created_at=req.created_at,
        updated_at=req.updated_at,
        created_by=req.created_by,
    )


@router.get("/admin", response_model=list[BorrowRequestReadWithDetails])
async def list_all_borrow_requests(
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_roles("admin", "superadmin")),
) -> list[BorrowRequestReadWithDetails]:
    result = await db.execute(
        select(Request)
        .options(*_load_options)
        .order_by(Request.created_at.desc())
    )
    requests = list(result.scalars().all())
    return [_to_details(r) for r in requests]


@router.post("", response_model=list[BorrowRequestRead], status_code=status.HTTP_201_CREATED)
async def create_borrow_requests(
    payload: BorrowRequestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[BorrowRequestRead]:
    membership = await _get_active_membership(current_user, db)

    tf_result = await db.execute(select(Timeframe).where(Timeframe.id == payload.timeframe_id))
    timeframe = tf_result.scalar_one_or_none()
    if timeframe is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Timeframe not found")

    return_tf_result = await db.execute(select(Timeframe).where(Timeframe.id == payload.return_timeframe_id))
    return_timeframe = return_tf_result.scalar_one_or_none()
    if return_timeframe is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Return timeframe not found")

    pickup_date = timeframe.start_time.date()

    # Only count requests that overlap with the new pickup date.
    # Requests whose return_date is on or before the pickup date don't conflict
    # (the member is returning those toys on or before they pick up the new ones).
    MAX_TOYS = 3
    count_result = await db.execute(
        select(func.count()).where(
            Request.membership_id == membership.id,
            Request.status.in_([RequestStatus.pending, RequestStatus.approved]),
            Request.return_date > pickup_date,
        )
    )
    active_count = count_result.scalar_one()
    if active_count + len(payload.toy_ids) > MAX_TOYS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"You already have {active_count} pending or approved request(s) that overlap with your requested pickup date. You can have at most {MAX_TOYS} toys out at a time.",
        )
    if payload.return_date < pickup_date:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Return date must be on or after the pickup date.",
        )
    if payload.return_date > pickup_date + timedelta(days=28):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Return date must be within 28 days of the pickup date.",
        )

    batch_id = uuid_lib.uuid4()
    created: list[Request] = []
    for toy_id in payload.toy_ids:
        req = Request(toy_id=toy_id, membership_id=membership.id, batch_id=batch_id, created_by=current_user.id, return_date=payload.return_date, return_timeframe_id=payload.return_timeframe_id, status=RequestStatus.approved)
        db.add(req)
        created.append(req)
    await db.commit()
    for req in created:
        await db.refresh(req)

    for req in created:
        ct = CheckoutTimeframe(request_id=req.id, timeframe_id=timeframe.id, created_by=current_user.id)
        db.add(ct)
    await db.commit()

    return [
        BorrowRequestRead(
            id=r.id,
            batch_id=r.batch_id,
            toy_id=r.toy_id,
            membership_id=r.membership_id,
            status=r.status,
            denial_note=r.denial_note,
            return_date=r.return_date,
            pickup_start=timeframe.start_time,
            pickup_end=timeframe.end_time,
            return_start=return_timeframe.start_time,
            return_end=return_timeframe.end_time,
            created_at=r.created_at,
            updated_at=r.updated_at,
            created_by=r.created_by,
        )
        for r in created
    ]


@router.get("", response_model=list[BorrowRequestRead])
async def list_borrow_requests(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[BorrowRequestRead]:
    mem_result = await db.execute(
        select(Membership)
        .join(MembershipUser, MembershipUser.membership_id == Membership.id)
        .where(MembershipUser.user_id == current_user.id)
        .order_by(Membership.end_date.desc())
    )
    membership = mem_result.scalars().first()
    if membership is None:
        return []
    result = await db.execute(
        select(Request)
        .options(
            selectinload(Request.return_timeframe),
            selectinload(Request.checkout_timeframes).selectinload(CheckoutTimeframe.timeframe),
        )
        .where(Request.membership_id == membership.id)
        .order_by(Request.created_at.desc())
    )
    requests = list(result.scalars().all())
    return [
        BorrowRequestRead(
            id=r.id,
            batch_id=r.batch_id,
            toy_id=r.toy_id,
            membership_id=r.membership_id,
            status=r.status,
            denial_note=r.denial_note,
            return_date=r.return_date,
            pickup_start=r.checkout_timeframes[0].timeframe.start_time if r.checkout_timeframes else None,
            pickup_end=r.checkout_timeframes[0].timeframe.end_time if r.checkout_timeframes else None,
            return_start=r.return_timeframe.start_time if r.return_timeframe is not None else None,
            return_end=r.return_timeframe.end_time if r.return_timeframe is not None else None,
            created_at=r.created_at,
            updated_at=r.updated_at,
            created_by=r.created_by,
        )
        for r in requests
    ]


@router.delete("/{request_id}", status_code=status.HTTP_200_OK)
async def delete_borrow_request(
    request_id: uuid_lib.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, str]:
    result = await db.execute(
        select(Request)
        .options(
            selectinload(Request.checkout_timeframes).selectinload(CheckoutTimeframe.timeframe),
            selectinload(Request.checkout),
        )
        .where(Request.id == request_id)
    )
    req = result.scalar_one_or_none()
    if req is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")

    if not _is_admin(current_user):
        # Check that this request belongs to the current user's membership
        membership = await _get_membership(current_user, db)
        if req.membership_id != membership.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

        # Cannot cancel a request that has already been checked out
        if req.checkout is not None and req.checkout.returned_at is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="This toy is already checked out and cannot be cancelled online. Please email nbktoybrary@gmail.com.",
            )

        # Block cancellation within 24 hours of pickup
        ct = req.checkout_timeframes[0] if req.checkout_timeframes else None
        if ct is not None:
            pickup = ct.timeframe.start_time
            if pickup.tzinfo is None:
                pickup = pickup.replace(tzinfo=timezone.utc)
            now = datetime.now(timezone.utc)
            if pickup > now and (pickup - now).total_seconds() < 24 * 3600:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Your pickup is within 24 hours. Please email nbktoybrary@gmail.com to cancel.",
                )

    await db.delete(req)
    await db.commit()
    return {"ok": "cancelled"}


@router.patch("/{request_id}", response_model=BorrowRequestRead)
async def update_borrow_request(
    request_id: uuid_lib.UUID,
    payload: BorrowRequestUpdate,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_roles("admin", "superadmin")),
) -> BorrowRequestRead:
    result = await db.execute(
        select(Request)
        .options(selectinload(Request.return_timeframe))
        .where(Request.id == request_id)
    )
    req = result.scalar_one_or_none()
    if req is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    req.status = payload.status
    req.denial_note = payload.denial_note if payload.status == RequestStatus.denied else None
    await db.commit()
    result = await db.execute(
        select(Request)
        .options(
            selectinload(Request.return_timeframe),
            selectinload(Request.checkout_timeframes).selectinload(CheckoutTimeframe.timeframe),
        )
        .where(Request.id == request_id)
    )
    req = result.scalar_one()
    ct = req.checkout_timeframes[0] if req.checkout_timeframes else None
    return BorrowRequestRead(
        id=req.id,
        batch_id=req.batch_id,
        toy_id=req.toy_id,
        membership_id=req.membership_id,
        status=req.status,
        denial_note=req.denial_note,
        return_date=req.return_date,
        pickup_start=ct.timeframe.start_time if ct is not None else None,
        pickup_end=ct.timeframe.end_time if ct is not None else None,
        return_start=req.return_timeframe.start_time if req.return_timeframe is not None else None,
        return_end=req.return_timeframe.end_time if req.return_timeframe is not None else None,
        created_at=req.created_at,
        updated_at=req.updated_at,
        created_by=req.created_by,
    )
