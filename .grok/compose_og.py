#!/usr/bin/env python3
"""Compose public/og.jpg from the cinematic still + exact Sahel Record lockup."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont

ROOT = Path("/workspace")
SRC = ROOT / ".grok/og-cinema.jpg"
FONT_DIR = ROOT / ".grok/fonts"
OUT_RAW = ROOT / ".grok/og-card-raw.jpg"

W, H = 1792, 1008
BG = (14, 13, 12)
BONE = (240, 235, 226)
MUTED = (176, 168, 154)
RULE = (198, 188, 172)


def load_font(path: Path, size: int, axes=None) -> ImageFont.FreeTypeFont:
    font = ImageFont.truetype(str(path), size)
    if axes:
        font.set_variation_by_axes(axes)
    return font


def text_size(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont):
    b = draw.textbbox((0, 0), text, font=font)
    return b[2] - b[0], b[3] - b[1]


def draw_tracked(draw, text, font, cx, y, fill, tracking=6):
    widths = []
    for ch in text:
        w, _ = text_size(draw, ch, font)
        widths.append(w)
    total = sum(widths) + tracking * (len(text) - 1)
    x = cx - total / 2
    for ch, w in zip(text, widths):
        draw.text((x, y), ch, font=font, fill=fill)
        x += w + tracking
    _, h = text_size(draw, text, font)
    return total, h


def main() -> None:
    canvas = Image.open(SRC).convert("RGB")
    if canvas.size != (W, H):
        canvas = canvas.resize((W, H), Image.Resampling.LANCZOS)
    canvas = ImageEnhance.Contrast(canvas).enhance(1.08)
    canvas = ImageEnhance.Color(canvas).enhance(0.96)

    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    fade_start = int(W * 0.46)
    fade_end = int(W * 0.72)
    for x in range(fade_start, W):
        t = min(1.0, (x - fade_start) / max(1, fade_end - fade_start))
        a = int(210 * (t**1.08))
        od.line([(x, 0), (x, H)], fill=(*BG, a))
    for y in range(0, 48):
        a = int(50 * (1 - y / 48))
        od.line([(0, y), (W, y)], fill=(0, 0, 0, a))
        od.line([(0, H - 1 - y), (W, H - 1 - y)], fill=(0, 0, 0, a))
    canvas = Image.alpha_composite(canvas.convert("RGBA"), overlay).convert("RGB")

    draw = ImageDraw.Draw(canvas)
    news = FONT_DIR / "Newsreader.ttf"
    mono = FONT_DIR / "IBMPlexMono-Medium.ttf"
    sans = FONT_DIR / "IBMPlexSans-Regular.ttf"

    title_font = load_font(news, 128, axes=[650, 72])
    kicker_font = load_font(mono, 20)
    tag_font = load_font(sans, 27)

    line1, line2 = "SAHEL", "RECORD"
    kicker = "PUBLIC-DATA ARCHIVE"
    tag = "Sudan & adjacent corridors"

    w1, h1 = text_size(draw, line1, title_font)
    w2, h2 = text_size(draw, line2, title_font)
    wk, hk = text_size(draw, kicker, kicker_font)
    wt, ht = text_size(draw, tag, tag_font)

    gap_kicker, gap_title, gap_rule, rule_h = 30, 0, 28, 2
    rule_w = max(w1, w2)
    # tracked kicker is wider than the untracked measure
    kicker_extra = 6 * (len(kicker) - 1)
    block_h = hk + gap_kicker + h1 + gap_title + h2 + gap_rule + rule_h + gap_rule + ht
    block_w = max(w1, w2, wk + kicker_extra, wt, rule_w)

    field_cx = int(W * 0.75)
    if field_cx + block_w / 2 > W - 80:
        field_cx = int(W - 80 - block_w / 2)
    y0 = int((H - block_h) / 2)
    assert 252 <= y0 <= H - 252 - block_h, (y0, block_h)
    assert field_cx - block_w / 2 >= W * 0.42, (field_cx, block_w)

    def centered(text, font, y, fill):
        tw, _ = text_size(draw, text, font)
        draw.text((int(field_cx - tw / 2), y), text, font=font, fill=fill)

    y = y0
    draw_tracked(draw, kicker, kicker_font, field_cx, y, MUTED, tracking=6)
    y += hk + gap_kicker
    centered(line1, title_font, y, BONE)
    y += h1 + gap_title
    centered(line2, title_font, y, BONE)
    y += h2 + gap_rule
    rx0 = int(field_cx - rule_w / 2)
    draw.rectangle([rx0, y, rx0 + rule_w, y + rule_h], fill=RULE)
    y += rule_h + gap_rule
    centered(tag, tag_font, y, MUTED)

    grain = Image.effect_noise((W, H), 10).convert("L")
    canvas = Image.blend(canvas, Image.merge("RGB", (grain, grain, grain)), 0.028)
    canvas = canvas.filter(ImageFilter.UnsharpMask(radius=0.9, percent=55, threshold=2))
    canvas.save(OUT_RAW, "JPEG", quality=94, subsampling=0, optimize=True)
    print("wrote", OUT_RAW, canvas.size, "y0", y0, "h", block_h, "cx", field_cx)


if __name__ == "__main__":
    main()
