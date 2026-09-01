from __future__ import annotations

import uuid
from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import Date, ForeignKey, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import AuditMixin, Base, TimestampMixin, UuidPK

if TYPE_CHECKING:
    from app.models.membership import MembershipUser
    from app.models.scheduling import Checkout, Timeframe


class User(AuditMixin, Base):
    __tablename__ = "users"

    id: Mapped[UuidPK]
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(320), unique=True, nullable=False)
    phone: Mapped[str] = mapped_column(String(32), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    address_line1: Mapped[str] = mapped_column(String(255), nullable=False)
    address_line2: Mapped[str | None] = mapped_column(String(255), nullable=True)
    city: Mapped[str] = mapped_column(String(128), nullable=False)
    state: Mapped[str] = mapped_column(String(64), nullable=False)
    zip: Mapped[str] = mapped_column(String(16), nullable=False)

    roles: Mapped[list["UserRole"]] = relationship(
        back_populates="user", cascade="all, delete-orphan", foreign_keys="UserRole.user_id"
    )
    memberships: Mapped[list["MembershipUser"]] = relationship(back_populates="user")
    timeframes_created: Mapped[list["Timeframe"]] = relationship(
        back_populates="creator", foreign_keys="Timeframe.created_by"
    )
    checkouts: Mapped[list["Checkout"]] = relationship(
        back_populates="user", foreign_keys="Checkout.user_id"
    )
    kids: Mapped[list["Kid"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class Role(AuditMixin, Base):
    __tablename__ = "roles"

    id: Mapped[UuidPK]
    name: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)

    users: Mapped[list["UserRole"]] = relationship(back_populates="role")


class UserRole(Base):
    __tablename__ = "user_roles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    role_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True
    )

    user: Mapped["User"] = relationship(back_populates="roles", foreign_keys=[user_id])
    role: Mapped["Role"] = relationship(back_populates="users")


class Kid(TimestampMixin, Base):
    __tablename__ = "kids"

    id: Mapped[UuidPK]
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    birthdate: Mapped[date | None] = mapped_column(Date, nullable=True)

    user: Mapped["User"] = relationship(back_populates="kids")
