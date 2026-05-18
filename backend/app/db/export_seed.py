"""
Regenerates the TOYS list in seed.py from the current database.

Run from inside the backend container:
    docker compose run --rm backend python -m app.db.export_seed
"""
from __future__ import annotations

import asyncio
import json
import re
from pathlib import Path
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db.session import SessionLocal
from app.models.toy import Tag, Toy, ToyImage, ToyTag


def _serialize(v: Any) -> str:
    """Serialize a value to a Python literal that is always a single line."""
    if v is None:
        return "None"
    if isinstance(v, bool):
        return "True" if v else "False"
    if isinstance(v, int):
        return str(v)
    if isinstance(v, list):
        if not v:
            return "[]"
        items = ", ".join(json.dumps(x) for x in v)
        return f"[{items}]"
    # string: json.dumps always produces a double-quoted, single-line, fully-escaped string
    return json.dumps(v)


async def export() -> None:
    async with SessionLocal() as db:
        result = await db.execute(
            select(Toy)
            .options(
                selectinload(Toy.images),
                selectinload(Toy.tags).selectinload(ToyTag.tag),
            )
            .order_by(Toy.created_at)
        )
        toys = result.scalars().all()

    lines: list[str] = ["TOYS: list[dict[str, Any]] = ["]
    for toy in toys:
        featured = [img for img in toy.images if img.is_featured]
        others = sorted([img for img in toy.images if not img.is_featured], key=lambda i: i.image_url)
        ordered_images = featured + others

        images_repr: list[str] = []
        for img in ordered_images:
            images_repr.append(
                f'{{"url": {json.dumps(img.image_url)}, "is_featured": {"True" if img.is_featured else "False"}}}'
            )

        tag_names = sorted(tt.tag.name for tt in toy.tags)

        lines.append("    {")
        lines.append(f'        "name": {_serialize(toy.name)},')
        lines.append(f'        "description": {_serialize(toy.description)},')
        lines.append(f'        "brand": {_serialize(toy.brand)}, "language": {_serialize(toy.language)}, "link": {_serialize(toy.link)},')
        lines.append(f'        "battery_operated": {_serialize(toy.battery_operated)}, "shareable": {_serialize(toy.shareable)},')
        lines.append(f'        "materials": {_serialize(toy.materials)}, "age_min": {_serialize(toy.age_min)}, "age_max": {_serialize(toy.age_max)}, "piece_count": {_serialize(toy.piece_count)}, "keywords": {_serialize(toy.keywords)},')
        if toy.admin_notes is not None:
            lines.append(f'        "admin_notes": {_serialize(toy.admin_notes)},')
        else:
            lines.append('        "admin_notes": None,')
        lines.append(f'        "tags": {_serialize(tag_names)},')
        if images_repr:
            lines.append('        "images": [')
            for img_line in images_repr:
                lines.append(f'            {img_line},')
            lines.append('        ],')
        else:
            lines.append('        "images": [],')
        lines.append("    },")
    lines.append("]")

    new_toys_block = "\n".join(lines)

    seed_path = Path(__file__).parent / "seed.py"
    original = seed_path.read_text()

    # Replace everything from "TOYS: list..." up to (not including) "async def seed"
    updated = re.sub(
        r"TOYS: list\[dict\[str, Any\]\] = \[.*?\](?=\n\n\nasync def seed)",
        lambda _: new_toys_block,
        original,
        flags=re.DOTALL,
    )

    if updated == original:
        print("WARNING: Could not find TOYS block to replace — seed.py unchanged.")
        return

    seed_path.write_text(updated)
    print(f"Done. Exported {len(toys)} toys to seed.py.")


if __name__ == "__main__":
    asyncio.run(export())
