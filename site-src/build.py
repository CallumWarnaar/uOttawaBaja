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
]

# Built and listed in the footer, but kept out of the full-screen menu
EXTRA_PAGES = [
    ("roster", "Full roster", "img_6036.jpg"),
]


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
        (OUT / f"{slug}.html").write_text(html, encoding="utf-8")
        print(f"built {slug}.html")


if __name__ == "__main__":
    build()
