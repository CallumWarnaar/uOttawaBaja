# Launch prep

The site goes public the weekend of **2026-10-03**. This file tracks the changes Callum asked for before launch, in batches as they come in. Tick items as they merge. CLAUDE.md and the README hold a short summary; this is the full list.

Launch itself (domain, Access control → public, `SITE_URL`) is in the README's "Hosting" section and still needs Callum's go-ahead.

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

## Batch 2

_Waiting on Callum._
