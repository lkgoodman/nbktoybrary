from __future__ import annotations

import uuid

from pydantic import BaseModel, Field

from app.schemas.base import AuditRead, ORMModel


class ToyBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str = Field(min_length=1, max_length=2048)
    brand: str | None = Field(default=None, max_length=255)
    link: str | None = Field(default=None, max_length=1024)
    battery_operated: bool
    shareable: bool
    age_min: int | None = Field(default=None, ge=0)
    age_max: int | None = Field(default=None, ge=0)
    piece_count: int | None = Field(default=None, ge=0)


class ToyCreate(ToyBase):
    pass


class ToyUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, min_length=1, max_length=2048)
    brand: str | None = Field(default=None, max_length=255)
    link: str | None = Field(default=None, max_length=1024)
    battery_operated: bool | None = None
    shareable: bool | None = None
    age_min: int | None = Field(default=None, ge=0)
    age_max: int | None = Field(default=None, ge=0)
    piece_count: int | None = Field(default=None, ge=0)


class ToyRead(ToyBase, AuditRead):
    id: uuid.UUID


class ToyImageBase(BaseModel):
    image_url: str = Field(min_length=1, max_length=1024)
    is_featured: bool = False


class ToyImageCreate(ToyImageBase):
    toy_id: uuid.UUID


class ToyImageRead(ToyImageBase, AuditRead):
    id: uuid.UUID
    toy_id: uuid.UUID


class ToyReadWithImages(ToyRead):
    images: list[ToyImageRead] = []


class TagBase(BaseModel):
    name: str = Field(min_length=1, max_length=64)


class TagCreate(TagBase):
    pass


class TagRead(TagBase, AuditRead):
    id: uuid.UUID


class ToyTagCreate(BaseModel):
    toy_id: uuid.UUID
    tag_id: uuid.UUID


class ToyTagRead(ORMModel):
    toy_id: uuid.UUID
    tag_id: uuid.UUID
