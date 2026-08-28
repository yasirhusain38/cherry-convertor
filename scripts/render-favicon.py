"""Rasterize the CherryMark SVG paths into Google Search favicon PNGs.

Exact letter shape from src/components/Logo.tsx CherryMark.
Solid #F2013F, white mark, no wordmark, no triangle, no transparency.
"""

from __future__ import annotations

import io
import math
import struct
import zlib
from pathlib import Path

from PIL import Image, ImageDraw

# Brand tokens (header CherryMark)
BG = (0xF2, 0x01, 0x3F)  # #F2013F
FG = (0xFF, 0xFF, 0xFF)  # clean white

# C path from Logo.tsx (viewBox 0 0 32 32)
# M21.2 8.4
# c-1.1-1.4-2.8-2.2-4.7-2.2
# C12.1 6.2 9 9.4 9 13.6
# c0 4.3 3.1 7.6 7.5 7.6
# c1.9 0 3.6-.8 4.8-2.2
C_CUBICS = [
    ((21.2, 8.4), (20.1, 7.0), (18.4, 6.2), (16.5, 6.2)),
    ((16.5, 6.2), (12.1, 6.2), (9.0, 9.4), (9.0, 13.6)),
    ((9.0, 13.6), (9.0, 17.9), (12.1, 21.2), (16.5, 21.2)),
    ((16.5, 21.2), (18.4, 21.2), (20.1, 20.4), (21.3, 19.0)),
]
C_STROKE = 2.1
BERRY = (22.4, 9.2, 2.15)
# M22.5 7.2 c.15-1.5 1.55-2.45 2.7-2
STEM_CUBIC = ((22.5, 7.2), (22.65, 5.7), (24.05, 4.75), (25.2, 5.2))
STEM_STROKE = 1.4

SIZES = (1024, 512, 192, 96, 48, 32)
MARK_FRACTION = 0.70  # C group = 70% of canvas, rounded-square safe padding


def cubic_point(p0, p1, p2, p3, t: float) -> tuple[float, float]:
    u = 1.0 - t
    x = u**3 * p0[0] + 3 * u**2 * t * p1[0] + 3 * u * t**2 * p2[0] + t**3 * p3[0]
    y = u**3 * p0[1] + 3 * u**2 * t * p1[1] + 3 * u * t**2 * p2[1] + t**3 * p3[1]
    return (x, y)


def flatten_cubic(p0, p1, p2, p3, steps: int = 96) -> list[tuple[float, float]]:
    return [cubic_point(p0, p1, p2, p3, i / steps) for i in range(steps + 1)]


def polyline_for_c() -> list[tuple[float, float]]:
    pts: list[tuple[float, float]] = []
    for i, cub in enumerate(C_CUBICS):
        flat = flatten_cubic(*cub)
        pts.extend(flat if i == 0 else flat[1:])
    return pts


def stroke_envelope_points(
    pts: list[tuple[float, float]], half: float
) -> list[tuple[float, float]]:
    """Sample points covering a round-capped stroke (bbox only)."""
    out: list[tuple[float, float]] = []
    for x, y in pts:
        out.append((x - half, y - half))
        out.append((x + half, y + half))
        out.append((x - half, y + half))
        out.append((x + half, y - half))
    return out


def mark_bbox() -> tuple[float, float, float, float]:
    pts = polyline_for_c()
    samples = stroke_envelope_points(pts, C_STROKE / 2.0)
    bx, by, br = BERRY
    samples.extend(
        [
            (bx - br, by - br),
            (bx + br, by + br),
        ]
    )
    stem = flatten_cubic(*STEM_CUBIC)
    samples.extend(stroke_envelope_points(stem, STEM_STROKE / 2.0))
    xs = [p[0] for p in samples]
    ys = [p[1] for p in samples]
    return (min(xs), min(ys), max(xs), max(ys))


def optical_strokes(size: int, scale: float) -> tuple[float, float, float]:
    """Keep the same paths; floor pixel stroke so 16/48px stay readable."""
    c_px = C_STROKE * scale
    stem_px = STEM_STROKE * scale
    berry_r_px = BERRY[2] * scale
    if size <= 32:
        c_px = max(c_px, 3.15)
        stem_px = max(stem_px, 2.2)
        berry_r_px = max(berry_r_px, 3.0)
    elif size <= 48:
        c_px = max(c_px, 3.4)
        stem_px = max(stem_px, 2.3)
        berry_r_px = max(berry_r_px, 3.2)
    elif size <= 96:
        c_px = max(c_px, 3.6)
        stem_px = max(stem_px, 2.4)
    return c_px, stem_px, berry_r_px


def draw_round_stroke(
    draw: ImageDraw.ImageDraw,
    pts: list[tuple[float, float]],
    width: float,
    fill,
) -> None:
    if len(pts) < 2 or width <= 0:
        return
    r = width / 2.0
    xy = [(p[0], p[1]) for p in pts]
    w = max(1, int(round(width)))
    draw.line(xy, fill=fill, width=w, joint="curve")
    # Round caps + joints (circle at every sample)
    for x, y in pts:
        draw.ellipse((x - r, y - r, x + r, y + r), fill=fill)


