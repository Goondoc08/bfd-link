"""
>>> SUPERSEDED Aug 12 2026 — DO NOT RUN THIS <<<
The live icons (favicon-32/icon-180/icon-192/icon-512/icon-maskable-512) are
now derived from a real badge design the user supplied (BFD LINK.png →
icon-source-badge.png, background removed, cropped, and resized down for
each size — not regenerated from this script). Running this file again would
silently overwrite that artwork with the old programmatic placeholder.
Left in the repo only as a fallback if the real artwork is ever lost — if
you need new icon sizes, resize icon-source-badge.png instead.

BFDLink icon generator (placeholder version, retired).

Placeholder marks — NOT the Baytown Fire Department badge, and must not be
mistaken for it (the app is unofficial). If BFD ever supplies an approved
mark, drop it in and replace the PNGs; nothing else in the app depends on
their internals.

Red field, gold chain-link glyph, white "BFD" wordmark below it — the link
graphic is the point (this is a LINK launcher), red/gold/white per request.
Independent of the app's on-screen Harbor (navy/teal) theme; the two don't
need to match — an icon sits on a home screen next to dozens of others and
wants to read at a glance, the in-app palette is a different job.

    python make-icons.py
"""
import math
from PIL import Image, ImageDraw, ImageFont

RED = (196, 30, 38)
RED_DK = (150, 20, 28)     # ring / shadow accents, same hue, darker
GOLD = (240, 180, 60)
WHITE = (250, 248, 244)

def font(px):
    for name in ("arialbd.ttf", "Arialbd.ttf", "DejaVuSans-Bold.ttf", "seguisb.ttf"):
        try:
            return ImageFont.truetype(name, px)
        except OSError:
            continue
    return ImageFont.load_default()

def capsule(length, thick, stroke, color):
    """A stadium-shaped outline (rounded rectangle, unfilled) as its own
    RGBA image, sized with margin so it can be rotated without clipping."""
    pad = stroke * 3
    w, h = length + pad * 2, thick + pad * 2
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([pad, pad, w - pad - 1, h - pad - 1],
                         radius=thick // 2, outline=color, width=stroke)
    return img

def paste_centered(base, layer, cx, cy):
    base.alpha_composite(layer, (int(cx - layer.width / 2), int(cy - layer.height / 2)))

def chain_link(canvas, cx, cy, scale, color):
    """Two interlocked stadium outlines, rotated to +/-40 degrees, offset so
    they overlap in the middle — the standard 'link' glyph shape (same idea
    as the Font Awesome / iOS link icon), not a literal fire-service chain."""
    length = scale * 0.62
    thick = scale * 0.34
    stroke = max(2, int(scale * 0.09))
    offset = scale * 0.17

    a = capsule(int(length), int(thick), stroke, color).rotate(40, expand=True, resample=Image.BICUBIC)
    b = capsule(int(length), int(thick), stroke, color).rotate(-40, expand=True, resample=Image.BICUBIC)

    dx = offset * math.cos(math.radians(40))
    dy = offset * math.sin(math.radians(40))
    paste_centered(canvas, a, cx - dx, cy - dy)
    paste_centered(canvas, b, cx + dx, cy + dy)

def draw(size, maskable=False):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # Maskable icons get cropped to a circle by the launcher, so artwork has
    # to sit inside the middle ~80% (the "safe zone") and the field has to
    # bleed to the full square edge with no rounding of its own.
    if maskable:
        d.rectangle([0, 0, size, size], fill=RED)
        inset = size * 0.20
    else:
        radius = int(size * 0.22)
        d.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=RED)
        inset = size * 0.09

    box = size - inset * 2

    # thin gold ring, inside the safe zone — dropped at favicon size, where
    # it would just read as noise
    if size >= 96:
        ring = max(1, int(size * 0.014))
        d.rounded_rectangle(
            [inset, inset, size - inset - 1, size - inset - 1],
            radius=int(box * 0.16), outline=GOLD, width=ring,
        )

    if size < 96:
        # Favicon / tiny sizes: the link glyph alone reads at a glance;
        # a wordmark and ring both turn to mud below ~48px.
        chain_link(img, size / 2, size / 2, box * 0.78, GOLD)
        img.save.__self__  # no-op, keeps flow identical to the branch below
        return img

    chain_link(img, size / 2, size * 0.40, box * 0.52, GOLD)

    f = font(int(box * 0.24))
    text = "BFD"
    l, t, r, b = d.textbbox((0, 0), text, font=f)
    ty = size * 0.685
    d.text(((size - (r - l)) / 2 - l, ty - (b - t) / 2 - t), text, font=f, fill=WHITE)

    # thin rule under the wordmark
    rw = box * 0.30
    ry = size * 0.80
    d.rounded_rectangle(
        [(size - rw) / 2, ry, (size + rw) / 2, ry + max(2, size * 0.016)],
        radius=size * 0.008, fill=GOLD,
    )
    return img

for size, name in [
    (32, "favicon-32.png"),
    (180, "icon-180.png"),
    (192, "icon-192.png"),
    (512, "icon-512.png"),
]:
    draw(size).save(name)
    print("wrote", name)

draw(512, maskable=True).save("icon-maskable-512.png")
print("wrote icon-maskable-512.png")
