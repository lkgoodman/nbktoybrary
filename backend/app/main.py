import os
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from sqlalchemy import select
from app.db.base import Base
from app.db.seed import seed
from app.db.session import SessionLocal, engine
from app.models import *  # noqa: F401,F403  -- register mappers
from app.models.user import User
from app.routers import auth, borrow_requests, checkouts, favorites, membership_requests, memberships, timeframes, toy_images, toys, users

IMAGES_DIR: str = os.getenv("IMAGES_DIR", "/data/images")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with SessionLocal() as session:
        result = await session.execute(select(User).limit(1))
        needs_seed = result.scalar_one_or_none() is None
    if needs_seed:
        async with SessionLocal() as session:
            await seed(session)
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
