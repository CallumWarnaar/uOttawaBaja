# DRAFT: Portal privacy notice

*Draft for Callum's review (2026-10-09). Once Callum and the faculty advisors approve it, it becomes `privacy.html` on the site (PortalAgentPlan.md, WP6). Not legal advice.*

**Check before sending (choices made in this draft):**
- Retention: profiles deleted **12 months** after a member leaves; access logs kept **12 months**; deletion requests handled within **30 days**.
- Sponsors see opted-in members only, and **never** last names or email addresses (the plan's default; change it if you want sponsors to see more).
- The database is in the **United States** (Neon, AWS US East). Logins and files are in Canada. This is the question the advisor email asks about.
- Contact is `baja@uottawa.ca`.

---

## Rough Rider Racing portal: how we handle your information

*Last updated: [date of approval]*

Rough Rider Racing is the University of Ottawa's Baja SAE student design team. Our sponsor & member portal lets team members share a profile with each other and, if they choose, with our sponsors for recruiting. This notice explains what we store, who can see it, and what you can do about it.

### What we collect

- **Account details:** your email address, your role (member, sponsor or admin), and when you last logged in.
- **Team profile (members):** first and last name, subteam and role, program, expected graduation, the season you joined, and anything you choose to add: a short bio, focus areas, project highlights, what you're looking for (e.g. a co-op), your LinkedIn link, a headshot and a resume (PDF).
- **Sponsor contacts:** your name, email and the organization you represent.
- **Activity:** a record of when a sponsor opens a member's profile or downloads a resume.

We don't collect student numbers, grades, payment details or anything we don't need to run the team.

### Who can see what

| Information | Who can see it |
|---|---|
| First name, headshot, subteam and role, program | **Anyone** (on the public website) |
| Everything else in your profile, including last name and email | **Team members and the team's admins**, after logging in |
| Your profile and resume, without your last name or email | **Sponsors, only if you opt in** |

- Sharing with sponsors is **off until you turn it on**, and you can turn it off at any time from your profile. Turning it off removes your profile from sponsors' view immediately.
- The admins are the team captain and the team's administration member responsible for the portal. They can see all accounts and approve profile changes.
- Sponsor access is tied to the current season and ends when their sponsorship does.
- Sponsors agree to use member information only to contact members about jobs, co-ops and internships, and not to pass it on.

### Where it's stored and how it's protected

- Logins are handled by Amazon Cognito and files (headshots, resumes) by Amazon S3, both in **Canada** (AWS Montreal region). We never see or store your password.
- Profile data is stored in a PostgreSQL database run by Neon on Amazon Web Services in the **United States** (Virginia). Information stored in the US may be subject to US law.
- Everything is encrypted in transit and at rest. Resumes are never public: each download uses a link that expires after five minutes. Admin accounts require two-factor authentication.

### How long we keep it

- **Members:** while you're on the team. When you leave, your account is disabled and your profile, headshot and resume are deleted within 12 months, sooner if you ask.
- **Sponsor contacts:** until the end of the season after their last sponsorship.
- **Activity records:** 12 months.

### Your choices

You can, at any time:
- update your profile or turn sponsor sharing on or off from the portal;
- ask which sponsors have viewed your profile or downloaded your resume;
- ask for a copy of your information, a correction, or to have your profile and account deleted.

Email **baja@uottawa.ca**. We'll respond within 30 days.

### Changes

If we change how we use your information, we'll update this page and tell members by email before the change takes effect.

### Questions

Rough Rider Racing · Faculty of Engineering, University of Ottawa · baja@uottawa.ca
