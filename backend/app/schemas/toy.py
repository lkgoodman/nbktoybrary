from __future__ import annotations

import uuid
from typing import Any

from pydantic import BaseModel, Field, model_validator

from app.schemas.base import AuditRead, ORMModel


class ToyBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str = Field(default="", max_length=2048)
    brand: str | None = Field(default=None, max_length=255)
    language: str | None = Field(default=None, max_length=64)
    link: str | None = Field(default=None, max_length=1024)
    battery_operated: bool
    shareable: bool
    age_min: int | None = Field(default=None, ge=0)
    age_max: int | None = Field(default=None, ge=0)
    piece_count: int | None = Field(default=None, ge=0)
    quantity: int = Field(default=1, ge=1)
    admin_notes: str | None = None
    materials: list[str] = Field(default_factory=list)
    keywords: list[str] = Field(default_factory=list)


class ToyCreate(ToyBase):
    tags: list[str] = Field(default_factory=list)


class ToyUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=2048)
    brand: str | None = Field(default=None, max_length=255)
    language: str | None = Field(default=None, max_length=64)
    link: str | None = Field(default=None, max_length=1024)
    battery_operated: bool | None = None
    shareable: bool | None = None
    age_min: int | None = Field(default=None, ge=0)
    age_max: int | None = Field(default=None, ge=0)
    piece_count: int | None = Field(default=None, ge=0)
    quantity: int | None = Field(default=None, ge=1)
    admin_notes: str | None = None
    materials: list[str] | None = None
    keywords: list[str] | None = None
    tags: list[str] | None = None


class ToyRead(ToyBase, AuditRead):
    id: uuid.UUID


class ToyImageBase(BaseModel):
    image_url: str = Field(min_length=1, max_length=1024)
    is_featured: bool = False


class ToyImageCreate(ToyImageBase):
    toy_id: uuid.UUID


class ToyImageUpdate(BaseModel):
    is_featured: bool


class ToyImageRead(ToyImageBase, AuditRead):
    id: uuid.UUID
    toy_id: uuid.UUID


class ToyReadWithImages(ToyRead):
    images: list[ToyImageRead] = []
    tags: list[str] = []
    is_available: bool = True
    is_checked_out: bool = False
    is_requested: bool = False
    available_count: int = 0

    @model_validator(mode="before")
    @classmethod
    def extract_tags(cls, data: Any) -> Any:
        if isinstance(data, dict) or not hasattr(data, "tags"):
            return data
        from sqlalchemy import inspect as sa_inspect
        mapper = sa_inspect(type(data))
        result: dict[str, Any] = {
            col.key: getattr(data, col.key, None)
            for col in mapper.mapper.column_attrs
        }
        toy_tags = getattr(data, "tags", [])
        result["tags"] = [tt.tag.name for tt in toy_tags if hasattr(tt, "tag")]
        result["materials"] = result.get("materials") or []
        result["images"] = getattr(data, "images", [])
        requests = getattr(data, "requests", [])
        checkouts = getattr(data, "checkouts", [])
        quantity = result.get("quantity") or 1
        active_request_count = sum(
            1 for r in requests
            if getattr(r, "status", None) in ("pending", "approved")
            and (getattr(r, "checkout", None) is None or r.checkout.returned_at is None)
        )
        active_checkout_count = sum(1 for c in checkouts if c.returned_at is None)
        active_total = active_request_count + active_checkout_count
        result["is_available"] = active_total < quantity
        result["is_checked_out"] = active_checkout_count > 0
        result["is_requested"] = active_request_count > 0 and active_total < quantity
        result["available_count"] = max(0, quantity - active_total)
        return result


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
