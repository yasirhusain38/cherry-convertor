"""Build Google Search favicons from the provided logo screenshot.

Solid #F2013F square (Google crops to a circle). Stable public/ URLs, no hash.
"""

from __future__ import annotations

import io
import struct
from pathlib import Path

from PIL import Image

BG = (0xF2, 0x01, 0x3F)
SRC = Path(r"C:\Users\Mohd Yasir Husain\Downloads\Screenshot 2026-08-29 010816.png")
ROOT = Path(__file__).resolve().parents[1]


def crop_square(im: Image.Image) -> Image.Image:
    im = im.convert("RGBA")
    w, h = im.size
    side = min(w, h)
    # Center on the white mark (C), not the dark chrome at the left edge
    px = im.load()
    xs, ys = [], []
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a > 200 and r > 220 and g > 220 and b > 210:
                xs.append(x)
                ys.append(y)
    if xs:
        cx = (min(xs) + max(xs)) / 2
        cy = (min(ys) + max(ys)) / 2
    else:
        cx, cy = w / 2, h / 2
    left = int(round(cx - side / 2))
    top = int(round(cy - side / 2))
    left = max(0, min(left, w - side))
    top = max(0, min(top, h - side))
    return im.crop((left, top, left + side, top + side))


def fill_chrome(im: Image.Image) -> Image.Image:
    """Paint header-chrome / rounded-corner charcoal as brand red. Keep the C."""
    im = im.convert("RGBA")
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 250:
                px[x, y] = (*BG, 255)
                continue
            # Charcoal site background showing in rounded corners
            dark = r < 140 and g < 90 and b < 90
            # Odd screenshot fringe that is neither red nor paper-white
            not_red = r < 180 or g > 90 or b < 20
            not_mark = not (r > 200 and g > 180 and b > 170)
            if dark or (not_red and not_mark and (r + g + b) < 280):
                px[x, y] = (*BG, 255)
    return im.convert("RGB")


def write_png_rgb(path: Path, img: Image.Image) -> None:
    img = img.convert("RGB")
    img.save(path, format="PNG", optimize=True)


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


def main() -> None:
    master = fill_chrome(crop_square(Image.open(SRC)))
    master = master.resize((1024, 1024), Image.Resampling.LANCZOS)

    public = ROOT / "public"
    icons = public / "icons"
    icons.mkdir(parents=True, exist_ok=True)

    sizes = {
        1024: icons / "icon-1024.png",
        512: icons / "icon-512.png",
        192: icons / "icon-192.png",
        96: icons / "icon-96.png",
        48: icons / "icon-48.png",
        32: icons / "icon-32.png",
    }
    rendered: dict[int, Image.Image] = {}
    for size, dest in sizes.items():
        im = master.resize((size, size), Image.Resampling.LANCZOS).convert("RGB")
        rendered[size] = im
        write_png_rgb(dest, im)
        print("wrote", dest)

    # Stable Google Search / browser paths (no Next.js content hash)
    write_png_rgb(public / "favicon-48x48.png", rendered[48])
    write_png_rgb(public / "favicon-96x96.png", rendered[96])
    write_png_rgb(public / "favicon-192x192.png", rendered[192])
    write_png_rgb(public / "favicon-512x512.png", rendered[512])
    write_png_rgb(public / "apple-touch-icon.png", rendered[192])
    write_png_rgb(public / "favicon.png", rendered[48])

    preview16 = rendered[32].resize((16, 16), Image.Resampling.LANCZOS)
    write_ico_rgba(public / "favicon.ico", [preview16, rendered[32], rendered[48]])
    print("wrote", public / "favicon.ico")

    # Drop hashed App Router icons so Next does not emit /favicon.ico?favicon.hash.ico
    for name in ("favicon.ico", "icon.png", "apple-icon.png"):
        p = ROOT / "src" / "app" / name
        if p.exists():
            p.unlink()
            print("removed", p)


if __name__ == "__main__":
    main()
