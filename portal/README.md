# portal/ — sponsor & member login (scaffold, not deployed)

Backend scaffold for the login-gated roster. The plan, decisions and security checklist are in [`../MemberPortal.md`](../MemberPortal.md); read that first.

This folder is **outside `baja-site/`**, so Amplify never serves it, and `build.py` ignores it. Nothing here runs until Callum approves the AWS/database setup.

```
portal/
  db/migrations/    PostgreSQL schema, one file per change (001_init = tables, enums, role-filtered views).
                    Never edit a merged migration; add 002_....sql.
  db/grants.sql     the Lambda's least-privilege login (portal_api); no password in the file
  db/seed.sql       fake sample rows for local testing (no real people)
  api/test/         node --test against PGlite (in-process Postgres): what each view and portal_api can see
  api/handler.mjs   Lambda handler: routes, role checks, parameterized queries
  api/package.json  Lambda dependencies (pg). The website itself stays npm-free.
  .env.example      names of the settings the Lambda needs (values go in AWS, never in git)
  drafts/           privacy notice + advisor email drafts (Callum reviews; the notice becomes privacy.html)
```

## Tests (no database install needed)

```bash
cd portal/api && npm ci && npm test
```

## Setting up the real database (Neon)

Callum's steps are in `../PortalCallumPlan.md` (step 5): run `db/migrations/*.sql` in order, then `db/grants.sql`, then `alter role portal_api with login password '...'` in the SQL Editor. Create `portal_api` in SQL only, never in Neon's Roles tab (those roles join `neon_superuser` and can read every table).

## Next steps

See "Build phases" in `MemberPortal.md`. The handler's `TODO`s mark the parts that need the real Cognito pool, database and S3 bucket.
