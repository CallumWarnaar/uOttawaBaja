-- =========================================================================
-- Rough Rider Racing member & sponsor portal: PostgreSQL schema (draft)
-- Plan: ../../MemberPortal.md. Plain PostgreSQL 15+, works on Neon, RDS, Aurora or local.
-- Run: psql <db> -f schema.sql   (idempotent enough for a fresh database, not a migration tool)
-- =========================================================================

create extension if not exists citext;

-- ---------- Lookups ------------------------------------------------------
create type account_role as enum ('sponsor', 'member', 'admin');
create type sponsor_tier as enum ('bronze', 'silver', 'gold', 'platinum', 'software', 'in_kind');
create type profile_status as enum ('approved', 'pending');

create table subteams (
  id    text primary key,                 -- 'chassis', matches team.html anchors
  name  text not null unique,             -- 'Chassis'
  sort  smallint not null default 0
);

-- ---------- Sponsors -----------------------------------------------------
create table sponsors (
  id           bigint generated always as identity primary key,
  name         text not null,
  tier         sponsor_tier not null,
  season       text not null,             -- '2026-27'
  website      text,
  access_until date,                      -- portal access ends after this date unless renewed
  created_at   timestamptz not null default now(),
  unique (name, season)
);

-- ---------- Members (one row per person; mirrors roster-data.js) --------
create table members (
  id                  text primary key,   -- url-safe slug, same as roster.html#id
  first_name          text not null,
  last_name           text,               -- never shown publicly (site uses first names)
  rank                smallint not null default 2 check (rank between 0 and 2),  -- 0 captain, 1 lead, 2 member
  is_lead             boolean not null default false,
  joined              smallint,           -- first season start year (2024 = 2024-25)
  program             text,
  study_year          text,
  grad                text,               -- 'April 2028'
  photo_key           text,               -- private S3 key for the full-size headshot
  about               text,
  focus               text[] not null default '{}',
  highlights          text[] not null default '{}',
  seeking             text,
  linkedin            text,
  email               citext,             -- member-only, never sent to sponsors unless opted in
  resume_key          text,               -- private S3 key, served by signed URL only
  share_with_sponsors boolean not null default false,   -- consent: default OFF
  active              boolean not null default true,    -- false when they leave (keep history)
  status              profile_status not null default 'approved',
  updated_at          timestamptz not null default now()
);

create table member_roles (
  member_id  text not null references members(id) on delete cascade,
  subteam_id text not null references subteams(id),
  title      text not null,                -- 'Suspension Lead'
  is_primary boolean not null default false, -- shown on the card
  primary key (member_id, subteam_id)
);

-- Pending self-edits wait here until an admin approves them
create table profile_edits (
  id          bigint generated always as identity primary key,
  member_id   text not null references members(id) on delete cascade,
  changes     jsonb not null,             -- only whitelisted profile fields (enforced in the API)
  submitted_at timestamptz not null default now(),
  reviewed_by bigint,
  reviewed_at timestamptz,
  approved    boolean
);

-- ---------- Accounts (login identities; passwords live in Cognito, not here) ----
create table accounts (
  id           bigint generated always as identity primary key,
  cognito_sub  uuid not null unique,      -- the JWT "sub" claim
  email        citext not null unique,
  role         account_role not null,
  member_id    text references members(id),   -- set for role = member
  sponsor_id   bigint references sponsors(id), -- set for role = sponsor
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  last_login   timestamptz,
  check ((role = 'member'  and member_id  is not null) or role <> 'member'),
  check ((role = 'sponsor' and sponsor_id is not null) or role <> 'sponsor')
);
alter table profile_edits add foreign key (reviewed_by) references accounts(id);

-- Who viewed what (sponsor views of profiles and resumes)
create table access_log (
  id          bigint generated always as identity primary key,
  account_id  bigint not null references accounts(id),
  member_id   text references members(id) on delete set null,
  action      text not null,              -- 'view_profile', 'download_resume', 'list_roster'
  at          timestamptz not null default now()
);
create index on access_log (member_id, at desc);

-- ---------- Role-filtered views (the API only ever reads these) ----------
-- Columns a view doesn't select can't leak, whatever the API code does.

-- Public: what's on the website today (first name, title, subteams). Also usable to generate roster-data.js.
create view v_roster_public as
select m.id, m.first_name as name, m.rank, m.is_lead,
       coalesce(json_agg(json_build_object('team', s.name, 'title', r.title) order by r.is_primary desc, s.sort)
                filter (where r.member_id is not null), '[]') as roles
from members m
left join member_roles r on r.member_id = m.id
left join subteams s on s.id = r.subteam_id
where m.active and m.status = 'approved'
group by m.id;

-- Sponsor: full profile of opted-in members only; no email, no last name
create view v_roster_sponsor as
select p.*, m.joined, m.program, m.study_year, m.grad, m.about, m.focus, m.highlights,
       m.seeking, m.linkedin, (m.resume_key is not null) as has_resume
from v_roster_public p
join members m on m.id = p.id
where m.share_with_sponsors;

-- Member / admin: everyone active, including internal contact info
create view v_roster_member as
select p.*, m.last_name, m.joined, m.program, m.study_year, m.grad, m.about, m.focus,
       m.highlights, m.seeking, m.linkedin, m.email, m.share_with_sponsors,
       (m.resume_key is not null) as has_resume
from v_roster_public p
join members m on m.id = p.id;

-- ---------- Least-privilege DB user for the Lambda ------------------------
-- Run once as the owner, with a real password from Secrets Manager:
--   create role portal_api login password '...';
--   grant select on v_roster_public, v_roster_sponsor, v_roster_member, accounts, sponsors to portal_api;
--   grant insert on access_log, profile_edits to portal_api;
--   grant update (last_login) on accounts to portal_api;
-- The API user can't edit members directly; approved edits are applied by an admin script.
