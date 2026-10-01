# Launch prep

The site goes public the weekend of **2026-10-03**. This file tracks the changes Callum asked for before launch, in batches as they come in. Tick items as they merge. CLAUDE.md and the README hold a short summary; this is the full list.

The domain `uottawabaja.ca` is live and public (2026-09-30); see "Search / Google" below and the README's "Hosting" section.

## Batch 1 (requested 2026-09-29)

- [x] **Nora's last name removed** on the team page (name and initials now "Nora" / "N") and on the roster (`id: 'nora'`, so her profile link is `roster.html#nora`). She was the only person shown with a last name. Her full name still appears once, as the sign-off on the sponsors page ("Team captain · Nora Jordan"), since that wasn't part of the request.
- [x] **Roster members hidden until the full roster is ready.** On `roster.html` the six leads stay as they are. Every regular member slot (40 of them) now shows **"TBD"**, an **"Under construction"** photo, no subteam, class or major, and a drawer that just says the profile is under construction. The dashed outline around each person is gone.
  - Callum, Etienne and Joseph's roster entries were removed for launch (they're still listed on `team.html` under their subteams). To bring them back, copy their three entries from `git show 9ec4f71:baja-site/assets/js/roster-data.js`.
  - The slots are one loop at the bottom of `roster-data.js` (`placeholder: true`, `roles: []`). When the real roster arrives, add people above it and lower the count or delete the loop.
  - Filter chips only count real people, so Administration has no chip until someone is added to it.
- [x] **Tech page, "What's new this year"** filled in:
  - Suspension, "Redesigned front and rear": completely redesigned front and rear suspension for bigger jumps and tougher obstacles, designed and simulated in 3D kinematics software, built in house.
  - Drivetrain, "Custom gearbox": fully custom gearbox designed by the team, more power to the wheels for the toughest challenges.
  - Chassis, "Lighter, nimbler chassis": lighter, more manoeuvrable, quick, safe and reliable through the field.
- [x] **All dashed placeholder boxes and "to be added" notes removed** from public pages:
  - Tech page: the CVT spec list (all TBD) removed; the gearbox list now reads "Design: Custom, designed in house" + "Design tool: KISSsoft" (the TBD rows are gone). The highlights grid lost its dashed outline.
  - Team page: "Recruitment dates and sign-up link to be added" removed (the email and Instagram buttons stay).
  - Sponsors page: JMTS shows as a plain "JMTS" text tile (no dashed box or "Logo to add"). Swap in the logo when it arrives.
  - Home page: "Logo still needed: JMTS" removed.
  - Merch page: "Placeholder products: names, prices and photos will follow…" removed.
  - Roster: dashed outline on member slots removed (above).
  - Not changed: the merch "Coming soon!" boxes (diagonal-striped product images) and "Price TBA", which read as intentional pre-launch copy, and the small notes "Drag or scroll →" (home) and "★ Exclusive to the Platinum sponsor" (sponsors), which share the `todo-note` style but aren't placeholders.
- [x] **Merch:** the "Car #230 Crewneck" is now the **"Car #230 Quarter-Zip"** (`data-product="car-230-quarter-zip"`).

## Search / Google (2026-09-30)

