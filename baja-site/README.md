# Rough Rider Racing website

The website for Rough Rider Racing, the University of Ottawa Baja SAE team. It's a plain static site (HTML, CSS and JavaScript, no framework), hosted on AWS Amplify.

## How the repo is organized

```
uOttawaBaja/
├── site-src/            ← EDIT PAGES HERE
│   ├── build.py         run:  python build.py   (Python 3, no packages needed)
│   ├── perf_check.py    run:  python perf_check.py   (page weight per page, needs Edge)
│   ├── partials/layout.html   shared <head>, splash, header, menu, footer
│   └── pages/*.html     one file per page (index, about, team, tech, competitions, sponsors, merch, roster)
├── baja-site/           ← WHAT GETS PUBLISHED (HTML is generated, assets are edited by hand)
│   ├── *.html           built by build.py, don't edit these directly
│   └── assets/
│       ├── css/styles.css     design system (colours, fonts and spacing at the top)
│       ├── js/main.js         all animations and interactions
│       ├── js/roster-data.js  the full team roster, one entry per person
│       ├── js/roster.js       draws the roster page (sorting, filters, profiles)
│       ├── vendor/            GSAP + ScrollTrigger + SplitText, Lenis (self-hosted)
│       ├── fonts/             Big Shoulders Display/Stencil, Barlow, Barlow Condensed (self-hosted, OFL)
│       ├── img/photos/        team photos as WebP web copies (made by site-src/optimize_images.py)
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

The build also adds each photo's real `width` and `height` to its `<img>` tag automatically, so the browser can reserve space and lazy-load properly. You don't need to type them.

Amplify doesn't run the build itself. It publishes `baja-site/` exactly as committed, so if you skip step 2 your change won't appear on the site.

CSS, JavaScript and images in `baja-site/assets/` are edited directly. Browsers cache files in `assets/` (see `amplify.yml`), so **run `python build.py` after changing any CSS or JS file** (including `roster-data.js`), then commit. The build stamps every linked CSS, JS and PDF file with a fingerprint of its contents (`styles.css?v=0f77cdc1`), so a changed file gets a new URL and returning visitors fetch it. There are no version numbers to bump by hand.

Images and fonts aren't fingerprinted. When you replace a photo, sponsor logo or headshot, **give the new file a new name** instead of overwriting the old one, or returning visitors may keep seeing the old image.

## Checking page weight
From `site-src/`, run `python perf_check.py` (Windows with Edge; run it from PowerShell or a normal terminal). It loads every page in headless Edge with an empty cache and prints requests and KB per page, split into photos and everything else. Any page over 2 MB is flagged and the script exits with an error. `--width 500` checks a narrow window, `-v` lists every file, and `python perf_check.py index team` checks only those pages. Run it before merging changes that add images.

## Adding photos
Full-size originals stay in Google Drive; the site only gets small web copies.
1. Download the originals into a folder **outside** `baja-site/` (e.g. `website pics/`, which git ignores).
2. From `site-src/`, run `python optimize_images.py "path/to/folder"` (needs Pillow: `pip install pillow`). Each photo becomes `assets/img/photos/<name>.webp` plus smaller `-640` and `-1280` copies. The name comes from the file name, e.g. `IMG_5212.JPG` → `img_5212`; use `python optimize_images.py photo.jpg --name good_name` to choose one.
3. Use it in a page as `<img src="assets/img/photos/img_5212.webp" alt="What's in the photo" loading="lazy">`, then run `python build.py`. The build adds the sizes so phones download the small copy.
4. Try not to reuse a photo already shown on another page; the competitions gallery is the one place that collects them all.

## Updating the team

- **Full roster:** edit `baja-site/assets/js/roster-data.js`, then run `python build.py` so the new version reaches returning visitors. Instructions for each field are at the top of the file. Leads (`rank` 0 or 1) show as full-size cards; everyone else shows in the slim members list with headshot, subteam tags, class (the year from `grad`) and major (`program`). Every entry opens the same profile. Until the full roster is ready, every regular member is one of 40 "TBD" slots (an "Under construction" photo and no subteam), made by the loop at the bottom of the file; add real people above it and lower the count or delete the loop.
- **Team page:** the subteam lists on `site-src/pages/team.html` are written out by hand. Keep them in step with the roster.
- **Headshots:** put them in `baja-site/assets/img/team/<id>.jpg` (portrait 4:5, about 800×1000). Create the `team/` folder when you add the first one.

## Colours (official uOttawa palette)
Official colours only: Garnet (red) `#8f001a` · Primary Charcoal `#2d2d2c` · Secondary Charcoal `#3a3a37` · Polar Grey `#f2f2f2`, plus white. The page background (`--bg`) is Primary Charcoal and raised sections/footer/cards use Secondary Charcoal; there are no pure-black surfaces (black is only used for text on light/garnet backgrounds and for shadows over photos). The other tokens (`--garnet-2`, `--charcoal-2`, `--grey`, `--grey-2`) are tints mixed from these colours, not extra hues.

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
| Load a group of images just before it's reached (for marquees, where normal lazy loading can't tell) | `data-lazy` on the container, and `data-src="..."` instead of `src` on its images |
| Pinned horizontal scroll | `data-htrack` on a section with `.htrack__inner` |
| Parallax | `data-parallax="0.2"`; `.frame` and `.band` images parallax automatically |
| Torn paper edge | class `torn-top` on a section |
| Countdown | The home page's "Next up" section lists events in a small JSON block (`data-events`); it counts down to the first event that hasn't ended and switches to the next one on its own. Add next season's events there. |

