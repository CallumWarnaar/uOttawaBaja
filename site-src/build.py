"""
Rough Rider Racing — tiny static site builder.

Edit pages in  site-src/pages/*.html  and the shared shell in  site-src/partials/layout.html,
then run:     python build.py
Output goes to  ../baja-site/  (that folder is what gets uploaded to AWS).

Each page starts with a front-matter comment:
<!--
title: Page title
description: One sentence for search engines
og_image: img_5850            (a photo name in assets/img/photos; optimize_images.py makes its -og.jpg)
-->
"""
import hashlib
import re
import struct
from pathlib import Path

# The live domain (no trailing slash). Used for canonical, og:url and og:image URLs, and
# for sitemap.xml / robots.txt, which the build writes into baja-site/ for search engines.
SITE_URL = "https://uottawabaja.ca"

ROOT = Path(__file__).resolve().parent
OUT = ROOT.parent / "baja-site"

# slug, menu label, menu preview photo
PAGES = [
    ("index", "Home", "img_5850.webp"),
    ("about", "About", "img_5212.webp"),
    ("team", "Team", "img_4971.webp"),
    ("tech", "The Car", "dsc_0541.webp"),
    ("competitions", "Competitions", "img_5557.webp"),
    ("gallery", "Gallery", "img_6036.webp"),
    ("sponsors", "Sponsors", "img_6028.webp"),
    ("merch", "Merch", "img_4534.webp"),
]

# Built and listed in the footer, but kept out of the full-screen menu
EXTRA_PAGES = [
    ("roster", "Full roster", "img_4479.webp"),
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
    Photos made by optimize_images.py also get srcset + sizes (see photo_srcset).
    Images loaded later by main.js (data-src inside a data-lazy group) also get a 1x1
    placeholder src, so they lay out as images (not alt text) until they load."""
    def fill(m):
        tag = m.group(0)
        if " data-src=" in tag and not re.search(r"\ssrc=", tag):
            tag = tag.replace("<img", f'<img src="{BLANK_GIF}"', 1)
        src = re.search(r'\s(data-)?src="(assets/img/[^"?#]+)"', tag)
        if not src:
            return tag
        extra = ""
        size = image_size(OUT / src.group(2))
        if size and not re.search(r"\swidth=", tag):
            extra += f' width="{size[0]}" height="{size[1]}"'
        srcset = photo_srcset(src.group(2), size)
        if srcset and "srcset=" not in tag:
            extra += f' {src.group(1) or ""}srcset="{srcset}"'
            if " sizes=" not in tag:
                # "auto" (lazy images only) lets the browser use the laid-out width; others fall back to 100vw
                extra += ' sizes="auto, 100vw"' if 'loading="lazy"' in tag else ' sizes="100vw"'
        end = "/>" if tag.endswith("/>") else ">"
        return tag[:-len(end)].rstrip() + extra + end
    return re.sub(r"<img\b[^>]*>", fill, html)


def photo_srcset(src, size):
    """srcset for a photo made by optimize_images.py: <name>-640.webp, <name>-1280.webp and
    <name>.webp (the largest). None if the smaller copies don't exist."""
    m = re.fullmatch(r"(assets/img/photos/[a-z0-9_]+)\.webp", src)
    if not m or not size:
        return None
    parts = []
    for w in (640, 1280):
        small = OUT / f"{m.group(1)}-{w}.webp"
        dims = image_size(small) if small.exists() else None
        if dims and dims[0] < size[0]:
            parts.append(f"{m.group(1)}-{w}.webp {dims[0]}w")
    if not parts:
        return None
    return ", ".join(parts + [f"{src} {size[0]}w"])


_hashes = {}


def add_asset_versions(html):
    """Stamp every linked CSS, JS and PDF file with ?v=<first 8 hex of its SHA-256>.
    assets/** is cached by browsers (amplify.yml), so a changed file needs a new URL or
    returning visitors keep the old copy. The hash changes exactly when the file does, so
    there's nothing to bump by hand; just rebuild after editing a CSS/JS file.
    Fonts and images are left alone: preloaded fonts must match the url() in styles.css
    exactly, and replaced photos/logos get a new file name instead (see README)."""
    def stamp(m):
        path = m.group(2)
        if path not in _hashes:
            f = OUT / path
            if not f.exists():
                raise SystemExit(f"linked file not found: {path}")
            _hashes[path] = hashlib.sha256(f.read_bytes()).hexdigest()[:8]
        return f'{m.group(1)}="{path}?v={_hashes[path]}"'
    return re.sub(r'\b(href|src)="(assets/[^"?#]+\.(?:css|js|pdf))(?:\?v=[^"]*)?"', stamp, html)


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

        og = f"assets/img/photos/{Path(meta.get('og_image', 'img_5850')).stem}-og.jpg"
        page_file = "" if slug == "index" else f"{slug}.html"
        values = {
            **meta,
            "slug": slug,
            "nav": nav,
            "nav_previews": previews,
            "footer_nav": footer_nav,
            "og_image_url": f"{SITE_URL}/{og}" if SITE_URL else og,
            "canonical_tag": (f'  <link rel="canonical" href="{SITE_URL}/{page_file}">\n'
                              f'  <meta property="og:url" content="{SITE_URL}/{page_file}">\n') if SITE_URL else "",
            "body": body,
        }
        html = layout
        for k, v in values.items():
            html = html.replace("{{" + k + "}}", v)
        left = re.findall(r"\{\{\w+\}\}", html)
        if left:
            raise SystemExit(f"{slug}: unfilled placeholders {left}")
        html = add_image_sizes(html)
        html = add_asset_versions(html)
        (OUT / f"{slug}.html").write_text(html, encoding="utf-8")
        print(f"built {slug}.html")
    write_sitemap()


def write_sitemap():
    """sitemap.xml (every page in PAGES + EXTRA_PAGES) and robots.txt, for Google Search
    Console. URLs use the .html form the site links to internally, which matches the
    canonical tags; the home page is the bare domain."""
    if not SITE_URL:
        return
    urls = "\n".join(
        f"  <url><loc>{SITE_URL}/{'' if s == 'index' else s + '.html'}</loc></url>"
        for s, _, _ in PAGES + EXTRA_PAGES
    )
    (OUT / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls + "\n</urlset>\n",
        encoding="utf-8")
    (OUT / "robots.txt").write_text(f"User-agent: *\nAllow: /\n\nSitemap: {SITE_URL}/sitemap.xml\n", encoding="utf-8")
    print("built sitemap.xml, robots.txt")


if __name__ == "__main__":
    build()
