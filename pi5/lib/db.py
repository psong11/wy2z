"""Thin Supabase wrapper for the wy2z orchestrator.

Two responsibilities:
  - upload a photo to the plant-photos bucket and return its public URL
  - insert one observation row into public.observations and return the id

Service-role key is required (server-side, bypasses RLS).
"""
from __future__ import annotations

import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from supabase import Client, create_client

PHOTO_BUCKET = "plant-photos"


class Db:
    def __init__(self, url: str | None = None, service_role_key: str | None = None):
        url = url or os.environ.get("SUPABASE_URL")
        key = service_role_key or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
        if not url or not key:
            raise RuntimeError(
                "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set "
                "(env or .env at repo root)"
            )
        self._client: Client = create_client(url, key)

    def upload_photo(self, local_path: Path, key: str | None = None) -> tuple[str, str]:
        """Upload a JPEG to plant-photos. Returns (storage_key, public_url)."""
        local_path = Path(local_path).expanduser().resolve()
        if not local_path.exists():
            raise FileNotFoundError(local_path)

        storage_key = key or self._default_key(local_path)
        with local_path.open("rb") as f:
            self._client.storage.from_(PHOTO_BUCKET).upload(
                path=storage_key,
                file=f.read(),
                file_options={"content-type": "image/jpeg", "upsert": "true"},
            )
        public_url = self._client.storage.from_(PHOTO_BUCKET).get_public_url(storage_key)
        return storage_key, public_url

    def insert_observation(
        self,
        *,
        photo_path: str,
        photo_url: str,
        captured_at: datetime | None = None,
        air_temp_c: float | None = None,
        air_humidity_pct: float | None = None,
        verdict: dict[str, Any] | None = None,
        action_taken: str | None = None,
        action_payload: dict[str, Any] | None = None,
        action_result: str | None = None,
        notes: str | None = None,
    ) -> str:
        """Insert one observation row. Returns the new row's UUID."""
        row: dict[str, Any] = {
            "photo_path": photo_path,
            "photo_url": photo_url,
            "captured_at": (captured_at or datetime.now(timezone.utc)).isoformat(),
            "air_temp_c": air_temp_c,
            "air_humidity_pct": air_humidity_pct,
            "verdict": verdict,
            "action_taken": action_taken,
            "action_payload": action_payload,
            "action_result": action_result,
            "notes": notes,
        }
        result = self._client.table("observations").insert(row).execute()
        if not result.data:
            raise RuntimeError(f"insert returned no rows: {result}")
        return result.data[0]["id"]

    @staticmethod
    def _default_key(path: Path) -> str:
        """e.g. 2026/05/03/wy2z_2026-05-03_09-40-46.jpg — partitioned by date."""
        ts = datetime.now(timezone.utc)
        return f"{ts:%Y/%m/%d}/{path.name}"
