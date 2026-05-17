"""
One-time migration: copy existing toy images from the PostgreSQL BYTEA column
to Railway object storage, then clear the binary data from the DB.

Run inside the Railway backend service (via Railway's "Run Command"):
    python migrate_images_to_s3.py

Requires the same env vars the backend uses:
    DATABASE_URL, BUCKET_ENDPOINT_URL, BUCKET_NAME,
    BUCKET_ACCESS_KEY_ID, BUCKET_SECRET_ACCESS_KEY, BUCKET_REGION
"""
from __future__ import annotations

import os
import sys

import boto3
import psycopg2
import psycopg2.extras


def get_s3_client() -> boto3.client:  # type: ignore[type-arg]
    return boto3.client(
        "s3",
        endpoint_url=os.environ["BUCKET_ENDPOINT_URL"],
        aws_access_key_id=os.environ["BUCKET_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["BUCKET_SECRET_ACCESS_KEY"],
        region_name=os.environ.get("BUCKET_REGION", "auto"),
    )


def main() -> None:
    database_url = os.environ["DATABASE_URL"]
    bucket = os.environ["BUCKET_NAME"]
    s3 = get_s3_client()

    conn = psycopg2.connect(database_url)
    conn.autocommit = False
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    cur.execute(
        "SELECT id, content_type, data FROM toy_images WHERE data IS NOT NULL"
    )
    rows = cur.fetchall()

    if not rows:
        print("No images with binary data found — nothing to migrate.")
        conn.close()
        return

    print(f"Migrating {len(rows)} image(s)...")

    migrated = 0
    for row in rows:
        image_id: str = str(row["id"])
        content_type: str = row["content_type"] or "application/octet-stream"
        data: bytes = bytes(row["data"])

        try:
            s3.put_object(
                Bucket=bucket,
                Key=image_id,
                Body=data,
                ContentType=content_type,
            )
        except Exception as exc:
            print(f"  ERROR uploading {image_id}: {exc}", file=sys.stderr)
            continue

        cur.execute(
            "UPDATE toy_images SET data = NULL WHERE id = %s",
            (row["id"],),
        )
        migrated += 1
        print(f"  [{migrated}/{len(rows)}] migrated {image_id}")

    conn.commit()
    conn.close()
    print(f"\nDone. {migrated}/{len(rows)} images migrated to S3.")
    if migrated < len(rows):
        print("Some images failed — re-run the script to retry.")


if __name__ == "__main__":
    main()
