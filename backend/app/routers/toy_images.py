from __future__ import annotations

import asyncio
import uuid

from fastapi import APIRouter, Depends, HTTPException, Response, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import require_roles
from app.core.storage import delete_image, download_image, upload_image
from app.db.session import get_db
from app.models.toy import ToyImage
from app.models.user import User
from app.schemas.toy import ToyImageRead, ToyImageUpdate

router = APIRouter(tags=["toy-images"])

_ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
_EXTENSIONS = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif"}


@router.post("/toys/{toy_id}/images", response_model=ToyImageRead, status_code=status.HTTP_201_CREATED)
async def upload_toy_image(
    toy_id: uuid.UUID,
    file: UploadFile,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "superadmin")),
) -> ToyImage:
    content_type = file.content_type or "image/jpeg"
    if content_type not in _ALLOWED_TYPES:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Unsupported image type")
    data = await file.read()
    ext = _EXTENSIONS[content_type]
    image_id = uuid.uuid4()
    key = f"toys/{toy_id}/{image_id}{ext}"
    await asyncio.to_thread(upload_image, key, data, content_type)
    existing = await db.execute(select(ToyImage).where(ToyImage.toy_id == toy_id))
    is_first = existing.scalars().first() is None
    image = ToyImage(
        id=image_id,
        toy_id=toy_id,
        image_url=f"/api/toy-images/{image_id}/file",
        storage_key=key,
        is_featured=is_first,
        created_by=current_user.id,
    )
    db.add(image)
    await db.commit()
    await db.refresh(image)
    return image


@router.get("/toy-images/{image_id}/file")
async def get_toy_image_file(
    image_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> Response:
    image = await db.get(ToyImage, image_id)
    if image is None or image.storage_key is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")
    data, content_type = await asyncio.to_thread(download_image, image.storage_key)
    return Response(
        content=data,
        media_type=content_type,
        headers={"Cache-Control": "public, max-age=31536000, immutable"},
    )


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
    if image.storage_key is not None:
        try:
            await asyncio.to_thread(delete_image, image.storage_key)
        except Exception:
            pass
    await db.delete(image)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
