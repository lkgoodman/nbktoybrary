import os
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from sqlalchemy import select, text
from app.db.base import Base
from app.db.seed import seed
from app.db.session import SessionLocal, engine
from app.models import *  # noqa: F401,F403  -- register mappers
from app.models.user import User, Role, UserRole
from app.core.security import hash_password
from app.models.settings import SiteSettings  # noqa: F401 -- register mapper
from app.routers import auth, borrow_requests, checkouts, favorites, membership_requests, memberships, settings, timeframes, toy_images, toys, users

IMAGES_DIR: str = os.getenv("IMAGES_DIR", "/data/images")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Add columns introduced after initial deploy (no-op if they already exist)
        for stmt in [
            "ALTER TABLE toy_images ADD COLUMN IF NOT EXISTS data BYTEA",
            "ALTER TABLE toy_images ADD COLUMN IF NOT EXISTS content_type VARCHAR(128)",
            "ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE RESTRICT",
            "ALTER TABLE requests ADD COLUMN IF NOT EXISTS return_timeframe_id UUID REFERENCES timeframes(id) ON DELETE SET NULL",
            "ALTER TABLE toys ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1",
            "ALTER TABLE toys ADD COLUMN IF NOT EXISTS admin_notes TEXT",
        ]:
            try:
                await conn.execute(text(stmt))
            except Exception:
                pass
    async with SessionLocal() as session:
        result = await session.execute(select(User).limit(1))
        needs_seed = result.scalar_one_or_none() is None
    if needs_seed:
        async with SessionLocal() as session:
            await seed(session)
    # Ensure superadmin role and account exist
    async with SessionLocal() as session:
        result = await session.execute(select(Role).where(Role.name == "superadmin"))
        role = result.scalar_one_or_none()
        if role is None:
            role = Role(name="superadmin")
            session.add(role)
            await session.flush()
        result = await session.execute(select(User).where(User.email == "lkg@nbktoybrary.org"))
        user = result.scalar_one_or_none()
        if user is None:
            user = User(
                name="Library Admin",
                email="lkg@nbktoybrary.org",
                phone="000-000-0000",
                address_line1="123 Main St",
                city="Brooklyn",
                state="NY",
                zip="11201",
                password_hash=hash_password("Toybrary2026!"),
            )
            session.add(user)
            await session.flush()
        else:
            if user.phone == "":
                user.phone = "000-000-0000"
        result = await session.execute(select(UserRole).where(UserRole.user_id == user.id, UserRole.role_id == role.id))
        if result.scalar_one_or_none() is None:
            session.add(UserRole(user_id=user.id, role_id=role.id))
        await session.commit()
    # Merge "puzzle" tag into "puzzles"
    async with SessionLocal() as session:
        from app.models.toy import Tag, ToyTag
        puzzle_result = await session.execute(select(Tag).where(Tag.name == "puzzle"))
        puzzle_tag = puzzle_result.scalar_one_or_none()
        if puzzle_tag is not None:
            puzzles_result = await session.execute(select(Tag).where(Tag.name == "puzzles"))
            puzzles_tag = puzzles_result.scalar_one_or_none()
            if puzzles_tag is None:
                puzzle_tag.name = "puzzles"
            else:
                await session.execute(
                    text("UPDATE toy_tags SET tag_id = :new WHERE tag_id = :old AND toy_id NOT IN (SELECT toy_id FROM toy_tags WHERE tag_id = :new)")
                    .bindparams(new=puzzles_tag.id, old=puzzle_tag.id)
                )
                await session.execute(
                    text("DELETE FROM toy_tags WHERE tag_id = :old").bindparams(old=puzzle_tag.id)
                )
                await session.execute(
                    text("DELETE FROM tags WHERE id = :old").bindparams(old=puzzle_tag.id)
                )
            await session.commit()
    # Approve all lingering pending requests (auto-approval added retroactively)
    async with SessionLocal() as session:
        from app.models.scheduling import Request, RequestStatus as RS
        await session.execute(
            text("UPDATE requests SET status = 'approved' WHERE status = 'pending'")
        )
        await session.commit()
    # Seed default site settings
    async with SessionLocal() as session:
        result = await session.execute(select(SiteSettings).where(SiteSettings.id == 1))
        if result.scalar_one_or_none() is None:
            session.add(SiteSettings(id=1, address="171 Calyer"))
            await session.commit()
    # Migrate any images still stored as binary in the DB to S3 object storage
    import logging as _logging
    _migrate_log = _logging.getLogger("image_migration")
    if os.getenv("BUCKET_ENDPOINT_URL"):
        import asyncio as _asyncio
        from app.core import storage as _storage
        from app.models.toy import ToyImage as _ToyImage
        from sqlalchemy import text as _text
        async with engine.begin() as conn:
            rows = await conn.execute(
                _text("SELECT id, content_type, data FROM toy_images WHERE data IS NOT NULL")
            )
            pending = rows.fetchall()
        _migrate_log.warning("IMAGE MIGRATION: found %d images to migrate", len(pending))
        for row in pending:
            try:
                await _asyncio.to_thread(
                    _storage.upload_image,
                    str(row.id),
                    bytes(row.data),
                    row.content_type or "application/octet-stream",
                )
                async with engine.begin() as conn:
                    await conn.execute(
                        _text("UPDATE toy_images SET data = NULL WHERE id = :id"),
                        {"id": row.id},
                    )
                _migrate_log.warning("IMAGE MIGRATION: migrated %s", row.id)
            except Exception as _e:
                _migrate_log.error("IMAGE MIGRATION: failed %s: %s", row.id, _e)
    else:
        _migrate_log.warning("IMAGE MIGRATION: skipped, BUCKET_ENDPOINT_URL not set")
    yield
    await engine.dispose()


app = FastAPI(title="nbktoybrary backend", lifespan=lifespan)

_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
_allow_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allow_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(settings.router)
app.include_router(users.router)
app.include_router(membership_requests.router)
app.include_router(memberships.router)
app.include_router(borrow_requests.router)
app.include_router(checkouts.router)
app.include_router(favorites.router)
app.include_router(timeframes.router)
app.include_router(toys.router)
app.include_router(toy_images.router)
os.makedirs(IMAGES_DIR, exist_ok=True)
app.mount("/static/images", StaticFiles(directory=IMAGES_DIR), name="images")


class HelloResponse(BaseModel):
    message: str


@app.get("/hello", response_model=HelloResponse)
def hello() -> HelloResponse:
    return HelloResponse(message="Hello, world!")
