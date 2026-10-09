# Member & sponsor portal (login-gated roster)

**Status: planning only (2026-10-01). Nothing here is deployed.** Execution plans (2026-10-09): [`PortalAgentPlan.md`](PortalAgentPlan.md) (work packages for agents) and [`PortalCallumPlan.md`](PortalCallumPlan.md) (Callum's decisions, accounts, deploy and testing). The scaffold lives in `portal/` (outside `baja-site/`, so Amplify never serves it). Any AWS resources, `amplify.yml` changes, DNS or access-control work need Callum's go-ahead first (see CLAUDE.md, "Standing permission").

## Goal

Keep the public roster light (names, titles, subteams), and put the **full roster** (about, highlights, focus areas, what they're seeking, resumes, LinkedIn/email) behind a login that only **sponsors** and **team members** can open.

| Who | Sees |
|---|---|
| Public (no login) | Leads' names + titles, subteams, member count. Same as today's `team.html`. |
| Sponsor | Full profiles of members who **opted in** to sponsor sharing, resumes, the Baja Talent Package. |
| Team member | Full roster (all members, internal contact info), and can edit **their own** profile. |
| Admin (Callum + captain) | Everything, plus invite/disable accounts, approve profile edits, export the Talent Package. |

## The one rule that matters

**Hiding data in the browser is not security.** Today the whole roster is in `baja-site/assets/js/roster-data.js`, which anyone can download. Once the portal exists:

1. Private fields (about, highlights, links, resumes, email) are **removed from `roster-data.js`** and live only in the database.
2. The browser asks an API for them, sending the login token. The API checks the token and the role **on the server** and returns only what that role may see.
3. Resumes/headshots for logged-in users sit in a **private** bucket and are served by short-lived signed URLs, never public paths in `baja-site/`.

## Recommended architecture

```
Browser (static site on Amplify)
  portal.html  ──login──▶  Amazon Cognito (hosted login, groups: sponsor / member / admin)
      │                        │ returns a signed JWT
      └──fetch + JWT──▶  API Gateway (HTTP API, JWT authorizer = Cognito)
                               │ rejects bad/expired tokens before any code runs
                               ▼
                         Lambda (portal/api)  ──SQL──▶  PostgreSQL (portal/db/schema.sql)
                               │
                               └── signed URLs ──▶  private S3 bucket (resumes, private headshots)
```

Why this shape:
- **Cognito** handles passwords, email verification, password reset, MFA and lockout, so we never store passwords. The free tier covers far more users than we'll ever have. Same AWS account as Amplify.
- **API Gateway JWT authorizer** verifies the token before Lambda runs, so a missing or forged token never reaches our code.
- **PostgreSQL** because Callum asked for SQL, the data is relational (members ↔ subteams ↔ sponsors), and the schema is plain SQL that runs anywhere.
- **Lambda** fits the static site (no server to patch) and is the same pattern the merch checkout plan uses (CLAUDE.md, "Merch page").

### Database hosting: pick one (Callum's call)

| Option | Cost (rough, 2026) | Notes |
|---|---|---|
| **Neon** (serverless Postgres) | Free tier | Scales to zero, no pausing problem, simplest to start. **Recommended to start.** |
| AWS RDS PostgreSQL `db.t4g.micro` | Free 12 months, then ~$15–20/mo | Stays in the AWS account; needs a VPC for Lambda. |
| Aurora Serverless v2 | Pay per use, can scale to 0 | Overkill for ~50 members. |
| Supabase | Free tier | Has its own auth too, but free projects pause after a week idle, which would break logins. |

The schema in `portal/db/schema.sql` is plain PostgreSQL, so switching hosts later is a dump-and-restore.

## Accounts and access

- **No public sign-up.** Admins invite people (Cognito "admin create user"), which emails a temporary password.
- **Team members:** invited with their uOttawa email, added to the `member` group. Disabled when they leave (keep the row, set `active = false`).
- **Sponsors:** one or more contacts per sponsor organization, `sponsor` group, linked to a `sponsors` row with the tier and season. Access ends with the season unless renewed (`access_until`).
- **Consent:** each member has `share_with_sponsors` (default **off**). Sponsors only ever see opted-in members. This matches the opt-in promise on the sponsors page ("Members opt in").
- **MFA** required for `admin`, optional for others.
- Every sponsor view of a profile/resume is written to `access_log`, so members can be told who looked.

## API (first version)

| Method + path | Role | Returns |
|---|---|---|
| `GET /me` | any | Your account, role, and (members) your own profile |
| `GET /roster` | sponsor, member, admin | Members visible to you, with the columns your role may see |
| `GET /roster/{id}` | sponsor, member, admin | One profile (403 for a sponsor if the member hasn't opted in) |
| `PUT /me/profile` | member | Update your own profile (goes to `pending` until an admin approves) |
| `GET /roster/{id}/resume` | sponsor, member, admin | 5-minute signed S3 URL |
| `POST /admin/invite` | admin | Invite a member or sponsor contact |

Column filtering happens in SQL (`portal/db/schema.sql` defines `v_roster_sponsor` and `v_roster_member` views), so a code bug can't leak a column the view doesn't have.

## Front end (when we build it)

- New pages `portal.html` (login + roster) via `site-src/pages/`, added to `EXTRA_PAGES` (footer link "Sponsor & member login"), **`noindex`** and left out of the sitemap.
- Login with the Cognito hosted UI (Authorization Code + PKCE), tokens kept in memory/sessionStorage, never localStorage.
- Reuse `roster.js` rendering: today it reads `window.RRR_ROSTER`; the portal version fetches `/roster` with the token and feeds the same renderer.
- The public `roster.html` keeps working with the trimmed `roster-data.js` and gets a "Sponsors and members: log in for full profiles" link.
- Content-Security-Policy and CORS locked to `uottawabaja.ca`.

## Security checklist

- [ ] Secrets (DB URL, Cognito IDs) in Lambda environment variables / AWS Secrets Manager. **Never in the repo.** `portal/.env.example` shows the names only.
- [ ] Parameterized SQL only (the scaffold uses `$1` placeholders), never string-built queries.
- [ ] Lambda's DB user has `SELECT` on the views + `UPDATE` on its own profile rows only, not table owner.
- [ ] HTTPS only, CORS allow-list = `https://uottawabaja.ca`.
- [ ] Rate limiting on API Gateway (throttling) and Cognito advanced security / lockout on.
- [ ] Privacy: members' personal info is covered by Ontario/uOttawa expectations. Write a short privacy notice (what's stored, who sees it, how to delete it) and get the faculty advisors' OK before launch.
- [ ] Delete-on-request: an admin can remove a member's profile and resume.

## Build phases

1. **Data:** create the Postgres DB, run `schema.sql`, import the roster from Callum's Excel file (names, positions, subteams) with a small script.
2. **Auth:** Cognito user pool + groups, invite admins only, test login on a local copy of `portal.html`.
3. **API:** deploy `portal/api` to Lambda behind API Gateway with the JWT authorizer. Test each role.
4. **Front end:** `portal.html`, then strip private fields out of `roster-data.js`.
5. **Sponsors:** invite current sponsor contacts, tie access to tier/season.
6. **Later:** member self-editing with approval, Talent Package export (PDF/ZIP), resume uploads.

## Decisions needed from Callum

- Database host (Neon vs RDS).
- Which fields are public, member-only, sponsor-visible (proposal is in `schema.sql` views).
- Who besides Callum and Nora gets `admin`.
- Whether sponsors at every tier get portal access, or only some tiers (the tier table promises a team portfolio and resume booklet at all tiers).
