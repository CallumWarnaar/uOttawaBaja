// Loads the real migrations + grants + fake seed data into PGlite (in-process Postgres, no install)
// and checks what each role-filtered view exposes. Run: npm test (from portal/api).
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { citext } from '@electric-sql/pglite/contrib/citext';

const dbDir = new URL('../../db/', import.meta.url);
const sql = (path) => readFileSync(new URL(path, dbDir), 'utf8');

let db;

before(async () => {
  db = new PGlite({ extensions: { citext } });
  const migrations = readdirSync(new URL('migrations/', dbDir)).filter((f) => f.endsWith('.sql')).sort();
  for (const file of migrations) await db.exec(sql(`migrations/${file}`));
  await db.exec(sql('grants.sql'));
  await db.exec(sql('seed.sql'));

  // Fake members who must never appear anywhere, even though they opted in
  await db.exec(`
    insert into members (id, first_name, last_name, share_with_sponsors, active, status, deleted_at) values
      ('gone-inactive', 'Ina',  'Left',    true, false, 'approved', null),
      ('gone-pending',  'Pat',  'Waiting', true, true,  'pending',  null),
      ('gone-deleted',  'Dee',  'Removed', true, true,  'approved', now());
  `);
});

const columns = async (view) =>
  (await db.query(`select column_name from information_schema.columns where table_name = $1`, [view]))
    .rows.map((r) => r.column_name);
const ids = async (view) => (await db.query(`select id from ${view} order by id`)).rows.map((r) => r.id);

test('migrations record themselves', async () => {
  const { rows } = await db.query('select version from schema_migrations');
  assert.deepEqual(rows.map((r) => r.version), ['001_init']);
});

test('sponsor view has no email or last name', async () => {
  const cols = await columns('v_roster_sponsor');
  assert.ok(cols.length > 0);
  for (const secret of ['email', 'last_name', 'resume_key', 'photo_key', 'share_with_sponsors']) {
    assert.ok(!cols.includes(secret), `v_roster_sponsor must not expose ${secret}`);
  }
});

test('public view has no private fields', async () => {
  const cols = await columns('v_roster_public');
  for (const secret of ['email', 'last_name', 'about', 'grad', 'joined', 'linkedin', 'resume_key']) {
    assert.ok(!cols.includes(secret), `v_roster_public must not expose ${secret}`);
  }
});

test('sponsor view lists only opted-in members', async () => {
  assert.deepEqual(await ids('v_roster_sponsor'), ['test-lead']);
});

test('member view lists every active member', async () => {
  assert.deepEqual(await ids('v_roster_member'), ['test-lead', 'test-member']);
});

test('inactive, pending and deleted members appear in no view', async () => {
  for (const view of ['v_roster_public', 'v_roster_sponsor', 'v_roster_member']) {
    const found = await ids(view);
    for (const id of ['gone-inactive', 'gone-pending', 'gone-deleted']) {
      assert.ok(!found.includes(id), `${id} leaked into ${view}`);
    }
  }
});

// Everything below runs as portal_api, the login the Lambda uses
async function asApi(fn) {
  await db.exec('set role portal_api');
  try { return await fn(); } finally { await db.exec('reset role'); }
}
const denied = (query, params) =>
  asApi(() => assert.rejects(db.query(query, params), /permission denied/));

test('portal_api is not a superuser and has no login until Callum sets a password', async () => {
  const { rows } = await db.query(`select rolsuper, rolcanlogin, rolbypassrls from pg_roles where rolname = 'portal_api'`);
  assert.deepEqual(rows[0], { rolsuper: false, rolcanlogin: false, rolbypassrls: false });
});

test('portal_api can read the views, accounts and sponsors', async () => {
  await asApi(async () => {
    for (const t of ['v_roster_public', 'v_roster_sponsor', 'v_roster_member', 'accounts', 'sponsors']) {
      await db.query(`select * from ${t} limit 1`);
    }
  });
});

test('portal_api cannot read the base tables', async () => {
  for (const t of ['members', 'member_roles', 'profile_edits', 'access_log']) {
    await denied(`select * from ${t} limit 1`);
  }
});

test('portal_api can only write the log, pending edits and last_login', async () => {
  await asApi(async () => {
    await db.query(`insert into access_log (account_id, member_id, action) values (2, 'test-lead', 'view_profile')`);
    await db.query(`insert into profile_edits (member_id, changes) values ('test-member', '{"about":"hi"}')`);
    await db.query('update accounts set last_login = now() where id = $1', [1]);
  });
  await denied(`update members set about = 'hacked' where id = 'test-lead'`);
  await denied(`update members set share_with_sponsors = true`);
  await denied(`update accounts set role = 'admin' where id = 2`);
  await denied(`delete from access_log`);
  await denied(`insert into accounts (cognito_sub, email, role) values (gen_random_uuid(), 'x@example.com', 'admin')`);
});

test('grants.sql can be run again', async () => {
  await db.exec(sql('grants.sql'));
});
