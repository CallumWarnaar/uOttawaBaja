# Rough Rider Racing website

The website for Rough Rider Racing, the University of Ottawa Baja SAE team. It's a plain static site (HTML, CSS and JavaScript, no framework), hosted on AWS Amplify.

## How the repo is organized

```
uOttawaBaja/
├── site-src/            ← EDIT PAGES HERE
│   ├── build.py         run:  python build.py   (Python 3, no packages needed)
│   ├── partials/layout.html   shared <head>, splash, header, menu, footer
│   └── pages/*.html     one file per page (index, about, team, tech, competitions, sponsors, roster)
├── baja-site/           ← WHAT GETS PUBLISHED (HTML is generated, assets are edited by hand)
│   ├── *.html           built by build.py, don't edit these directly
│   └── assets/
│       ├── css/styles.css     design system (colours, fonts and spacing at the top)
│       ├── js/main.js         all animations and interactions
│       ├── js/roster-data.js  the full team roster, one entry per person
│       ├── js/roster.js       draws the roster page (sorting, filters, profiles)
│       ├── vendor/            GSAP + ScrollTrigger + SplitText, Lenis (self-hosted)
│       ├── fonts/             Big Shoulders Display/Stencil, Barlow, Barlow Condensed (self-hosted, OFL)
│       ├── img/photos/        team photos (1920px, web-sized)
│       ├── img/sponsors/      white-on-transparent sponsor logos
│       ├── img/tech/          car image for the tech page (placeholder SVG for now)
│       ├── img/texture/       grunge mask, scratches, mud spray, torn edges
│       └── docs/              sponsorship package PDF
└── amplify.yml          hosting settings
```

## Making a change

1. Edit the page in `site-src/pages/` (or the shared header/footer in `site-src/partials/layout.html`).
2. From `site-src/`, run `python build.py`. This regenerates the HTML in `baja-site/`.
3. Commit **both** `site-src/` and `baja-site/`, then push to `main`.

Amplify doesn't run the build itself. It publishes `baja-site/` exactly as committed, so if you skip step 2 your change won't appear on the site.

CSS, JavaScript and images in `baja-site/assets/` are edited directly, with no build needed. Assets are cached for 7 days, so when you change `styles.css`, `main.js` or the roster scripts, bump the `?v=` number where they're linked (`site-src/partials/layout.html`, or `site-src/pages/roster.html` for the roster) and rebuild. Otherwise returning visitors will keep the old file.

## Updating the team

- **Full roster:** edit `baja-site/assets/js/roster-data.js`. Instructions for each field are at the top of the file. Delete the `placeholder` entries as real members are added.
- **Team page:** the subteam lists on `site-src/pages/team.html` are written out by hand. Keep them in step with the roster.
- **Headshots:** put them in `baja-site/assets/img/team/<id>.jpg` (portrait 4:5, about 800×1000). Create the `team/` folder when you add the first one.

## Colours (official uOttawa palette)
Three official colours only: Garnet (red) `#8f001a` · Charcoal Grey `#3a3a37` · Polar Grey `#f2f2f2`, plus black and white. The other tokens (`--garnet-2`, `--charcoal-2`, `--grey`, `--grey-2`) are tints mixed from those three, not extra hues. Page background is black (PMS Black C, the base of uOttawa's charcoal tint). To go charcoal-only, set `--bg: var(--charcoal)` in `:root`.

## Effects and how to use them
| Effect | How |
|---|---|
| Splash screen | Automatic, first page view per browser session |
| Page-to-page wipe | Automatic on internal links |
| Fade/slide in on scroll | `data-reveal` (`clip`, `stagger`, `left`, `right`; `data-delay="1-3"`) |
| Masked line-by-line headline | `data-split="lines"` (or `chars`) |
| Distressed paint on type | class `worn` (`worn--light` = subtler; `--worn-floor` in `styles.css` sets how much of the worn-away paint still shows) |
| Garnet highlight block | class `accent-hl` (never wraps, so keep the phrase short) |
| Word-by-word brighten | class `scrub-text` |
| Count-up numbers | `data-count="40" data-prefix="~$"` |
| Marquee (text/photos/logos) | `data-marquee="1"` (or `-1` reversed), `data-speed="40"` seconds per loop |
| Pinned horizontal scroll | `data-htrack` on a section with `.htrack__inner` |
| Parallax | `data-parallax="0.2"`; `.frame` and `.band` images parallax automatically |
| Torn paper edge | class `torn-top` on a section |
| Countdown | `data-countdown="2026-10-02T08:00:00-04:00"` on the home page (update each season) |

All motion switches off for visitors with "reduce motion" enabled, and content still shows if JavaScript fails.

## Tech page: swapping in the render
1. Save the render as `baja-site/assets/img/tech/car-render.png` (transparent background, side or 3/4 view, ~2400px wide).
2. In `site-src/pages/tech.html`, change the `<img>` src in `.car-canvas` and remove the `is-placeholder` class.
3. Open `tech.html?edit` in a browser. Drag each numbered dot onto its part; the HUD prints `style="--x:..%; --y:..%"`. Paste that onto the matching hotspot.
4. `python build.py`.

## Still to fill in
Anything with a dashed grey outline (class `todo`) needs real content:
- the tech-page car render and hotspot positions
- CVT and gearbox specs
- design highlights (tech page)
- recruitment dates and the sign-up link (team page)
- the JMTS sponsor logo
- real roster entries and headshots

## Parked for later
- **Past seasons (competitions page)** was taken out in Sept 2026 so the page focuses on upcoming events. To bring it back, copy the `<!-- RESULTS -->` section from `git show 245e5ea:site-src/pages/competitions.html` and fill in real results.

## Hosting
- **AWS Amplify Hosting**, connected to this GitHub repo. Every push to `main` redeploys the site automatically, usually within a minute or two.
- `amplify.yml` tells Amplify to serve `baja-site/` as-is (no build step) and sets the 7-day cache on `assets/`.
- While the site is unfinished it's **password-protected** (Amplify → Access control). Deploys don't change that.
- **Launch plan:** register a custom domain (likely through Route 53) and connect it in Amplify, switch Access control to public, then set `SITE_URL` in `site-src/build.py` and rebuild so canonical and social-share links use the real domain.
