"""
Migration: add status column to requests table.
Run with: docker compose exec -w /app backend python -m app.migrate_add_request_status
"""
import asyncio

from sqlalchemy import text

from app.db.session import engine


async def main() -> None:
    async with engine.begin() as conn:
        # Check if column already exists
        result = await conn.execute(text("PRAGMA table_info(requests)"))
        columns = [row[1] for row in result.all()]
        if "status" in columns:
            print("Column 'status' already exists, nothing to do.")
            return
        await conn.execute(text("ALTER TABLE requests ADD COLUMN status VARCHAR NOT NULL DEFAULT 'pending'"))
    print("Migration complete: added 'status' column to requests table.")


asyncio.run(main())
