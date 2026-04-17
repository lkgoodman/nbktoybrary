from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.scheduling import RequestStatus
from app.schemas.base import AuditRead


class BorrowRequestCreate(BaseModel):
    toy_ids: list[uuid.UUID] = Field(min_length=1, max_length=5)
    timeframe_id: uuid.UUID


class BorrowRequestUpdate(BaseModel):
    status: RequestStatus


class BorrowRequestRead(AuditRead):
    id: uuid.UUID
    batch_id: uuid.UUID
    toy_id: uuid.UUID
    membership_id: uuid.UUID
    status: RequestStatus


class BorrowRequestReadWithDetails(AuditRead):
    id: uuid.UUID
    batch_id: uuid.UUID
    toy_id: uuid.UUID
    membership_id: uuid.UUID
    status: RequestStatus
    toy_name: str
    member_name: str
    pickup_start: datetime | None
    pickup_end: datetime | None
