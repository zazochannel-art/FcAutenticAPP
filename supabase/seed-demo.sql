-- Date demo SaaS pentru FC Autentic — compatibile cu supabase/schema.sql.
-- Înlocuiește YOUR_AUTH_USER_ID cu id-ul unui utilizator din auth.users
-- înainte de a rula blocul de membership.

INSERT INTO public.clubs (id, name, city, country, contact_email, phone, description, groups, status, blocked, plan)
VALUES
  ('00000000-0000-0000-0000-000000000000', 'FC Autentic', 'Chisinau', 'Moldova', 'contact@fcautentic.md', '+373 600 00 000', 'Club demo pentru platforma SaaS.', ARRAY['U13','U16','U19','Juniori','Seniori'], 'active', false, 'Free'),
  ('11111111-1111-1111-1111-111111111111', 'Demo Academy', 'Balti', 'Moldova', 'academy@example.com', '+373 601 11 222', 'Al doilea club pentru testarea izolarii multi-tenant.', ARRAY['U13','U16','U19'], 'active', false, 'Pro')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  city = EXCLUDED.city,
  country = EXCLUDED.country,
  contact_email = EXCLUDED.contact_email,
  phone = EXCLUDED.phone,
  description = EXCLUDED.description,
  groups = EXCLUDED.groups,
  status = EXCLUDED.status,
  blocked = EXCLUDED.blocked,
  plan = EXCLUDED.plan;

INSERT INTO public.subscriptions (club_id, plan_name, status, max_players, started_at, expires_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', 'Free', 'active', 20, now(), NULL),
  ('11111111-1111-1111-1111-111111111111', 'Pro', 'active', NULL, now(), NULL)
ON CONFLICT (club_id) DO UPDATE SET
  plan_name = EXCLUDED.plan_name,
  status = EXCLUDED.status,
  max_players = EXCLUDED.max_players,
  started_at = EXCLUDED.started_at,
  expires_at = EXCLUDED.expires_at;

-- Membership de club_owner pentru utilizatorul tău (decomentează și completează):
-- INSERT INTO public.club_memberships (user_id, club_id, role, assigned_groups, status)
-- VALUES ('YOUR_AUTH_USER_ID', '00000000-0000-0000-0000-000000000000', 'club_owner', ARRAY['U13','U16','U19','Juniori','Seniori'], 'active');
