from __future__ import annotations

import uuid as uuid_lib

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user, require_roles
from app.db.session import get_db
from app.models.membership import Membership, MembershipUser
from app.models.scheduling import CheckoutTimeframe, Request, RequestStatus, Timeframe
from app.models.toy import Toy
from app.models.user import User
from app.schemas.borrow_request import BorrowRequestCreate, BorrowRequestRead, BorrowRequestReadWithDetails, BorrowRequestUpdate

router = APIRouter(prefix="/borrow-requests", tags=["borrow-requests"])

_load_options = [
    selectinload(Request.toy),
    selectinload(Request.membership).selectinload(Membership.users).selectinload(MembershipUser.user),
    selectinload(Request.checkout_timeframes).selectinload(CheckoutTimeframe.timeframe),
]


async def _get_active_membership(user: User, db: AsyncSession) -> Membership:
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
        toy_name=req.toy.name,
        member_name=member_user.name if member_user is not None else "Unknown",
        member_user_id=member_user.id if member_user is not None else None,
        pickup_start=ct.timeframe.start_time if ct is not None else None,
        pickup_end=ct.timeframe.end_time if ct is not None else None,
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
) -> list[Request]:
    membership = await _get_active_membership(current_user, db)

    tf_result = await db.execute(select(Timeframe).where(Timeframe.id == payload.timeframe_id))
    timeframe = tf_result.scalar_one_or_none()
    if timeframe is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Timeframe not found")

    MAX_TOYS = 5
    count_result = await db.execute(
        select(func.count()).where(
            Request.membership_id == membership.id,
            Request.status.in_([RequestStatus.pending, RequestStatus.approved]),
        )
    )
    active_count = count_result.scalar_one()
    if active_count + len(payload.toy_ids) > MAX_TOYS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"You already have {active_count} pending or approved request(s). You can have at most {MAX_TOYS} toys out at a time.",
        )

    batch_id = uuid_lib.uuid4()
    requests: list[Request] = []
    for toy_id in payload.toy_ids:
        req = Request(toy_id=toy_id, membership_id=membership.id, batch_id=batch_id, created_by=current_user.id)
        db.add(req)
        requests.append(req)
    await db.commit()
    for req in requests:
        await db.refresh(req)

    for req in requests:
        ct = CheckoutTimeframe(request_id=req.id, timeframe_id=timeframe.id, created_by=current_user.id)
        db.add(ct)
    await db.commit()

    return requests


@router.get("", response_model=list[BorrowRequestRead])
async def list_borrow_requests(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Request]:
    membership = await _get_active_membership(current_user, db)
    result = await db.execute(
        select(Request)
        .where(Request.membership_id == membership.id)
        .order_by(Request.created_at.desc())
    )
    return list(result.scalars().all())


@router.patch("/{request_id}", response_model=BorrowRequestRead)
async def update_borrow_request(
    request_id: uuid_lib.UUID,
    payload: BorrowRequestUpdate,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_roles("admin", "superadmin")),
) -> Request:
    result = await db.execute(select(Request).where(Request.id == request_id))
    req = result.scalar_one_or_none()
    if req is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    req.status = payload.status
    req.denial_note = payload.denial_note if payload.status == RequestStatus.denied else None
    await db.commit()
    await db.refresh(req)
    return req
