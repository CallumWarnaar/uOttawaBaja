/* =========================================================================
   ROUGH RIDER RACING — PUBLIC ROSTER DATA
   EVERYTHING IN THIS FILE IS PUBLIC: anyone can download it from the website.
   Edit it to add people, then run python build.py from site-src/ (it checks this
   file and updates its ?v= fingerprint so visitors get the new version).

   Public fields only (Callum's portal decision D2, 2026-10-09):
   id          url-safe, unique, first name based: "nora", "megan-2". Profile link = roster.html#id
   name        FIRST NAME only
   sortName    optional: what A–Z sorting uses
   roles       one entry per subteam: { team, title }. The first role is shown on the card.
               team must be one of TEAMS below.
   rank        0 = captain, 1 = lead, 2 = member. Ranks 0–1 get a full-size card in the
               "Leads" block; rank 2 goes in the slim "Members" list.
   lead        optional: true puts a rank-2 person in the Leads block anyway
   program     e.g. "Mechanical Engineering" (shown as "Major")
   photo       headshot path, e.g. "assets/img/team/nora.webp" (portrait 4:5). Leave "" for
               initials. Convert it first: build.py refuses images with camera/GPS metadata.
   placeholder true for empty member slots ("TBD" + "Under construction")

   NOT here, ever: last name, email, phone, year, graduation/class, season joined, about,
   focus areas, highlights, what they're seeking, LinkedIn, résumé or portfolio links.
   Those are login-only and will live in the portal database (MemberPortal.md).
   build.py stops with an error if any of those keys appear in this file, and roster.js
   ignores anything not listed above.
   ========================================================================= */

window.RRR_TEAMS = ['Leadership', 'Chassis', 'Suspension', 'Drivetrain', 'Electrical', 'Administration'];

window.RRR_ROSTER = [
  {
    id: 'nora', name: 'Nora', rank: 0,
    roles: [{ team: 'Leadership', title: 'Team Captain' }],
    program: '', photo: '',
  },
  {
    id: 'megan', name: 'Megan', rank: 1,
    roles: [{ team: 'Chassis', title: 'Chassis Co-Lead' }],
    program: '', photo: '',
  },
  {
    id: 'kira', name: 'Kira', rank: 1,
    roles: [{ team: 'Chassis', title: 'Chassis Co-Lead' }],
    program: '', photo: '',
  },
  {
    id: 'matthew', name: 'Matthew', rank: 1,
    roles: [{ team: 'Suspension', title: 'Suspension Lead' }],
    program: '', photo: '',
  },
  {
    id: 'vincent', name: 'Vincent', rank: 1,
    roles: [{ team: 'Drivetrain', title: 'Drivetrain Lead' }],
    program: '', photo: '',
  },
  {
    id: 'fahad', name: 'Fahad', rank: 1,
    roles: [{ team: 'Electrical', title: 'Electrical Lead' }],
    program: '', photo: '',
  },

];

/* ---- Member slots (launch, 2026-10): every regular member shows as "TBD" until the full
   roster goes in. Add real members above (rank 2), then lower this count or delete the block.
   Callum, Etienne and Joseph's entries were removed for launch; see LaunchPrep.md to restore. ---- */
for (let i = 1; i <= 40; i++) {
  window.RRR_ROSTER.push({ id: `member-${i}`, name: 'TBD', rank: 2, placeholder: true, roles: [] });
}
