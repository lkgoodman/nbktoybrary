from __future__ import annotations

import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field

from app.models.scheduling import RequestStatus
from app.schemas.base import AuditRead


class BorrowRequestCreate(BaseModel):
    toy_ids: list[uuid.UUID] = Field(min_length=1, max_length=5)
    timeframe_id: uuid.UUID
    return_date: date
    return_timeframe_id: uuid.UUID


class BorrowRequestUpdate(BaseModel):
    status: RequestStatus
    denial_note: str | None = Field(default=None, max_length=1024)


class BorrowRequestRead(AuditRead):
    id: uuid.UUID
    batch_id: uuid.UUID
    toy_id: uuid.UUID
    membership_id: uuid.UUID
    status: RequestStatus
    denial_note: str | None
    return_date: date | None
    return_start: datetime | None
    return_end: datetime | None


class BorrowRequestReadWithDetails(AuditRead):
    id: uuid.UUID
    batch_id: uuid.UUID
    toy_id: uuid.UUID
    membership_id: uuid.UUID
    status: RequestStatus
    denial_note: str | None
    return_date: date | None
    toy_name: str
    member_name: str
    member_user_id: uuid.UUID | None
    pickup_start: datetime | None
    pickup_end: datetime | None
    return_start: datetime | None
    return_end: datetime | None
