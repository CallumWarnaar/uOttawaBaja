# Portal build plan: Callum's checklist

What **you** do to get the sponsor & member login live. Agents write the code (see [`PortalAgentPlan.md`](PortalAgentPlan.md)); you make the decisions, own the accounts, click "deploy" and test. Background and architecture: [`MemberPortal.md`](MemberPortal.md). Written 2026-10-09.

**Golden rule:** never paste a password, database URL or real member's personal data into a chat, an issue or a commit. Paste those only into the AWS / Neon consoles. IDs and URLs that the deploy prints (user pool ID, client ID, API URL) are fine to share.

## At a glance

| Step | You do | Time | Unblocks |
|---|---|---|---|
| 1 | Answer decisions D1–D6 | 15 min | everything |
| 2 | Privacy OK from Jason and Alex | 1 email | go-live |
| 3 | Fill the roster spreadsheet | 30 min | real data |
| 4 | AWS account, tools, budget alert | 1 hr | deploy |
| 5 | Create the database (Neon) | 20 min | deploy |
| 6 | Deploy and plug in the secret | 30 min | testing |
| 7 | Create your admin login, test every role | 45 min | go-live |
| 8 | Approve go-live, invite people | spread over a week | done |
| 9 | Keep it running | a few min/week | |

Agents can start WP1 and WP2 right now; they don't need anything from you yet.

## Step 1: Decisions

Reply in chat with your picks (e.g. "D1 Neon, D2 as recommended, D3 me + Nora + Etienne, …"). The agent records them in `MemberPortal.md`.

| # | Question | Recommended | Why |
|---|---|---|---|
| D1 | Database host | **Neon** (free), unless the advisors say member data must stay in Canada, then **AWS RDS in Montreal** (~$15–25/mo after the free year) | Neon has no Canadian region. Resumes and logins stay in Canada either way (S3 + Cognito in `ca-central-1`). |
| D2 | What's public vs. behind login | **Public:** first name, title, subteams, headshot, program, class year. **Members only:** last name, email. **Sponsors (only members who opt in):** about, focus areas, highlights, what they're seeking, LinkedIn, resume. | Keeps today's roster page useful without exposing anything personal. |
| D3 | Admins | **You + Nora + one more** (e.g. Etienne) | Someone has to keep access when people graduate. |
| D4 | Which sponsors get logins | **All tiers** | The tier table already promises the portfolio and resume booklet at every tier. |
| D5 | Which AWS account | **The account Amplify already uses**, as long as it's owned by a team email (e.g. `baja@uottawa.ca`), not a personal one. Region `ca-central-1` (Montreal). | The account outlives any one student. |
| D6 | Privacy notice | Ask an agent to **draft it** ("Draft the portal privacy notice and the email to the advisors"), you edit, advisors approve (step 2). | Members' resumes and contact info are personal information. |

## Step 2: Privacy sign-off

1. Ask an agent to draft the privacy notice + a short email to Jason and Alex (what's stored, who sees it, opt-in for sponsors, how to delete it, where it's hosted).
2. Send it from your own email. Ask them two things: is the notice OK, and **does member data have to stay in Canada** (that settles D1).
3. Save their reply. Go-live (step 8) waits for it.

## Step 3: Roster spreadsheet

Fill in one row per person, then **File → Save As → CSV** to `portal/private/roster.csv` in the repo folder (that folder is git-ignored, so it never gets committed). Don't email it around or paste it into chat.

| Column | Example | Notes |
|---|---|---|
| first_name | Megan | |
| last_name | Example | members-only, never public |
| email | megan@uottawa.ca | where their login invite goes |
| subteam | Chassis | one of: Leadership, Chassis, Suspension, Drivetrain, Electrical, Administration |
| title | Chassis Co-Lead | |
| rank | lead | captain / lead / member |
| joined | 2024 | first season's start year |
| program | Mechanical Engineering | |
| grad | April 2028 | |

Someone on two subteams gets two rows (same email). Leave out about/LinkedIn/resume: members fill those in themselves after they log in, and they choose whether sponsors can see them.

Then tell the agent: "roster.csv is in portal/private, run the import". You'll get `portal/private/roster-import.sql` to run in step 5.

## Step 4: AWS account and tools (one time)

