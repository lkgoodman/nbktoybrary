"""
Copies images from database/export/images/ to frontend/public/toys/
with slugified names: {toy-slug}-1.jpg, {toy-slug}-2.jpg, etc.
Primary image is always index 1.

Run from repo root:
    python3 prepare_static_images.py
"""
import csv
import os
import re
import shutil


def slugify(name: str) -> str:
    name = name.lower()
    name = re.sub(r"[^a-z0-9\s]", "", name)
    name = re.sub(r"\s+", "-", name.strip())
    name = re.sub(r"-+", "-", name)
    return name


SRC_DIR = os.path.join(os.path.dirname(__file__), "database", "export", "images")
DST_DIR = os.path.join(os.path.dirname(__file__), "frontend", "public", "toys")
CSV_PATH = os.path.join(os.path.dirname(__file__), "database", "export", "toys.csv")

os.makedirs(DST_DIR, exist_ok=True)

with open(CSV_PATH, newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        toy_name = row["name"]
        slug = slugify(toy_name)
        images_str = row["images"].strip()
        if not images_str:
            continue

        raw = [img.strip() for img in images_str.split(",") if img.strip()]
        # primary image first, then photo2, photo3, etc.
        primary = [x for x in raw if "_primary" in x]
        others = sorted([x for x in raw if "_primary" not in x])
        ordered = primary + others

        for i, filename in enumerate(ordered):
            src = os.path.join(SRC_DIR, filename)
            if not os.path.exists(src):
                print(f"  MISSING: {src}")
                continue
            ext = os.path.splitext(filename)[1].lower()
            new_name = f"{slug}-{i + 1}{ext}"
            dst = os.path.join(DST_DIR, new_name)
            shutil.copy2(src, dst)
            print(f"  {filename} -> {new_name}")

print(f"\nDone. Images in {DST_DIR}")
