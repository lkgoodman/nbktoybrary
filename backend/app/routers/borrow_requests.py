from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user, require_roles
from app.db.session import get_db
from app.models.membership import Membership, MembershipUser
from app.models.scheduling import Request
from app.models.toy import Toy
from app.models.user import User
from app.schemas.borrow_request import BorrowRequestCreate, BorrowRequestRead, BorrowRequestReadWithDetails

router = APIRouter(prefix="/borrow-requests", tags=["borrow-requests"])

_load_options = [
    selectinload(Request.toy),
    selectinload(Request.membership).selectinload(Membership.users).selectinload(MembershipUser.user),
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
    member_name = next(
        (mu.user.name for mu in req.membership.users if mu.user is not None),
        "Unknown",
    )
    return BorrowRequestReadWithDetails(
        id=req.id,
        toy_id=req.toy_id,
        membership_id=req.membership_id,
        toy_name=req.toy.name,
        member_name=member_name,
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
    requests: list[Request] = []
    for toy_id in payload.toy_ids:
        req = Request(toy_id=toy_id, membership_id=membership.id)
        db.add(req)
        requests.append(req)
    await db.commit()
    for req in requests:
        await db.refresh(req)
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


@router.delete("/{request_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
async def delete_borrow_request(
    request_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_roles("admin", "superadmin")),
) -> Response:
    result = await db.execute(select(Request).where(Request.id == request_id))
    req = result.scalar_one_or_none()
    if req is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    await db.delete(req)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
