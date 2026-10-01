# portal/ — sponsor & member login (scaffold, not deployed)

Backend scaffold for the login-gated roster. The plan, decisions and security checklist are in [`../MemberPortal.md`](../MemberPortal.md); read that first.

This folder is **outside `baja-site/`**, so Amplify never serves it, and `build.py` ignores it. Nothing here runs until Callum approves the AWS/database setup.

```
portal/
  db/schema.sql     PostgreSQL tables, enums and the role-filtered views the API reads
  db/seed.sql       fake sample rows for local testing (no real people)
  api/handler.mjs   Lambda handler: routes, role checks, parameterized queries
  api/package.json  Lambda dependencies (pg). The website itself stays npm-free.
  .env.example      names of the settings the Lambda needs (values go in AWS, never in git)
```

## Try the database locally

```bash
createdb rrr_portal
psql rrr_portal -f db/schema.sql
psql rrr_portal -f db/seed.sql
psql rrr_portal -c "select * from v_roster_sponsor;"   # what a sponsor would see
```

## Next steps

See "Build phases" in `MemberPortal.md`. The handler's `TODO`s mark the parts that need the real Cognito pool, database and S3 bucket.
