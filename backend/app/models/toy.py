from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, Integer, JSON, String, Text, UniqueConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import AuditMixin, Base, TimestampMixin, UuidPK

if TYPE_CHECKING:
    from app.models.scheduling import Checkout, Request
    from app.models.user import User


class Toy(AuditMixin, Base):
    __tablename__ = "toys"

    id: Mapped[UuidPK]
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(String(2048), nullable=False)
    brand: Mapped[str | None] = mapped_column(String(255), nullable=True)
    language: Mapped[str | None] = mapped_column(String(64), nullable=True)
    link: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    battery_operated: Mapped[bool] = mapped_column(Boolean, nullable=False)
    shareable: Mapped[bool] = mapped_column(Boolean, nullable=False)
    materials: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    keywords: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    age_min: Mapped[int | None] = mapped_column(Integer, nullable=True)
    age_max: Mapped[int | None] = mapped_column(Integer, nullable=True)
    piece_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, server_default="1")
    admin_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    images: Mapped[list["ToyImage"]] = relationship(
        back_populates="toy", cascade="all, delete-orphan"
    )
    tags: Mapped[list["ToyTag"]] = relationship(
        back_populates="toy", cascade="all, delete-orphan"
    )
    requests: Mapped[list["Request"]] = relationship(back_populates="toy")
    checkouts: Mapped[list["Checkout"]] = relationship(back_populates="toy")


class ToyImage(AuditMixin, Base):
    __tablename__ = "toy_images"

    id: Mapped[UuidPK]
    toy_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("toys.id", ondelete="CASCADE"), nullable=False
    )
    image_url: Mapped[str] = mapped_column(String(1024), nullable=False)
    storage_key: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    toy: Mapped["Toy"] = relationship(back_populates="images")


class Tag(AuditMixin, Base):
    __tablename__ = "tags"

    id: Mapped[UuidPK]
    name: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)

    toys: Mapped[list["ToyTag"]] = relationship(back_populates="tag")


class ToyTag(Base):
    __tablename__ = "toy_tags"

    toy_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("toys.id", ondelete="CASCADE"), primary_key=True
    )
    tag_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True
    )

    toy: Mapped["Toy"] = relationship(back_populates="tags")
    tag: Mapped["Tag"] = relationship(back_populates="toys")


class Favorite(TimestampMixin, Base):
    __tablename__ = "favorites"
    __table_args__ = (UniqueConstraint("user_id", "toy_id", name="uq_favorites_user_toy"),)

    id: Mapped[UuidPK]
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    toy_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("toys.id", ondelete="CASCADE"), nullable=False
    )

    user: Mapped["User"] = relationship()
    toy: Mapped["Toy"] = relationship()
