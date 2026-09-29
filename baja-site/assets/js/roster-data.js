/* =========================================================================
   ROUGH RIDER RACING — FULL ROSTER DATA
   Edit this file to add people or fill in profiles, then run python build.py from
   site-src/ (it updates this file's ?v= fingerprint so visitors get the new version).

   One object per person. Only `id`, `name` and `roles` are required.

   id          url-safe, unique: "firstname-lastname". Profile link = roster.html#id
   name        display name
   sortName    optional: what A–Z sorting uses (e.g. "Smith Alex" to sort by last name)
   roles       one entry per subteam: { team, title }. The first role is shown on the card.
               team must be one of TEAMS below.
   rank        0 = captain, 1 = lead, 2 = member. Ranks 0–1 get a full-size card in the
               "Leads" block; rank 2 goes in the slim "Members" list. Also the seniority tie-breaker.
   lead        optional: true puts a rank-2 person in the Leads block anyway
   joined      first season on the team, as the starting year (2024 = 2024–25). Earlier = more senior.
   program     e.g. "Mechanical Engineering" (shown as "Major" in the members list)
   year        year of study, e.g. "3rd year"
   grad        expected graduation, e.g. "April 2028". Its 4-digit year is shown as "Class"
   photo       headshot path, e.g. "assets/img/team/nora.jpg"
               (portrait 4:5 crop, ~800×1000 JPG, used for both cards and list rows).
               Leave "" to show initials.
   about       "About me" paragraph(s). Separate paragraphs with a blank line (\n\n).
   focus       short list of skills / areas, shown as tags
   highlights  what they designed, built or led on the car (list of sentences)
   seeking     optional: what they're looking for, e.g. "Summer 2027 co-op in automotive or aerospace"
   links       optional: { linkedin, email, resume, portfolio } full URLs / address
   placeholder true for empty member slots: shown as "TBD" with an "Under construction"
               photo, no subteam, and a short "profile under construction" drawer

   Seniority sort = earliest `joined` first, then `rank`, then name.
   People without a `joined` year sort after everyone who has one.
   ========================================================================= */

window.RRR_TEAMS = ['Leadership', 'Chassis', 'Suspension', 'Drivetrain', 'Electrical', 'Administration'];

window.RRR_ROSTER = [
  {
    id: 'nora', name: 'Nora', rank: 0,
    roles: [{ team: 'Leadership', title: 'Team Captain' }],
    joined: null, program: '', year: '', grad: '', photo: '',
    about: '', focus: [], highlights: [], seeking: '', links: {},
  },
  {
    id: 'megan', name: 'Megan', rank: 1,
    roles: [{ team: 'Chassis', title: 'Chassis Co-Lead' }],
    joined: null, program: '', year: '', grad: '', photo: '',
    about: '', focus: [], highlights: [], seeking: '', links: {},
  },
  {
    id: 'kira', name: 'Kira', rank: 1,
    roles: [{ team: 'Chassis', title: 'Chassis Co-Lead' }],
    joined: null, program: '', year: '', grad: '', photo: '',
    about: '', focus: [], highlights: [], seeking: '', links: {},
  },
  {
    id: 'matthew', name: 'Matthew', rank: 1,
    roles: [{ team: 'Suspension', title: 'Suspension Lead' }],
    joined: null, program: '', year: '', grad: '', photo: '',
    about: '', focus: [], highlights: [], seeking: '', links: {},
  },
  {
    id: 'vincent', name: 'Vincent', rank: 1,
    roles: [{ team: 'Drivetrain', title: 'Drivetrain Lead' }],
    joined: null, program: '', year: '', grad: '', photo: '',
    about: '', focus: [], highlights: [], seeking: '', links: {},
  },
  {
    id: 'fahad', name: 'Fahad', rank: 1,
    roles: [{ team: 'Electrical', title: 'Electrical Lead' }],
    joined: null, program: '', year: '', grad: '', photo: '',
    about: '', focus: [], highlights: [], seeking: '', links: {},
  },

];

/* ---- Member slots (launch, 2026-10): every regular member shows as "TBD" until the full
   roster goes in. Add real members above (rank 2), then lower this count or delete the block.
   Callum, Etienne and Joseph's entries were removed for launch; see LaunchPrep.md to restore. ---- */
for (let i = 1; i <= 40; i++) {
  window.RRR_ROSTER.push({ id: `member-${i}`, name: 'TBD', rank: 2, placeholder: true, roles: [] });
}
