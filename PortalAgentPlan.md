# Portal build plan: for agents

How agents (Claude, Gemini, anything else working in this repo) build the sponsor & member login from [`MemberPortal.md`](MemberPortal.md). That file is the **what and why**. This one is the **order of work**. Callum's side (decisions, accounts, deploys) is in [`PortalCallumPlan.md`](PortalCallumPlan.md). Written 2026-10-09; nothing is built or deployed yet.

## Ground rules (read before every work package)

1. **Agents write code. Callum creates and changes cloud things.** Agents never create, change or delete AWS resources, Neon projects, DNS or `amplify.yml` unless Callum has said "go" for that exact step in chat. Writing a template that *would* create them is fine.
2. **No secrets and no real personal data in git, chat or logs.** No passwords, DB URLs, Cognito client secrets (we don't use one), resumes, emails or last names of real people. Real roster files live in `portal/private/` (git-ignored). Tests use fake people only.
3. **Public IDs are fine in the repo:** Cognito user pool ID, app client ID, hosted-login domain, API URL and region are not secrets (every browser sees them).
4. **One work package = one PR**, merged under the standing auto-merge permission in CLAUDE.md, *except* PRs that change `amplify.yml`, remove data from the live site, or take the portal live: those wait for Callum.
5. **The website stays npm-free.** `portal/api/` may use npm (it's a Lambda, not the site). The site's portal page is hand-written JS like the rest of `assets/js/`.
6. **Security lives on the server.** Anything the browser hides is still public. Role checks happen in API Gateway (token) + Lambda (account row) + SQL views (columns). Never return a column a role's view doesn't select.
7. Each PR updates `MemberPortal.md` status, ticks its box below, and keeps CLAUDE.md / README / `gemini.MD` aligned (CLAUDE.md rule).

## Target layout

```
portal/
  db/migrations/001_init.sql     schema (from today's schema.sql), then 002_..., never edit a merged migration
  db/grants.sql                  least-privilege role for the Lambda (password set by Callum, not here)
  db/seed.sql                    fake data for tests
  tools/import_roster.py         CSV (from Callum's Excel) -> private SQL + public roster-data.js (stdlib only)
  api/handler.mjs                routes
  api/lib/*.mjs                  auth, db, s3, cognito, validation helpers
  api/test/*.test.mjs            node --test, against PGlite (in-process Postgres, no install)
  template.yaml                  AWS SAM: Cognito, HTTP API + JWT authorizer, Lambda, S3, secret, logs
  private/                       git-ignored: real roster CSV, generated real-data SQL
site-src/pages/portal.html       login + full roster page (noindex, not in sitemap)
baja-site/assets/js/portal.js    PKCE login, token handling, calls the API, feeds roster.js
baja-site/assets/js/portal-config.js   public IDs/URLs output by the SAM deploy
```

## Work packages

Dependencies are shown as "after". WP1 and WP2 can start now (they need no decisions from Callum). Everything that depends on a decision says which one (D1–D6, listed in `PortalCallumPlan.md`).

### WP1: Database migrations and tests harness (now)
- [ ] Move `db/schema.sql` to `db/migrations/001_init.sql`; leave `schema.sql` deleted, update docs.
- [ ] Add `db/grants.sql` (role `portal_api`: `select` on the three views, `accounts`, `sponsors`; `insert` on `access_log`, `profile_edits`; `update (last_login)` on `accounts`). Password placeholder only.
- [ ] Add to `members`: `consent_updated_at timestamptz`, `deleted_at timestamptz` (soft delete for "delete my data" requests, purged by an admin script).
- [ ] `api/package.json`: add dev dependency `@electric-sql/pglite`; `npm test` = `node --test`.
- [ ] `api/test/views.test.mjs`: load migrations + `seed.sql` into PGlite and assert: sponsor view has no `email`/`last_name` columns and only opted-in members; member view has everyone active; inactive/pending members appear nowhere.
- Done when: `cd portal/api && npm ci && npm test` passes on Windows and Linux.

### WP2: Roster import tool (now; real run needs D2)
- [ ] `tools/import_roster.py` (stdlib `csv`): reads `portal/private/roster.csv` (columns in `PortalCallumPlan.md`, step 3) and writes:
  - `portal/private/roster-import.sql`: upserts into `members`, `member_roles`, `subteams` (git-ignored, Callum runs it).
  - `baja-site/assets/js/roster-data.js` entries with **public fields only** (per D2), replacing the `placeholder` loop.
- [ ] Validates: unique ids, subteam names match `RRR_TEAMS`, 4-digit grad year, no empty names; prints a summary, exits non-zero on errors.
- [ ] Test with a fake CSV in `portal/tools/test/`.
- Done when: a fake CSV round-trips into PGlite and into a `roster-data.js` that `roster.html` renders (headless Edge check).

### WP3: Finish the API (after WP1; uses D1, D3, D4)
- [ ] Split `handler.mjs` into `lib/auth.mjs` (account lookup, role check, sponsor expiry), `lib/db.mjs` (pool; reads `DATABASE_URL` from Secrets Manager at cold start, cached), `lib/validate.mjs`.
- [ ] `GET /roster/{id}/resume`: look up `resume_key` through the role's view only, 5-minute presigned GET (`@aws-sdk/s3-request-presigner`), log sponsor downloads.
- [ ] `PUT /me/profile`: whitelist (`about, focus, highlights, seeking, linkedin, share_with_sponsors`), length limits, insert into `profile_edits`. `share_with_sponsors` applies immediately (consent shouldn't wait for approval) and sets `consent_updated_at`.
- [ ] `POST /me/resume-upload`: presigned PUT (PDF only, 5 MB cap via conditions), key `resumes/<member-id>/<uuid>.pdf`.
- [ ] Admin: `GET /admin/edits`, `POST /admin/edits/{id}` (approve/reject, applied with a separate admin DB role or a `security definer` function, since `portal_api` can't update `members`), `POST /admin/invite` (Cognito `AdminCreateUser` + `AdminAddUserToGroup` + `accounts` row), `POST /admin/accounts/{id}/disable`, `DELETE /admin/members/{id}` (soft delete + remove S3 objects).
- [ ] Admin routes refuse admins without TOTP MFA (`AdminGetUser` → `UserMFASettingList`, cached per container), because Cognito MFA is pool-wide and we keep it optional for sponsors.
- [ ] Tests for the role matrix: anonymous / sponsor / expired sponsor / disabled account / member / admin × every route; a sponsor asking for a non-opted-in id gets 404; ids with SQL metacharacters are harmless.
- Done when: all route tests pass against PGlite with Cognito and S3 mocked.

### WP4: Infrastructure template (after WP1; uses D1, D5)
- [ ] `portal/template.yaml` (AWS SAM), region `ca-central-1`, parameters `AllowedOrigin` (default `https://uottawabaja.ca`), `AuthDomainPrefix`, `CallbackUrls`.
- [ ] Cognito user pool: no self sign-up, email sign-in, MFA optional (TOTP), strong password policy, deletion protection on. Groups `admin`, `member`, `sponsor`. Public app client: authorization code + PKCE, no secret, scopes `openid email`, callback/logout URLs for `https://uottawabaja.ca/portal.html` and `http://localhost:8000/portal.html`. Hosted login on a Cognito prefix domain (custom `login.uottawabaja.ca` is a later, DNS-touching step).
- [ ] HTTP API: JWT authorizer (issuer = pool, audience = client id), CORS allow-origin = `AllowedOrigin` only, default throttling (e.g. 20 rps / burst 40).
- [ ] Lambda: Node 22, arm64, 256 MB, 10 s timeout, env `SECRET_ARN`, `RESUME_BUCKET`, `USER_POOL_ID`, `ALLOWED_ORIGIN`; IAM limited to that secret, that bucket, and `cognito-idp:Admin*` on that pool. **No VPC** if D1 = Neon (TLS to Neon); a VPC + endpoints variant only if D1 = RDS.
- [ ] S3 bucket: block all public access, SSE, versioning, CORS for presigned PUT from `AllowedOrigin`, lifecycle to expire noncurrent versions after 30 days.
- [ ] Secrets Manager secret `rrr-portal/database-url` created **empty**; Callum pastes the value in the console.
- [ ] CloudWatch log retention 30 days. Outputs: pool id, client id, auth domain, API URL.
- [ ] `sam validate --lint` passes. Write `portal/DEPLOY.md` with the exact commands Callum runs.
- Done when: the template validates and a reviewer can read every permission it grants.

### WP5: Portal page (after WP4 outputs exist, can be built against mocks before)
- [ ] `build.py`: support front-matter `noindex: true` (adds `<meta name="robots" content="noindex">`, left out of `sitemap.xml`). Add `portal` to `EXTRA_PAGES` with footer label "Sponsor & member login".
- [ ] Refactor `roster.js` to expose `RRR.renderRoster(people, { canSeeProfile })` so both pages share one renderer; `roster.html` keeps using `window.RRR_ROSTER`.
- [ ] `portal.js`: PKCE (Web Crypto), redirect to hosted login, exchange code, keep tokens in memory + `sessionStorage` (never `localStorage`), refresh before expiry, logout. Calls `/me` and `/roster`, renders, opens profiles from `/roster/{id}`, resume button uses the signed URL. Member view adds "Edit my profile" and the opt-in toggle. Admin view adds pending edits + invite form.
- [ ] `portal-config.js` holds the WP4 outputs (public values).
- [ ] Test against a local mock API (`portal/api/test/mock-server.mjs`) and in headless Edge at 1440 and 390 px.
- Done when: the page works end to end against the mock, and nothing private is in any static file.

### WP6: Go-live (after Callum's step 6 tests pass; PR waits for Callum)
- [ ] Strip private fields (per D2) from `roster-data.js`; the public drawer says "Sponsors and members: log in for full profiles" with a link to `portal.html`.
- [ ] `amplify.yml`: Content-Security-Policy for `portal.html` (`connect-src` = API + auth domain, `frame-ancestors 'none'`), `Referrer-Policy`, `X-Content-Type-Options`. **Needs Callum's go-ahead.**
- [ ] `privacy.html` (from Callum's approved text, D6), linked from the portal and footer.
- [ ] Update docs: CLAUDE.md "Member & sponsor portal" from planned → live, README, `gemini.MD`.

### WP7: Later
- [ ] Talent Package export (admin: opted-in profiles → PDF/ZIP).
- [ ] Custom login domain `login.uottawabaja.ca` (ACM cert + DNS, Callum's call).
- [ ] Season rollover script: extend/renew `access_until`, disable departed members.
- [ ] Headshots for logged-in users through the same pipeline (`Optimization.md` Phase 3).

## Handoff checklist for each PR

- Tests pass (`npm test` in `portal/api`, `python build.py` clean).
- No secret or real personal data in the diff (`git diff | grep -iE "password|postgres://|@uottawa|@gmail"` comes back empty except docs).
- Docs aligned, boxes ticked here and in `MemberPortal.md`.
- PR description says what Callum has to do next, if anything, in plain words.
