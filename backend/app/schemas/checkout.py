from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel

from app.schemas.base import AuditRead


class CheckoutCreate(BaseModel):
    request_id: uuid.UUID


class CheckoutUpdate(BaseModel):
    due_at: datetime | None = None


class CheckoutRead(AuditRead):
    id: uuid.UUID
    toy_id: uuid.UUID
    membership_id: uuid.UUID
    request_id: uuid.UUID | None
    checked_out_at: datetime
    due_at: datetime
    returned_at: datetime | None
    member_name: str
    toy_name: str
