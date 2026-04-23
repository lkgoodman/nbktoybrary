from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import require_roles
from app.db.session import get_db
from app.models.scheduling import Checkout, Request
from app.models.toy import Toy, ToyTag
from app.models.user import User
from app.schemas.toy import ToyCreate, ToyReadWithImages, ToyUpdate

router = APIRouter(prefix="/toys", tags=["toys"])

_load_options = [
    selectinload(Toy.images),
    selectinload(Toy.tags).selectinload(ToyTag.tag),
    selectinload(Toy.requests).selectinload(Request.checkout),
    selectinload(Toy.checkouts),
]


@router.post("", response_model=ToyReadWithImages, status_code=status.HTTP_201_CREATED)
async def create_toy(
    payload: ToyCreate,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_roles("admin", "superadmin")),
) -> Toy:
    toy = Toy(**payload.model_dump())
    db.add(toy)
    await db.commit()
    result = await db.execute(select(Toy).options(*_load_options).where(Toy.id == toy.id))
    return result.scalar_one()


@router.get("", response_model=list[ToyReadWithImages])
async def list_toys(db: AsyncSession = Depends(get_db)) -> list[Toy]:
    result = await db.execute(
        select(Toy).options(*_load_options).order_by(Toy.created_at.desc())
    )
    return list(result.scalars().all())


@router.get("/{toy_id}", response_model=ToyReadWithImages)
async def get_toy(toy_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> Toy:
    result = await db.execute(
        select(Toy).options(*_load_options).where(Toy.id == toy_id)
    )
    toy = result.scalar_one_or_none()
    if toy is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Toy not found")
    return toy


@router.patch("/{toy_id}", response_model=ToyReadWithImages)
async def update_toy(
    toy_id: uuid.UUID,
    payload: ToyUpdate,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_roles("admin", "superadmin")),
) -> Toy:
    result = await db.execute(
        select(Toy).options(*_load_options).where(Toy.id == toy_id)
    )
    toy = result.scalar_one_or_none()
    if toy is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Toy not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(toy, field, value)
    await db.commit()
    await db.refresh(toy)
    return toy
