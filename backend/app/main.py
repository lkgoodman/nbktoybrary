import os
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from app.db.base import Base
from app.db.seed import seed
from app.db.session import DATABASE_PATH, SessionLocal, engine
from app.models import *  # noqa: F401,F403  -- register mappers
from app.routers import auth, borrow_requests, checkouts, membership_requests, memberships, timeframes, toy_images, toys, users

IMAGES_DIR: str = os.getenv("IMAGES_DIR", "/data/images")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    is_fresh_db = not os.path.exists(DATABASE_PATH)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    if is_fresh_db:
        async with SessionLocal() as session:
            await seed(session)
    yield
    await engine.dispose()


app = FastAPI(title="nbktoybrary backend", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(membership_requests.router)
app.include_router(memberships.router)
app.include_router(borrow_requests.router)
app.include_router(checkouts.router)
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