- [x] `SITE_URL = "https://uottawabaja.ca"` in `build.py`: every page now has a canonical tag, `og:url`, and an absolute `og:image` (so link previews work on social media).
- [x] `build.py` writes `baja-site/sitemap.xml` (all 8 pages, incl. merch and roster) and `robots.txt` (allow all + sitemap link).
- [ ] **Callum:** in Google Search Console, verify the domain (DNS TXT record in Route 53 for a Domain property), then Sitemaps → submit `sitemap.xml`, and URL Inspection → Request indexing on the home page.
- [ ] Optional (domain config, Callum's call): redirect `www.uottawabaja.ca` → `uottawabaja.ca` in Amplify → Domain management. Canonical tags already cover it.

## Batch 2: trimming the copy and cutting repetition (requested 2026-10-01)

Goal: every section tells the reader something new. Only a few sections summarize the page (home stats, sponsors tier table), and the sponsorship PDF carries the detail so the sponsors page doesn't have to.

- [x] **Sponsors, "Four ways in":** the four items are headlines only now (Brand exposure, Talent & recruitment, Technical partnership, Community & education), with no descriptions. The section lead points to the sponsorship package PDF for details. The panels stretch to the height of the two photos beside them.
- [x] **Sponsors, scrub text** now reads "Your brand reaches uOttawa engineering students and faculty all year round. Your brand is visible at competitions to other teams, judges, and industry reps." All white, no red highlight. (The home-page scrub line lost its red highlight too, for the same readability reason.)
- [x] **Sponsors, budget:** the ~$40K is labelled the **cash** budget ("Typical annual cash budget"), and a new line explains that in-kind sponsorship (machining, materials, components, software) comes on top of it, isn't counted in it, and makes a massive impact on how we design and develop the car.
- [x] **Sponsors, tiers title:** "Pick your line" → **"How you can help"**.
- [x] **Sponsors, talent title:** "Meet them before they graduate" → **"Meet the talent behind the team"**.
- [x] **About, "What is Baja SAE?":** the two paragraphs on the shared engine and judging cut to one sentence (~45% of the old length). The judging detail already lives in the "Judged three ways" section right below.
- [x] **About, "Who we are":** the team photo is bigger on laptops (wider column, 7:5 frame, and from 1200px wide the frame stretches to the text height), so the bullets no longer hang below it. The bullet "Give students practical experience in design, fabrication, testing and project management" was cut because "What members learn" right below says the same thing.
- [x] **About, "How we work":** the subteam paragraph was removed (the home and team pages cover the subteams), and the four timeline steps were rewritten so they no longer repeat the "What members learn" panels or the car page's build timeline.
- [x] **Home, scrub line:** "Every team runs the same engine, restricted to 10 hp. Same rules… What separates the field is…" → "Every team runs the same engine under the same rules. The rest of the car is ours to design." (The 10 hp figure stays in the stat right below it.)
- [x] **Home, "Want to build a race car?":** photo changed to `img_3612` (team members working on car #230 under the paddock tent). `img_3854` is now only in the competitions gallery.
- [x] **Home, small repetition fixes:** the intro no longer lists the engineering programs (the join section does) and the join section no longer repeats the hero's "design, machine, weld, wire".

## Batch 3: slimmer pages, less filler (requested 2026-10-01)

Goal: shorter pages with less empty space between sections, fewer filler words, and less redundancy on the sponsors page. Plus a darker sponsors talent section and a plan for a login-gated roster.

- [x] **Less space everywhere** (`styles.css`, applies to every page):
  - Section padding 10rem → **6rem** top and bottom on desktop, 7rem → **3.5rem** on phones; "tight" sections 7rem → 4rem (2.5rem on phones).
  - Gap under section headings 4rem → 2.5rem (1.5rem on phones); `mt-4`/`mt-5` spacers 2.5/4rem → 1.5/2.5rem; timeline steps, team subteam blocks, roster blocks and the footer all tightened to match.
  - Page heroes 78% → **64%** of the screen height (roster hero 64% → 52%), with less padding under the hero text.
  - Full-width photo bands (e.g. "Built in Ottawa", "One seat. Four hours.") 70vh (max 760px) → **45vh (max 500px)**.
  - The big outlined section numbers (01, 02…) are smaller (max 12rem → 8.5rem) so they don't sit on top of the tighter headings.
  - Competitions gallery shows **2 columns on phones** instead of 1 (it was ~24,000px tall on a phone).
- [x] **Sponsors page: redundancy removed**
  - The four tier cards (Bronze $500+ … Platinum $5,000+) are gone: the benefits table's header already shows every tier and its range. The "Minimum sponsorship is $500" sentence folded into the tiers lead.
  - The "Every event. Every lap." photo band is gone: it repeated the "your brand travels with us" point already made by the scrub text and the "Ride along" contact step. (Restore from `git show 63c13b9:site-src/pages/sponsors.html`, photo `dsc_0546`.)
  - Talent section: shorter panel text, Talent Package paragraph cut to one line (the employer-industry list is gone), shorter Profile/Portfolio/Delivery steps.
  - Shorter hero lead, in-kind note, partners lead, contact lead and contact steps.
  - **Not touched (still pending Vincent/Nora's review):** the budget section and the "10–15 members" figures.
- [x] **Sponsors "Meet the talent behind the team" section: light → grey.** It was the only Polar Grey (near-white) section on the page and flashed bright when scrolling. Now Secondary Charcoal (`section--charcoal`), with slightly lighter panels (`.section--charcoal .panel` uses `--charcoal-2`) so the cards still stand out. The About page's "Can't learn this in a lecture" section is still light; say the word if it should go grey too.
- [x] **Competitions: "What happens at an event" section removed.** Its three panels were word-for-word the same as About's "Judged three ways". The schedule lead now links to `about.html#format` ("How events are judged"), and the sponsor-branding sentence (covered by "Travel with us") was cut. (Restore from `git show 63c13b9:site-src/pages/competitions.html`, `<!-- SCORING -->`.)
- [x] **Filler trimmed on every page** (same facts, fewer words):
  - Home: hero lead, intro (two paragraphs → one), subteams intro, car teaser, OktoBajaFest/Williamsport text (both in the no-JS text and the `data-events` JSON), partners lead ("The car doesn't happen without them."), join lead.
  - About: "What is Baja SAE?" lead and engine sentence, format lead, "Who we are" bullets, skills lead.
  - Team: subteams lead and the five subteam descriptions ("Responsible for…" / "Designs the…" openers dropped).
  - The Car: overview line, steering, brakes, cockpit, engine (no longer repeats the spec list right below it) and rear-suspension blurbs, subsystem-sponsor lead; "By the numbers" lost its filler lead.
  - Competitions: schedule lead and both event descriptions.
  - Merch: "Where it goes" lead + bullets shortened, and the 4th "Build" step (repeated section 01) removed.
  - Roster: hero lead.
- [x] **Result** (page height in px, measured in headless Chromium):

  | Page | Desktop 1440px | Phone 390px |
  |---|---|---|
  | Home | 9,538 → 8,257 (−13%) | 10,306 → 8,775 (−15%) |
  | About | 7,500 → 6,323 (−16%) | 9,927 → 8,585 (−14%) |
  | Team | 7,838 → 6,852 (−13%) | 10,326 → 9,200 (−11%) |
  | The Car | 6,601 → 5,721 (−13%) | 9,510 → 8,429 (−11%) |
  | Competitions | 12,079 → 10,552 (−13%) | 23,835 → 8,746 (−63%) |
  | Sponsors | 11,082 → 8,878 (−20%) | 14,530 → 11,658 (−20%) |
  | Merch | 5,752 → 5,011 (−13%) | 6,421 → 5,575 (−13%) |
  | Roster | 7,224 → 6,855 (−5%) | 7,793 → 7,348 (−6%) |

- [x] **Sponsor & member login: plan + scaffold only, nothing deployed.** `MemberPortal.md` (repo root) is the plan: Cognito login with sponsor / member / admin groups, API Gateway + Lambda, PostgreSQL, private S3 for resumes, opt-in consent for sharing with sponsors. `portal/` holds the starting code (SQL schema with role-filtered views, sample data, Lambda handler stub). Needs Callum's decisions (database host, which fields each role sees, admins) before any AWS work.
