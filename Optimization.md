# Site speed optimization plan

Goal: keep the site snappy as we add headshots, merch photos and the high-res car render. Planned 2026-09-28 with Callum. Work through the phases in order, one PR per phase, and tick them off below as they merge.

Status: [x] Phase 1 · [x] Phase 2 · [ ] Phase 3 · [x] Phase 4

## Baseline (measured 2026-09-28)

First visit, empty cache, desktop 1440×900, top of each page. Measured by logging every request on a local server while headless Edge loads the page (screenshot mode, fresh profile).

> **Measuring gotcha:** headless Edge/Chrome **ignores `loading="lazy"`** unless you pass `--blink-settings=lazyLoadEnabled=true`. The first numbers in this plan (competitions 20 MB, home 12 MB) were measured without it and were wrong. Always use that flag (Phase 4's `perf_check.py` must too).

| Page | Before Phase 1 | After Phase 1 |
|---|---|---|
| index | 7.6 MB (15 photos) | **2.1 MB** (3 photos) |
| about | 2.4 MB | 2.0 MB |
| competitions (top) | 1.9 MB | 1.5 MB |
| competitions `#gallery` | **19.2 MB of photos (all 50)** | **5.1 MB** (14 photos) |
| merch | 2.1 MB | 1.7 MB |
| team / sponsors / roster | 1.4 MB | 1.0 MB |
| tech | 1.0 MB | 0.6 MB |

What was heavy, and what Phase 1 did about it:

1. **Gallery images had no size.** `<img>` tags without `width`/`height` in the CSS-columns gallery were 0px tall until loaded, so all 50 "fit" in the viewport and downloaded together as soon as you scrolled there. Fixed: `build.py` now writes real `width`/`height` on every local `<img>`.
2. **The home-page photo marquees** loaded all 12 photos on page load. Fixed: they use `data-lazy` + `data-src` and load about a screen before they're reached.
3. **Oversized chrome on every page:** `logo.png` 200 KB → 31 KB (468px, 256-colour PNG, looks identical), textures moved to WebP (grunge mask 314 → 139 KB, scratches 87 → 42 KB, splatter 66 → 24 KB).
4. **Menu previews were not actually a problem:** real browsers don't load them until the menu opens (they're `visibility:hidden` and lazy). Opening the menu on desktop pulled all 7 full 1920px photos (~2.9 MB); since Phase 2 they have `srcset` with `sizes="auto"`, so small copies load.
5. Still to do: every photo is one 1920px JPEG (~400 KB), with no WebP/AVIF and no `srcset` (Phase 2). The sponsorship PDF is 9 MB but only downloads on click; compressing it is optional.

Fine as-is: vendor JS (GSAP + ScrollTrigger + SplitText + Lenis, ~150 KB, `defer`), fonts (~230 KB self-hosted woff2, 2 preloaded), sponsor logos (15–70 KB each). CloudFront already gzips/brotlis text files.

## Decisions (Callum, 2026-09-28)

