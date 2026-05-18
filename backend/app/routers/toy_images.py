from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import require_roles
from app.db.session import get_db
from app.models.toy import ToyImage
from app.models.user import User
from app.schemas.toy import ToyImageRead, ToyImageUpdate

router = APIRouter(tags=["toy-images"])


@router.patch("/toy-images/{image_id}", response_model=ToyImageRead)
async def update_toy_image(
    image_id: uuid.UUID,
    payload: ToyImageUpdate,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_roles("admin", "superadmin")),
) -> ToyImage:
    image = await db.get(ToyImage, image_id)
    if image is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")

    if payload.is_featured:
        all_images = await db.execute(
            select(ToyImage).where(ToyImage.toy_id == image.toy_id)
        )
        for img in all_images.scalars().all():
            img.is_featured = False

    image.is_featured = payload.is_featured
    await db.commit()
    await db.refresh(image)
    return image


@router.delete("/toy-images/{image_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
async def delete_toy_image(
    image_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_roles("admin", "superadmin")),
) -> Response:
    image = await db.get(ToyImage, image_id)
    if image is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")
    await db.delete(image)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
