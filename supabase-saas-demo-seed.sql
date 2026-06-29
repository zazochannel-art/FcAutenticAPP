-- Date demo SaaS pentru FC Autentic
-- Inlocuieste YOUR_AUTH_USER_ID cu id-ul unui utilizator din auth.users.

INSERT INTO public.clubs (id, name, city, country, email_contact, phone, description, groups, status, blocked, plan_name)
VALUES
  ('club-fc-autentic', 'FC Autentic', 'Chisinau', 'Moldova', 'contact@fcautentic.md', '+373 600 00 000', 'Club demo pentru platforma SaaS.', ARRAY['U13','U16','U19','Seniori'], 'active', false, 'Free'),
  ('club-demo-academy', 'Demo Academy', 'Balti', 'Moldova', 'academy@example.com', '+373 601 11 222', 'Al doilea club pentru testarea izolarii multi-tenant.', ARRAY['U13','U16','U19'], 'active', false, 'Pro')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  city = EXCLUDED.city,
  country = EXCLUDED.country,
  email_contact = EXCLUDED.email_contact,
  phone = EXCLUDED.phone,
  description = EXCLUDED.description,
  groups = EXCLUDED.groups,
  status = EXCLUDED.status,
  blocked = EXCLUDED.blocked,
  plan_name = EXCLUDED.plan_name;

INSERT INTO public.subscriptions (id, club_id, plan_name, status, max_players, started_at, expires_at)
VALUES
  ('sub-fc-autentic-free', 'club-fc-autentic', 'Free', 'active', 20, now(), NULL),
  ('sub-demo-academy-pro', 'club-demo-academy', 'Pro', 'active', NULL, now(), NULL)
ON CONFLICT (id) DO UPDATE SET
  plan_name = EXCLUDED.plan_name,
  status = EXCLUDED.status,
  max_players = EXCLUDED.max_players,
  started_at = EXCLUDED.started_at,
  expires_at = EXCLUDED.expires_at;

-- Exemplu owner. Ruleaza dupa ce ai un user creat in Authentication.
-- INSERT INTO public.club_memberships (id, user_id, club_id, role, assigned_groups)
-- VALUES ('member-demo-owner', 'YOUR_AUTH_USER_ID', 'club-fc-autentic', 'club_owner', ARRAY['U13','U16','U19','Seniori'])
-- ON CONFLICT (user_id, club_id) DO UPDATE SET role = EXCLUDED.role, assigned_groups = EXCLUDED.assigned_groups;

INSERT INTO public.players (no, name, role, group_name, status, club_id)
VALUES
  (1, 'Victor Rusu', 'Portar', 'U19', 'Activ', 'club-fc-autentic'),
  (10, 'Alexandru Popa', 'Atacant', 'U16', 'Activ', 'club-fc-autentic'),
  (7, 'Demo Player', 'Mijlocas', 'U13', 'Activ', 'club-demo-academy')
ON CONFLICT DO NOTHING;

INSERT INTO public.trainings (state, date_label, time_label, location, group_name, coach, theme, objectives, equipment, exercises, steps, club_id)
VALUES
  ('Viitor', '5 iulie 2026', '18:30', 'Teren principal', 'U19', 'M. Rusu', 'Tranzitie pozitiva', 'Recuperare rapida si finalizare', 'Mingi, conuri, veste', 'Rondo, tranzitii, joc 8v8', ARRAY['Incalzire','Pase','Dribling','Suturi','Stretching'], 'club-fc-autentic'),
  ('Viitor', '6 iulie 2026', '17:00', 'Teren Demo', 'U13', 'Coach Demo', 'Control orientat', 'Prima atingere sub presiune', 'Mingi, jaloane', 'Tehnica individuala', ARRAY['Incalzire','Exercitii tehnice','Meci de antrenament'], 'club-demo-academy')
ON CONFLICT DO NOTHING;

INSERT INTO public.club_invitations (id, email, role, club_id, status, token)
VALUES
  ('invite-demo-coach', 'coach@example.com', 'coach', 'club-fc-autentic', 'pending', 'fc-demo-coach'),
  ('invite-demo-parent', 'parent@example.com', 'parent', 'club-fc-autentic', 'pending', 'fc-demo-parent')
ON CONFLICT (token) DO UPDATE SET status = EXCLUDED.status, role = EXCLUDED.role, email = EXCLUDED.email;
