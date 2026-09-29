"""
Rough Rider Racing — make web copies of photos (Optimization.md, Phase 2).

Full-size originals live in Google Drive, never in the repo. This script turns them into
small WebP copies in ../baja-site/assets/img/photos/ that build.py then wires up with srcset.

Needs Pillow (pip install pillow). build.py itself stays stdlib-only; only whoever adds
photos needs this script.

Usage (from site-src/):
    python optimize_images.py "path/to/folder"               every .jpg/.jpeg/.png in it
    python optimize_images.py photo1.jpg photo2.JPG          specific files
    python optimize_images.py IMG_1234.JPG --name pit_crew   one file, chosen name
    python optimize_images.py --og                           only (re)make social-share JPEGs
    add --force to rebuild copies that are already up to date

Names come from the file name: lower case, "Copy of " dropped, anything other than
a-z 0-9 _ turned into "_" (e.g. "Copy of IMG_5212.JPG" -> img_5212). Pages then use
    <img src="assets/img/photos/img_5212.webp" alt="...">
and build.py adds width/height, srcset and sizes automatically.

For each photo it writes (never upscaling, rotation fixed, camera metadata stripped):
    <name>-640.webp    phones, thumbnails
    <name>-1280.webp   tablets, half-width slots, phones at 2x
    <name>.webp        the largest copy: 1920px wide (portrait photos: 1920px tall)
It also writes <name>-og.jpg (1200px) for every photo named as og_image in a page's
front matter, since some social sites don't read WebP.
"""
import argparse
import re
import sys
from pathlib import Path

try:
    from PIL import Image, ImageOps
except ImportError:
    sys.exit("Pillow is needed for this script: pip install pillow")

ROOT = Path(__file__).resolve().parent
PHOTOS = ROOT.parent / "baja-site" / "assets" / "img" / "photos"
SIZES = (640, 1280)   # smaller copies; the largest one is <name>.webp
MAX_EDGE = 1920       # largest copy: long edge capped here
QUALITY = 70
OG_WIDTH = 1200
EXTS = {".jpg", ".jpeg", ".png"}


def web_name(path):
    stem = re.sub(r"^copy of ", "", path.stem.strip().lower())
    return re.sub(r"[^a-z0-9_]+", "_", stem).strip("_")


def save_webp(im, width, dest):
    if width < im.width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    im.save(dest, "WEBP", quality=QUALITY, method=6)
    return dest.stat().st_size


def process(src, name, force):
    largest = PHOTOS / f"{name}.webp"
    if not force and largest.exists() and largest.stat().st_mtime >= src.stat().st_mtime:
        print(f"  up to date  {name}")
        return
    im = ImageOps.exif_transpose(Image.open(src))
    alpha = im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info)
    im = im.convert("RGBA" if alpha else "RGB")
    scale = min(1, MAX_EDGE / max(im.size))
    top = round(im.width * scale)
    total = save_webp(im, top, largest)
    for w in SIZES:
        dest = PHOTOS / f"{name}-{w}.webp"
        if w < top:
            total += save_webp(im, w, dest)
        elif dest.exists():
            dest.unlink()  # the largest copy already covers this width
    print(f"  wrote       {name}  ({top}px max, {total // 1024} KB for all sizes)")


def og_names():
    names = set()
    for page in (ROOT / "pages").glob("*.html"):
        m = re.search(r"^og_image:\s*(\S+)", page.read_text(encoding="utf-8"), re.M)
        if m:
            names.add(Path(m.group(1)).stem)
    return names


def make_og(force):
    for name in sorted(og_names()):
        src, dest = PHOTOS / f"{name}.webp", PHOTOS / f"{name}-og.jpg"
        if not src.exists():
            print(f"  missing     {name}.webp (named as og_image) - add the photo first")
            continue
        if not force and dest.exists() and dest.stat().st_mtime >= src.stat().st_mtime:
            continue
        im = Image.open(src).convert("RGB")
        if im.width > OG_WIDTH:
            im = im.resize((OG_WIDTH, round(im.height * OG_WIDTH / im.width)), Image.LANCZOS)
        im.save(dest, "JPEG", quality=82, optimize=True, progressive=True)
        print(f"  wrote       {dest.name}")


def main():
    ap = argparse.ArgumentParser(description="Make WebP web copies of photos (see the top of this file).")
    ap.add_argument("inputs", nargs="*", help="image files and/or folders")
    ap.add_argument("--name", help="web name to use (only with a single input file)")
    ap.add_argument("--og", action="store_true", help="only (re)make the social-share JPEGs")
    ap.add_argument("--force", action="store_true", help="rebuild even if the copies are up to date")
    a = ap.parse_args()
    PHOTOS.mkdir(parents=True, exist_ok=True)
    if not a.og:
        files = []
        for p in map(Path, a.inputs):
            files += sorted(f for f in p.iterdir() if f.suffix.lower() in EXTS) if p.is_dir() else [p]
        if not files:
            ap.error("give at least one image file or folder (or --og)")
        if a.name and len(files) != 1:
            ap.error("--name only works with a single file")
        for f in files:
            name = a.name or web_name(f)
            if not re.fullmatch(r"[a-z0-9_]+", name):
                ap.error(f"bad name {name!r}: use a-z, 0-9 and _ only")
            process(f, name, a.force)
    make_og(a.force)


if __name__ == "__main__":
    main()
