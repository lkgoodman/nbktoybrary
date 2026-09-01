from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import require_roles
from app.db.session import get_db
from app.models.user import Kid, User
from app.schemas.user import KidCreate, KidRead, KidUpdate

router = APIRouter(prefix="/kids", tags=["kids"])


@router.get("", response_model=list[KidRead])
async def list_kids(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_roles("admin", "superadmin")),
) -> list[Kid]:
    result = await db.execute(select(Kid).where(Kid.user_id == user_id).order_by(Kid.created_at))
    return list(result.scalars().all())


@router.post("", response_model=KidRead, status_code=status.HTTP_201_CREATED)
async def create_kid(
    payload: KidCreate,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_roles("admin", "superadmin")),
) -> Kid:
    user = await db.get(User, payload.user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    kid = Kid(**payload.model_dump())
    db.add(kid)
    await db.commit()
    await db.refresh(kid)
    return kid


@router.patch("/{kid_id}", response_model=KidRead)
async def update_kid(
    kid_id: uuid.UUID,
    payload: KidUpdate,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_roles("admin", "superadmin")),
) -> Kid:
    kid = await db.get(Kid, kid_id)
    if kid is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kid not found")
    for field in payload.model_fields_set:
        setattr(kid, field, getattr(payload, field))
    await db.commit()
    await db.refresh(kid)
    return kid


@router.delete("/{kid_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
async def delete_kid(
    kid_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_roles("admin", "superadmin")),
) -> Response:
    kid = await db.get(Kid, kid_id)
    if kid is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kid not found")
    await db.delete(kid)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
