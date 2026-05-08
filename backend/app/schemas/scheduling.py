from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field, field_serializer

from app.models.scheduling import TimeframeStatus
from app.schemas.base import AuditRead


def _strip_tz(v: datetime) -> str:
    return v.strftime("%Y-%m-%dT%H:%M:%S")


class TimeframeBase(BaseModel):
    start_time: datetime
    end_time: datetime
    notes: str | None = Field(default=None, max_length=1024)

    @field_serializer("start_time", "end_time")
    def serialize_time(self, v: datetime) -> str:
        return _strip_tz(v)


class TimeframeCreate(TimeframeBase):
    pass


class TimeframeRead(TimeframeBase, AuditRead):
    id: uuid.UUID


class RequestCreate(BaseModel):
    toy_id: uuid.UUID
    membership_id: uuid.UUID


class RequestRead(AuditRead):
    id: uuid.UUID
    toy_id: uuid.UUID
    membership_id: uuid.UUID


class CheckoutTimeframeCreate(BaseModel):
    request_id: uuid.UUID
    timeframe_id: uuid.UUID
    status: TimeframeStatus = TimeframeStatus.scheduled


class CheckoutTimeframeRead(AuditRead):
    id: uuid.UUID
    request_id: uuid.UUID
    timeframe_id: uuid.UUID
    status: TimeframeStatus


class CheckoutCreate(BaseModel):
    toy_id: uuid.UUID
    membership_id: uuid.UUID
    user_id: uuid.UUID
    request_id: uuid.UUID | None = None
    checked_out_at: datetime
    due_at: datetime


class CheckoutRead(AuditRead):
    id: uuid.UUID
    toy_id: uuid.UUID
    membership_id: uuid.UUID
    user_id: uuid.UUID
    request_id: uuid.UUID | None
    checked_out_at: datetime
    due_at: datetime
    returned_at: datetime | None


class ReturnTimeframeCreate(BaseModel):
    checkout_id: uuid.UUID
    timeframe_id: uuid.UUID
    status: TimeframeStatus = TimeframeStatus.scheduled


class ReturnTimeframeRead(AuditRead):
    id: uuid.UUID
    checkout_id: uuid.UUID
    timeframe_id: uuid.UUID
    status: TimeframeStatus
