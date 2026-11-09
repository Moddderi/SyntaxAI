"""Builds 1280x800 Chrome Web Store screenshots (24-bit PNG, no alpha) from the web-site shots."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

SRC = Path(__file__).resolve().parents[2] / "syntaxai-web" / "src" / "assets" / "shots"
OUT = Path(__file__).resolve().parents[1] / "store-assets"
W, H = 1280, 800
BG = (0, 0, 0)
FONT_PATH = "/System/Library/Fonts/Menlo.ttc"


def load(name: str) -> Image.Image:
    return Image.open(SRC / name).convert("RGBA")


def flatten(img: Image.Image) -> Image.Image:
    base = Image.new("RGB", img.size, BG)
    base.paste(img, mask=img.split()[3])
    return base


def cover(img: Image.Image) -> Image.Image:
    scale = W / img.width
    resized = img.resize((W, round(img.height * scale)), Image.LANCZOS)
    canvas = Image.new("RGB", (W, H), BG)
    canvas.paste(flatten(resized), (0, 0))
    return canvas


def text_block(draw: ImageDraw.ImageDraw, x: int, y: int, title: str, lines: list[str]) -> None:
    title_font = ImageFont.truetype(FONT_PATH, 44, index=1)
    body_font = ImageFont.truetype(FONT_PATH, 22)
    draw.text((x, y), title, font=title_font, fill=(255, 255, 255), spacing=12)
    ty = y + 44 * (title.count("\n") + 1) + 40
    for line in lines:
        draw.text((x, ty), line, font=body_font, fill=(160, 160, 160))
        ty += 36


def sidepanel_shot() -> Image.Image:
    canvas = Image.new("RGB", (W, H), BG)
    panel = load("sidepanel.png")
    h = 740
    panel = panel.resize((round(panel.width * h / panel.height), h), Image.LANCZOS)
    canvas.paste(flatten(panel), (W - panel.width - 140, (H - h) // 2))
    d = ImageDraw.Draw(canvas)
    text_block(d, 90, 250, "CAPTURE\nCODE FAST", ["Paste, drop a screenshot,", "or select text on any page.", "AI turns it into a note."])
    return canvas


def stack_shot() -> Image.Image:
    canvas = Image.new("RGB", (W, H), BG)
    stack = load("stack.png")
    w = 1120
    stack = stack.resize((w, round(stack.height * w / stack.width)), Image.LANCZOS)
    d = ImageDraw.Draw(canvas)
    text_block(d, 80, 100, "KNOW YOUR STACK", [])
    canvas.paste(flatten(stack), ((W - w) // 2, 260))
    return canvas


def main() -> None:
    OUT.mkdir(exist_ok=True)
    shots = {
        "1-library.png": cover(load("library.png")),
        "2-sidepanel.png": sidepanel_shot(),
        "3-insights.png": cover(load("insights.png")),
        "4-stack.png": stack_shot(),
    }
    for name, img in shots.items():
        img.save(OUT / name, "PNG")
        print(name, img.size, img.mode)


main()
