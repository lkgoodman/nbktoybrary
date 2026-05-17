"""
S3-compatible object storage client for Railway Storage Buckets.

Buckets are private-only; files are served through the backend proxy endpoint.
All boto3 calls are synchronous and must be wrapped in asyncio.to_thread
before use in async FastAPI handlers.
"""
from __future__ import annotations

import os
from functools import lru_cache

import boto3
from botocore.client import BaseClient


@lru_cache(maxsize=1)
def _get_client() -> BaseClient:
    return boto3.client(
        "s3",
        endpoint_url=os.environ["BUCKET_ENDPOINT_URL"],
        aws_access_key_id=os.environ["BUCKET_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["BUCKET_SECRET_ACCESS_KEY"],
        region_name=os.environ.get("BUCKET_REGION", "auto"),
    )


def _bucket() -> str:
    return os.environ["BUCKET_NAME"]


def upload_image(key: str, data: bytes, content_type: str) -> None:
    """Upload image bytes under *key* in the configured bucket."""
    _get_client().put_object(
        Bucket=_bucket(),
        Key=key,
        Body=data,
        ContentType=content_type,
    )


def download_image(key: str) -> bytes:
    """Return the raw bytes stored at *key*."""
    response = _get_client().get_object(Bucket=_bucket(), Key=key)
    return response["Body"].read()  # type: ignore[no-any-return]


def delete_image(key: str) -> None:
    """Delete the object at *key* (no-op if it does not exist)."""
    _get_client().delete_object(Bucket=_bucket(), Key=key)