1. **Sign in to the AWS account Amplify uses.** Check the root user's email is the team's, and that the root user has **MFA** on (Account menu → Security credentials). If the account is on a personal email, change it to the team email now.
2. **Make yourself a day-to-day login** instead of using root: IAM Identity Center → enable → create a user for yourself → give it the `AdministratorAccess` permission set on this account. Turn on MFA for it.
3. **Budget alarm:** Billing → Budgets → create a monthly cost budget of **$5** with an email alert. The portal should cost under $1/month; this catches mistakes.
4. **Install on your PC:** [AWS CLI v2](https://aws.amazon.com/cli/), [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html) (Windows installer). Node 22 is already installed.
5. In PowerShell, connect the CLI to your Identity Center login, then check it:

```bash
aws configure sso
```

```bash
aws sts get-caller-identity
```

   When it asks for a region, use `ca-central-1`. Name the profile `rrr`.

## Step 5: Database (Neon, if D1 = Neon)

Wait until the agent says WP1 is merged (that creates the `migrations/` folder and `grants.sql`).

1. Sign up at neon.tech **with the team email**. Create a project `rrr-portal`, region **AWS US East (N. Virginia)** (closest to Montreal).
2. Open the **SQL Editor** and run, in order (copy each file's contents in): `portal/db/migrations/001_init.sql`, then any later migrations, then `portal/db/grants.sql`.
3. **Roles** tab → create role `portal_api` and let Neon generate the password. Copy the connection string for that role (with `sslmode=require`). **Keep it in your clipboard only**; it goes into AWS in step 6.
4. When you have it, run `portal/private/roster-import.sql` in the SQL Editor the same way.

(If D1 = RDS instead, the agent's `DEPLOY.md` will have the RDS steps.)

## Step 6: Deploy

Wait until the agent says WP3 and WP4 are merged and `portal/DEPLOY.md` exists. Then:

1. Tell the agent **"go for the portal deploy"**. That's your go-ahead for AWS resources.
2. In PowerShell, from the repo folder, run the commands in `portal/DEPLOY.md` (roughly `sam build`, then `sam deploy --guided --profile rrr`). When SAM shows the **changeset**, read the list: it should only create Cognito, an API, a Lambda function, an S3 bucket, a secret, log groups and their permissions. Say yes.
3. AWS console → **Secrets Manager** → `rrr-portal/database-url` → *Retrieve secret value* → *Edit* → paste the Neon connection string from step 5 → Save.
4. Copy the deploy's **Outputs** (user pool ID, client ID, auth domain, API URL) into chat. They're public values; the agent puts them in `portal-config.js`.

## Step 7: Your admin login and testing

1. Ask the agent for the "bootstrap admin" command (it creates your Cognito user, adds you to `admin` and writes your `accounts` row). Run it. You get an email with a temporary password.
2. Open `https://uottawabaja.ca/portal.html` (or the local test URL the agent gives you), log in, set your password, and **set up an authenticator app (TOTP)**. Admin pages refuse to open without it.
3. Make two test accounts with your own email plus an alias (`yourname+sponsor@…`, `yourname+member@…`): one sponsor linked to a test sponsor, one member linked to a test member who has **not** opted in.
4. Check, and tick:
   - [ ] Logged out: `portal.html` shows only the login button; `roster.html` still works and shows no private fields.
   - [ ] Sponsor: sees only opted-in members, no emails or last names, can open a resume; the non-opted-in test member isn't listed and their link shows "not found".
   - [ ] Member: sees everyone, can edit their profile (edit shows as pending), can flip "share with sponsors".
   - [ ] Admin: sees and approves the pending edit, can invite and disable accounts.
   - [ ] Disabled account: can't get back in.
5. Tell the agent what failed, if anything. Delete the test accounts when done (or leave them disabled).

## Step 8: Go live

1. Advisors' OK from step 2 in hand.
2. The agent opens the go-live PR (WP6): strips private fields from the public roster, adds the privacy page and security headers in `amplify.yml`. **This one waits for you:** read the summary and merge it (or say "merge it").
3. Invite **Nora and the other admins** (admin page → invite). Make sure they set up TOTP.
4. Invite **members** (bulk invite from the admin page). Post in the team chat: check your email, log in, fill in your profile, choose whether sponsors can see it.
5. About a week later, once profiles are filled in, invite **sponsor contacts**, one or two per sponsor, linked to their sponsor and season.

## Step 9: Keep it running

- **Weekly:** approve or reject pending profile edits (admin page).
- **Each September:** disable members who left, renew sponsors for the new season (`access_until`), invite new members. Ask an agent to run the rollover script.
- **Monthly:** glance at the AWS bill/budget email.
- **When you hand over:** make sure at least two current students are admins in the portal and have access to the AWS and Neon accounts through the team email.

## Costs (expected)

| Piece | Cost |
|---|---|
| Cognito logins | free at our size |
| API Gateway + Lambda | cents per month |
| S3 (resumes) | cents per month |
| Secrets Manager | ~$0.40/month |
| Neon | free tier |
| **Total** | **under $1/month** (RDS instead of Neon: ~$15–25/month after the first year) |
