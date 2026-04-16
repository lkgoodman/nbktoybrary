from __future__ import annotations

from datetime import date, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models.membership import AccountStanding, Membership, MembershipRequest, MembershipRequestStatus, MembershipUser
from app.models.toy import Tag, Toy, ToyImage, ToyTag
from app.models.user import Role, User, UserRole


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

    blocks = Toy(
        name="Wooden Blocks",
        description="Classic 50-piece wooden block set for open-ended play.",
        brand="Melissa & Doug",
        battery_operated=False,
        shareable=True,
        age_min=2,
        age_max=8,
        piece_count=50,
        created_by=admin.id,
    )
    rc_car = Toy(
        name="Remote Control Car",
        description="Rechargeable RC car with working headlights.",
        brand="Hot Wheels",
        battery_operated=True,
        shareable=False,
        age_min=6,
        age_max=12,
        created_by=admin.id,
    )
    easel = Toy(
        name="Art Easel",
        description="Double-sided easel with chalkboard and whiteboard.",
        battery_operated=False,
        shareable=True,
        age_min=3,
        age_max=10,
        created_by=admin.id,
    )
    db.add_all([blocks, rc_car, easel])
    await db.flush()

    db.add_all(
        [
            ToyImage(
                toy_id=blocks.id,
                image_url="https://picsum.photos/seed/woodenblocks/600/400",
                is_featured=True,
            ),
            ToyImage(
                toy_id=rc_car.id,
                image_url="https://picsum.photos/seed/rccar/600/400",
                is_featured=True,
            ),
            ToyImage(
                toy_id=easel.id,
                image_url="https://picsum.photos/seed/arteasel/600/400",
                is_featured=True,
            ),
        ]
    )

    tag_building = Tag(name="building")
    tag_creative = Tag(name="creative")
    tag_vehicles = Tag(name="vehicles")
    tag_outdoor = Tag(name="outdoor")
    tag_electronic = Tag(name="electronic")
    tag_art = Tag(name="art")
    db.add_all([tag_building, tag_creative, tag_vehicles, tag_outdoor, tag_electronic, tag_art])
    await db.flush()

    db.add_all(
        [
            ToyTag(toy_id=blocks.id, tag_id=tag_building.id),
            ToyTag(toy_id=blocks.id, tag_id=tag_creative.id),
            ToyTag(toy_id=rc_car.id, tag_id=tag_vehicles.id),
            ToyTag(toy_id=rc_car.id, tag_id=tag_outdoor.id),
            ToyTag(toy_id=rc_car.id, tag_id=tag_electronic.id),
            ToyTag(toy_id=easel.id, tag_id=tag_art.id),
            ToyTag(toy_id=easel.id, tag_id=tag_creative.id),
        ]
    )

    await db.commit()
