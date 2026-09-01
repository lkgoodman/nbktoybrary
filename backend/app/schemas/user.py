from __future__ import annotations

import uuid
from datetime import date, datetime

from pydantic import BaseModel, EmailStr, Field

from app.schemas.base import AuditRead, ORMModel


class UserBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    email: EmailStr
    phone: str = Field(min_length=1, max_length=32)
    address_line1: str = Field(min_length=1, max_length=255)
    address_line2: str | None = Field(default=None, max_length=255)
    city: str = Field(min_length=1, max_length=128)
    state: str = Field(min_length=1, max_length=64)
    zip: str = Field(min_length=1, max_length=16)


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=255)


class UserRead(UserBase, AuditRead):
    id: uuid.UUID


class UserReadWithRoles(UserRead):
    roles: list[str] = []


class UserPasswordUpdate(BaseModel):
    password: str = Field(min_length=8, max_length=255)


class UserUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    phone: str | None = Field(default=None, min_length=1, max_length=32)
    address_line1: str | None = Field(default=None, min_length=1, max_length=255)
    address_line2: str | None = Field(default=None, max_length=255)
    city: str | None = Field(default=None, min_length=1, max_length=128)
    state: str | None = Field(default=None, min_length=1, max_length=64)
    zip: str | None = Field(default=None, min_length=1, max_length=16)
    password: str | None = Field(default=None, min_length=8, max_length=255)


class RoleBase(BaseModel):
    name: str = Field(min_length=1, max_length=64)


class RoleCreate(RoleBase):
    pass


class RoleRead(RoleBase, AuditRead):
    id: uuid.UUID


class UserRoleCreate(BaseModel):
    user_id: uuid.UUID
    role_id: uuid.UUID


class UserRoleRead(ORMModel):
    user_id: uuid.UUID
    role_id: uuid.UUID


class KidBase(BaseModel):
    name: str | None = Field(default=None, max_length=255)
    birthdate: date | None = None


class KidCreate(KidBase):
    user_id: uuid.UUID


class KidRead(KidBase, ORMModel):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class KidUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=255)
    birthdate: date | None = None
