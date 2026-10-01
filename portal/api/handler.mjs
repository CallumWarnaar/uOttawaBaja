// Rough Rider Racing portal API (scaffold, not deployed). Plan: ../../MemberPortal.md
//
// Runs on AWS Lambda behind an API Gateway HTTP API whose JWT authorizer is the Cognito
// user pool. API Gateway rejects missing/forged/expired tokens before this code runs, so the
// claims below are already verified. Roles come from the token's "cognito:groups" claim AND
// must match the accounts table (a token alone isn't enough: disabled accounts are refused).

import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
const ORIGIN = process.env.ALLOWED_ORIGIN || 'https://uottawabaja.ca';

// Which view each role reads. Column filtering lives in the SQL views, not here.
const ROSTER_VIEW = { sponsor: 'v_roster_sponsor', member: 'v_roster_member', admin: 'v_roster_member' };

const json = (statusCode, body) => ({
  statusCode,
  headers: {
    'content-type': 'application/json',
    'access-control-allow-origin': ORIGIN,
    'cache-control': 'no-store',          // private data: never cache in browsers or CDNs
  },
  body: JSON.stringify(body),
});

async function currentAccount(event) {
  const claims = event.requestContext?.authorizer?.jwt?.claims;
  if (!claims?.sub) return null;
  const { rows } = await pool.query(
    `select a.id, a.role, a.member_id, a.sponsor_id, s.access_until
       from accounts a left join sponsors s on s.id = a.sponsor_id
      where a.cognito_sub = $1 and a.active`,
    [claims.sub],
  );
  const acct = rows[0];
  if (!acct) return null;
  // Sponsor access ends with their season unless renewed
  if (acct.role === 'sponsor' && acct.access_until && new Date(acct.access_until) < new Date()) return null;
  return acct;
}

const log = (acct, action, memberId = null) =>
  pool.query('insert into access_log (account_id, member_id, action) values ($1, $2, $3)', [acct.id, memberId, action]);

export async function handler(event) {
  try {
    const acct = await currentAccount(event);
    if (!acct) return json(403, { error: 'No active portal account' });

    const route = event.routeKey;          // e.g. "GET /roster/{id}"
    const view = ROSTER_VIEW[acct.role];

    if (route === 'GET /me') {
      const profile = acct.member_id
        ? (await pool.query('select * from v_roster_member where id = $1', [acct.member_id])).rows[0]
        : null;
      await pool.query('update accounts set last_login = now() where id = $1', [acct.id]);
      return json(200, { role: acct.role, profile });
    }

    if (route === 'GET /roster') {
      // view name comes from the fixed map above, never from the request
      const { rows } = await pool.query(`select * from ${view} order by rank, name`);
      if (acct.role === 'sponsor') await log(acct, 'list_roster');
      return json(200, rows);
    }

    if (route === 'GET /roster/{id}') {
      const id = event.pathParameters?.id;
      const { rows } = await pool.query(`select * from ${view} where id = $1`, [id]);
      if (!rows[0]) return json(404, { error: 'Not found' });   // also hides non-opted-in members from sponsors
      if (acct.role === 'sponsor') await log(acct, 'view_profile', id);
      return json(200, rows[0]);
    }

    if (route === 'GET /roster/{id}/resume') {
      // TODO: look up resume_key (only via the role's view), then return a 5-minute
      // S3 presigned GET URL (@aws-sdk/s3-request-presigner) for RESUME_BUCKET. Log sponsor downloads.
      return json(501, { error: 'Not implemented yet' });
    }

    if (route === 'PUT /me/profile') {
      if (acct.role !== 'member') return json(403, { error: 'Members only' });
      // TODO: parse JSON, keep only whitelisted fields (about, focus, highlights, seeking, linkedin,
      // share_with_sponsors), validate lengths, then insert into profile_edits for admin approval.
      return json(501, { error: 'Not implemented yet' });
    }

    if (route === 'POST /admin/invite') {
      if (acct.role !== 'admin') return json(403, { error: 'Admins only' });
      // TODO: Cognito AdminCreateUser + AdminAddUserToGroup, then insert the accounts row.
      return json(501, { error: 'Not implemented yet' });
    }

    return json(404, { error: 'Unknown route' });
  } catch (err) {
    console.error(err);                    // details go to CloudWatch, never to the browser
    return json(500, { error: 'Server error' });
  }
}
