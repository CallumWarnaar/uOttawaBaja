# Rough Rider Racing (uOttawa Baja SAE) — Gemini Agent Guide

This document provides complete architectural, operational, design, technical facts, and diagnostic context for Gemini agents working on the Rough Rider Racing website repository.

---

## 1. Project Overview & Architecture

- **Project**: Official website for **Rough Rider Racing (RRR)**, the University of Ottawa's Baja SAE design team.
- **Repository**: `CallumWarnaar/uOttawaBaja` (GitHub, branch `main`).
- **Domain**: `https://uottawabaja.ca` (registered and live on AWS Amplify).
- **Hosting**: AWS Amplify Hosting connected directly to GitHub `main` (auto-deploys on push).
- **Stack**: Static HTML5/CSS3/JavaScript generator built in Python 3 (standard library only, zero npm/pip runtime requirements).

---

## 2. Directory Layout & The Golden Build Rule

```
Website/
├── site-src/                       ← SOURCE OF TRUTH (Edit templates and builder here)
│   ├── build.py                    ← Static builder (Python 3 stdlib: HTML compile, asset hash, sitemap)
│   ├── optimize_images.py          ← Image pipeline tool (Pillow: WebP 640/1280/1920 + OG jpg)
│   ├── perf_check.py               ← Headless Edge performance auditor (2 MB budget check)
│   ├── partials/
│   │   └── layout.html             ← Shared shell (<head>, splash, wipe, header, menu, footer, lightbox)
│   └── pages/                      ← Content templates (front-matter comment at top)
│       ├── index.html              ← Home (Hero, dynamic next event, RRR subteams, partners)
│       ├── about.html              ← About Baja SAE, competition format, mission, process
│       ├── team.html               ← Leadership, subteams, advisors, recruitment
│       ├── tech.html               ← "The Car" interactive hotspot viewer, specs, highlights
│       ├── competitions.html       ← Season schedule (OktoBajaFest & Williamsport), paddock info
│       ├── gallery.html            ← Full-screen filtered photo gallery (Track, Paddock, People)
│       ├── sponsors.html           ← Sponsorship tiers, talent package, budget, partnership CTA
│       ├── merch.html              ← Team gear shop (placeholder catalog, future cart)
│       └── roster.html             ← Full searchable/filterable member roster & profile drawer
│
├── baja-site/                      ← COMPILED OUTPUT (Served as-is by AWS Amplify)
│   ├── *.html                      ← Compiled HTML files (DO NOT HAND EDIT!)
│   ├── sitemap.xml                 ← Generated sitemap for Google Search Console
│   ├── robots.txt                  ← Generated robots exclusion standard
│   └── assets/                     ← Static assets (EDIT DIRECTLY HERE)
│       ├── css/styles.css          ← Core design system & CSS custom properties (:root)
│       ├── js/main.js              ← Interactions, GSAP timelines, Lenis scroll, hotspot viewer
│       ├── js/roster.js            ← Roster sorting, filtering, and profile drawer controller
│       ├── js/roster-data.js       ← Canonical member data objects
│       ├── fonts/                  ← Self-hosted Fontsource fonts (WOFF2)
│       ├── vendor/                 ← Self-hosted scripts (GSAP, ScrollTrigger, SplitText, Lenis)
│       ├── img/
│       │   ├── photos/             ← WebP responsive images (*.webp, *-640.webp, *-1280.webp, *-og.jpg)
│       │   ├── sponsors/           ← White-on-transparent partner logos (SVG/PNG)
│       │   ├── texture/            ← Grunge overlays, scratches, splatter, torn paper edges
│       │   ├── tech/               ← Car schematics and hotspot assets (car-placeholder.svg)
│       │   ├── favicon.png         ← Browser favicon
│       │   └── logo.png            ← Team crest emblem
│       └── docs/
│           └── RRR_Sponsorship_Package_2026-2027.pdf
│
├── portal/                         ← Planned Member & Sponsor Portal scaffold (not deployed)
├── amplify.yml                     ← AWS Amplify build settings (serves baja-site/ directly)
├── .gitignore                      ← Ignores raw photos, archives, python cache
├── CLAUDE.md                       ← Historical Claude agent guidelines
├── LaunchPrep.md                   ← Launch checklist and content tracking
├── MemberPortal.md                 ← Member & sponsor login portal specification
├── PortalAgentPlan.md              ← Portal work packages for agents
├── PortalCallumPlan.md             ← Portal checklist for Callum
├── Optimization.md                 ← Performance benchmarks and asset optimization plan
└── gemini.MD                       ← This document
```

