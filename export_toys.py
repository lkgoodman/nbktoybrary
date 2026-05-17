"""
Export all toy listings (with images) from the local SQLite database.

Run from the repo root:
    python3 export_toys.py

Output:
    database/export/toys.csv        — all toy metadata
    database/export/images/         — one image file per toy image
"""

import csv
import json
import os
import sqlite3

DB_PATH = os.path.join(os.path.dirname(__file__), "database", "app.db")
OUT_DIR = os.path.join(os.path.dirname(__file__), "database", "export")
IMG_DIR = os.path.join(OUT_DIR, "images")

CONTENT_TYPE_EXT = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}

os.makedirs(IMG_DIR, exist_ok=True)

conn = sqlite3.connect(DB_PATH)
conn.row_factory = sqlite3.Row
cur = conn.cursor()

# Check which columns exist
cur.execute("PRAGMA table_info(toys)")
toy_columns = {row["name"] for row in cur.fetchall()}
has_admin_notes = "admin_notes" in toy_columns

admin_notes_col = ", admin_notes" if has_admin_notes else ""

# Fetch all toys
cur.execute(f"""
    SELECT id, name, description, brand, language, link,
           battery_operated, shareable, age_min, age_max,
           piece_count, quantity{admin_notes_col}, materials, keywords
    FROM toys
    ORDER BY name
""")
toys = cur.fetchall()

# Fetch tags per toy
cur.execute("""
    SELECT tt.toy_id, t.name
    FROM toy_tags tt
    JOIN tags t ON t.id = tt.tag_id
""")
tags_by_toy: dict[str, list[str]] = {}
for row in cur.fetchall():
    tags_by_toy.setdefault(row["toy_id"], []).append(row["name"])

# Fetch images per toy
cur.execute("""
    SELECT id, toy_id, is_featured, data, content_type
    FROM toy_images
    ORDER BY is_featured DESC
""")
images_by_toy: dict[str, list[sqlite3.Row]] = {}
for row in cur.fetchall():
    images_by_toy.setdefault(row["toy_id"], []).append(row)

conn.close()

csv_path = os.path.join(OUT_DIR, "toys.csv")
with open(csv_path, "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow([
        "name", "description", "brand", "language", "link",
        "battery_operated", "shareable", "age_min", "age_max",
        "piece_count", "quantity", "admin_notes",
        "materials", "keywords", "tags", "images",
    ])

    for toy in toys:
        toy_id = toy["id"]
        tags = sorted(tags_by_toy.get(toy_id, []))
        images = images_by_toy.get(toy_id, [])

        # Save image files and collect filenames
        image_filenames: list[str] = []
        safe_name = "".join(c if c.isalnum() or c in " -_" else "_" for c in toy["name"]).strip()
        for i, img in enumerate(images):
            ext = CONTENT_TYPE_EXT.get(img["content_type"] or "", ".bin")
            prefix = "primary" if img["is_featured"] else f"photo{i + 1}"
            filename = f"{safe_name}_{prefix}{ext}"
            if img["data"]:
                with open(os.path.join(IMG_DIR, filename), "wb") as imgf:
                    imgf.write(img["data"])
                image_filenames.append(filename)

        materials = json.loads(toy["materials"]) if toy["materials"] else []
        keywords = json.loads(toy["keywords"]) if toy["keywords"] else []

        writer.writerow([
            toy["name"],
            toy["description"],
            toy["brand"] or "",
            toy["language"] or "",
            toy["link"] or "",
            "yes" if toy["battery_operated"] else "no",
            "yes" if toy["shareable"] else "no",
            toy["age_min"] if toy["age_min"] is not None else "",
            toy["age_max"] if toy["age_max"] is not None else "",
            toy["piece_count"] if toy["piece_count"] is not None else "",
            toy["quantity"],
            toy["admin_notes"] if has_admin_notes and toy["admin_notes"] else "",
            ", ".join(materials),
            ", ".join(keywords),
            ", ".join(tags),
            ", ".join(image_filenames),
        ])

print(f"Exported {len(toys)} toys to {csv_path}")
print(f"Images saved to {IMG_DIR}/")
