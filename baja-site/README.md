# Rough Rider Racing website — v2 (design pass)

Two folders live side by side:

```
Website/
├── site-src/            ← EDIT HERE
│   ├── build.py         run:  python build.py   (Python 3, no packages needed)
│   ├── partials/layout.html   shared <head>, splash, header, menu, footer
│   └── pages/*.html     one file per page (index, about, team, tech, competitions, sponsors)
└── baja-site/           ← GENERATED — this is what gets uploaded to AWS
    ├── *.html
    └── assets/
        ├── css/styles.css     design system (tokens at the top)
        ├── js/main.js         all interactions
        ├── vendor/            GSAP + ScrollTrigger + SplitText, Lenis (self-hosted)
        ├── fonts/             Big Shoulders Display/Stencil, Barlow, Barlow Condensed (self-hosted, OFL)
        ├── img/photos/        team photos (1920px, web-sized)
        ├── img/sponsors/      white-on-transparent sponsor logos
        ├── img/texture/       grunge mask, scratches, mud spray, torn edges
        ├── img/tech/          car render (placeholder SVG for now)
        └── docs/              sponsorship package PDF
```

Don't hand-edit the HTML in `baja-site/`: the next build overwrites it. CSS, JS and images in `baja-site/assets/` are edited directly.

## Colours (official uOttawa palette)
Garnet `#8f001a` · Secondary Garnet `#9c1c30` · Charcoal `#2d2d2c` · Secondary Charcoal `#3a3a37` · Warm Grey `#80746c` / `#908681` · Polar Grey `#f2f2f2` · White. Page background is black (PMS Black C, the base of uOttawa's charcoal tint). To go charcoal-only, set `--bg: var(--charcoal)` in `:root`.

## Effects and how to use them
| Effect | How |
|---|---|
| Splash screen | Automatic, first page view per browser session |
| Page-to-page wipe | Automatic on internal links |
| Fade/slide in on scroll | `data-reveal` (`clip`, `stagger`, `left`, `right`; `data-delay="1-3"`) |
| Masked line-by-line headline | `data-split="lines"` (or `chars`) |
| Distressed paint on type | class `worn` (`worn--light` = subtler) |
| Word-by-word brighten | class `scrub-text` |
| Count-up numbers | `data-count="50260" data-prefix="$"` |
| Marquee (text/photos/logos) | `data-marquee="1"` (or `-1` reversed), `data-speed="40"` seconds per loop |
| Pinned horizontal scroll | `data-htrack` on a section with `.htrack__inner` |
| Parallax | `data-parallax="0.2"`; `.frame` and `.band` images parallax automatically |
| Torn paper edge | class `torn-top` on a section |
| Countdown | `data-countdown="2026-10-02T08:00:00-04:00"` (update each season) |

All motion switches off for visitors with "reduce motion" enabled, and content still shows if JavaScript fails.

## Tech page: swapping in the render
1. Save the render as `baja-site/assets/img/tech/car-render.png` (transparent background, side or 3/4 view, ~2400px wide).
2. In `site-src/pages/tech.html`, change the `<img>` src in `.car-canvas` and remove the `is-placeholder` class.
3. Open `tech.html?edit` in a browser. Drag each numbered dot onto its part; the HUD prints `style="--x:..%; --y:..%"`. Paste that onto the matching hotspot.
4. `python build.py`.

## Placeholders
Anything with a dashed grey outline (class `todo`) needs real content: team roster and headshots, spec sheet values, design highlights, past results, recruitment dates, LinkedIn URL, and logos for Continual Energy, JMTS and Altair.

## Deploying (own domain)
S3 bucket (private) → CloudFront with Origin Access Control → ACM certificate (us-east-1) → Route 53 (or your registrar) pointing the domain at CloudFront. Set `SITE_URL` in `build.py` once the domain is live so canonical and social-share tags use it. Upload only `baja-site/`.
