from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ORMModel(BaseModel):
    """Base schema for models read from the ORM."""

    model_config = ConfigDict(from_attributes=True)


class AuditRead(ORMModel):
    """Shared convention fields present on every entity read response."""

    created_at: datetime
    updated_at: datetime
    created_by: uuid.UUID | None
