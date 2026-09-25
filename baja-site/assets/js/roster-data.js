/* =========================================================================
   ROUGH RIDER RACING — FULL ROSTER DATA
   Edit this file to add people or fill in profiles. No build step needed:
   commit and push, and the roster page picks it up.

   One object per person. Only `id`, `name` and `roles` are required.

   id          url-safe, unique: "firstname-lastname". Profile link = roster.html#id
   name        display name
   sortName    optional: what A–Z sorting uses (e.g. "Jordan Nora" to sort by last name)
   roles       one entry per subteam: { team, title }. The first role is shown on the card.
               team must be one of TEAMS below.
   rank        seniority tie-breaker: 0 = captain, 1 = lead, 2 = member
   joined      first season on the team, as the starting year (2024 = 2024–25). Earlier = more senior.
   program     e.g. "Mechanical Engineering"
   year        year of study, e.g. "3rd year"
   grad        expected graduation, e.g. "April 2028"
   photo       headshot path, e.g. "assets/img/team/nora-jordan.jpg"
               (portrait 4:5 crop, ~800×1000 JPG). Leave "" to show initials.
   about       "About me" paragraph(s). Separate paragraphs with a blank line (\n\n).
   focus       short list of skills / areas, shown as tags
   highlights  what they designed, built or led on the car (list of sentences)
   seeking     optional: what they're looking for, e.g. "Summer 2027 co-op in automotive or aerospace"
   links       optional: { linkedin, email, resume, portfolio } full URLs / address
   placeholder true for template entries that aren't real people yet (shown with a dashed outline)

   Seniority sort = earliest `joined` first, then `rank`, then name.
   People without a `joined` year sort after everyone who has one.
   ========================================================================= */

window.RRR_TEAMS = ['Leadership', 'Chassis', 'Suspension', 'Drivetrain', 'Electrical', 'Administration'];

window.RRR_ROSTER = [
  {
    id: 'nora-jordan', name: 'Nora Jordan', rank: 0,
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
    id: 'callum', name: 'Callum', rank: 2,
    roles: [{ team: 'Suspension', title: 'Front Suspension Engineer' }, { team: 'Administration', title: 'Administration' }],
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
  {
    id: 'etienne', name: 'Etienne', rank: 2,
    roles: [{ team: 'Administration', title: 'Administration' }],
    joined: null, program: '', year: '', grad: '', photo: '',
    about: '', focus: [], highlights: [], seeking: '', links: {},
  },
  {
    id: 'joseph', name: 'Joseph', rank: 2,
    roles: [{ team: 'Administration', title: 'Administration' }],
    joined: null, program: '', year: '', grad: '', photo: '',
    about: '', focus: [], highlights: [], seeking: '', links: {},
  },

  /* ---- Placeholders: replace with real members, then delete what's left ---- */
  { id: 'placeholder-chassis-1', name: 'Member Name', rank: 2, placeholder: true, roles: [{ team: 'Chassis', title: 'Chassis Member' }] },
  { id: 'placeholder-chassis-2', name: 'Member Name', rank: 2, placeholder: true, roles: [{ team: 'Chassis', title: 'Chassis Member' }] },
  { id: 'placeholder-suspension-1', name: 'Member Name', rank: 2, placeholder: true, roles: [{ team: 'Suspension', title: 'Suspension Member' }] },
  { id: 'placeholder-suspension-2', name: 'Member Name', rank: 2, placeholder: true, roles: [{ team: 'Suspension', title: 'Suspension Member' }] },
  { id: 'placeholder-drivetrain-1', name: 'Member Name', rank: 2, placeholder: true, roles: [{ team: 'Drivetrain', title: 'Drivetrain Member' }] },
  { id: 'placeholder-drivetrain-2', name: 'Member Name', rank: 2, placeholder: true, roles: [{ team: 'Drivetrain', title: 'Drivetrain Member' }] },
  { id: 'placeholder-electrical-1', name: 'Member Name', rank: 2, placeholder: true, roles: [{ team: 'Electrical', title: 'Electrical Member' }] },
  { id: 'placeholder-electrical-2', name: 'Member Name', rank: 2, placeholder: true, roles: [{ team: 'Electrical', title: 'Electrical Member' }] },
  { id: 'placeholder-admin-1', name: 'Member Name', rank: 2, placeholder: true, roles: [{ team: 'Administration', title: 'Administration Member' }] },
];
