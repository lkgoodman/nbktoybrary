from __future__ import annotations

from pydantic import BaseModel, Field


class SiteSettingsRead(BaseModel):
    address: str


class SiteSettingsUpdate(BaseModel):
    address: str = Field(min_length=1, max_length=255)