- **Pillow is an optional dev tool.** `build.py` stays Python stdlib only. A separate image script may use Pillow (already installed on Callum's machine). It will mostly be run by AI agents, so it needs clear usage docs and must be safe to re-run.
- **Originals stay in Google Drive.** The photos in `assets/img/photos/` were downloaded from Drive, and the repo should hold only web copies (smaller dimensions and file size), never full-size originals. Headshots and merch photos will arrive the same way: Callum hands over a folder of full-size files, and we generate the web copies into the repo.
- **Car: high-res 2D render, not a 3D model (for now).** *Update 2026-10-09: a scroll-scrubbed frame sequence (like cwrumotorsports.com/car) is now the preferred option, and `tech.html` may go over the 2 MB budget for it (first load ≤ 4 MB via `PAGE_BUDGETS` in `perf_check.py`, full scroll-through ≤ ~25 MB). Plan in CLAUDE.md, "Car render: scroll-scrubbed sequence".* The car is still being designed in SolidWorks. A spinnable 360° model like Case Western's is out of scope. Callum will export a background-free, high-res render from SolidWorks Visualize. It replaces `car-placeholder.svg` and keeps the current hotspot tagging and camera zoom/pan, with enough resolution that zoomed views stay sharp.
- **Cache: 30 days, not 1 year**, with automatic version numbers (see Phase 4). Callum approved the `amplify.yml` change on 2026-09-29.

## Phase 1: stop loading what nobody sees (done, 2026-09-28)

- `build.py` `add_image_sizes()`: every local `<img>` without a `width` gets its real `width`/`height`, read from the file header (JPEG/PNG/WebP, stdlib only). CSS still sets the display size (`img { height: auto }`); the attributes only reserve the aspect ratio. This is what fixed the gallery.
- `data-lazy` groups (`main.js`): a container with `data-lazy` holding `<img data-src>` loads all of its images when it's about a screen away (IntersectionObserver, `rootMargin: 100% 0px`). It covers the marquee's cloned copies. `build.py` gives every `data-src` image a 1×1 placeholder `src` so it lays out as an image. Used on the two home-page `.photo-marquee`s. Plain `loading="lazy"` is still right almost everywhere else.
- Logo and textures shrunk (see Baseline). `styles.css` → `?v=14`, `main.js` → `?v=3`.
- Checked with before/after headless-Edge screenshots of all 8 pages at 1440 and 500px: pixel-identical apart from the 46px header logo resample and the live countdown.

## Phase 2: image pipeline for web copies (done, 2026-09-29)

- **`site-src/optimize_images.py`** (Pillow, optional tool; usage at the top of the file and in the README). For each original it writes `photos/<name>.webp` (long edge 1920px: 1920 wide for landscape, 1920 tall for portrait), `<name>-640.webp` and `<name>-1280.webp` (skipped when not smaller than the largest), WebP quality 70, `method=6`, rotation fixed, metadata stripped, never upscaled. Re-runs skip up-to-date copies (`--force` to redo). Names come from the file name (`Copy of IMG_5212.JPG` → `img_5212`) or `--name`.
- **No JPEG fallback** for photos: every browser the site targets reads WebP. The one exception is social sharing: the script also writes `<name>-og.jpg` (1200px) for each page's `og_image` front-matter value, which `build.py` uses for `og:image`. `og_image` is now a bare name (`og_image: img_5850`).
- **Quality 70, not 78:** at 100% zoom it's indistinguishable on the hero (sponsor decals stay crisp) and saves ~17%. Grass and dirt texture is what makes these photos expensive.
- **`build.py`** (still stdlib): for `<img src="assets/img/photos/<name>.webp">` with smaller siblings it writes `srcset` and, unless the tag has its own, `sizes="auto, 100vw"` for lazy images (Chromium uses the laid-out width; others fall back to 100vw) or `sizes="100vw"` for eager ones. `data-src` images get `data-srcset`, which the `data-lazy` loader copies. The marquee photos declare `sizes="510px"` (their max CSS width). The gallery lightbox opens `src` (the largest copy), not the thumbnail's `currentSrc`.
- **Photos regenerated from the Drive originals** (`pics sep29/`, 3888–6960px) instead of the old 1920px JPEGs, then the 50 JPEGs were removed. 17 new competition photos were added in the same pass; see CLAUDE.md "Photo placement".
- **Sizes:** average per photo 212 KB (1920), 122 KB (1280), 41 KB (640), vs ~384 KB per old JPEG. `photos/` is 25 MB for 67 photos × 3 sizes.

**Results** (first load, empty cache; photos only in brackets):

| Page | After Phase 1 (1440px) | After Phase 2 (1440px) | After Phase 2 (500px) |
|---|---|---|---|
| index | 2.1 MB | 1.3 MB (286 KB) | 1.1 MB (91 KB) |
| about | 2.0 MB | 1.1 MB (509 KB) | 0.75 MB (137 KB) |
| competitions (top) | 1.5 MB | 1.0 MB (369 KB) | 0.72 MB (86 KB) |
| competitions `#gallery` | 5.1 MB (14 photos) | 1.6 MB (17 photos, 943 KB) | 0.79 MB (156 KB) |
| team / merch / sponsors / roster | 1.0–1.7 MB | 0.81–0.85 MB | ~0.7 MB |
| tech | 0.6 MB | 0.6 MB | – |

What's left on every page is fixed chrome, ~600 KB: fonts (~230 KB), vendor JS (~150 KB), textures (~205 KB), CSS and the logo. Phase 4's 30-day cache makes that a one-time cost per visitor. Trimming unused font weights would be the next small win.

## Phase 3: new assets

- **Headshots** (`assets/img/team/<id>`, 4:5): generate **~200px** (roster rows and lead cards, ~10 KB) and **~800px** (profile drawer, loaded only when the drawer opens). About 40 members × ~10 KB = ~400 KB, lazy-loaded as the list scrolls. Update `roster.js` to use the small copy in lists and the large one in the drawer.
- **Merch photos:** the same pipeline as Phase 2. Product cards use the 640/1280 copies; add a larger size only if we add a product close-up view.
- **Car render (SolidWorks Visualize):**
  - Export a PNG with a transparent background at **at least ~3600px wide**. The camera zooms up to ~1.6× (`data-zoom`, default 1.45), so a ~1100px-wide canvas at 2× DPR × 1.6 needs ~3500px to stay sharp.
  - Deliver it as **WebP with alpha** (JPEG has no transparency, and a PNG this size would be 5–15 MB): ~1600px for phones and ~3600px for desktop via `srcset`. Target: under ~250 KB and ~900 KB.
  - Optionally load the 1600px copy first and swap to the 3600px one when the zoom sequence starts.
  - Keep hotspot positions as percentages (`--x`/`--y`) so they don't depend on resolution. Re-place them with `tech.html?edit` on the final render.
  - Update the README's "Tech page: swapping in the render" steps (it still says `car-render.png`, ~2400px).
- **Future 3D model** (parked): if it comes back, use a GLB decimated to ~200–500k triangles with Draco/Meshopt compression (under ~5 MB) and a self-hosted `<model-viewer>`/three.js that loads only on a "View in 3D" tap, with the render as the poster.
- **Video**, if ever added: `preload="none"` plus a poster image, muted, 720p, H.264 + WebM/AV1, ~2–4 MB.

## Phase 4: caching and guardrails (done 2026-09-29)

**What was done:**
- `build.py` `add_asset_versions()` stamps every `href`/`src` pointing at `assets/**.css|js|pdf` with `?v=<first 8 hex of SHA-256>` (vendor files and the sponsorship PDF included). The hand-kept `?v=15` / `?v=5` / roster `?v=3` / `?v=2` are gone from `layout.html` and `roster.html`. A missing linked file stops the build.
- Not stamped: **fonts** (the preload `href` must equal the `url()` in `styles.css`, which the build doesn't touch, or the font downloads twice) and **images** (their URLs appear in `srcset`, `data-src` and CSS; the rule below covers them). `url()`s inside `styles.css` (fonts, textures) aren't versioned either, so those files get new names when replaced.
- `site-src/perf_check.py` (stdlib): local server that logs every response's size, headless Edge per page with a fresh profile, `--blink-settings=lazyLoadEnabled=true`, `--virtual-time-budget=8000`. Prints requests and KB (photos / other / total), budget 2048 KB, exit 1 if over. Includes `competitions.html#gallery`. **Run it from PowerShell:** in the agent's Git Bash sandbox Edge starts but makes no requests (the script now says so instead of printing zeros).
- `amplify.yml` max-age 604800 → **2592000 (30 days)**, approved by Callum 2026-09-29.

**perf_check.py results (2026-09-29, uncompressed bytes):**

| Page | 1440×900 | 500×900 |
|---|---|---|
| index | 1329 KB (286 KB photos) | 1134 KB (91 KB) |
| about | 1127 KB (510 KB) | – |
| competitions (top) | 1004 KB (370 KB) | – |
| competitions `#gallery` | 1267 KB (633 KB) | 721 KB (87 KB) |
| sponsors | 928 KB | – |
| team / merch / roster | 813–849 KB | – |
| tech | 633 KB | – |

**Plan (as written 2026-09-28):**


**How caching works here:** `Cache-Control: max-age` is set **per file**, only for `assets/**` (CSS, JS, images, fonts, PDF), and never for the HTML pages. It means "a browser that already has this exact URL may reuse it for up to N days without asking the server". It does **not** cache the whole site. The HTML is always re-checked, so page text and new sections show up right away. What goes stale are asset files reached by the same URL, e.g. `roster-data.js?v=2` edited without bumping `v`, or a photo replaced under the same file name.

- **Automatic versioning:** `build.py` computes a short hash of each linked CSS/JS file (and optionally images) and writes it as `?v=<hash>`. When a file changes its URL changes, so browsers fetch it on the next page load no matter the max-age. This removes the manual `?v=N` bumping in `layout.html` and `roster.html`, and the CLAUDE.md/README instructions for it.
- **Max-age: 30 days** (`max-age=2592000`) for `assets/**`, per Callum. With versioning in place, a longer time only affects files that haven't changed. **Needs Callum's go-ahead** since it edits `amplify.yml`.
- **Rule for images:** when replacing a photo, sponsor logo or headshot, give it a new file name (or rely on the hash in `?v=`) rather than overwriting in place.
- **`site-src/perf_check.py`:** the measuring script from the baseline above, kept in the repo. It starts a local server, loads each page in headless Edge and prints requests/KB per page against a budget (e.g. 2 MB first load). Run it before merging image-heavy changes.
- **Lighthouse:** PageSpeed Insights can't get past the Amplify password, so until launch use Edge DevTools → Lighthouse while logged in to the Amplify URL. After launch, check PageSpeed Insights on the real domain.
