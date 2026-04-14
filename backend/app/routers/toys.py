from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.toy import Toy
from app.schemas.toy import ToyCreate, ToyRead, ToyUpdate

router = APIRouter(prefix="/toys", tags=["toys"])


@router.post("", response_model=ToyRead, status_code=status.HTTP_201_CREATED)
async def create_toy(payload: ToyCreate, db: AsyncSession = Depends(get_db)) -> Toy:
    toy = Toy(**payload.model_dump())
    db.add(toy)
    await db.commit()
    await db.refresh(toy)
    return toy


@router.get("", response_model=list[ToyRead])
async def list_toys(db: AsyncSession = Depends(get_db)) -> list[Toy]:
    result = await db.execute(select(Toy).order_by(Toy.created_at.desc()))
    return list(result.scalars().all())


@router.get("/{toy_id}", response_model=ToyRead)
async def get_toy(toy_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> Toy:
    toy = await db.get(Toy, toy_id)
    if toy is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Toy not found")
    return toy


@router.patch("/{toy_id}", response_model=ToyRead)
async def update_toy(
    toy_id: uuid.UUID,
    payload: ToyUpdate,
    db: AsyncSession = Depends(get_db),
) -> Toy:
    toy = await db.get(Toy, toy_id)
    if toy is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Toy not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(toy, field, value)
    await db.commit()
    await db.refresh(toy)
    return toy
