#!/usr/bin/env python3
"""Generate Chrome/Firefox toolbar icons from logo-mark assets."""

from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
WHITE_MARK = ROOT / 'src/assets/logo-mark.png'
BLACK_MARK = ROOT / 'src/assets/logo-mark-black.png'
OUT_DIR = ROOT / 'public/icons'
SIZES = (16, 48, 128)


def compose_icon(mark_path: Path, size: int, background: tuple[int, int, int, int]) -> Image.Image:
    mark_src = Image.open(mark_path).convert('RGBA')
    canvas = Image.new('RGBA', (size, size), background)
    pad = max(2, size // 8)
    inner = size - 2 * pad
    mark = mark_src.copy()
    mark.thumbnail((inner, inner), Image.Resampling.LANCZOS)
    x = (size - mark.width) // 2
    y = (size - mark.height) // 2
    canvas.paste(mark, (x, y), mark)
    return canvas


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    for size in SIZES:
        dark = compose_icon(WHITE_MARK, size, (0, 0, 0, 255))
        dark.save(OUT_DIR / f'icon-{size}.png', optimize=True)
        light = compose_icon(BLACK_MARK, size, (255, 255, 255, 255))
        light.save(OUT_DIR / f'icon-light-{size}.png', optimize=True)

    print(f'Wrote {len(SIZES) * 2} icons to {OUT_DIR}')


if __name__ == '__main__':
    main()
