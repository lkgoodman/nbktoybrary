from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import require_roles
from app.db.session import get_db
from app.models.settings import SiteSettings
from app.models.user import User
from app.schemas.settings import SiteSettingsRead, SiteSettingsUpdate

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("", response_model=SiteSettingsRead)
async def get_settings(db: AsyncSession = Depends(get_db)) -> SiteSettingsRead:
    result = await db.execute(select(SiteSettings).where(SiteSettings.id == 1))
    settings = result.scalar_one_or_none()
    return SiteSettingsRead(address=settings.address if settings is not None else "")


@router.patch("", response_model=SiteSettingsRead)
async def update_settings(
    payload: SiteSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_roles("admin", "superadmin")),
) -> SiteSettingsRead:
    result = await db.execute(select(SiteSettings).where(SiteSettings.id == 1))
    settings = result.scalar_one_or_none()
    if settings is None:
        settings = SiteSettings(id=1, address=payload.address)
        db.add(settings)
    else:
        settings.address = payload.address
    await db.commit()
    return SiteSettingsRead(address=settings.address)
