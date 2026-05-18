"""
S3-compatible object storage client for Railway Storage Buckets (Tigris).

Public URLs are returned after upload so images can be served directly
without proxying through the backend.
All boto3 calls are synchronous and must be wrapped in asyncio.to_thread
before use in async FastAPI handlers.
"""
from __future__ import annotations

import os
from functools import lru_cache
from urllib.parse import urlparse

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


def _public_base() -> str:
    """Return the base public URL for the bucket, e.g. https://mybucket.t3.storageapi.dev"""
    endpoint = os.environ["BUCKET_ENDPOINT_URL"]
    bucket = _bucket()
    parsed = urlparse(endpoint)
    return f"{parsed.scheme}://{bucket}.{parsed.netloc}"


def get_public_url(key: str) -> str:
    """Return the public URL for an object key."""
    return f"{_public_base()}/{key}"


def key_from_public_url(url: str) -> str | None:
    """Extract the S3 key from a public URL. Returns None if not an S3 URL."""
    try:
        base = _public_base() + "/"
        if url.startswith(base):
            return url[len(base):]
    except KeyError:
        pass
    return None


def upload_image(key: str, data: bytes, content_type: str) -> str:
    """Upload image bytes under *key* and return the public URL."""
    _get_client().put_object(
        Bucket=_bucket(),
        Key=key,
        Body=data,
        ContentType=content_type,
        ACL="public-read",
    )
    return get_public_url(key)


def delete_image(key: str) -> None:
    """Delete the object at *key* (no-op if it does not exist)."""
    _get_client().delete_object(Bucket=_bucket(), Key=key)
