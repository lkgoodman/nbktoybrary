from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete as sql_delete, select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import require_roles, get_optional_user, _is_admin
from app.db.session import get_db
from app.models.scheduling import Checkout, Request
from app.models.toy import Tag, Toy, ToyTag
from app.models.user import User
from app.schemas.toy import ToyCreate, ToyReadWithImages, ToyUpdate

router = APIRouter(prefix="/toys", tags=["toys"])

_load_options = [
    selectinload(Toy.images),
    selectinload(Toy.tags).selectinload(ToyTag.tag),
    selectinload(Toy.requests).selectinload(Request.checkout),
    selectinload(Toy.checkouts),
]


async def _sync_tags(toy: Toy, tag_names: list[str], db: AsyncSession) -> None:
    """Replace the toy's tags with the given list of tag names."""
    # Remove existing toy-tag associations
    await db.execute(sql_delete(ToyTag).where(ToyTag.toy_id == toy.id))
    await db.flush()
    # Find or create each tag and associate
    for name in tag_names:
        name = name.strip().lower()
        if not name:
            continue
        result = await db.execute(select(Tag).where(Tag.name == name))
        tag = result.scalar_one_or_none()
        if tag is None:
            tag = Tag(name=name)
            db.add(tag)
            await db.flush()
        db.add(ToyTag(toy_id=toy.id, tag_id=tag.id))
    await db.flush()


@router.post("", response_model=ToyReadWithImages, status_code=status.HTTP_201_CREATED)
async def create_toy(
    payload: ToyCreate,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_roles("admin", "superadmin")),
) -> Toy:
    data = payload.model_dump()
    tag_names: list[str] = data.pop("tags", [])
    toy = Toy(**data)
    db.add(toy)
    await db.flush()
    await _sync_tags(toy, tag_names, db)
    await db.commit()
    result = await db.execute(select(Toy).options(*_load_options).where(Toy.id == toy.id))
    return result.scalar_one()


@router.get("", response_model=list[ToyReadWithImages])
async def list_toys(
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
) -> list[Toy]:
    query = select(Toy).options(*_load_options).order_by(Toy.created_at.desc())
    if not _is_admin(current_user):
        query = query.where(Toy.shareable == True)  # noqa: E712
    result = await db.execute(query)
    return list(result.scalars().all())


@router.get("/{toy_id}", response_model=ToyReadWithImages)
async def get_toy(
    toy_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
) -> Toy:
    result = await db.execute(
        select(Toy).options(*_load_options).where(Toy.id == toy_id)
    )
    toy = result.scalar_one_or_none()
    if toy is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Toy not found")
    if not toy.shareable and not _is_admin(current_user):
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
    update_data = payload.model_dump(exclude_unset=True)
    tag_names: list[str] | None = update_data.pop("tags", None)
    for field, value in update_data.items():
        setattr(toy, field, value)
    if tag_names is not None:
        await _sync_tags(toy, tag_names, db)
    await db.commit()
    result = await db.execute(select(Toy).options(*_load_options).where(Toy.id == toy_id))
    return result.scalar_one()