All motion switches off for visitors with "reduce motion" enabled, and content still shows if JavaScript fails.

## Tech page: swapping in the render
1. Save the render as `baja-site/assets/img/tech/car-render.png` (transparent background, side or 3/4 view, ~2400px wide).
2. In `site-src/pages/tech.html`, change the `<img>` src in `.car-canvas` and remove the `is-placeholder` class.
3. Open `tech.html?edit` in a browser. Drag each numbered dot onto its part; the HUD prints `style="--x:..%; --y:..%"`. Paste that onto the matching hotspot.
4. `python build.py`.

## Each new season
- **Car number:** #230 is this season's number and it usually changes at the end of each calendar year. Update it everywhere it appears (search the site for `230`).
- **Events:** add the season's competitions to the home page's `data-events` list and the competitions page schedule.

## Launch prep
The site goes public the weekend of October 3, 2026. `LaunchPrep.md` in the repo root lists every pre-launch change Callum asked for. The first batch (done) removed Nora's last name, replaced the roster's members with "TBD / Under construction" slots until the full roster is ready, filled in the tech page's "What's new this year" cards, removed every dashed placeholder box and "to be added" note, and renamed the merch crewneck to a quarter-zip.

## Still to fill in
Placeholder notes and dashed boxes were taken off the public pages for launch, so these gaps are now simply left out rather than marked:
- the tech-page car render and hotspot positions
- CVT and gearbox specs
- recruitment dates and the sign-up link (team page)
- the JMTS sponsor logo (a plain text tile for now)
- real roster entries and headshots
- merch: product names, prices and photos (the shop shows "Coming soon!" placeholders), and merch-photoshoot photos for the rest of the page

## Parked for later
- **Speed optimization:** see `Optimization.md` in the repo root for the phased plan (Phases 1, 2 and 4 are done: lazy-loading fixes, smaller WebP web copies of every photo, automatic cache versioning and `perf_check.py`. Still to come: Phase 3, headshot/merch/car-render sizes). Full-size originals stay in Google Drive; only web-sized copies go in the repo.
- **Merch cart and checkout:** the merch page is a preview only, with nothing for sale. Once the designs are final, it needs a proper cart and secure checkout, likely PayPal. Payments must be created and confirmed on a small server (not in the browser) and PayPal keys must never go in the repo. CLAUDE.md has the full checklist.
- **Past seasons (competitions page)** was taken out in Sept 2026 so the page focuses on upcoming events. To bring it back, copy the `<!-- RESULTS -->` section from `git show 245e5ea:site-src/pages/competitions.html` and fill in real results.

## Hosting
- **AWS Amplify Hosting**, connected to this GitHub repo. Every push to `main` redeploys the site automatically, usually within a minute or two.
- `amplify.yml` tells Amplify to serve `baja-site/` as-is (no build step) and sets a 30-day browser cache on `assets/` (changed CSS/JS still update right away because the build fingerprints their links).
- While the site is unfinished it's **password-protected** (Amplify → Access control). Deploys don't change that.
- **Launch plan:** register a custom domain (likely through Route 53) and connect it in Amplify, switch Access control to public, then set `SITE_URL` in `site-src/build.py` and rebuild so canonical and social-share links use the real domain.
