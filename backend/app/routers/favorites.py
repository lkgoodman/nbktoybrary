from __future__ import annotations

import uuid as uuid_lib

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user, require_roles
from app.db.session import get_db
from app.models.toy import Favorite
from app.models.user import User
from app.schemas.favorite import FavoriteRead

router = APIRouter(prefix="/favorites", tags=["favorites"])


@router.get("", response_model=list[FavoriteRead])
async def list_favorites(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("member", "admin", "superadmin")),
) -> list[Favorite]:
    result = await db.execute(
        select(Favorite).where(Favorite.user_id == current_user.id)
    )
    return list(result.scalars().all())


@router.post("", response_model=FavoriteRead, status_code=status.HTTP_201_CREATED)
async def add_favorite(
    toy_id: uuid_lib.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("member", "admin", "superadmin")),
) -> Favorite:
    existing = await db.execute(
        select(Favorite).where(
            Favorite.user_id == current_user.id,
            Favorite.toy_id == toy_id,
        )
    )
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already favorited")
    favorite = Favorite(user_id=current_user.id, toy_id=toy_id)
    db.add(favorite)
    await db.commit()
    await db.refresh(favorite)
    return favorite


@router.delete("/{toy_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
async def remove_favorite(
    toy_id: uuid_lib.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("member", "admin", "superadmin")),
) -> Response:
    result = await db.execute(
        select(Favorite).where(
            Favorite.user_id == current_user.id,
            Favorite.toy_id == toy_id,
        )
    )
    fav = result.scalar_one_or_none()
    if fav is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Favorite not found")
    await db.delete(fav)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
