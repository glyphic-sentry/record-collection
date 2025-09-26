# backend/collection_importer.py
"""
Importer/Refresher for record images and metadata fields.

- Reads backend/collection.json
- For each album with a Discogs release `id`, ensures local cached images exist
  using the same logic as the web server (ensure_release_images).
- Updates the album to reference absolute /images/... paths for cover/back and
  keeps legacy thumb fields consistent.
- Skips already-cached images unless --force is passed.
- Supports --dry-run, --limit, and --ids filters.

Usage examples:
  python3 collection_importer.py
  python3 collection_importer.py --limit 50
  python3 collection_importer.py --force
  python3 collection_importer.py --ids 1626692 1859153
  python3 collection_importer.py --dry-run
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
from datetime import datetime
from typing import Any, Dict, List, Tuple

# Reuse your backend caching logic
from image_cache import ensure_release_images, FALLBACK_IMAGE

HERE = os.path.dirname(__file__)
COLLECTION_PATH = os.path.join(HERE, "collection.json")
IMAGES_DIR = os.path.join(HERE, "images")

# Small politeness delay to avoid hammering Discogs unnecessarily
DEFAULT_DELAY_SEC = float(os.environ.get("DISCOGS_DELAY_SEC", "0.25"))  # 250ms between calls


def load_collection() -> Any:
    if not os.path.exists(COLLECTION_PATH):
        print(f"[ERROR] collection.json not found at: {COLLECTION_PATH}", file=sys.stderr)
        sys.exit(1)
    with open(COLLECTION_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def save_collection(data: Any, dry_run: bool) -> None:
    if dry_run:
        print("[DRY-RUN] Not writing changes to collection.json")
        return
    # Backup first
    ts = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup_path = f"{COLLECTION_PATH}.bak.{ts}"
    try:
        if os.path.exists(COLLECTION_PATH):
            with open(COLLECTION_PATH, "rb") as src, open(backup_path, "wb") as dst:
                dst.write(src.read())
            print(f"[INFO] Backed up old collection.json -> {backup_path}")
    except Exception as e:
        print(f"[WARN] Failed to create backup: {e}", file=sys.stderr)

    tmp_path = f"{COLLECTION_PATH}.tmp"
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    os.replace(tmp_path, COLLECTION_PATH)
    print(f"[OK] Wrote updated collection.json")


def extract_albums_shape(raw: Any) -> Tuple[List[Dict], Tuple[str, str | None]]:
    """
    Returns (albums_list, shape_info)
    shape_info: ('list', None) or ('dict', key_used)
    """
    if isinstance(raw, list):
        return raw, ("list", None)
    if isinstance(raw, dict):
        for key in ("records", "collection", "items"):
            if isinstance(raw.get(key), list):
                return raw[key], ("dict", key)
    # Otherwise, treat as empty list
    return [], ("list", None)


def set_albums_back(raw: Any, albums: List[Dict], shape: Tuple[str, str | None]) -> Any:
    kind, key = shape
    if kind == "list":
        return albums
    out = dict(raw)
    if key:
        out[key] = albums
    return out


def first_existing_variant(base_no_ext: str) -> str | None:
    for ext in ("jpg", "jpeg", "png", "webp"):
        candidate = os.path.join(IMAGES_DIR, f"{base_no_ext}.{ext}")
        if os.path.exists(candidate):
            return f"/images/{os.path.basename(candidate)}"
    return None


def absolutize(path: str | None) -> str | None:
    if not path:
        return None
    if path.startswith(("http://", "https://", "/")):
        return path
    return "/" + path.lstrip("/")


def refresh_album_images(album: Dict, force: bool = False) -> Tuple[bool, str]:
    """
    Ensure local images exist for this album and update fields to absolute /images/... paths.
    Returns (changed, message).
    """
    rid = album.get("id")
    if not rid:
        return False, "no id; skipped"

    # check cache existence unless forcing
    cover_cached = first_existing_variant(f"cover_{rid}")
    back_cached = first_existing_variant(f"back_{rid}")

    if not force and cover_cached:
        # ensure album points to cached paths
        changed = False
        if album.get("cover_image") != cover_cached:
            album["cover_image"] = cover_cached
            changed = True
        if back_cached and album.get("back_image") != back_cached:
            album["back_image"] = back_cached
            changed = True
        # keep legacy thumb fields aligned (optional)
        if album.get("thumb") != (cover_cached or FALLBACK_IMAGE):
            album["thumb"] = cover_cached or FALLBACK_IMAGE
            changed = True
        if back_cached and album.get("back_thumb") != back_cached:
            album["back_thumb"] = back_cached
            changed = True
        return changed, "already cached"

    # Ensure via Discogs (may download now)
    cover_url, back_url = ensure_release_images(int(rid))

    # After ensure, resolve concrete cached paths again (prefer exact file on disk)
    cover_final = first_existing_variant(f"cover_{rid}") or absolutize(cover_url) or FALLBACK_IMAGE
    back_final = first_existing_variant(f"back_{rid}") or absolutize(back_url)

    changed = False
    if album.get("cover_image") != cover_final:
        album["cover_image"] = cover_final
        changed = True
    if back_final and album.get("back_image") != back_final:
        album["back_image"] = back_final
        changed = True

    # Keep thumb fields consistent (simple approach: point to same as cover/back)
    if album.get("thumb") != (cover_final or FALLBACK_IMAGE):
        album["thumb"] = cover_final or FALLBACK_IMAGE
        changed = True
    if back_final and album.get("back_thumb") != back_final:
        album["back_thumb"] = back_final
        changed = True

    return changed, "downloaded" if (not cover_cached or (not back_cached and back_final)) else "updated refs"


def main():
    parser = argparse.ArgumentParser(description="Refresh/download Discogs images and update collection.json")
    parser.add_argument("--limit", type=int, default=0, help="Max number of albums to process (0 = all)")
    parser.add_argument("--force", action="store_true", help="Redownload/repoint even if images exist")
    parser.add_argument("--dry-run", action="store_true", help="Do not write collection.json; just log actions")
    parser.add_argument("--ids", nargs="*", help="Only process these release IDs")
    parser.add_argument("--delay", type=float, default=DEFAULT_DELAY_SEC, help=f"Delay between Discogs calls (default {DEFAULT_DELAY_SEC}s)")
    args = parser.parse_args()

    token = os.environ.get("DISCOGS_TOKEN")
    ua = os.environ.get("DISCOGS_UA")
    if not token:
        print("[WARN] DISCOGS_TOKEN is not set. Requests may be throttled/blocked.", file=sys.stderr)
    if not ua:
        print("[WARN] DISCOGS_UA is not set. Set a proper User-Agent per Discogs policy.", file=sys.stderr)

    os.makedirs(IMAGES_DIR, exist_ok=True)

    raw = load_collection()
    albums, shape = extract_albums_shape(raw)
    if not albums:
        print("[ERROR] No albums found in collection.json (expected list or records/collection/items array).", file=sys.stderr)
        sys.exit(1)

    # Optional filter by IDs
    if args.ids:
        idset = {int(x) for x in args.ids if str(x).isdigit()}
        albums = [a for a in albums if a.get("id") and int(a["id"]) in idset]
        print(f"[INFO] Filtering by ids: kept {len(albums)} items")

    total = len(albums)
    print(f"[INFO] Processing {total} album(s){' (dry-run)' if args.dry_run else ''}...")

    processed = 0
    changed_count = 0
    downloaded_count = 0
    skipped_count = 0
    errors = 0

    for idx, album in enumerate(albums, start=1):
        if args.limit and processed >= args.limit:
            break

        rid = album.get("id")
        label = f"{album.get('artist', '')} – {album.get('title', '')}"
        prefix = f"[{idx}/{total}] id={rid} {label}".strip()

        try:
            changed, status = refresh_album_images(album, force=args.force)
            processed += 1
            if status == "downloaded":
                downloaded_count += 1
            elif status == "already cached":
                skipped_count += 1
            else:
                # "updated refs" etc.
                pass
            if changed:
                changed_count += 1

            print(f"{prefix}: {status}")
            # politeness delay only when we might call Discogs
            if args.delay and status in ("downloaded",):
                time.sleep(args.delay)

        except Exception as e:
            errors += 1
            print(f"{prefix}: ERROR: {e}", file=sys.stderr)

    # Write back
    if changed_count and not args.dry_run:
        updated = set_albums_back(raw, albums, shape)
        save_collection(updated, dry_run=False)
    else:
        print("[INFO] No changes to write." if not changed_count else "[DRY-RUN] Changes not written.")

    print(
        f"[SUMMARY] processed={processed} downloaded={downloaded_count} "
        f"changed={changed_count} skipped={skipped_count} errors={errors}"
    )


if __name__ == "__main__":
    main()
