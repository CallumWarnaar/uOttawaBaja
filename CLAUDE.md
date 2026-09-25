# Rough Rider Racing website

Website for Rough Rider Racing (RRR), the University of Ottawa Baja SAE team. Maintained by Callum (team admin + front suspension). Static HTML/CSS/JS, no framework, no npm.

## Standing permission: auto-merge

Callum has authorized Claude to **merge requested changes into `main` without asking**. For every change request:

1. Start the working branch from the latest `main` (a merged PR's branch is finished; restart it from `origin/main`, don't stack on old history).
2. Edit `site-src/` (and `baja-site/assets/` for CSS/JS/images), then run `python build.py` from `site-src/`.
3. For visual changes, check the result in headless Chromium (Playwright is installed globally for node; serve `baja-site/` with `python3 -m http.server`).
4. Commit, push, open a PR into `main`, merge it, and give Callum a short summary plus the PR link.

Still ask first when a request is ambiguous or the change is hard to undo: deleting pages, photos or sections, changing hosting/deploy config (`amplify.yml`), or anything touching access control or the domain.

## Layout and build

```
site-src/            <- EDIT HERE
  build.py           python build.py  (Python 3, stdlib only) -> writes ../baja-site/*.html
  partials/layout.html   shared <head>, splash, header, menu, footer
  pages/*.html       index, about, team, tech, competitions, sponsors, roster (front-matter comment at top)
                     PAGES in build.py = menu pages; EXTRA_PAGES = built + footer only (roster)
baja-site/           <- GENERATED HTML + hand-edited assets; this folder is what gets deployed
  assets/css/styles.css  design system, tokens at the top
  assets/js/main.js      all interactions (GSAP, ScrollTrigger, SplitText, Lenis in assets/vendor/)
  assets/js/roster-data.js  FULL ROSTER DATA: one object per member (roles, joined, about, focus, links...). Edit directly, no build needed
  assets/js/roster.js    renders roster.html: A–Z / seniority sort, subteam filter, profile drawer at roster.html#member-id
  assets/img/photos/     1920px web-sized team photos
  assets/img/sponsors/   white-on-transparent logos
  assets/docs/           sponsorship package PDF
amplify.yml          Amplify serves baja-site/ as-is, no build step
```

- **Never hand-edit `baja-site/*.html`**; the next build overwrites it. CSS, JS and images in `baja-site/assets/` are edited directly.
- **Always run `build.py` and commit `baja-site/`** along with `site-src/`. Amplify does not run the build, so an unbuilt change deploys as nothing.
- `SITE_URL` in `build.py` is empty until the custom domain is live; set it then (canonical + og:image URLs).
- `baja-site/README.md` documents the effect attributes (`data-reveal`, `data-split`, `worn`, `data-count`, `data-marquee`, `data-countdown`, etc.) and the tech-page hotspot editor (`tech.html?edit`).
- Placeholders needing real content use class `todo` (dashed outline) or `todo-note`.
- Roster: seniority = earliest `joined` season, then `rank` (0 captain, 1 lead, 2 member), then name. Headshots go in `baja-site/assets/img/team/<id>.jpg` (4:5, ~800×1000). Delete the `placeholder: true` entries as real members are added.
- Sponsor logos are white-on-transparent PNGs in `assets/img/sponsors/`. Still missing: JMTS.
- Hero `.line` spans use padding-top/negative margin so glyph tops aren't clipped by the reveal mask; `data-split` masks are reverted after they animate. Keep both if touching headings.

## Hosting

- AWS Amplify Hosting, connected to GitHub `CallumWarnaar/uOttawaBaja`, branch `main`. Every push to `main` redeploys automatically.
- Current URL: `https://main.duwhaiwnzv75w.amplifyapp.com/`, **password-protected** (Amplify Access control) while the site is unfinished. Deploys don't change that setting.
- No custom domain yet; plan is to register one (likely via Route 53) at launch, then switch Access control to public and set `SITE_URL`.
- `amplify.yml` sets `Cache-Control: max-age=604800` (7 days) on `assets/**`. **Whenever `styles.css` or `main.js` changes, bump the `?v=N` on their links in `site-src/partials/layout.html`** (and on any page-specific script) so returning visitors get the new file.

## Design

- Official uOttawa palette: Garnet `#8f001a`, Secondary Garnet `#9c1c30`, Charcoal `#2d2d2c`, Polar Grey `#f2f2f2`; page background black.
- Fonts (self-hosted, OFL): Big Shoulders Display/Stencil, Barlow, Barlow Condensed.
- `.frame` images are sized by `aspect-ratio` on the frame, with the image overscanned (`top:-9%; height:118%`) so the ±7% parallax never shows the background. Keep that if touching frames.
- Canadian spelling in copy (manoeuvring, centre, organization is fine).

## Facts (confirmed by Callum, 2026-27 season, car #230)

- **Engine:** Kohler CH440, 14 hp stock, restricted to **10 hp** by the rules. Same engine for every team.
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

## Team (first names only unless given)

- Leadership: Nora Jordan (Team Captain). No technical director or business lead currently.
- 01 Chassis: Megan, Kira (co-leads)
- 02 Suspension: Matthew (lead), Callum (front suspension engineer)
- 03 Drivetrain: Vincent (lead)
- 04 Electrical: Fahad (lead)
- 05 Administration: Etienne, Callum, Joseph
