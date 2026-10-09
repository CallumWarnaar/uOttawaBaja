"""
Rough Rider Racing — page-weight check (stdlib only).

Serves ../baja-site/ on a local port, loads each page in headless Edge (fresh profile,
empty cache) and counts every request the browser makes. Prints requests and KB per page,
split into photos / everything else, and flags pages over the budget.

    python perf_check.py                      every page, 1440x900
    python perf_check.py --width 500          narrow window (Edge won't go much below ~500px)
    python perf_check.py index merch          only these pages
    python perf_check.py --budget 1500        budget in KB (default 2048 = 2 MB first load)
                                              (pages in PAGE_BUDGETS keep their own budget)
    python perf_check.py -v                   also list every request

Run it before merging image-heavy changes. Exit code 1 if any page is over budget.

Notes
- Sizes are bytes as served by this local server, i.e. uncompressed. Amplify/CloudFront
  gzips/brotlis HTML, CSS and JS, so real transfers are a bit smaller (photos, fonts and
  woff2 don't shrink). Compare runs with each other, not with DevTools' "transferred".
- Edge is started with --blink-settings=lazyLoadEnabled=true. Without it headless Edge
  ignores loading="lazy" and downloads every image, which overstates page weight.
- "page#fragment" (e.g. about.html#format) measures a page opened at that section.
- Set EDGE_PATH, or pass --browser, if Edge (or Chrome) isn't in the usual place.
"""
import argparse
import os
import shutil
import subprocess
import sys
import tempfile
import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

SITE = Path(__file__).resolve().parent.parent / "baja-site"
BROWSERS = [
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
]
# Pages allowed a bigger first load than --budget. tech.html: the scroll-scrubbed car render
# (overview frame + first leg of frames), approved by Callum 2026-10-09; see CLAUDE.md "Car render".
PAGE_BUDGETS = {"tech.html": 4096}
EXTRA = []  # extra "page#fragment" views to measure (the gallery has its own page since 2026-10-09)


class Recorder(SimpleHTTPRequestHandler):
    log = []
    lock = threading.Lock()

    def send_header(self, key, value):
        if key.lower() == "content-length":
            self._length = int(value)
        super().send_header(key, value)

    def end_headers(self):
        super().end_headers()
        with self.lock:
            self.log.append((self.path.split("?")[0], getattr(self, "_length", 0)))

    def log_message(self, *args):
        pass


def find_browser(arg):
    for c in [arg, os.environ.get("EDGE_PATH"), *BROWSERS,
              shutil.which("msedge"), shutil.which("google-chrome"), shutil.which("chromium")]:
        if c and Path(c).exists():
            return c
    raise SystemExit("Edge/Chrome not found; pass --browser or set EDGE_PATH")


def load(browser, url, width, height):
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
        subprocess.run([
            browser, "--headless=new", "--disable-gpu", "--no-first-run",
            "--force-prefers-reduced-motion", "--blink-settings=lazyLoadEnabled=true",
            f"--user-data-dir={tmp}", f"--window-size={width},{height}",
            "--virtual-time-budget=8000", f"--screenshot={Path(tmp) / 'shot.png'}", url,
        ], capture_output=True, timeout=120)


def main():
    ap = argparse.ArgumentParser(description="Measure first-load page weight in headless Edge.")
    ap.add_argument("pages", nargs="*", help="page names (index, team, about.html#format...)")
    ap.add_argument("--width", type=int, default=1440)
    ap.add_argument("--height", type=int, default=900)
    ap.add_argument("--budget", type=int, default=2048, help="KB per page (default 2048)")
    ap.add_argument("--browser")
    ap.add_argument("-v", "--verbose", action="store_true")
    a = ap.parse_args()

    browser = find_browser(a.browser)
    pages = a.pages or sorted(p.name for p in SITE.glob("*.html")) + EXTRA
    pages = [p if ".html" in p else p + ".html" for p in pages]

    server = ThreadingHTTPServer(("127.0.0.1", 0), partial(Recorder, directory=str(SITE)))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    port = server.server_address[1]

    print(f"{a.width}x{a.height}, budget {a.budget} KB\n")
    print(f"{'page':<28}{'reqs':>5}{'photos KB':>11}{'other KB':>10}{'total KB':>10}")
    over = []
    for page in pages:
        Recorder.log.clear()
        load(browser, f"http://127.0.0.1:{port}/{page}", a.width, a.height)
        with Recorder.lock:
            log = list(Recorder.log)
        if not log:
            raise SystemExit(f"{page}: the browser made no requests (sandboxed shell? try PowerShell)")
        photos = sum(n for p, n in log if "/img/photos/" in p) / 1024
        total = sum(n for _, n in log) / 1024
        budget = PAGE_BUDGETS.get(page.split("#")[0], a.budget)
        flag = f"  OVER ({budget} KB)" if total > budget else ""
        if flag:
            over.append(page)
        print(f"{page:<28}{len(log):>5}{photos:>11.0f}{total - photos:>10.0f}{total:>10.0f}{flag}")
        if a.verbose:
            for p, n in sorted(log, key=lambda r: -r[1]):
                print(f"      {n / 1024:>8.1f} KB  {p}")
    server.shutdown()

    if over:
        print(f"\nOver budget: {', '.join(over)}")
        sys.exit(1)
    print("\nAll pages within budget.")


if __name__ == "__main__":
    main()
