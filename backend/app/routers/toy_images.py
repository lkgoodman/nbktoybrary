from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Response, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user, require_roles
from app.db.session import get_db
from app.models.toy import ToyImage
from app.models.user import User
from app.schemas.toy import ToyImageRead, ToyImageUpdate

router = APIRouter(tags=["toy-images"])

ALLOWED_CONTENT_TYPES: frozenset[str] = frozenset({"image/jpeg", "image/png", "image/webp", "image/gif"})


@router.post("/toys/{toy_id}/images", response_model=ToyImageRead, status_code=status.HTTP_201_CREATED)
async def upload_toy_image(
    toy_id: uuid.UUID,
    file: UploadFile,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_roles("admin", "superadmin")),
) -> ToyImage:
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Only JPEG, PNG, WebP, and GIF images are supported",
        )

    existing = await db.execute(select(ToyImage).where(ToyImage.toy_id == toy_id))
    is_first = existing.scalar_one_or_none() is None

    contents = await file.read()

    image = ToyImage(
        toy_id=toy_id,
        image_url="",
        is_featured=is_first,
        data=contents,
        content_type=file.content_type,
    )
    db.add(image)
    await db.flush()
    image.image_url = f"/toy-images/{image.id}/file"
    await db.commit()
    await db.refresh(image)
    return image


@router.get("/toy-images/{image_id}/file")
async def get_toy_image_file(
    image_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> Response:
    image = await db.get(ToyImage, image_id)
    if image is None or image.data is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")
    return Response(content=image.data, media_type=image.content_type or "application/octet-stream")


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
