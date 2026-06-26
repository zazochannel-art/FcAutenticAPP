-- FC Autentic: Supabase Auth + roluri + RLS
-- Rulează acest fișier în Supabase SQL Editor după ce creezi proiectul.
-- Script idempotent: poate fi rulat de mai multe ori fără erori de duplicate.
-- IMPORTANT: folosește cheia anon/publishable în aplicație, niciodată service_role.

-- 1) Tip rol aplicație
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typnamespace = 'public'::regnamespace AND typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'coach', 'player', 'parent');
  END IF;
END $$;

-- 2) Tabele de bază
CREATE TABLE IF NOT EXISTS public.players (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  no integer NOT NULL DEFAULT 0,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'Jucător',
  group_name text NOT NULL DEFAULT 'U19',
  status text NOT NULL DEFAULT 'Activ',
  birthdate text,
  foot text,
  parent_phone text,
  medical_status text,
  allergies text,
  emergency_contact text,
  medical_expires text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  role public.app_role NOT NULL DEFAULT 'player',
  assigned_groups text[] NOT NULL DEFAULT '{}',
  player_id bigint REFERENCES public.players(id) ON DELETE SET NULL,
  child_player_id bigint REFERENCES public.players(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.trainings (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  state text NOT NULL DEFAULT 'Viitor',
  date_label text NOT NULL,
  time_label text NOT NULL,
  location text NOT NULL,
  group_name text NOT NULL,
  coach text NOT NULL,
  theme text,
  objectives text,
  equipment text,
  exercises text,
  steps text[] NOT NULL DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.attendance (
  training_id bigint REFERENCES public.trainings(id) ON DELETE CASCADE,
  player_id bigint REFERENCES public.players(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('present', 'absent', 'late', 'injured', 'excused')),
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (training_id, player_id)
);

CREATE TABLE IF NOT EXISTS public.matches (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  type text NOT NULL DEFAULT 'Meci oficial',
  opponent text NOT NULL,
  group_name text NOT NULL,
  date_label text NOT NULL,
  time_label text NOT NULL,
  location text NOT NULL,
  status text NOT NULL DEFAULT 'Programat',
  score text,
  notes text,
  post_notes text,
  stats text,
  call_ups jsonb NOT NULL DEFAULT '{}',
  scorers jsonb NOT NULL DEFAULT '{}',
  player_stats jsonb NOT NULL DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.player_observations (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  player_id bigint NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  type text NOT NULL,
  source text,
  date_label text,
  author_id uuid REFERENCES auth.users(id),
  author_name text,
  note text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.training_payments (
  training_id bigint REFERENCES public.trainings(id) ON DELETE CASCADE,
  player_id bigint REFERENCES public.players(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  paid boolean NOT NULL DEFAULT false,
  paid_at text,
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (training_id, player_id)
);

CREATE TABLE IF NOT EXISTS public.monthly_payments (
  month_label text NOT NULL,
  group_name text NOT NULL,
  player_id bigint REFERENCES public.players(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  paid boolean NOT NULL DEFAULT false,
  paid_at text,
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (month_label, group_name, player_id)
);

CREATE TABLE IF NOT EXISTS public.transactions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  label text NOT NULL,
  value numeric NOT NULL,
  positive boolean NOT NULL DEFAULT true,
  date_label text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.club_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  type text NOT NULL,
  date_label text NOT NULL,
  time_label text,
  detail text,
  group_name text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.documents (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title text NOT NULL,
  owner text,
  type text,
  status text,
  expires text,
  file_url text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.equipment (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  category text,
  total integer NOT NULL DEFAULT 0,
  assigned text,
  missing integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.player_evaluations (
  player_id bigint REFERENCES public.players(id) ON DELETE CASCADE,
  month_label text NOT NULL,
  technique integer NOT NULL DEFAULT 0,
  speed integer NOT NULL DEFAULT 0,
  discipline integer NOT NULL DEFAULT 0,
  attitude integer NOT NULL DEFAULT 0,
  tactics integer NOT NULL DEFAULT 0,
  physical integer NOT NULL DEFAULT 0,
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (player_id, month_label)
);

CREATE TABLE IF NOT EXISTS public.development_plans (
  player_id bigint PRIMARY KEY REFERENCES public.players(id) ON DELETE CASCADE,
  focus text,
  objective text,
  exercises text,
  status text,
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.discipline_records (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  player_id bigint REFERENCES public.players(id) ON DELETE CASCADE,
  type text NOT NULL,
  note text,
  date_label text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  audience text NOT NULL,
  author_id uuid REFERENCES auth.users(id),
  author_name text,
  text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.media_gallery (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  type text,
  title text NOT NULL,
  url text,
  date_label text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.scouting_players (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  age text,
  role text,
  notes text,
  decision text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3) Migrare pentru tabele deja create mai vechi
ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS birthdate text,
  ADD COLUMN IF NOT EXISTS foot text,
  ADD COLUMN IF NOT EXISTS parent_phone text,
  ADD COLUMN IF NOT EXISTS medical_status text,
  ADD COLUMN IF NOT EXISTS allergies text,
  ADD COLUMN IF NOT EXISTS emergency_contact text,
  ADD COLUMN IF NOT EXISTS medical_expires text;

-- 4) Funcții helper fără recursie RLS.
-- Aceste funcții SECURITY DEFINER citesc profilul utilizatorului fără să declanșeze policy-uri recursive pe profiles.
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.current_user_groups()
RETURNS text[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(assigned_groups, '{}') FROM public.profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.current_user_player_id()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT player_id FROM public.profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.current_user_child_player_id()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT child_player_id FROM public.profiles WHERE id = auth.uid()
$$;

REVOKE ALL ON FUNCTION public.current_user_role() FROM public;
REVOKE ALL ON FUNCTION public.current_user_groups() FROM public;
REVOKE ALL ON FUNCTION public.current_user_player_id() FROM public;
REVOKE ALL ON FUNCTION public.current_user_child_player_id() FROM public;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_groups() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_player_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_child_player_id() TO authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_player_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_player_id bigint;
  player_group text;
BEGIN
  player_group := COALESCE(NULLIF(new.raw_user_meta_data->>'group_name', ''), 'U19');

  INSERT INTO public.players (no, name, role, group_name, status)
  VALUES (
    COALESCE(NULLIF(new.raw_user_meta_data->>'player_no', '')::integer, 0),
    COALESCE(NULLIF(new.raw_user_meta_data->>'full_name', ''), split_part(new.email, '@', 1)),
    COALESCE(NULLIF(new.raw_user_meta_data->>'player_position', ''), 'Jucător'),
    player_group,
    'Activ'
  )
  RETURNING id INTO new_player_id;

  INSERT INTO public.profiles (id, full_name, role, assigned_groups, player_id)
  VALUES (
    new.id,
    COALESCE(NULLIF(new.raw_user_meta_data->>'full_name', ''), split_part(new.email, '@', 1)),
    'player',
    ARRAY[player_group],
    new_player_id
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_player_signup() FROM public, anon, authenticated;
DROP TRIGGER IF EXISTS on_auth_user_created_fc_autentic ON auth.users;
CREATE TRIGGER on_auth_user_created_fc_autentic
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_player_signup();

-- 5) RLS activat
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.development_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discipline_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scouting_players ENABLE ROW LEVEL SECURITY;

-- 6) Curățare policy-uri existente pentru rulare repetată
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_manage" ON public.profiles;
DROP POLICY IF EXISTS "players_role_select" ON public.players;
DROP POLICY IF EXISTS "players_admin_coach_write" ON public.players;
DROP POLICY IF EXISTS "trainings_role_select" ON public.trainings;
DROP POLICY IF EXISTS "trainings_admin_coach_write" ON public.trainings;
DROP POLICY IF EXISTS "attendance_role_select" ON public.attendance;
DROP POLICY IF EXISTS "attendance_admin_coach_write" ON public.attendance;
DROP POLICY IF EXISTS "club_admin_coach_manage_matches" ON public.matches;
DROP POLICY IF EXISTS "club_role_read_matches" ON public.matches;
DROP POLICY IF EXISTS "admin_coach_full_player_modules" ON public.player_observations;
DROP POLICY IF EXISTS "own_player_observations_read" ON public.player_observations;
DROP POLICY IF EXISTS "admin_full_finance" ON public.training_payments;
DROP POLICY IF EXISTS "admin_full_monthly_finance" ON public.monthly_payments;
DROP POLICY IF EXISTS "admin_full_transactions" ON public.transactions;
DROP POLICY IF EXISTS "admin_coach_manage_events" ON public.club_events;
DROP POLICY IF EXISTS "admin_coach_manage_admin_modules" ON public.documents;
DROP POLICY IF EXISTS "admin_coach_manage_equipment" ON public.equipment;
DROP POLICY IF EXISTS "admin_coach_manage_evaluations" ON public.player_evaluations;
DROP POLICY IF EXISTS "own_evaluations_read" ON public.player_evaluations;
DROP POLICY IF EXISTS "admin_coach_manage_plans" ON public.development_plans;
DROP POLICY IF EXISTS "admin_coach_manage_discipline" ON public.discipline_records;
DROP POLICY IF EXISTS "club_chat_read_write" ON public.chat_messages;
DROP POLICY IF EXISTS "admin_coach_manage_media" ON public.media_gallery;
DROP POLICY IF EXISTS "admin_coach_manage_scouting" ON public.scouting_players;
DROP POLICY IF EXISTS "authenticated_read_club_events" ON public.club_events;
DROP POLICY IF EXISTS "authenticated_read_documents" ON public.documents;
DROP POLICY IF EXISTS "authenticated_read_media" ON public.media_gallery;

-- 7) Policy-uri fără recursie pe profiles
CREATE POLICY "profiles_select_own_or_admin"
ON public.profiles FOR SELECT
TO authenticated
USING (id = auth.uid() OR public.current_user_role() = 'admin');

CREATE POLICY "profiles_admin_manage"
ON public.profiles FOR ALL
TO authenticated
USING (public.current_user_role() = 'admin')
WITH CHECK (public.current_user_role() = 'admin');

CREATE POLICY "players_role_select"
ON public.players FOR SELECT
TO authenticated
USING (
  public.current_user_role() = 'admin'
  OR (public.current_user_role() = 'coach' AND group_name = ANY(public.current_user_groups()))
  OR id = public.current_user_player_id()
  OR id = public.current_user_child_player_id()
);

CREATE POLICY "players_admin_coach_write"
ON public.players FOR ALL
TO authenticated
USING (
  public.current_user_role() = 'admin'
  OR (public.current_user_role() = 'coach' AND group_name = ANY(public.current_user_groups()))
)
WITH CHECK (
  public.current_user_role() = 'admin'
  OR (public.current_user_role() = 'coach' AND group_name = ANY(public.current_user_groups()))
);

CREATE POLICY "trainings_role_select"
ON public.trainings FOR SELECT
TO authenticated
USING (
  public.current_user_role() = 'admin'
  OR (public.current_user_role() = 'coach' AND group_name = ANY(public.current_user_groups()))
  OR group_name = (SELECT group_name FROM public.players WHERE id = public.current_user_player_id())
  OR group_name = (SELECT group_name FROM public.players WHERE id = public.current_user_child_player_id())
);

CREATE POLICY "trainings_admin_coach_write"
ON public.trainings FOR ALL
TO authenticated
USING (
  public.current_user_role() = 'admin'
  OR (public.current_user_role() = 'coach' AND group_name = ANY(public.current_user_groups()))
)
WITH CHECK (
  public.current_user_role() = 'admin'
  OR (public.current_user_role() = 'coach' AND group_name = ANY(public.current_user_groups()))
);

CREATE POLICY "attendance_role_select"
ON public.attendance FOR SELECT
TO authenticated
USING (
  public.current_user_role() = 'admin'
  OR EXISTS (
    SELECT 1 FROM public.players p
    WHERE p.id = attendance.player_id
      AND (
        (public.current_user_role() = 'coach' AND p.group_name = ANY(public.current_user_groups()))
        OR p.id = public.current_user_player_id()
        OR p.id = public.current_user_child_player_id()
      )
  )
);

CREATE POLICY "attendance_admin_coach_write"
ON public.attendance FOR ALL
TO authenticated
USING (
  public.current_user_role() = 'admin'
  OR EXISTS (
    SELECT 1 FROM public.players p
    WHERE p.id = attendance.player_id
      AND public.current_user_role() = 'coach'
      AND p.group_name = ANY(public.current_user_groups())
  )
)
WITH CHECK (
  public.current_user_role() = 'admin'
  OR EXISTS (
    SELECT 1 FROM public.players p
    WHERE p.id = attendance.player_id
      AND public.current_user_role() = 'coach'
      AND p.group_name = ANY(public.current_user_groups())
  )
);

CREATE POLICY "club_role_read_matches"
ON public.matches FOR SELECT
TO authenticated
USING (
  public.current_user_role() = 'admin'
  OR (public.current_user_role() = 'coach' AND group_name = ANY(public.current_user_groups()))
  OR group_name = (SELECT group_name FROM public.players WHERE id = public.current_user_player_id())
  OR group_name = (SELECT group_name FROM public.players WHERE id = public.current_user_child_player_id())
);

CREATE POLICY "club_admin_coach_manage_matches"
ON public.matches FOR ALL
TO authenticated
USING (
  public.current_user_role() = 'admin'
  OR (public.current_user_role() = 'coach' AND group_name = ANY(public.current_user_groups()))
)
WITH CHECK (
  public.current_user_role() = 'admin'
  OR (public.current_user_role() = 'coach' AND group_name = ANY(public.current_user_groups()))
);

CREATE POLICY "admin_coach_full_player_modules"
ON public.player_observations FOR ALL
TO authenticated
USING (public.current_user_role() IN ('admin','coach'))
WITH CHECK (public.current_user_role() IN ('admin','coach'));

CREATE POLICY "own_player_observations_read"
ON public.player_observations FOR SELECT
TO authenticated
USING (
  player_id = public.current_user_player_id()
  OR player_id = public.current_user_child_player_id()
  OR public.current_user_role() IN ('admin','coach')
);

CREATE POLICY "admin_full_finance"
ON public.training_payments FOR ALL
TO authenticated
USING (public.current_user_role() = 'admin')
WITH CHECK (public.current_user_role() = 'admin');

CREATE POLICY "admin_full_monthly_finance"
ON public.monthly_payments FOR ALL
TO authenticated
USING (public.current_user_role() = 'admin')
WITH CHECK (public.current_user_role() = 'admin');

CREATE POLICY "admin_full_transactions"
ON public.transactions FOR ALL
TO authenticated
USING (public.current_user_role() = 'admin')
WITH CHECK (public.current_user_role() = 'admin');

CREATE POLICY "admin_coach_manage_events"
ON public.club_events FOR ALL
TO authenticated
USING (public.current_user_role() IN ('admin','coach'))
WITH CHECK (public.current_user_role() IN ('admin','coach'));

CREATE POLICY "authenticated_read_club_events"
ON public.club_events FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "admin_coach_manage_admin_modules"
ON public.documents FOR ALL
TO authenticated
USING (public.current_user_role() IN ('admin','coach'))
WITH CHECK (public.current_user_role() IN ('admin','coach'));

CREATE POLICY "authenticated_read_documents"
ON public.documents FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "admin_coach_manage_equipment"
ON public.equipment FOR ALL
TO authenticated
USING (public.current_user_role() IN ('admin','coach'))
WITH CHECK (public.current_user_role() IN ('admin','coach'));

CREATE POLICY "admin_coach_manage_evaluations"
ON public.player_evaluations FOR ALL
TO authenticated
USING (public.current_user_role() IN ('admin','coach'))
WITH CHECK (public.current_user_role() IN ('admin','coach'));

CREATE POLICY "own_evaluations_read"
ON public.player_evaluations FOR SELECT
TO authenticated
USING (
  player_id = public.current_user_player_id()
  OR player_id = public.current_user_child_player_id()
  OR public.current_user_role() IN ('admin','coach')
);

CREATE POLICY "admin_coach_manage_plans"
ON public.development_plans FOR ALL
TO authenticated
USING (public.current_user_role() IN ('admin','coach'))
WITH CHECK (public.current_user_role() IN ('admin','coach'));

CREATE POLICY "admin_coach_manage_discipline"
ON public.discipline_records FOR ALL
TO authenticated
USING (public.current_user_role() IN ('admin','coach'))
WITH CHECK (public.current_user_role() IN ('admin','coach'));

CREATE POLICY "club_chat_read_write"
ON public.chat_messages FOR ALL
TO authenticated
USING (true)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "admin_coach_manage_media"
ON public.media_gallery FOR ALL
TO authenticated
USING (public.current_user_role() IN ('admin','coach'))
WITH CHECK (public.current_user_role() IN ('admin','coach'));

CREATE POLICY "authenticated_read_media"
ON public.media_gallery FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "admin_coach_manage_scouting"
ON public.scouting_players FOR ALL
TO authenticated
USING (public.current_user_role() IN ('admin','coach'))
WITH CHECK (public.current_user_role() IN ('admin','coach'));

-- 8) Util după ce creezi primul user în Auth:
-- update public.profiles set role = 'admin', assigned_groups = array['U13','U16','U19','Juniori'] where id = '<USER_UUID>';
