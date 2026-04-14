from __future__ import annotations

import enum
import uuid
from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Date, DateTime, Enum, ForeignKey, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import AuditMixin, Base, UuidPK

if TYPE_CHECKING:
    from app.models.scheduling import Checkout, Request
    from app.models.user import User


class MembershipRequestStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    denied = "denied"


class AccountStanding(str, enum.Enum):
    active = "active"
    banned = "banned"
    temporary_hold = "temporary_hold"


class MembershipRequest(AuditMixin, Base):
    __tablename__ = "membership_requests"

    id: Mapped[UuidPK]
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    status: Mapped[MembershipRequestStatus] = mapped_column(
        Enum(MembershipRequestStatus, name="membership_request_status"),
        default=MembershipRequestStatus.pending,
        nullable=False,
    )
    notes: Mapped[str | None] = mapped_column(String(1024), nullable=True)

    user: Mapped["User"] = relationship(foreign_keys=[user_id])
    reviewer: Mapped["User | None"] = relationship(foreign_keys=[reviewed_by])
    membership: Mapped["Membership | None"] = relationship(back_populates="request", uselist=False)


class Membership(AuditMixin, Base):
    __tablename__ = "memberships"

    id: Mapped[UuidPK]
    membership_request_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("membership_requests.id", ondelete="RESTRICT"),
        unique=True,
        nullable=False,
    )
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    account_standing: Mapped[AccountStanding] = mapped_column(
        Enum(AccountStanding, name="account_standing"),
        default=AccountStanding.active,
        nullable=False,
    )

    request: Mapped["MembershipRequest"] = relationship(back_populates="membership")
    users: Mapped[list["MembershipUser"]] = relationship(
        back_populates="membership", cascade="all, delete-orphan"
    )
    borrow_requests: Mapped[list["Request"]] = relationship(back_populates="membership")
    checkouts: Mapped[list["Checkout"]] = relationship(back_populates="membership")


class MembershipUser(Base):
    __tablename__ = "membership_users"

    membership_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("memberships.id", ondelete="CASCADE"), primary_key=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )

    membership: Mapped["Membership"] = relationship(back_populates="users")
    user: Mapped["User"] = relationship(back_populates="memberships")
