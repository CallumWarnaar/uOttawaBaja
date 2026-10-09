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
  pages/*.html       index, about, team, tech, competitions, gallery, sponsors, merch, roster (front-matter comment at top)
                     PAGES in build.py = menu pages; EXTRA_PAGES = built + footer only (roster)
  image-tags.json    IMAGE CATALOG (machine-readable): every photo, logo and texture tagged by content (not deployed)
  image-tags.md      same catalog for humans: "find a photo of X" / what to swap in
baja-site/           <- GENERATED HTML + hand-edited assets; this folder is what gets deployed
  assets/css/styles.css  design system, tokens at the top
  assets/js/main.js      all interactions (GSAP, ScrollTrigger, SplitText, Lenis in assets/vendor/)
  assets/js/roster-data.js  PUBLIC ROSTER DATA: first name, roles, rank, program, photo only (anyone can download it). Edit directly, then rebuild (build checks it + updates its ?v= hash)
  assets/js/roster.js    renders roster.html: A–Z, subteam filter, short profile drawer at roster.html#member-id (public fields only)
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
- `SITE_URL` in `build.py` is `https://uottawabaja.ca` (set 2026-09-30). It drives the canonical, `og:url` and `og:image` URLs, and the build writes `baja-site/sitemap.xml` (every page in `PAGES` + `EXTRA_PAGES`) and `robots.txt` from it. Don't hand-edit those two files; a new page added to `PAGES`/`EXTRA_PAGES` lands in the sitemap automatically.
- `baja-site/README.md` documents the effect attributes (`data-reveal`, `data-split`, `worn`, `data-count`, `data-marquee`, `data-countdown`, etc.) and the tech-page hotspot editor (`tech.html?edit`). The README is the human-friendly guide and CLAUDE.md is the agent guide, and **they must stay aligned**. When a change affects workflow, structure, hosting or the placeholder list, update both in the same PR.
- Placeholders needing real content use class `todo` (dashed outline) or `todo-note`, but **none are left on public pages since launch prep** (see `LaunchPrep.md`); don't add new ones to live pages. `todo-note` is also reused as plain small-note styling (e.g. "Drag or scroll →" on the home page), so check context before treating one as unfinished.
- Still placeholder: tech-page car render + hotspot positions, CVT and gearbox specs (TBD rows removed for launch), team-page recruitment dates/sign-up link (note removed for launch), JMTS logo (plain text tile for now), real roster members, merch products (names, prices, photos) and merch-page photos.
- **Competitions "Past seasons" section removed for now** (2026-09-28) so the page focuses on upcoming events; it may come back. It was section 03 (`<section id="results">`, a `todo` grid of 3 placeholder panels: season, event, location/dates, result summary; newest first) between the scoring section and the (then) gallery. Recover the markup with `git show 245e5ea:site-src/pages/competitions.html`.
- `worn` (grunge mask on display type) has a floor, `--worn-floor` in `styles.css` (currently .55), so worn patches stay partly visible for readability. Tune that value rather than removing the effect; Callum wants the grit kept.
- Home-page "Next up" section (`data-next-event` in `pages/index.html`) holds a JSON list of events (`<script type="application/json" data-events>`: start, end, kicker, title, lead, done). `main.js` shows the first event whose `end` hasn't passed, so it flips from OktoBajaFest (Oct 2–4, 2026) to Baja SAE Williamsport (May 20–23, 2027) by itself (Vincent's request, 2026-09-29). Each season, add the next events and update the written-out text (the no-JS fallback) to match the first one. After the last event it shows "Next season's schedule is coming soon".
- Roster layout (modelled on cwrumotorsports.com/team): leads (`rank` 0–1, or `lead: true`) get full-size cards; everyone else is a slim clickable row (headshot, name/title, subteam tags, Major = `program`). Every card and row opens the same profile drawer, which shows only photo, first name, subteam + title, program and a "Contact via baja@uottawa.ca" button. For launch, the only real entries are the six leads; every regular member is one of 40 `placeholder` slots (loop at the bottom of `roster-data.js`) shown as "TBD" with an "Under construction" photo, no subteam, and a short drawer (Callum, 2026-09-29). Callum will send an Excel file (names, position, subteam) to fill them; Callum/Etienne/Joseph's old entries are recoverable (see `LaunchPrep.md`).
- **Roster privacy (2026-10-09, from Callum's portal decision D2):** the public roster holds **only first name, headshot, subteam + title, program** (plus `rank`/`lead`/`placeholder` for layout). Last name, email, phone, year, grad/class, season joined, about, focus, highlights, seeking and any links are login-only and wait for the portal database. Three guards: the `roster-data.js` header says so; `roster.js` keeps only `PUBLIC_KEYS` and ignores anything else; **`build.py` (`check_public_roster`) stops the build** if a private key appears in `roster-data.js`. The Class column and the seniority/class-year sorts were removed for this (A–Z only, captain first among leads); bring them back only inside the portal. Old versions with those fields are in git history (`git show 9ec4f71:baja-site/assets/js/roster-data.js`).
- Roster: sorted A–Z (empty TBD slots last), leads with `rank` 0 first. Headshots go in `baja-site/assets/img/team/<id>.webp` (4:5, ~800×1000; the `team/` folder doesn't exist yet, create it with the first photo). **Never commit a phone/camera original:** `build.py` (`check_image_metadata`) refuses any image under `assets/img/` with EXIF/XMP metadata (GPS location, camera, owner name); convert with `optimize_images.py`, which strips it. Delete the `placeholder: true` entries as real members are added. The roster is also hand-listed on `pages/team.html`; keep names and titles in sync between the two.
- **Asset versioning (Phase 4):** `build.py` stamps every linked CSS/JS/PDF with `?v=<8-hex SHA-256>` (`add_asset_versions`). CSS/JS are hashed with CRLF → LF, so Windows (`core.autocrlf=true`) and Linux/macOS builds give the same hashes (2026-10-09). Don't write `?v=` by hand. After editing any CSS/JS in `baja-site/assets/` (including `roster-data.js`), rebuild and commit the HTML, or returning visitors keep the cached copy. Fonts and images are not stamped (preloaded fonts must match the `url()` in `styles.css`), so a replaced photo, logo or headshot gets a **new file name**, never an overwrite.
- Sponsor logos are white-on-transparent PNGs in `assets/img/sponsors/`. Still missing: JMTS (shown as a plain "JMTS" text tile on the sponsors page).
- Every sponsor logo is a link to the sponsor's site, opening in a new tab (`target="_blank" rel="noopener noreferrer"`), in all three places they appear: home marquee (`index.html`), sponsors logo walls (`sponsors.html`), software partners (`tech.html`). Keep the URLs in sync across the three. URLs were checked 2026-09-29. SolidWorks points to `3ds.com/products/solidworks` because solidworks.com blocks automated checks. JMTS (John McEntyre Team Space) links to its uOttawa facility page, and EEF to the Faculty's student-funding page. `main.js` already skips `_blank` links in the page-transition handler.
- Garnet highlight blocks (`.accent-hl`, and `.accent` inside `.section--charcoal .title`) are `inline-block` + `nowrap` so they never split across lines and overlap the line above. Keep highlighted phrases short (they can't wrap).
- Subteam titles on the team page are sized with container units (`16cqi`) so long names like "Administration" fit the intro column.
- `.frame` keeps its chamfered corner in `--shape`; `data-reveal="clip"` wipes in with `inset()` and then hands `clip-path` back to `var(--shape)` (`.is-revealed`). Keep that pairing if you add another clip-revealed element with its own shape.
- Menu and lightbox make the rest of the page `inert` while open (`inertOthers` in `main.js`, also on `window.RRR`), so Tab can't reach the page behind them. The roster drawer has its own Tab trap in `roster.js`.
- Hero `.line` spans use padding-top/negative margin so glyph tops aren't clipped by the reveal mask; `data-split` masks are reverted after they animate. Keep both if touching headings.

## Launch prep (planned public weekend of 2026-10-03; **behind a password as of 2026-10-09**, see Hosting)

Callum is sending pre-launch change requests in batches. **`LaunchPrep.md` (repo root) is the checklist**: add each new batch there, tick items as they merge, and keep this summary current. Batch 1 (2026-09-29, done): Nora's last name removed, roster members replaced by "TBD / Under construction" slots, tech "What's new this year" filled in (suspension, gearbox, chassis), every dashed `todo` box and "to be added" note removed from public pages, merch crewneck → quarter-zip. Batch 2 (2026-10-01, done): copy trimmed and repetition cut on home, about and sponsors (see "Copy" below and `LaunchPrep.md`). Batch 3 (2026-10-01, done): slimmer pages (less section spacing, shorter heroes/bands, 2-column phone gallery), filler trimmed on every page, sponsors tier cards + "Every event" band removed, sponsors talent section polar → charcoal, competitions "What happens at an event" removed (duplicated About), and the login-portal plan (`MemberPortal.md` + `portal/`). Batch 4 (2026-10-09, after launch, done): "#230" → "RRR" everywhere, horsepower 10 → 9.5, About band removed and skills section polar → charcoal, faculty advisors moved to the bottom of the team page ("Special thank you"), gallery moved to its own page (`gallery.html`), sponsors "Four ways in" tiles all garnet and slimmer with the PDF note under them, talent section halved, more garnet sections and less charcoal site-wide, and filler bands/marquees cut (see "Colour" below). **Final audit (2026-10-09, `LaunchPrep.md` "Final audit"):** no JS errors, failed requests or broken images on any page; every page 0.6–1.4 MB; no image metadata; public roster limited to D2 fields with build guards; open items for Callum (site password, public repo, outdated sponsorship PDF, security headers, heading contrast) are listed there.

## Colour: more red, less grey (Callum, 2026-10-09)

- Callum likes the recruitment red (`section--garnet scratched`) and wants it used more, with less grey. Pages now alternate the page background (`--bg`) with garnet sections; `section--charcoal` is kept only where garnet would hide garnet details (sponsors budget bars, still under review) and for About's "Can't learn this in a lecture" (Callum asked for a grey there). Don't put two garnet sections back to back, and give the following section `torn-top` so the edge reads.
- `styles.css` has a "Garnet sections" block that swaps garnet details for white/charcoal inside `section--garnet` (kicker rule, check-list bullets, timeline dots/line, tags, frame tags, stat superscripts, default buttons → light). A garnet `.panel` (`panel--garnet`) is fine on a dark section; its `.muted` text turns white.
- Sponsors "Four ways in": four slim `panel--garnet` tiles (same colour), the "details are in the sponsorship package" lead **under** the tiles, and the two photos side by side (4:5) on the right. No height-matching stretch.
- Sponsors talent section ("Meet the talent behind the team") is garnet, one row of four short panels (info sessions, workshops, tours & demos, Talent Package). The old three-step Talent Package block was cut (the tier table already lists portfolio and resume booklet). Restore from `git show d0a328e:site-src/pages/sponsors.html`.
- Team page: Leadership (Nora only) is a tight garnet section; the faculty advisors are their own section at the bottom ("Special thank you … to our faculty advisors"), just above Join. The engineering-programs marquee was removed (it repeated the hero line).
- Cut as filler (2026-10-09): the About "One seat. Four hours." band (requested), the home "Built in Ottawa. Raced through the dust." band, the team programs marquee. Recover any of them from `git show d0a328e:site-src/pages/<page>.html`.

## Copy: less repetition, every section unique (Callum, 2026-10-01)

- **Keep pages slim (Callum, batch 3).** Section padding is 6rem desktop / 3.5rem phone (`.section`), heroes 64svh, bands max 500px. Don't add new full-height bands or spacer sections; prefer tightening a sentence to adding one.
- **No light (Polar) sections anywhere** (Callum, 2026-10-09: "no white backgrounds"). The `section--polar` styles were deleted; don't bring them back. White is fine for text and `btn--light` buttons.
- **Competitions has no scoring section** since batch 3 (it duplicated About's "Judged three ways"); the schedule lead links to `about.html#format`. Restore with `git show 63c13b9:site-src/pages/competitions.html`. Since batch 4 it has **no gallery** either; the photos live on `gallery.html` and the schedule lead links there.
- **Each section must tell the reader something new.** Before adding text, check the page (and the sections around it) doesn't already say it. Only a few sections summarize the page (home stats, sponsors tier table). Known overlaps to avoid: the engineering-programs list (About "Who we are" + home join only), the one-year cycle (About "How we work", car page timeline, sponsors budget each phrase it differently), skills lists (About "What members learn" + team-page join only), the build process (car-page timeline only; the About timeline is about why, not what).
- **Sponsors page stays short;** the sponsorship package PDF carries the detail. "Four ways in" is headline-only panels (`.ways`, stretched to the photo column), and the lead links the PDF. Don't add the descriptions back.
- Budget section: ~$40K is the **cash** budget; in-kind sponsorship is separate and on top, with a line saying it makes a massive impact on design and development. Tiers title is "How you can help"; talent title is "Meet the talent behind the team".
- Scrub text (`.scrub-text`, home + sponsors) is all white now. Callum found the red `<em>` highlight hard to read, so don't add `<em>` back.
- Home scrub line is deliberately plain ("Every team runs the same engine under the same rules. The rest of the car is ours to design."); Callum found the old one over the top. Keep the tone understated.
- About "Who we are" uses `.split--media` (wider image column; from 1200px the frame stretches to the text height) + `.frame--tall-wide` (7:5) so the photo isn't shorter than the text. Below 1200px it doesn't stretch, because the extra crop cut people off the group photo.

## Member & sponsor portal (planned, not built)

`MemberPortal.md` (repo root) is the plan to hide the full roster behind a login for sponsors and team members; `portal/` holds the scaffold (Postgres `db/schema.sql` with role-filtered views, `db/seed.sql` fake data, Lambda `api/handler.mjs`). `portal/` is outside `baja-site/`, so it isn't deployed and `build.py` ignores it. Key rule: private profile fields must leave `roster-data.js` (anything in the static site is public), and the API filters by role server-side. Nothing in AWS (Cognito, API Gateway, Lambda, database, S3) gets created without Callum's go-ahead, and he still has to pick the database host and field visibility. **Execution plans (2026-10-09):** `PortalAgentPlan.md` = agent work packages WP1–WP7 (WP1 migrations + PGlite tests and WP2 roster import can start without Callum; ground rules at the top), `PortalCallumPlan.md` = Callum's steps and decisions D1–D6. Real roster data goes only in git-ignored `portal/private/`. **Decisions made 2026-10-09** (table in `MemberPortal.md`): Neon; public = first name, headshot, subteam + title, program, everything else behind login; admins Callum + Nora; all sponsor tiers; same AWS account; privacy notice drafted in `portal/drafts/`, Callum reviews then emails the advisors.

## Pending review (don't change yet)

Vincent flagged these on 2026-09-29 and will review them with Nora. **Leave them as they are until Callum says otherwise** (Callum changed the budget section's wording on 2026-10-01, cash vs in-kind, but didn't close the review):
- Sponsors page, "Travel with us" section: he'd rather not state how many students go to competitions (e.g. say "multiple team members" instead of 10–15).
- Sponsors page, budget section: he isn't a fan of it as is.

The tech page's menu label is **"The Car"** (Vincent, 2026-09-29); the file stays `tech.html` so links keep working.

## Merch page (`pages/merch.html`, menu item 08, added 2026-09-28)

- Sections: hero ("Team gear."), 01 "Where it goes" (how merch helps the team), 02 shop gallery (`#shop`, "The first run"), and a garnet "Stay in the loop" section (Instagram + email).
- **Tone: low-key, "it's here if you want it"** (Vincent, 2026-09-29). No hype, urgency or "buy now" language, and no head counts of members sent to events.
- Photos are stand-ins from `img/photos/` chosen to show team apparel (hero `img_4534` shirt backs, `crew_headset` team tee, `img_4441` sponsor shirts). Callum will supply merch-photoshoot photos to replace them.
- The shop is **placeholder only**: 6 invented products (tee, hoodie, RRR quarter-zip, cap, toque, sticker pack), "Price TBA", a "Coming soon!" box instead of a photo, and disabled "Coming soon" buttons. Each `<article class="product">` has a `data-product` id for the future cart. For a real photo, put an `<img>` inside `.product__img` in place of the `<span>`.
- **TODO, not started: a full shopping cart and secure checkout**, to build once the merch designs are final and the team is ready to ship. Likely **PayPal** (PayPal JS SDK buttons + Orders API v2). Requirements:
  - The site is static (Amplify serves `baja-site/` with no build), so checkout needs a small backend, e.g. Lambda + API Gateway, to **create and capture PayPal orders server-side**. Never trust prices, totals or discounts sent from the browser. Recalculate from a server-side product/price list.
  - PayPal client secret in environment variables or AWS Secrets Manager, **never in the repo**. Use sandbox credentials until launch.
  - Verify PayPal webhook signatures before marking an order paid. Make order handling idempotent.
  - Card data stays with PayPal (hosted buttons/fields), so it never touches our servers (keeps PCI scope minimal). HTTPS only (Amplify default).
  - The cart itself can live client-side (localStorage, wrapped in try/catch like `roster.js`). It needs sizes/variants, quantities, stock limits, shipping vs campus pickup, Ontario HST, an order-confirmation email (e.g. SES) and a refund/returns policy page.
  - Changes to `amplify.yml`, backend or AWS resources need Callum's go-ahead first (see Standing permission).

## Performance plan (`Optimization.md`; Phases 1–2 done 2026-09-29, 3–4 not started)

Callum wants the site to stay snappy as headshots, merch photos and the car render land. **`Optimization.md` (repo root) holds the full plan, baseline numbers and decisions. Read it before adding images or touching loading/caching, and tick its status line as phases merge.** Don't start a phase unless Callum asks. In short:

- Baseline after Phase 1: every page is 0.6–2.1 MB on first load; the gallery pulled ~5 MB when scrolled to (it was on the competitions page then). Phase 2 results are in `Optimization.md`. **To measure, headless Edge needs `--blink-settings=lazyLoadEnabled=true`, or it ignores `loading="lazy"` and overstates page weight** (our first baseline was wrong because of this).
- Phases: **1 (done)** build writes image sizes, `data-lazy` marquees, smaller logo and WebP textures. **2 (done)** `site-src/optimize_images.py` (Pillow, optional tool) makes WebP 640/1280/1920 web copies, and `build.py` (stays stdlib) writes `srcset`/`sizes` automatically. **3** headshots (~200px list + ~800px drawer), merch through the same pipeline, and the car render as WebP with alpha (~1600 + ~3600px). **4 (done)** `build.py` hashes CSS/JS/PDF into `?v=` automatically, `site-src/perf_check.py` checks page weight against a 2 MB budget, and `assets/**` max-age is **30 days** (`2592000`; Callum doesn't want 1 year).
- **Images (since Phase 1):** `build.py` adds the real `width`/`height` to every local `<img>` that lacks a `width` (read from the file header), so don't hand-write them for photos, and don't remove that step: without it the gallery's lazy images are 0px tall and all 50 download at once. For images that `loading="lazy"` can't handle (the scrolling marquees), put `data-lazy` on the container and use `data-src` instead of `src`; `main.js` loads the group a screen early and the build adds a 1×1 placeholder `src`. Texture masks are `.webp` in `img/texture/`.
- **Adding photos (since Phase 2):** put the originals in a scratch folder outside `baja-site/` (the repo's `.gitignore` covers `website pics/`), then from `site-src/` run `python optimize_images.py "<folder>"` (or `<file> --name <web_name>` for camera/phone names you'd rather not keep). It writes `photos/<name>.webp` (1920px, or 1920 tall for portraits), `<name>-640.webp`, `<name>-1280.webp`, and `<name>-og.jpg` for every page `og_image`. In pages write `<img src="assets/img/photos/<name>.webp" alt="..." loading="lazy">`; `build.py` adds width/height, `srcset` and `sizes` (`auto, 100vw` for lazy images, `100vw` otherwise; write your own `sizes` for small fixed slots, like the marquee's `510px`). Gallery lightbox opens `src` (the largest copy). No JPEG photos remain; don't add any.
- **Image catalog (`site-src/image-tags.json` + `site-src/image-tags.md`, added 2026-10-09 by Callum via Gemini; moved out of `baja-site/` the same day so it isn't public). Use it before choosing or swapping a photo** instead of opening images one by one. It covers all 67 photos plus the sponsor logos, textures, car placeholder and branding (88 entries).
  - JSON: `{version, description, summary, images: [...]}`. Each image has `id` (the photo name, e.g. `img_5212`), `filename`, `category` (`car_on_track`, `people`, `paddock`, `logo`, `texture`, `tech_schematic`, `branding`), `action`, `tags`, `substitutable_for` (interchangeable-shot groups, e.g. `wheel_to_wheel_racing`, `crew_portrait`), plus `detailed_action`/`terrain`/`angle` for track shots and `people_count`/`people[]` (role, attire, posture)/`setting` for people shots.
  - MD: §1 quick index of car-on-track shots (action, terrain, angle), §2 person-by-person crew catalog, §3 sponsor logos, §4 textures/schematic/branding.
  - **The descriptions are AI-generated: check the actual image before relying on a detail**, and never identify people in it: Gemini's guessed names for the `img_4971` team photo were replaced with "team member (person N)" (Callum, 2026-10-09). Use roles/attire/posture to find shots, never names.
  - Find with e.g. `python -c "import json;[print(i['id'],i['action']) for i in json.load(open('site-src/image-tags.json',encoding='utf-8'))['images'] if 'dust' in i['tags']]"`.
  - **Keep it current:** when `optimize_images.py` adds a photo, add its entry to both files (same fields) and update `summary`; when a photo is renamed or removed, update or delete its entry. The site and `build.py` don't read these files.
  - They live in `site-src/`, so Amplify never serves them; keep them out of `baja-site/`. Still no names of people (they're in git history and any agent can read them).
- **Photo placement (2026-09-29, Callum: more variety, no repeats):** outside the gallery page (`pages/gallery.html`, menu item 06 since 2026-10-09; its hero is `img_6036`), each photo is used on one page only (menu previews reuse each page's own hero). The gallery holds every other photo, including the competitions hero and schedule photos, except near-duplicates (`dsc_0937`, `dsc_1041`, `img_4973`, `img_5114`, `dsc_0546` stay out). Mix people and car shots. `pics sep29/` (local only) held the Drive originals: 50 already on the site plus 26 new; 17 new were used, 9 skipped as near-repeats or weak.
- **Originals live in Google Drive; the repo holds only web copies** (smaller dimensions). Headshots and merch photos will come from Callum as a folder of full-size files for us to convert. Never commit full-size originals.
- **Car:** no live 3D model (no WebGL/GLB). Plan A (simplest): one background-free, high-res still (≥ ~3600px wide) replaces `car-placeholder.svg` and keeps the existing hotspots and camera zoom. **Plan B (preferred if the renderer can do it, Callum 2026-10-09): a scroll-scrubbed render sequence like cwrumotorsports.com/car.** See "Car render: scroll-scrubbed sequence" below.

### Car render: scroll-scrubbed sequence (plan, not built)

How cwrumotorsports.com/car does it (checked 2026-10-09): no 3D in the browser. They pre-render the car offline and flip through **WebP frames on a `<canvas>`** as you scroll (`renders-sr26/portrait/layers/brake-arc/000-brake-arc-0001…0030.webp`, ~110 KB each, one short camera move per system), on top of a full-car still (`full/0001.webp`), with **one matte image per part** (`mattes/brakes/caliper.webp`, `rotor.webp`…) to highlight parts and anchor the callout lines. Separate `portrait/` renders for phones. Next.js site; the renderer isn't visible (Blender or KeyShot most likely).

**Render side (teammate with the CAD):**
- **Tool:** SolidWorks Visualize (renders camera animations as image sequences) or Blender (import the assembly as glTF/FBX/OBJ exported from SolidWorks; best for masks and tracked hotspot points). Either is fine; Blender makes the matte and hotspot steps easier.
- **Camera path:** one continuous move that starts on the overview (full car, the framing of today's overview panel) and visits the 10 systems in the car page's order (chassis, front suspension, steering, brakes, cockpit, electrical, engine, CVT, gearbox, rear suspension), ~24 frames per leg, holding briefly at each stop. ~240–260 frames total. Same lighting throughout, no camera shake, fixed noise seed / enough samples so frames don't flicker.
- **Background:** transparent film, then composite over **exactly `#2d2d2c`** (the page `--bg`) with a soft floor shadow, sRGB, "Standard" view transform (not Filmic/AgX), so the frame edge is invisible on the page. (Or deliver transparent PNGs and we composite.)
- **Size:** landscape **1920×1080**; optional portrait 1080×1350 set for phones later. Deliver **lossless PNG**, numbered `car-0001.png …`, plus one **≥3600px still at each stop** (for the no-JS / reduced-motion fallback and sharp zoom), in a Drive folder. Never commit the PNGs.
- **Mattes (nice to have):** at each stop, a white-on-black mask per highlighted part, same size as the frame (Blender: Cryptomatte / object index pass; Visualize: render with only that part visible). Named `<system>-<part>.png`.
- **Hotspot tracking (nice to have, Blender):** an empty at each hotspot, and a script exporting its 2D position per frame (`bpy_extras.object_utils.world_to_camera_view`) to `hotspots.json` as `{system: [[x%, y%], …per frame]}`, so dots ride along with the camera.

**Web side (agents):**
- **Files:** `optimize_images.py` gets a `--sequence` mode: PNG frames → `baja-site/assets/img/car/<set>/1920/0001.webp` and `/960/0001.webp` (WebP q≈70, no `-og`, no srcset), stills → `car/<set>/stops/<system>.webp`, mattes → `car/<set>/mattes/`. `<set>` = render name (e.g. `2027a`): images aren't `?v=` stamped and are cached 30 days, so a re-render gets a **new folder**, never overwrites.
- **Player (`main.js`, inside the existing `[data-car]` code):** replace the camera-zoom transform with a `<canvas>` in `.car-canvas`; the existing ScrollTrigger pin/step logic maps scroll progress → frame index. Preload the overview frame + the first leg, then fetch each next leg when its stop becomes active (`createImageBitmap` to decode off the main thread); draw the nearest loaded frame so scrubbing never blanks. Size the canvas to its box × `devicePixelRatio` (max 2). Use the 960 set when the canvas is under ~1000 CSS px wide or `navigator.connection.saveData`.
- **Hotspots/callouts:** keep the current buttons + system panel. Without `hotspots.json`, show dots only at stops (fade during motion) with positions placed via `tech.html?edit` on each stop still; with it, position them per frame. Mattes: on hover/active, draw the part's matte as a garnet glow (CSS `mask-image` over a garnet layer, or canvas `source-in`).
- **Fallbacks:** no JS, reduced motion or tapping a hotspot on a phone → the stop still (current hotspot behaviour), no frame loading. Tapping a hotspot on desktop jumps to that stop's last frame.
- **Page weight (Callum, 2026-10-09: worth it for this page):** `tech.html` may exceed the 2 MB rule. Targets: **first load ≤ 4 MB** (enforced by `PAGE_BUDGETS` in `perf_check.py`), full scroll-through **≤ ~25 MB desktop / ~8 MB phone**. Every other page keeps 2 MB. Measure with `perf_check.py tech` and by scrolling in headless Edge.

## Hosting

- AWS Amplify Hosting, connected to GitHub `CallumWarnaar/uOttawaBaja`, branch `main`. Every push to `main` redeploys automatically. (An `origin/staging` branch also exists, currently identical to `main`; it isn't referenced anywhere in the repo.)
- **Domain `https://uottawabaja.ca`** (registered 2026-09-30). **As of 2026-10-09 every URL (bare, `www`, and the Amplify default) answers `401` with a Basic-auth password prompt: Amplify access control is on**, so the public can't see the site and agents can't check it live (audit the local build instead: `python -m http.server --directory baja-site`). Turning it off is Callum's call (Amplify → Hosting → Access control); never try to sign in. The Amplify default URL `https://main.duwhaiwnzv75w.amplifyapp.com/` still exists.
- `www.uottawabaja.ca` serves the site too (no redirect to the bare domain as of 2026-09-30), and Amplify serves `/about` as well as `/about.html`. The canonical tags point Google at the bare-domain `.html` URLs, so this is safe; a www → bare-domain redirect in Amplify → Domain management would be tidier (Callum's call, it's domain config).
- **Google Search Console:** sitemap is `https://uottawabaja.ca/sitemap.xml`. Callum submits it in Search Console (Sitemaps) after verifying the domain.
- `amplify.yml` sets `Cache-Control: max-age=2592000` (30 days) on `assets/**`. CSS/JS versions are automatic; just rebuild after editing them.

## Design

- Official uOttawa palette (Callum, 2026-09-28): Garnet/red `#8f001a`, Primary Charcoal `#2d2d2c` (`--charcoal-deep`, the page background `--bg`), Secondary Charcoal `#3a3a37` (`--charcoal`, raised sections/footer/cards), Polar Grey `#f2f2f2`. **No pure-black surfaces** (Callum found them lifeless): `--black` is only for text on garnet and for shadows/photo overlays. `--garnet-2`, `--charcoal-2`, `--grey`, `--grey-2` are tints mixed from the palette; don't add other hues (the old warm greys and `#9c1c30` were removed).
- Fonts (self-hosted, OFL): Big Shoulders Display/Stencil, Barlow, Barlow Condensed.
- `.frame` images are sized by `aspect-ratio` on the frame, with the image overscanned (`top:-9%; height:118%`) so the ±7% parallax never shows the background. Keep that if touching frames.
- Canadian spelling in copy (manoeuvring, centre, organization is fine).

## Facts (confirmed by Callum, 2026-27 season)

- **No car number on the site** (Callum, 2026-10-09). The number changes most seasons (2026-27 was #230), so the site says **"RRR"** instead: hero numbers, "RRR · 2026–27", "The crew behind RRR", "RRR Quarter-Zip", and alt text says "the RRR car". Don't add the number back; photos may still show it on the car.

- **Engine:** Kohler CH440, 14 hp stock, restricted by the rules. Same engine for every team. The site shows **9.5 hp** everywhere (the team's dyno figure; Callum, 2026-10-09, replacing the 10 hp rules spec).
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

- Leadership: Nora Jordan (Team Captain), shown as **"Nora" only** on the team page and roster so she matches everyone else (the sponsors-page sign-off still has her full name). No technical director or business lead currently.
- Faculty advisors: Jason, Alex (first names only; their own "Special thank you" section at the bottom of `team.html`, above Join; not on the roster).
- 01 Chassis: Megan, Kira (co-leads)
- 02 Suspension: Matthew (lead), Callum (Director of Front Suspension, 2026-09-29)
- 03 Drivetrain: Vincent (lead)
- 04 Electrical: Fahad (lead)
- 05 Administration: Etienne, Callum, Joseph
