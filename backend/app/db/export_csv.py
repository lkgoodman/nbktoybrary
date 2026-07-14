"""
Exports all toys to a CSV file at backend/app/db/toys_export.csv.

Run from inside the backend container:
    docker compose run --rm backend python -m app.db.export_csv
"""
from __future__ import annotations

import asyncio
import csv
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db.session import SessionLocal
from app.models.toy import Toy, ToyTag


async def export() -> None:
    async with SessionLocal() as db:
        result = await db.execute(
            select(Toy)
            .options(selectinload(Toy.tags).selectinload(ToyTag.tag))
            .order_by(Toy.name)
        )
        toys = result.scalars().all()

    out_path = Path(__file__).parent / "toys_export.csv"

    fieldnames = [
        "name",
        "brand",
        "language",
        "tags",
        "age_min_months",
        "piece_count",
        "quantity",
        "battery_operated",
        "shareable",
        "materials",
        "keywords",
        "description",
        "link",
        "admin_notes",
    ]

    def age_label(months: int | None) -> str:
        if months is None:
            return ""
        if months < 12:
            return f"{months}m+"
        return f"{months // 12}+"

    with out_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for toy in toys:
            tag_names = sorted(tt.tag.name for tt in toy.tags)
            writer.writerow({
                "name": toy.name,
                "brand": toy.brand or "",
                "language": toy.language or "",
                "tags": ", ".join(tag_names),
                "age_min_months": age_label(toy.age_min),
                "piece_count": toy.piece_count if toy.piece_count is not None else "",
                "quantity": toy.quantity,
                "battery_operated": "Yes" if toy.battery_operated else "No",
                "shareable": "Yes" if toy.shareable else "No",
                "materials": ", ".join(toy.materials),
                "keywords": ", ".join(toy.keywords),
                "description": toy.description or "",
                "link": toy.link or "",
                "admin_notes": toy.admin_notes or "",
            })

    print(f"Done. Exported {len(toys)} toys to {out_path}.")


if __name__ == "__main__":
    asyncio.run(export())
