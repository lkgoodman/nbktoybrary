from __future__ import annotations

import uuid as uuid_lib

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user, require_roles
from app.db.session import get_db
from app.models.scheduling import Timeframe
from app.models.user import User
from app.schemas.scheduling import TimeframeCreate, TimeframeRead

router = APIRouter(prefix="/timeframes", tags=["timeframes"])


@router.get("", response_model=list[TimeframeRead])
async def list_timeframes(
    db: AsyncSession = Depends(get_db),
) -> list[Timeframe]:
    result = await db.execute(select(Timeframe).order_by(Timeframe.start_time))
    return list(result.scalars().all())


@router.post("", response_model=TimeframeRead, status_code=status.HTTP_201_CREATED)
async def create_timeframe(
    payload: TimeframeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "superadmin")),
) -> Timeframe:
    timeframe = Timeframe(**payload.model_dump(), created_by=current_user.id)
    db.add(timeframe)
    await db.commit()
    await db.refresh(timeframe)
    return timeframe


@router.delete("/{timeframe_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
async def delete_timeframe(
    timeframe_id: uuid_lib.UUID,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_roles("admin", "superadmin")),
) -> Response:
    result = await db.execute(select(Timeframe).where(Timeframe.id == timeframe_id))
    tf = result.scalar_one_or_none()
    if tf is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Timeframe not found")
    await db.delete(tf)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