def render(size: int, ss: int | None = None) -> Image.Image:
    if ss is None:
        ss = 8 if size <= 96 else 4 if size <= 512 else 2
    minx, miny, maxx, maxy = mark_bbox()
    cx = (minx + maxx) / 2.0
    cy = (miny + maxy) / 2.0
    span = max(maxx - minx, maxy - miny)
    canvas = size * ss
    scale = (MARK_FRACTION * canvas) / span

    def tx(x: float, y: float) -> tuple[float, float]:
        return (canvas / 2.0 + (x - cx) * scale, canvas / 2.0 + (y - cy) * scale)

    c_px, stem_px, berry_r_px = optical_strokes(size, scale / ss)
    c_px *= ss
    stem_px *= ss
    berry_r_px *= ss

    img = Image.new("RGB", (canvas, canvas), BG)
    draw = ImageDraw.Draw(img)

    c_pts = [tx(x, y) for x, y in polyline_for_c()]
    draw_round_stroke(draw, c_pts, c_px, FG)

    bx, by, _ = BERRY
    bcx, bcy = tx(bx, by)
    draw.ellipse(
        (bcx - berry_r_px, bcy - berry_r_px, bcx + berry_r_px, bcy + berry_r_px),
        fill=FG,
    )

    stem_pts = [tx(x, y) for x, y in flatten_cubic(*STEM_CUBIC)]
    draw_round_stroke(draw, stem_pts, stem_px, FG)

    out = img.resize((size, size), Image.Resampling.LANCZOS)
    # Flatten any filter fringe back onto solid brand red (keep fully opaque)
    return out.convert("RGB")


def as_opaque_rgba(img: Image.Image) -> Image.Image:
    rgb = img.convert("RGB")
    alpha = Image.new("L", rgb.size, 255)
    r, g, b = rgb.split()
    return Image.merge("RGBA", (r, g, b, alpha))


def png_rgba_bytes(img: Image.Image) -> bytes:
    buf = io.BytesIO()
    as_opaque_rgba(img).save(buf, format="PNG", optimize=True)
    return buf.getvalue()


def write_ico_rgba(path: Path, images: list[Image.Image]) -> None:
    """ICO with PNG frames in RGBA — Next.js (image crate) rejects RGB-only PNG ICO."""
    blobs = [png_rgba_bytes(im) for im in images]
    count = len(images)
    offset = 6 + 16 * count
    entries = bytearray()
    for im, data in zip(images, blobs):
        w, h = im.size
        bw = 0 if w >= 256 else w
        bh = 0 if h >= 256 else h
        entries += struct.pack("<BBBBHHII", bw, bh, 0, 0, 1, 32, len(data), offset)
        offset += len(data)
    path.write_bytes(struct.pack("<HHH", 0, 1, count) + entries + b"".join(blobs))


def write_png_rgb(path: Path, img: Image.Image) -> None:
    """Write an 8-bit RGB PNG with no alpha chunk."""
    img = img.convert("RGB")
    w, h = img.size
    raw = b"".join(b"\x00" + img.crop((0, y, w, y + 1)).tobytes() for y in range(h))
    compressed = zlib.compress(raw, 9)

    def chunk(tag: bytes, data: bytes) -> bytes:
        crc = zlib.crc32(tag + data) & 0xFFFFFFFF
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", crc)

    ihdr = struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0)  # 8-bit truecolor, no alpha
    png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", compressed) + chunk(b"IEND", b"")
    path.write_bytes(png)


def assert_square_opaque(path: Path, size: int) -> None:
    with Image.open(path) as im:
        assert im.size == (size, size), (path.name, im.size)
        assert im.mode == "RGB", (path.name, im.mode)
        # Corners must be brand red (full-bleed, not a rounded cutout)
        corners = [im.getpixel((0, 0)), im.getpixel((size - 1, 0)), im.getpixel((0, size - 1)), im.getpixel((size - 1, size - 1))]
        for c in corners:
            assert c[0] > 200 and c[1] < 40 and c[2] > 40, (path.name, "corner not brand red", c)
        # Must contain white mark pixels
        extrema = im.getextrema()
        assert extrema[0][1] > 240 and extrema[1][1] > 240 and extrema[2][1] > 240, (path.name, extrema)


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    out_dir = root / "public" / "icons"
    out_dir.mkdir(parents=True, exist_ok=True)
    bbox = mark_bbox()
    print(f"mark bbox {bbox} span={max(bbox[2]-bbox[0], bbox[3]-bbox[1]):.3f}")

    rendered: dict[int, Image.Image] = {}
    for size in SIZES:
        im = render(size)
        rendered[size] = im
        dest = out_dir / f"icon-{size}.png"
        write_png_rgb(dest, im)
        assert_square_opaque(dest, size)
        print(f"wrote {dest} {dest.stat().st_size} bytes")

    preview16 = rendered[32].resize((16, 16), Image.Resampling.LANCZOS)

    # Next.js app/favicon.ico must embed RGBA PNGs (RGB frames fail to decode).
    ico_path = root / "src" / "app" / "favicon.ico"
    write_ico_rgba(ico_path, [preview16, rendered[32], rendered[48]])
    print(f"wrote {ico_path}")

    # File-based metadata icons in app/ — RGB is fine for PNG, but keep
    # a copy of the 48px Google size as icon.png.
    write_png_rgb(root / "src" / "app" / "icon.png", rendered[48])
    write_png_rgb(root / "src" / "app" / "apple-icon.png", rendered[192])


if __name__ == "__main__":
    main()
