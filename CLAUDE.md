# Rough Rider Racing website

Website for Rough Rider Racing (RRR), the University of Ottawa Baja SAE team. Maintained by Callum (team admin + front suspension). Static HTML/CSS/JS, no framework, no npm.

## Standing permission: auto-merge

Callum has authorized Claude to **merge requested changes into `main` without asking**. For every change request:

1. Start the working branch from the latest `main` (a merged PR's branch is finished; restart it from `origin/main`, don't stack on old history).
2. Edit `site-src/` (and `baja-site/assets/` for CSS/JS/images), then run `python build.py` from `site-src/`.
3. For visual changes, check the result in a headless browser. Playwright is **not** installed on Callum's Windows machine; use headless Edge (`"/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless=new --force-prefers-reduced-motion --window-size=W,H --screenshot=out.png file:///.../baja-site/page.html`). Tall windows inflate the `svh` heroes, so to see lower sections, screenshot a scratch copy with `<base href>` pointing at `baja-site/` and `.hero,.splash{display:none}` injected. Edge won't go below ~500px wide; for phone widths, wrap the page in a 390px iframe.
4. Commit, push, open a PR into `main`, merge it, and give Callum a short summary plus the PR link.

Still ask first when a request is ambiguous or the change is hard to undo: deleting pages, photos or sections, changing hosting/deploy config (`amplify.yml`), or anything touching access control or the domain.

## Layout and build

```
site-src/            <- EDIT HERE
  build.py           python build.py  (Python 3, stdlib only) -> writes ../baja-site/*.html
  perf_check.py      python perf_check.py  page weight per page in headless Edge (run from PowerShell; Git Bash sandbox blocks Edge)
  partials/layout.html   shared <head>, splash, header, menu, footer
  pages/*.html       index, about, team, tech, competitions, sponsors, merch, roster (front-matter comment at top)
                     PAGES in build.py = menu pages; EXTRA_PAGES = built + footer only (roster)
baja-site/           <- GENERATED HTML + hand-edited assets; this folder is what gets deployed
  assets/css/styles.css  design system, tokens at the top
  assets/js/main.js      all interactions (GSAP, ScrollTrigger, SplitText, Lenis in assets/vendor/)
  assets/js/roster-data.js  FULL ROSTER DATA: one object per member (roles, joined, about, focus, links...). Edit directly, then rebuild (updates its ?v= hash)
  assets/js/roster.js    renders roster.html: A–Z / seniority sort, subteam filter, profile drawer at roster.html#member-id
  assets/vendor/         GSAP, ScrollTrigger, SplitText, Lenis (self-hosted, no CDN)
  assets/fonts/          self-hosted woff2 files
  assets/img/photos/     WebP web copies: <name>.webp (1920px) + -640/-1280 sizes, -og.jpg share images
  assets/img/sponsors/   white-on-transparent logos
  assets/img/tech/       car image for the tech-page hotspots (still car-placeholder.svg)
  assets/img/texture/    grunge mask, scratches, splatter, torn edges
  assets/docs/           sponsorship package PDF
amplify.yml          Amplify serves baja-site/ as-is, no build step
```

