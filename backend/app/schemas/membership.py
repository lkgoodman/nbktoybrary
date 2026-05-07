from __future__ import annotations

import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field

from app.models.membership import AccountStanding, MembershipRequestStatus
from app.schemas.base import AuditRead, ORMModel
from app.schemas.user import UserRead


class MembershipRequestCreate(BaseModel):
    user_id: uuid.UUID
    notes: str | None = Field(default=None, max_length=1024)


class MembershipRequestUpdate(BaseModel):
    status: MembershipRequestStatus
    notes: str | None = Field(default=None, max_length=1024)


class MembershipRequestRead(AuditRead):
    id: uuid.UUID
    user_id: uuid.UUID
    reviewed_by: uuid.UUID | None
    reviewed_at: datetime | None
    status: MembershipRequestStatus
    notes: str | None


class MembershipRequestReadWithUser(MembershipRequestRead):
    user: UserRead


class MembershipCreate(BaseModel):
    user_id: uuid.UUID


class MembershipUpdate(BaseModel):
    account_standing: AccountStanding


class MembershipRead(AuditRead):
    id: uuid.UUID
    membership_request_id: uuid.UUID
    start_date: date
    end_date: date
    account_standing: AccountStanding


class MembershipUserCreate(BaseModel):
    membership_id: uuid.UUID
    user_id: uuid.UUID


class MembershipUserRead(ORMModel):
    membership_id: uuid.UUID
    user_id: uuid.UUID
