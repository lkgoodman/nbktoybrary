from __future__ import annotations

import os
from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

_raw_url = os.environ.get("DATABASE_URL")

if _raw_url:
    # Railway (and most PaaS) provide postgresql:// but asyncpg requires postgresql+asyncpg://
    DATABASE_URL = _raw_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    engine = create_async_engine(DATABASE_URL, future=True)
else:
    DATABASE_PATH = os.environ.get("DATABASE_PATH", "/data/app.db")
    DATABASE_URL = f"sqlite+aiosqlite:///{DATABASE_PATH}"
    engine = create_async_engine(DATABASE_URL, future=True)

SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def get_db() -> AsyncIterator[AsyncSession]:
    async with SessionLocal() as session:
        yield session