- **Never hand-edit `baja-site/*.html`**; the next build overwrites it. CSS, JS and images in `baja-site/assets/` are edited directly.
- **Always run `build.py` and commit `baja-site/`** along with `site-src/`. Amplify does not run the build, so an unbuilt change deploys as nothing.
- `SITE_URL` in `build.py` is empty until the custom domain is live; set it then (canonical + og:image URLs).
- `baja-site/README.md` documents the effect attributes (`data-reveal`, `data-split`, `worn`, `data-count`, `data-marquee`, `data-countdown`, etc.) and the tech-page hotspot editor (`tech.html?edit`). The README is the human-friendly guide and CLAUDE.md is the agent guide, and **they must stay aligned**. When a change affects workflow, structure, hosting or the placeholder list, update both in the same PR.
- Placeholders needing real content use class `todo` (dashed outline) or `todo-note`. `todo-note` is also reused as plain small-note styling (e.g. "Drag or scroll →" on the home page), so check context before treating one as unfinished.
- Still placeholder: tech-page car render + hotspot positions, CVT and gearbox spec lists, tech "design highlights" grid, team-page recruitment dates/sign-up link, JMTS logo, merch products (names, prices, photos) and merch-page photos.
- **Competitions "Past seasons" section removed for now** (2026-09-28) so the page focuses on upcoming events; it may come back. It was section 03 (`<section id="results">`, a `todo` grid of 3 placeholder panels: season, event, location/dates, result summary; newest first) between the scoring section and the gallery. Recover the markup with `git show 245e5ea:site-src/pages/competitions.html`.
- `worn` (grunge mask on display type) has a floor, `--worn-floor` in `styles.css` (currently .55), so worn patches stay partly visible for readability. Tune that value rather than removing the effect; Callum wants the grit kept.
- Home-page "Next up" section (`data-next-event` in `pages/index.html`) holds a JSON list of events (`<script type="application/json" data-events>`: start, end, kicker, title, lead, done). `main.js` shows the first event whose `end` hasn't passed, so it flips from OktoBajaFest (Oct 2–4, 2026) to Baja SAE Williamsport (May 20–23, 2027) by itself (Vincent's request, 2026-09-29). Each season, add the next events and update the written-out text (the no-JS fallback) to match the first one. After the last event it shows "Next season's schedule is coming soon".
- Roster layout (modelled on cwrumotorsports.com/team): leads (`rank` 0–1, or `lead: true`) get full-size cards; everyone else is a slim clickable row (headshot, name/title, subteam tags, Class = 4-digit year from `grad`, Major = `program`). Every card and row opens the same profile drawer. 37 `placeholder` slots generated at the bottom of `roster-data.js` (with Callum, Etienne, Joseph = 40 regular members); Callum will send an Excel file (names, position, subteam) to fill them.
- Roster: seniority = earliest `joined` season, then `rank` (0 captain, 1 lead, 2 member), then name. Sort options: A–Z, seniority, class year. Headshots go in `baja-site/assets/img/team/<id>.jpg` (4:5, ~800×1000; the `team/` folder doesn't exist yet, create it with the first photo). Delete the `placeholder: true` entries as real members are added. The roster is also hand-listed on `pages/team.html`; keep names and titles in sync between the two.
- **Asset versioning (Phase 4):** `build.py` stamps every linked CSS/JS/PDF with `?v=<8-hex SHA-256>` (`add_asset_versions`). Don't write `?v=` by hand. After editing any CSS/JS in `baja-site/assets/` (including `roster-data.js`), rebuild and commit the HTML, or returning visitors keep the cached copy. Fonts and images are not stamped (preloaded fonts must match the `url()` in `styles.css`), so a replaced photo, logo or headshot gets a **new file name**, never an overwrite.
- Sponsor logos are white-on-transparent PNGs in `assets/img/sponsors/`. Still missing: JMTS.
- Garnet highlight blocks (`.accent-hl`, and `.accent` inside `.section--charcoal .title`) are `inline-block` + `nowrap` so they never split across lines and overlap the line above. Keep highlighted phrases short (they can't wrap).
- Subteam titles on the team page are sized with container units (`16cqi`) so long names like "Administration" fit the intro column.
- Hero `.line` spans use padding-top/negative margin so glyph tops aren't clipped by the reveal mask; `data-split` masks are reverted after they animate. Keep both if touching headings.

## Pending review (don't change yet)

Vincent flagged these on 2026-09-29 and will review them with Nora. **Leave them as they are until Callum says otherwise:**
- Sponsors page, "Travel with us" section: he'd rather not state how many students go to competitions (e.g. say "multiple team members" instead of 10–15).
- Sponsors page, budget section: he isn't a fan of it as is.

The tech page's menu label is **"The Car"** (Vincent, 2026-09-29); the file stays `tech.html` so links keep working.

## Merch page (`pages/merch.html`, menu item 07, added 2026-09-28)

- Sections: hero ("Team gear."), 01 "Where it goes" (how merch helps the team), 02 shop gallery (`#shop`, "The first run"), and a garnet "Stay in the loop" section (Instagram + email).
- **Tone: low-key, "it's here if you want it"** (Vincent, 2026-09-29). No hype, urgency or "buy now" language, and no head counts of members sent to events.
- Photos are stand-ins from `img/photos/` chosen to show team apparel (hero `img_4534` shirt backs, `crew_headset` team tee, `img_4441` sponsor shirts). Callum will supply merch-photoshoot photos to replace them.
- The shop is **placeholder only**: 6 invented products (tee, hoodie, crewneck, cap, toque, sticker pack), "Price TBA", a "Coming soon!" box instead of a photo, and disabled "Coming soon" buttons. Each `<article class="product">` has a `data-product` id for the future cart. For a real photo, put an `<img>` inside `.product__img` in place of the `<span>`.
- **TODO, not started: a full shopping cart and secure checkout**, to build once the merch designs are final and the team is ready to ship. Likely **PayPal** (PayPal JS SDK buttons + Orders API v2). Requirements:
  - The site is static (Amplify serves `baja-site/` with no build), so checkout needs a small backend, e.g. Lambda + API Gateway, to **create and capture PayPal orders server-side**. Never trust prices, totals or discounts sent from the browser. Recalculate from a server-side product/price list.
  - PayPal client secret in environment variables or AWS Secrets Manager, **never in the repo**. Use sandbox credentials until launch.
  - Verify PayPal webhook signatures before marking an order paid. Make order handling idempotent.
  - Card data stays with PayPal (hosted buttons/fields), so it never touches our servers (keeps PCI scope minimal). HTTPS only (Amplify default).
  - The cart itself can live client-side (localStorage, wrapped in try/catch like `roster.js`). It needs sizes/variants, quantities, stock limits, shipping vs campus pickup, Ontario HST, an order-confirmation email (e.g. SES) and a refund/returns policy page.
  - Changes to `amplify.yml`, backend or AWS resources need Callum's go-ahead first (see Standing permission).

## Performance plan (`Optimization.md`; Phases 1–2 done 2026-09-29, 3–4 not started)

Callum wants the site to stay snappy as headshots, merch photos and the car render land. **`Optimization.md` (repo root) holds the full plan, baseline numbers and decisions. Read it before adding images or touching loading/caching, and tick its status line as phases merge.** Don't start a phase unless Callum asks. In short:

- Baseline after Phase 1: every page is 0.6–2.1 MB on first load; the competitions gallery pulls ~5 MB when scrolled to. Phase 2 results are in `Optimization.md`. **To measure, headless Edge needs `--blink-settings=lazyLoadEnabled=true`, or it ignores `loading="lazy"` and overstates page weight** (our first baseline was wrong because of this).
- Phases: **1 (done)** build writes image sizes, `data-lazy` marquees, smaller logo and WebP textures. **2 (done)** `site-src/optimize_images.py` (Pillow, optional tool) makes WebP 640/1280/1920 web copies, and `build.py` (stays stdlib) writes `srcset`/`sizes` automatically. **3** headshots (~200px list + ~800px drawer), merch through the same pipeline, and the car render as WebP with alpha (~1600 + ~3600px). **4 (done, except max-age)** `build.py` hashes CSS/JS/PDF into `?v=` automatically and `site-src/perf_check.py` checks page weight against a 2 MB budget. Still pending Callum's go-ahead: `assets/**` max-age to **30 days** (`2592000`) in `amplify.yml` (he doesn't want 1 year).
- **Images (since Phase 1):** `build.py` adds the real `width`/`height` to every local `<img>` that lacks a `width` (read from the file header), so don't hand-write them for photos, and don't remove that step: without it the gallery's lazy images are 0px tall and all 50 download at once. For images that `loading="lazy"` can't handle (the scrolling marquees), put `data-lazy` on the container and use `data-src` instead of `src`; `main.js` loads the group a screen early and the build adds a 1×1 placeholder `src`. Texture masks are `.webp` in `img/texture/`.
- **Adding photos (since Phase 2):** put the originals in a scratch folder outside `baja-site/` (the repo's `.gitignore` covers `website pics/`), then from `site-src/` run `python optimize_images.py "<folder>"` (or `<file> --name <web_name>` for camera/phone names you'd rather not keep). It writes `photos/<name>.webp` (1920px, or 1920 tall for portraits), `<name>-640.webp`, `<name>-1280.webp`, and `<name>-og.jpg` for every page `og_image`. In pages write `<img src="assets/img/photos/<name>.webp" alt="..." loading="lazy">`; `build.py` adds width/height, `srcset` and `sizes` (`auto, 100vw` for lazy images, `100vw` otherwise; write your own `sizes` for small fixed slots, like the marquee's `510px`). Gallery lightbox opens `src` (the largest copy). No JPEG photos remain; don't add any.
- **Photo placement (2026-09-29, Callum: more variety, no repeats):** outside the competitions gallery, each photo is used on one page only (menu previews reuse each page's own hero). The gallery holds everything else except photos already shown higher on the competitions page and near-duplicates (`dsc_0937`, `dsc_1041`, `img_4973`, `img_5114`, `dsc_0546` stay out). Mix people and car shots. `pics sep29/` (local only) held the Drive originals: 50 already on the site plus 26 new; 17 new were used, 9 skipped as near-repeats or weak.
- **Originals live in Google Drive; the repo holds only web copies** (smaller dimensions). Headshots and merch photos will come from Callum as a folder of full-size files for us to convert. Never commit full-size originals.
- **Car:** no 3D/360° model for now (out of scope while the car is still in SolidWorks). Callum will supply a background-free, high-res SolidWorks Visualize render. It replaces `car-placeholder.svg` and keeps the existing hotspots and camera zoom, at ≥ ~3600px wide so the zoomed views stay sharp.

## Hosting

- AWS Amplify Hosting, connected to GitHub `CallumWarnaar/uOttawaBaja`, branch `main`. Every push to `main` redeploys automatically. (An `origin/staging` branch also exists, currently identical to `main`; it isn't referenced anywhere in the repo.)
- Current URL: `https://main.duwhaiwnzv75w.amplifyapp.com/`, **password-protected** (Amplify Access control) while the site is unfinished. Deploys don't change that setting.
- No custom domain yet; plan is to register one (likely via Route 53) at launch, then switch Access control to public and set `SITE_URL`.
- `amplify.yml` sets `Cache-Control: max-age=604800` (7 days) on `assets/**` (planned: 30 days, see Performance plan). CSS/JS versions are automatic; just rebuild after editing them.

## Design

- Official uOttawa palette (Callum, 2026-09-28): Garnet/red `#8f001a`, Primary Charcoal `#2d2d2c` (`--charcoal-deep`, the page background `--bg`), Secondary Charcoal `#3a3a37` (`--charcoal`, raised sections/footer/cards), Polar Grey `#f2f2f2`. **No pure-black surfaces** (Callum found them lifeless): `--black` is only for text on polar/garnet and for shadows/photo overlays. `--garnet-2`, `--charcoal-2`, `--grey`, `--grey-2` are tints mixed from the palette; don't add other hues (the old warm greys and `#9c1c30` were removed).
- Fonts (self-hosted, OFL): Big Shoulders Display/Stencil, Barlow, Barlow Condensed.
- `.frame` images are sized by `aspect-ratio` on the frame, with the image overscanned (`top:-9%; height:118%`) so the ±7% parallax never shows the background. Keep that if touching frames.
- Canadian spelling in copy (manoeuvring, centre, organization is fine).

## Facts (confirmed by Callum, 2026-27 season, car #230)

- **Car number changes most seasons.** #230 is this season's number; expect a new one at the end of each calendar year. When it changes, update it everywhere (`grep -rn 230 site-src baja-site/assets/js`): hero numbers, alt text, copy, CLAUDE.md, README.

- **Engine:** Kohler CH440, 14 hp stock, restricted to **10 hp** by the rules. Same engine for every team. (The team's dyno graph shows ~9.5 hp; Vincent said to keep showing the 10 hp spec.)
- **Chassis:** 4130 steel, 1-1/4" OD × 0.065" wall tubing. Wheelbase 70", track width 58".
- **Front suspension:** double wishbone, 12" travel, King PR2008 2.0 air shocks (8" shock travel), 14" ride height.
- **Rear suspension:** semi-trailing arm with camber links, 10" travel, King PR2012 2.0 air shocks (12" shock travel), 13" ride height.
- **Steering:** power steering, 90% Ackermann, 8 ft turning radius.
- **Brakes:** 4-wheel hydraulic disc, 2 circuits.
- **Cockpit:** custom foam seat inserts, 5-point harness, egress under 5 s.
- **Electrical:** 2 kill switches (1 interior, 1 exterior); sensors and data logging are work in progress.
- **Drive:** 2WD, CVT + gearbox.
- **Curb weight:** under 550 lb (without driver).
- Still TBD: top speed, CVT and gearbox specs.
- **Program:** one-year vehicle cycle, a brand-new car every season (not two-year).
- **Budget:** shown as ~$40K typical annual budget (the $50,260 figure was an unusually high year; don't show it). 10–15 members travel per event.
- **Links:** Faculty of Engineering https://www.uottawa.ca/faculty-engineering/ · Baja SAE https://www.bajasae.net/ (footer + About page).
- **Socials (footer):** Instagram https://www.instagram.com/uottawabaja/ · LinkedIn https://www.linkedin.com/company/baja-uottawa/

## Team (first names only unless given)

- Leadership: Nora Jordan (Team Captain). No technical director or business lead currently.
- Faculty advisors: Jason, Alex (first names only; shown under Leadership on `team.html`, not on the roster).
- 01 Chassis: Megan, Kira (co-leads)
- 02 Suspension: Matthew (lead), Callum (Director of Front Suspension, 2026-09-29)
- 03 Drivetrain: Vincent (lead)
- 04 Electrical: Fahad (lead)
- 05 Administration: Etienne, Callum, Joseph
