from __future__ import annotations

import uuid
from datetime import datetime
from typing import Annotated

from sqlalchemy import DateTime, ForeignKey, Uuid, func
from sqlalchemy.orm import (
    DeclarativeBase,
    Mapped,
    declared_attr,
    mapped_column,
)

UuidPK = Annotated[
    uuid.UUID,
    mapped_column(Uuid, primary_key=True, default=uuid.uuid4),
]


class Base(DeclarativeBase):
    pass


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class CreatedByMixin:
    @declared_attr
    @classmethod
    def created_by(cls) -> Mapped[uuid.UUID | None]:
        return mapped_column(
            Uuid,
            ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        )


class AuditMixin(TimestampMixin, CreatedByMixin):
    """Combines TimestampMixin + CreatedByMixin for the convention fields."""
