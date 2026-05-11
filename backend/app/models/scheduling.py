from __future__ import annotations

import enum
import uuid
from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Date, DateTime, Enum, ForeignKey, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import AuditMixin, Base, UuidPK

if TYPE_CHECKING:
    from app.models.membership import Membership
    from app.models.toy import Toy
    from app.models.user import User


class TimeframeStatus(str, enum.Enum):
    scheduled = "scheduled"
    completed = "completed"
    no_show = "no_show"
    cancelled = "cancelled"


class RequestStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    denied = "denied"


class Timeframe(AuditMixin, Base):
    __tablename__ = "timeframes"

    id: Mapped[UuidPK]
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    notes: Mapped[str | None] = mapped_column(String(1024), nullable=True)

    creator: Mapped["User | None"] = relationship(
        back_populates="timeframes_created", foreign_keys="Timeframe.created_by"
    )
    checkout_timeframes: Mapped[list["CheckoutTimeframe"]] = relationship(
        back_populates="timeframe"
    )
    return_timeframes: Mapped[list["ReturnTimeframe"]] = relationship(
        back_populates="timeframe"
    )


class Request(AuditMixin, Base):
    __tablename__ = "requests"

    id: Mapped[UuidPK]
    batch_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    toy_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("toys.id", ondelete="RESTRICT"), nullable=False
    )
    membership_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("memberships.id", ondelete="CASCADE"), nullable=False
    )
    status: Mapped[RequestStatus] = mapped_column(
        Enum(RequestStatus, name="request_status"),
        server_default=RequestStatus.pending.value,
        nullable=False,
    )
    denial_note: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    return_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    return_timeframe_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("timeframes.id", ondelete="SET NULL"), nullable=True
    )

    toy: Mapped["Toy"] = relationship(back_populates="requests")
    membership: Mapped["Membership"] = relationship(back_populates="borrow_requests")
    checkout_timeframes: Mapped[list["CheckoutTimeframe"]] = relationship(
        back_populates="request", cascade="all, delete-orphan"
    )
    checkout: Mapped["Checkout | None"] = relationship(back_populates="request", uselist=False)
    return_timeframe: Mapped["Timeframe | None"] = relationship(foreign_keys=[return_timeframe_id])


class CheckoutTimeframe(AuditMixin, Base):
    __tablename__ = "checkout_timeframes"

    id: Mapped[UuidPK]
    request_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("requests.id", ondelete="CASCADE"), nullable=False
    )
    timeframe_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("timeframes.id", ondelete="RESTRICT"), nullable=False
    )
    status: Mapped[TimeframeStatus] = mapped_column(
        Enum(TimeframeStatus, name="checkout_timeframe_status"),
        default=TimeframeStatus.scheduled,
        nullable=False,
    )

    request: Mapped["Request"] = relationship(back_populates="checkout_timeframes")
    timeframe: Mapped["Timeframe"] = relationship(back_populates="checkout_timeframes")


class Checkout(AuditMixin, Base):
    __tablename__ = "checkouts"

    id: Mapped[UuidPK]
    toy_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("toys.id", ondelete="RESTRICT"), nullable=False
    )
    membership_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("memberships.id", ondelete="RESTRICT"), nullable=False
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="RESTRICT"), nullable=True
    )
    request_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("requests.id", ondelete="SET NULL"), unique=True, nullable=True
    )
    checked_out_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    due_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    returned_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    toy: Mapped["Toy"] = relationship(back_populates="checkouts")
    membership: Mapped["Membership"] = relationship(back_populates="checkouts")
    user: Mapped["User | None"] = relationship(back_populates="checkouts", foreign_keys=[user_id])
    request: Mapped["Request | None"] = relationship(back_populates="checkout")
    return_timeframes: Mapped[list["ReturnTimeframe"]] = relationship(
        back_populates="checkout", cascade="all, delete-orphan"
    )


class ReturnTimeframe(AuditMixin, Base):
    __tablename__ = "return_timeframes"

    id: Mapped[UuidPK]
    checkout_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("checkouts.id", ondelete="CASCADE"), nullable=False
    )
    timeframe_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("timeframes.id", ondelete="RESTRICT"), nullable=False
    )
    status: Mapped[TimeframeStatus] = mapped_column(
        Enum(TimeframeStatus, name="return_timeframe_status"),
        default=TimeframeStatus.scheduled,
        nullable=False,
    )

    checkout: Mapped["Checkout"] = relationship(back_populates="return_timeframes")
    timeframe: Mapped["Timeframe"] = relationship(back_populates="return_timeframes")
