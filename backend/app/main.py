import os
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.db.base import Base
from app.db.seed import seed
from app.db.session import DATABASE_PATH, SessionLocal, engine
from app.models import *  # noqa: F401,F403  -- register mappers
from app.routers import toys


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

app.include_router(toys.router)


class HelloResponse(BaseModel):
    message: str


@app.get("/hello", response_model=HelloResponse)
def hello() -> HelloResponse:
    return HelloResponse(message="Hello, world!")
