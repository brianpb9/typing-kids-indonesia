#!/usr/bin/env python3
"""Add soft storybook depth (inner highlight + shadow) to the top-frequency
word icons, extending the soften-icons.py approach.

Light comes from the top-left: pixels on the top/left rim of each opaque
shape get a subtle warm-cream lift, pixels on the bottom/right rim get a
soft warm-brown shade. Alpha is preserved byte-for-byte, and the warm-brown
outline color (from soften-icons.py) is left untouched — never recolor a
swatch, never repaint line art.

Skips solid-color swatches (merah/biru/hitam/… from _meta/sources.json).

Usage:  python3 scripts/shade-icons.py [--dry-run] [--count N]
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
WORDS = ROOT / "data" / "words.json"

# Warm light / shade tints (Poppu palette, same family as soften-icons BROWN)
CREAM = np.array([255, 246, 224], dtype=np.float64)
BROWN = np.array([74, 53, 36], dtype=np.float64)
# Pixels already this close to the outline brown are line art — skip them
OUTLINE_TOL = 24
# Blend strengths (kept low: soft storybook depth, not bevel stickers)
HI_STRONG, HI_SOFT = 0.30, 0.14
SH_STRONG, SH_SOFT = 0.22, 0.10


def swatch_files() -> set[str]:
    if not META.exists():
        return set()
    data = json.loads(META.read_text())
    return {
        str(meta.get("file", ""))
        for meta in data.values()
        if isinstance(meta, dict) and meta.get("type") == "solid-color"
    }


def top_word_files(count: int) -> list[str]:
    data = json.loads(WORDS.read_text())
    files = []
    for w in data.get("words", []):
        img = str(w.get("image", ""))
        name = img.split("?")[0].rsplit("/", 1)[-1]
        if name.endswith(".png"):
            files.append(name)
        if len(files) >= count:
            break
    return files


def shifted(mask: np.ndarray, dy: int, dx: int) -> np.ndarray:
    """Boolean mask shifted by (dy, dx); vacated area = False."""
    out = np.zeros_like(mask)
    ys = slice(max(0, dy), mask.shape[0] + min(0, dy))
    xs = slice(max(0, dx), mask.shape[1] + min(0, dx))
    src_y = slice(max(0, -dy), mask.shape[0] + min(0, -dy))
    src_x = slice(max(0, -dx), mask.shape[1] + min(0, -dx))
    out[ys, xs] = mask[src_y, src_x]
    return out


def rim(mask: np.ndarray, dy: int, dx: int, depth: int) -> np.ndarray:
    """Opaque pixels whose neighbour `depth` px toward (dy,dx) is transparent."""
    return mask & ~shifted(mask, dy, dx)


def shade(path: Path, dry_run: bool) -> int:
    img = Image.open(path).convert("RGBA")
    arr = np.asarray(img).astype(np.float64)
    rgb = arr[..., :3]
    alpha = arr[..., 3]
    h, w = alpha.shape

    solid = alpha > 200  # keep the antialiased edge pixels untouched
    d1 = max(6, round(min(h, w) * 0.02))   # strong band
    d2 = d1 * 2                            # soft falloff band

    # Rim masks per direction at both depths
    hi1 = rim(solid, -d1, 0, d1) | rim(solid, 0, -d1, d1)
    hi2 = rim(solid, -d2, 0, d2) | rim(solid, 0, -d2, d2)
    sh1 = rim(solid, d1, 0, d1) | rim(solid, 0, d1, d1)
    sh2 = rim(solid, d2, 0, d2) | rim(solid, 0, d2, d2)

    # Line art (outline brown / near-black) is never re-tinted
    dist_outline = np.abs(rgb - BROWN).max(axis=2)
    mx = rgb.max(axis=2)
    mn = rgb.min(axis=2)
    line_art = (dist_outline < OUTLINE_TOL) | ((mx < 80) & ((mx - mn) < 30))

    hi_strong = hi1 & ~line_art
    hi_soft = hi2 & ~hi1 & ~line_art
    sh_strong = sh1 & ~hi2 & ~line_art
    sh_soft = sh2 & ~sh1 & ~hi2 & ~line_art

    changed = int((hi_strong | hi_soft | sh_strong | sh_soft).sum())
    if changed and not dry_run:
        for m, tint, k in (
            (hi_strong, CREAM, HI_STRONG),
            (hi_soft, CREAM, HI_SOFT),
            (sh_strong, BROWN, SH_STRONG),
            (sh_soft, BROWN, SH_SOFT),
        ):
            rgb[m] = rgb[m] * (1 - k) + tint * k
        arr[..., :3] = rgb
        arr[..., 3] = alpha  # alpha byte-identical
        Image.fromarray(arr.astype(np.uint8), "RGBA").save(path)
    return changed


def main() -> None:
    dry = "--dry-run" in sys.argv
    count = 30
    if "--count" in sys.argv:
        count = int(sys.argv[sys.argv.index("--count") + 1])
    skip = swatch_files()
    done = 0
    for name in top_word_files(count):
        if name in skip:
            print(f"skip swatch {name}")
            continue
        path = IMG_DIR / name
        if not path.exists():
            print(f"missing {name}")
            continue
        changed = shade(path, dry)
        done += 1
        print(f"{'[dry] ' if dry else ''}{name}: {changed} px shaded")
    print(f"{'[dry] ' if dry else ''}done — {done} icons shaded")


if __name__ == "__main__":
    main()
