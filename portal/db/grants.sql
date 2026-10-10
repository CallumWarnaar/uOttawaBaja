-- =========================================================================
-- Least-privilege database login for the Lambda (portal_api)
-- Run as the database owner, after the migrations. Safe to run again after a new migration.
--
-- Create this role HERE, in SQL, not in Neon's Roles tab: Neon adds Console-made roles to
-- neon_superuser, which can read and write every table and would bypass the views below.
--
-- No password in this file. After running it, set one in the SQL Editor (generate 24+ random
-- characters; Neon rejects weak ones), then delete that query from the editor's history:
--   alter role portal_api with login password '<generated password>';
-- =========================================================================

do $$
begin
  if not exists (select from pg_roles where rolname = 'portal_api') then
    create role portal_api nologin;   -- login is switched on with the password, above
  end if;
end
$$;

-- Start from nothing, then grant only what the API needs
revoke all on all tables in schema public from portal_api;

-- Reads go through the role-filtered views; accounts/sponsors for the login check
grant select on v_roster_public, v_roster_sponsor, v_roster_member, accounts, sponsors to portal_api;

-- Writes: the access log, pending profile edits, and the last-login time
grant insert on access_log, profile_edits to portal_api;
grant update (last_login) on accounts to portal_api;

-- No access to members, member_roles or subteams tables directly: approved edits are
-- applied by an admin-only path (WP3), never by this role.