> [!CAUTION]
> ### THE GOLDEN BUILD RULE
> **NEVER hand-edit HTML files inside `baja-site/`!**
> All markup changes must be made in `site-src/pages/*.html` or `site-src/partials/layout.html`.
> Running `python site-src/build.py` regenerates `baja-site/*.html` and will overwrite any manual edits.
> Assets inside `baja-site/assets/` (CSS, JS, images, fonts) ARE edited directly.

---

## 3. Build & Deployment Workflow

### Running the Build
Run the build script from the repository root:
```powershell
python site-src/build.py
```
Or from inside `site-src/`:
```powershell
cd site-src
python build.py
cd ..
```

### What `build.py` Does
1. **Compiles HTML**: Merges `site-src/partials/layout.html` with each page in `PAGES` and `EXTRA_PAGES`.
2. **Generates Navigations**: Injects shared header menu (`{{nav}}`), photo previews (`{{nav_previews}}`), and footer navigation (`{{footer_nav}}`).
3. **Adds Image Dimensions**: Parses headers of local JPEG, PNG, and WebP files to add explicit `width` and `height` attributes to prevent Cumulative Layout Shift (CLS).
4. **Builds `srcset`**: Detects `-640.webp` and `-1280.webp` variants created by `optimize_images.py` and injects responsive `srcset` and `sizes="auto, 100vw"`.
5. **Asset Versioning (`?v=`)**: Hashes linked CSS, JS, and PDF files with SHA-256 (`?v=<8-hex>`) to bust browser caches when files change.
6. **Generates SEO Assets**: Rebuilds `baja-site/sitemap.xml` and `baja-site/robots.txt` based on `SITE_URL` (`https://uottawabaja.ca`).

### Deployment
Pushes to `origin/main` automatically deploy via AWS Amplify Hosting. Amplify serves `baja-site/` as-is with a 30-day cache header (`Cache-Control: public, max-age=2592000`) on assets.

---

## 4. Design System & Brand Standards

### Official University of Ottawa Colour Palette
Defined in `:root` in `baja-site/assets/css/styles.css`:
- **Primary Garnet**: `#8f001a` (`--garnet`)
- **Secondary Garnet**: `#9c1c30` (`--garnet-2`)
- **Deep Charcoal (Page Background)**: `#2d2d2c` (`--charcoal-deep`, `--bg`)
- **Raised Charcoal**: `#3a3a37` (`--charcoal`, cards, panels, raised sections)
- **Polar Grey**: `#f2f2f2` (`--polar`, light text)
- **Pure White**: `#ffffff` (`--white`)
- **Pure Black**: `#0d0d0d` (`--black`, reserved for text on garnet highlights, shadows, and overlays — **no solid black page surfaces**)

### Design Rules
- **No Light (Polar) Sections**: Solid white/polar background sections were removed by team request. Dark charcoal surfaces alternate with garnet sections (`section--garnet scratched`).
- **Garnet Sections**: Inside `section--garnet`, rules swap text and borders to white/charcoal. Give following sections `class="torn-top"` to preserve the torn-paper edge look.
- **High Contrast on Dark Surfaces**: Pure garnet text on charcoal fails contrast. Always use `.accent-hl` (black text on garnet pill).
- **Worn Grunge Type**: Display headings use the `worn` class (`--worn-floor: 0.55`) for distressed motorsport stencil grit.
- **Forbidden Elements**: Do not bring back custom mouse cursors or animated film grain overlays (Callum explicitly removed them).
- **Typography (Self-hosted via Fontsource)**:
  - Display: `Big Shoulders Display` (900)
  - Stencil: `Big Shoulders Stencil` (900)
  - Body & UI: `Barlow` (400, 600, 700)
  - Data / Labels: `Barlow Condensed` (700)

---

## 5. Animation, Interaction & JavaScript Rules

Libraries vendored in `baja-site/assets/vendor/`:
- **GSAP 3.12.5** + **ScrollTrigger** + **SplitText**
- **Lenis 1.1.9** (Smooth scrolling)

### Data Attribute Directives
| Attribute | Example / Options | Function |
|---|---|---|
| `data-reveal` | `clip`, `stagger`, `left`, `right` | GSAP scroll entrance animation |
| `data-delay` | `1`, `2`, `3` | Stagger delay multiplier (value * 0.1s) |
| `data-split` | `lines`, `chars` | Masks and reveals type via SplitText |
| `data-marquee`| `1` (normal), `-1` (reversed) | Infinite scroll-velocity-reactive ticker |
| `data-speed` | `28`, `40`, `60` | Loop duration in seconds |
| `data-count` | `50260`, `9.5` | Smooth animated counter from 0 |
| `data-prefix`| `$`, `+` | Prepends symbol to animated counter |
| `data-htrack` | on section | Desktop pinned horizontal scroll track |
| `data-parallax`| `0.2` | Parallax factor relative to parent |
| `data-countdown` | ISO date | Dynamic event countdown timer |
| `data-car` | on stage container | Pinned 10-point vehicle system explorer |

