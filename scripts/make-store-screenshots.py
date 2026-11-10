"""Builds store screenshots and website shots from the retina captures in store-assets/raw.

Outputs
  store-assets/*.png                 1280x800, 24-bit PNG (no alpha) for Chrome Web Store / AMO
  ../syntaxai-web/src/assets/shots   hi-res crops used by the marketing site (same file names as before)

Raw captures: dashboard pages 3840x2400 (1280x800 @3x), side panel pages 1200x2400 (400x800 @3x).
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "store-assets" / "raw"
OUT = ROOT / "store-assets"
SITE = ROOT.parent / "syntaxai-web" / "src" / "assets" / "shots"

W, H = 1280, 800
BG = (0, 0, 0)
BORDER = (46, 46, 46)
FONT_PATH = "/System/Library/Fonts/Menlo.ttc"


def load(name: str) -> Image.Image:
    return Image.open(RAW / name).convert("RGB")


def resize(img: Image.Image, width: int, height: int) -> Image.Image:
    return img.resize((width, height), Image.LANCZOS)


def rounded(img: Image.Image, radius: int) -> Image.Image:
    mask = Image.new("L", img.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, img.width - 1, img.height - 1), radius, fill=255)
    out = Image.new("RGB", img.size, BG)
    out.paste(img, mask=mask)
    ImageDraw.Draw(out).rounded_rectangle(
        (0, 0, img.width - 1, img.height - 1), radius, outline=BORDER, width=2
    )
    return out


def headline(draw: ImageDraw.ImageDraw, x: int, y: int, title: str, lines: list[str]) -> None:
    title_font = ImageFont.truetype(FONT_PATH, 46, index=1)
    body_font = ImageFont.truetype(FONT_PATH, 22)
    draw.text((x, y), title, font=title_font, fill=(255, 255, 255), spacing=14)
    ty = y + 46 * (title.count("\n") + 1) + 14 * title.count("\n") + 36
    for line in lines:
        draw.text((x, ty), line, font=body_font, fill=(165, 165, 165))
        ty += 36


def full_bleed(name: str) -> Image.Image:
    return resize(load(name), W, H)


def capture_panels() -> Image.Image:
    canvas = Image.new("RGB", (W, H), BG)
    panel_h = 680
    panel_w = panel_h // 2
    gap = 30
    start_x = W - 70 - (panel_w * 2 + gap)
    y = (H - panel_h) // 2
    for index, name in enumerate(("sidepanel-new-note.png", "sidepanel-search.png")):
        panel = rounded(resize(load(name), panel_w, panel_h), 18)
        canvas.paste(panel, (start_x + index * (panel_w + gap), y))
    draw = ImageDraw.Draw(canvas)
    headline(
        draw,
        70,
        250,
        "CAPTURE\nCODE FAST",
        ["Select code on any page,", "paste a snippet or drop a", "screenshot. AI makes the note."],
    )
    return canvas


def store_shots() -> dict[str, Image.Image]:
    return {
        "1-capture-sidepanel.png": capture_panels(),
        "2-ai-note.png": full_bleed("note-detail.png"),
        "3-library.png": full_bleed("library-grid.png"),
        "4-insights.png": full_bleed("usage-insights.png"),
        "5-stack.png": full_bleed("stack.png"),
    }


def site_shots() -> dict[str, Image.Image]:
    library = load("library-grid.png")
    # Hero uses an aspect-[1500/951] frame: crop the empty right edge to match it exactly.
    crop_w = round(library.height * 1500 / 951)
    library = resize(library.crop((0, 0, crop_w, library.height)), 3000, 1902)

    stack_full = load("stack.png")
    # Content area only (no sidebar), starting at the "Technologies" heading.
    stack = stack_full.crop((844, 244, 3790, 2150))
    stack = resize(stack, 2000, round(2000 * stack.height / stack.width))

    insights = resize(load("usage-insights.png"), 2400, 1500)
    sidepanel = resize(load("sidepanel-new-note.png"), 800, 1600)

    return {
        "library.png": library,
        "stack.png": stack,
        "insights.png": insights,
        "sidepanel.png": sidepanel,
    }


def save_all(shots: dict[str, Image.Image], folder: Path) -> None:
    folder.mkdir(parents=True, exist_ok=True)
    for name, img in shots.items():
        path = folder / name
        img.save(path, "PNG", optimize=True)
        print(f"{path.relative_to(ROOT.parent)}  {img.size}  {path.stat().st_size // 1024} KB")


def main() -> None:
    save_all(store_shots(), OUT)
    save_all(site_shots(), SITE)


main()
