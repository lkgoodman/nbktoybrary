from __future__ import annotations

import csv
from datetime import date, timedelta
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models.membership import AccountStanding, Membership, MembershipRequest, MembershipRequestStatus, MembershipUser
from app.models.toy import Tag, Toy, ToyTag
from app.models.user import Role, User, UserRole

CSV_PATH = Path(__file__).parent / "toys.csv"


def _parse_age_months(value: str) -> int | None:
    s = value.strip().replace(" ", "")
    if not s:
        return None
    if s.lower().endswith("m+") or s.lower().endswith("m"):
        try:
            return int(s.lower().rstrip("m+"))
        except ValueError:
            return None
    if s.endswith("+"):
        try:
            return int(s.rstrip("+")) * 12
        except ValueError:
            return None
    try:
        return int(s) * 12
    except ValueError:
        return None


def _parse_piece_count(value: str) -> int | None:
    s = value.strip().rstrip("+")
    if not s:
        return None
    try:
        return int(s)
    except ValueError:
        return None


def _parse_materials(value: str) -> list[str]:
    if not value.strip():
        return []
    return [m.strip().lower() for m in value.split(",") if m.strip()]


def _parse_categories(value: str) -> list[str]:
    if not value.strip():
        return []
    return [c.strip().lower() for c in value.split(",") if c.strip()]


def _parse_battery(value: str) -> bool:
    return value.strip().lower() in ("yes", "y", "true")


async def seed(db: AsyncSession) -> None:
    admin_role = Role(name="admin")
    member_role = Role(name="member")
    db.add_all([admin_role, member_role])
    await db.flush()

    admin = User(
        name="Ada",
        email="admin@toybrary.com",
        phone="555-0100",
        password_hash=hash_password("adminpass"),
        address_line1="1 Library Way",
        city="Brooklyn",
        state="NY",
        zip="11201",
    )
    member = User(
        name="Milo Member",
        email="member@toybrary.com",
        phone="555-0101",
        password_hash=hash_password("memberpass"),
        address_line1="42 Play St",
        city="Brooklyn",
        state="NY",
        zip="11215",
    )
    db.add_all([admin, member])
    await db.flush()

    db.add_all(
        [
            UserRole(user_id=admin.id, role_id=admin_role.id),
            UserRole(user_id=admin.id, role_id=member_role.id),
            UserRole(user_id=member.id, role_id=member_role.id),
        ]
    )
    await db.flush()

    today = date.today()
    membership_request = MembershipRequest(
        user_id=member.id,
        reviewed_by=admin.id,
        status=MembershipRequestStatus.approved,
    )
    db.add(membership_request)
    await db.flush()

    membership = Membership(
        membership_request_id=membership_request.id,
        start_date=today,
        end_date=today + timedelta(days=365),
        account_standing=AccountStanding.active,
    )
    db.add(membership)
    await db.flush()

    db.add(MembershipUser(membership_id=membership.id, user_id=member.id))
    await db.flush()

    # Read toys from CSV
    tag_cache: dict[str, Tag] = {}

    with open(CSV_PATH, newline="", encoding="utf-8-sig") as f:
        reader = csv.reader(f)
        next(reader)  # skip header row
        for row in reader:
            if len(row) < 7:
                continue
            name = row[0].strip()
            if not name:
                continue

            piece_count = _parse_piece_count(row[1])
            age_min = _parse_age_months(row[2])
            materials = _parse_materials(row[3])
            battery_operated = _parse_battery(row[4])
            categories = _parse_categories(row[5])
            brand_raw = row[6].strip()
            brand = brand_raw if brand_raw else None

            toy = Toy(
                name=name,
                description=" ",
                brand=brand,
                battery_operated=battery_operated,
                shareable=True,
                age_min=age_min,
                age_max=None,
                piece_count=piece_count,
                materials=materials,
                created_by=admin.id,
            )
            db.add(toy)
            await db.flush()

            for cat in categories:
                if cat not in tag_cache:
                    tag = Tag(name=cat)
                    db.add(tag)
                    await db.flush()
                    tag_cache[cat] = tag
                db.add(ToyTag(toy_id=toy.id, tag_id=tag_cache[cat].id))

    await db.commit()