### Critical Motion Rule
Never animate an element with GSAP while it simultaneously has a CSS `transition` on `transform`. The two engines fight, causing severe visual stutter.

---

## 6. Confirmed Technical Facts & Specs (2026–2027 Season)

When writing copy or populating specs, use these confirmed figures:
- **Vehicle Identifier**: Use **"RRR"** (do **not** hardcode "#230"; car numbers change seasonally).
- **Engine**: Kohler CH440, rules-restricted. Output is **9.5 hp** (dyno tested), replacing the stock 14 hp spec.
- **Cycle**: **One-year vehicle cycle** (the team designs and builds a brand-new car every season, not two-year).
- **Chassis**: 4130 chromoly steel, 1-1/4" OD × 0.065" wall tubing. Wheelbase 70", track width 58".
- **Front Suspension**: Double wishbone, 12" travel, King PR2008 2.0 air shocks (8" shock travel), 14" ride height.
- **Rear Suspension**: Semi-trailing arm with camber links, 10" travel, King PR2012 2.0 air shocks (12" shock travel), 13" ride height.
- **Steering**: Power steering, 90% Ackermann geometry, 8 ft turning radius.
- **Brakes**: 4-wheel hydraulic disc, dual independent circuits.
- **Cockpit**: Custom foam seat inserts, 5-point harness, egress time under 5 seconds.
- **Electrical**: Dual kill switches (1 interior, 1 exterior). Sensor DAQ network under development.
- **Drive**: 2WD, tuned CVT + student-machined custom gearbox.
- **Curb Weight**: Under 550 lb (dry, without driver).
- **Budget**: Typical annual cash budget is **~$40,000** (in-kind machining, materials, and software licenses are separate).
- **Travel Roster**: 10–15 students travel per competition event.

---

## 7. Known Bugs, Quirks & Diagnostic Inventory

Reviewed 2026-10-09. Fixed items stay listed so they aren't reported again.

### Fixed
1. **CRLF vs. LF asset hashes (`build.py`)**: CSS/JS are now hashed with CRLF normalized to LF, so Windows (`core.autocrlf = true`) and Linux/macOS builds produce the same `?v=` values.
2. **`.frame` chamfer lost after `data-reveal="clip"` (`styles.css`, `main.js`)**: the chamfer lives in `--shape`; the reveal tween clears its inline `inset()` when done and `.is-revealed` restores `clip-path: var(--shape)`.
3. **`data-suffix` ignored by counters (`main.js`)**: `fmt()` now appends it.
4. **Lightbox**: the "3 / 62" counter never updated (its line had been swallowed by a comment); fixed. `show()` also closes the lightbox if no photos are visible, instead of indexing an empty list.
5. **Focus escaping modals (`main.js`)**: the menu and lightbox now make the rest of the page `inert` while open (`inertOthers`); the header stays live under the menu because it holds the Close toggle. Closing the lightbox returns focus to the clicked photo.

### Checked and not a bug
- **Scrub text stuck at 16% opacity without GSAP**: the `.word` spans are only created inside the `motion` branch of `main.js`, so without GSAP (or with reduced motion) the text is plain and fully visible.
- **Cross-page `#hash` links with Lenis**: tested in headless Edge with motion on (`team.html#join`, `sponsors.html#become-a-sponsor`, with splash and with page wipe); the browser lands on the target, offset by the header (`scroll-padding-top`).
- **Roster drawer focus**: `roster.js` already traps Tab inside the drawer.

---

## 8. Open Items & Future Roadmap

- [ ] **SolidWorks Car Render (`tech.html`)**:
  - Replace `assets/img/tech/car-placeholder.svg` with a high-resolution transparent background SolidWorks Visualize render (~3600px wide).
  - Fine-tune hotspot coordinates using `tech.html?edit`.
- [ ] **Full Team Roster (`roster-data.js`)**:
  - Replace the 40 "TBD / Under construction" placeholder entries with confirmed member names, programs, and graduation years from the team roster sheet.
- [ ] **Member & Sponsor Portal (`MemberPortal.md`, `portal/`)**:
  - Execution plans: `PortalAgentPlan.md` (agent work packages + ground rules, read before touching `portal/`) and `PortalCallumPlan.md` (Callum's decisions D1–D6 and deploy steps).
  - Future implementation of authenticated member directory with role-based visibility (Cognito + Lambda + Postgres).
- [ ] **Merch E-Commerce Checkout (`merch.html`)**:
  - Integrate server-side PayPal Orders API and shopping cart when apparel designs and pricing are finalized.
