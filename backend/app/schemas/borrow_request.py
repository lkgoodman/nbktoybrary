from __future__ import annotations

import uuid

from pydantic import BaseModel, Field

from app.schemas.base import AuditRead


class BorrowRequestCreate(BaseModel):
    toy_ids: list[uuid.UUID] = Field(min_length=1, max_length=5)


class BorrowRequestRead(AuditRead):
    id: uuid.UUID
    toy_id: uuid.UUID
    membership_id: uuid.UUID


class BorrowRequestReadWithDetails(AuditRead):
    id: uuid.UUID
    toy_id: uuid.UUID
    membership_id: uuid.UUID
    toy_name: str
    member_name: str
