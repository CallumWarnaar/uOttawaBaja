"""
Rough Rider Racing — tiny static site builder.

Edit pages in  site-src/pages/*.html  and the shared shell in  site-src/partials/layout.html,
then run:     python build.py
Output goes to  ../baja-site/  (that folder is what gets uploaded to AWS).

Each page starts with a front-matter comment:
<!--
title: Page title
description: One sentence for search engines
og_image: img_5850.jpg        (a file in assets/img/photos)
-->
"""
import re
import struct
from pathlib import Path

# Set this once the domain is live, e.g. "https://www.example.ca" (no trailing slash).
SITE_URL = ""

ROOT = Path(__file__).resolve().parent
OUT = ROOT.parent / "baja-site"

# slug, menu label, menu preview photo
PAGES = [
    ("index", "Home", "img_5850.jpg"),
    ("about", "About", "img_5212.jpg"),
    ("team", "Team", "img_4971.jpg"),
    ("tech", "Tech", "dsc_0541.jpg"),
    ("competitions", "Competitions", "img_5557.jpg"),
    ("sponsors", "Sponsors", "img_6028.jpg"),
    ("merch", "Merch", "img_3596.jpg"),
]

# Built and listed in the footer, but kept out of the full-screen menu
EXTRA_PAGES = [
    ("roster", "Full roster", "img_6036.jpg"),
]


BLANK_GIF = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"


def image_size(path):
    """(width, height) of a JPEG, PNG or WebP file, read from its header. None if unknown."""
    try:
        data = path.read_bytes()
    except OSError:
        return None
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return struct.unpack(">II", data[16:24])
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        kind = data[12:16]
        if kind == b"VP8X":
            return 1 + int.from_bytes(data[24:27], "little"), 1 + int.from_bytes(data[27:30], "little")
        if kind == b"VP8 ":
            w, h = struct.unpack("<HH", data[26:30])
            return w & 0x3FFF, h & 0x3FFF
        if kind == b"VP8L":
            b = int.from_bytes(data[21:25], "little")
            return (b & 0x3FFF) + 1, ((b >> 14) & 0x3FFF) + 1
        return None
    if data[:2] == b"\xff\xd8":
        i = 2
        while i + 9 < len(data):
            if data[i] != 0xFF:
                i += 1
                continue
            marker = data[i + 1]
            if marker in (0xD8, 0x01) or 0xD0 <= marker <= 0xD7:
                i += 2
                continue
            if 0xC0 <= marker <= 0xCF and marker not in (0xC4, 0xC8, 0xCC):
                h, w = struct.unpack(">HH", data[i + 5:i + 9])
                return w, h
            i += 2 + struct.unpack(">H", data[i + 2:i + 4])[0]
    return None


def add_image_sizes(html):
    """Give every local <img> without a width its real width/height, so the browser can
    reserve its space before it loads. Without this, lazy images in the gallery are 0px
    tall, all count as on-screen, and all download at once. CSS still sets the display
    size (img { height: auto } in styles.css); the attributes only supply the aspect ratio.
    Images loaded later by main.js (data-src inside a data-lazy group) also get a 1x1
    placeholder src, so they lay out as images (not alt text) until they load."""
    def fill(m):
        tag = m.group(0)
        if " data-src=" in tag and not re.search(r"\ssrc=", tag):
            tag = tag.replace("<img", f'<img src="{BLANK_GIF}"', 1)
        if re.search(r"\swidth=", tag):
            return tag
        src = re.search(r'\s(?:data-)?src="(assets/img/[^"?#]+)"', tag)
        size = src and image_size(OUT / src.group(1))
        if not size:
            return tag
        end = "/>" if tag.endswith("/>") else ">"
        return tag[:-len(end)].rstrip() + f' width="{size[0]}" height="{size[1]}"{end}'
    return re.sub(r"<img\b[^>]*>", fill, html)


def build():
    layout = (ROOT / "partials" / "layout.html").read_text(encoding="utf-8")
    for slug, _, _ in PAGES + EXTRA_PAGES:
        raw = (ROOT / "pages" / f"{slug}.html").read_text(encoding="utf-8")
        m = re.match(r"\s*<!--(.*?)-->\s*\n", raw, re.S)
        if not m:
            raise SystemExit(f"{slug}.html is missing its front-matter comment")
        meta = {}
        for line in m.group(1).strip().splitlines():
            k, v = line.split(":", 1)
            meta[k.strip()] = v.strip()
        body = raw[m.end():].rstrip()

        nav = "\n".join(
            f'        <li><a class="menu__link" href="{s}.html"'
            + (' aria-current="page"' if s == slug else "")
            + f'><span>{i + 1:02d}</span>{label}</a></li>'
            for i, (s, label, _) in enumerate(PAGES)
        )
        previews = "\n".join(
            f'        <img src="assets/img/photos/{img}" alt="" loading="lazy"'
            + (' class="is-active"' if s == slug else "") + ">"
            for s, _, img in PAGES
        )
        footer_pages = PAGES[:3] + EXTRA_PAGES + PAGES[3:]
        footer_nav = "\n".join(f'            <li><a href="{s}.html">{label}</a></li>' for s, label, _ in footer_pages)

        og = f"assets/img/photos/{meta.get('og_image', 'img_5850.jpg')}"
        page_file = "" if slug == "index" else f"{slug}.html"
        values = {
            **meta,
            "slug": slug,
            "nav": nav,
            "nav_previews": previews,
            "footer_nav": footer_nav,
            "og_image_url": f"{SITE_URL}/{og}" if SITE_URL else og,
            "canonical_tag": f'  <link rel="canonical" href="{SITE_URL}/{page_file}">\n' if SITE_URL else "",
            "body": body,
        }
        html = layout
        for k, v in values.items():
            html = html.replace("{{" + k + "}}", v)
        left = re.findall(r"\{\{\w+\}\}", html)
        if left:
            raise SystemExit(f"{slug}: unfilled placeholders {left}")
        html = add_image_sizes(html)
        (OUT / f"{slug}.html").write_text(html, encoding="utf-8")
        print(f"built {slug}.html")


if __name__ == "__main__":
    build()
