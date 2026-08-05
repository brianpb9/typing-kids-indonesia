#!/usr/bin/env python3
"""Soften OpenMoji word icons: recolor harsh near-black outlines to the
Poppu World warm dark brown, keeping alpha antialiasing and all real
colors untouched.

Skips solid-color swatches (merah/biru/hitam/… from _meta/sources.json) —
a brown "hitam" card would teach the wrong color.

Usage:  python3 scripts/soften-icons.py [--dry-run]
Requires: pillow, numpy (see scripts/requirements-img.txt)
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
IMG_DIR = ROOT / "assets" / "images"
META = IMG_DIR / "_meta" / "sources.json"

# Poppu World dark warm brown (deeper than --text #5B4636 for crisp lines)
BROWN = np.array([74, 53, 36], dtype=np.float64)
# Near-black threshold: all channels below this AND low saturation
DARK_MAX = 80
SAT_SPREAD = 30


def swatch_files() -> set[str]:
    if not META.exists():
        return set()
    data = json.loads(META.read_text())
    return {
        str(meta.get("file", ""))
        for meta in data.values()
        if isinstance(meta, dict) and meta.get("type") == "solid-color"
    }


def soften(path: Path, dry_run: bool) -> tuple[int, int]:
    img = Image.open(path).convert("RGBA")
    arr = np.asarray(img).astype(np.float64)
    rgb = arr[..., :3]
    mx = rgb.max(axis=2)
    mn = rgb.min(axis=2)
    # Near-black, hue-neutral pixels = outlines / pupils / line art.
    # Colored darks (navy window, dark red) have channel spread and stay.
    mask = (mx < DARK_MAX) & ((mx - mn) < SAT_SPREAD)
    changed = int(mask.sum())
    if changed and not dry_run:
        rgb[mask] = BROWN
        arr[..., :3] = rgb
        Image.fromarray(arr.astype(np.uint8), "RGBA").save(path)
    return changed, mask.size


def main() -> None:
    dry = "--dry-run" in sys.argv
    skip = swatch_files()
    total_files = 0
    for png in sorted(IMG_DIR.glob("*.png")):
        if png.name in skip:
            continue
        changed, _ = soften(png, dry)
        if changed:
            total_files += 1
            print(f"{'[dry] ' if dry else ''}{png.name}: {changed} px recolored")
    print(f"{'[dry] ' if dry else ''}done — {total_files} icons softened, "
          f"{len(skip)} swatches skipped")


if __name__ == "__main__":
    main()
