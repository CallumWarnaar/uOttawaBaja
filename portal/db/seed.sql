-- Fake sample data for local testing only. No real people, emails or sponsors' contacts.
insert into subteams (id, name, sort) values
  ('leadership', 'Leadership', 0), ('chassis', 'Chassis', 1), ('suspension', 'Suspension', 2),
  ('drivetrain', 'Drivetrain', 3), ('electrical', 'Electrical', 4), ('administration', 'Administration', 5);

insert into sponsors (name, tier, season, access_until) values
  ('Example Machining Co.', 'gold', '2026-27', '2027-08-31');

insert into members (id, first_name, last_name, rank, joined, program, grad, about, focus, share_with_sponsors, email) values
  ('test-lead',   'Alex', 'Example', 1, 2024, 'Mechanical Engineering', 'April 2027',
   'Sample lead profile.', '{SolidWorks,FEA}', true,  'alex@example.com'),
  ('test-member', 'Sam',  'Sample',  2, 2025, 'Electrical Engineering', 'April 2028',
   'Sample member who has not opted in.', '{Wiring}', false, 'sam@example.com');

insert into member_roles (member_id, subteam_id, title, is_primary) values
  ('test-lead', 'suspension', 'Suspension Lead', true),
  ('test-member', 'electrical', 'Electrical Member', true);

insert into accounts (cognito_sub, email, role, member_id, sponsor_id) values
  ('00000000-0000-0000-0000-000000000001', 'alex@example.com',    'member',  'test-lead', null),
  ('00000000-0000-0000-0000-000000000002', 'contact@example.com', 'sponsor', null, 1),
  ('00000000-0000-0000-0000-000000000003', 'admin@example.com',   'admin',   null, null);
