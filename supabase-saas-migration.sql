-- FC Autentic SaaS multi-club migration
-- Ruleaza in Supabase SQL Editor dupa schema existenta.
-- Scop: multi-tenant pe club_id, roluri SaaS, invitatii, abonamente si RLS pe club.

-- 1) Rol platforma in profiles. Text este folosit intentionat ca sa nu blocam schema veche app_role.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS platform_role text
  CHECK (platform_role IS NULL OR platform_role IN ('super_admin', 'club_owner', 'coach', 'player', 'parent', 'viewer'));

-- 2) Tabele SaaS
CREATE TABLE IF NOT EXISTS public.clubs (
  id text PRIMARY KEY,
  name text NOT NULL,
  logo_url text,
  city text,
  country text,
  email_contact text,
  phone text,
  description text,
  groups text[] NOT NULL DEFAULT ARRAY['U13', 'U16', 'U19', 'Juniori', 'Seniori'],
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
  blocked boolean NOT NULL DEFAULT false,
  plan_name text NOT NULL DEFAULT 'Free' CHECK (plan_name IN ('Free', 'Basic', 'Pro', 'Academy')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.clubs ALTER COLUMN created_by SET DEFAULT auth.uid();

CREATE TABLE IF NOT EXISTS public.club_memberships (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  club_id text NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('club_owner', 'coach', 'player', 'parent', 'viewer')),
  assigned_groups text[] NOT NULL DEFAULT '{}',
  player_id bigint REFERENCES public.players(id) ON DELETE SET NULL,
  child_player_ids bigint[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, club_id)
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id text PRIMARY KEY,
  club_id text NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE UNIQUE,
  plan_name text NOT NULL CHECK (plan_name IN ('Free', 'Basic', 'Pro', 'Academy')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trialing', 'past_due', 'expired', 'canceled')),
  max_players integer,
  started_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.club_invitations (
  id text PRIMARY KEY,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('club_owner', 'coach', 'player', 'parent', 'viewer')),
  club_id text NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  token text NOT NULL UNIQUE,
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3) club_id pe datele existente
INSERT INTO public.clubs (id, name, city, country, email_contact, phone, description, groups, status, blocked, plan_name)
VALUES ('club-fc-autentic', 'FC Autentic', 'Chisinau', 'Moldova', 'contact@fcautentic.md', '+373 600 00 000', 'Club migrat din aplicatia existenta.', ARRAY['U13','U16','U19','Juniori','Seniori'], 'active', false, 'Free')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.subscriptions (id, club_id, plan_name, status, max_players, started_at)
VALUES ('sub-fc-autentic-free', 'club-fc-autentic', 'Free', 'active', 20, now())
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.players ADD COLUMN IF NOT EXISTS club_id text REFERENCES public.clubs(id) ON DELETE CASCADE;
ALTER TABLE public.trainings ADD COLUMN IF NOT EXISTS club_id text REFERENCES public.clubs(id) ON DELETE CASCADE;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS club_id text REFERENCES public.clubs(id) ON DELETE CASCADE;
ALTER TABLE public.player_observations ADD COLUMN IF NOT EXISTS club_id text REFERENCES public.clubs(id) ON DELETE CASCADE;
ALTER TABLE public.training_payments ADD COLUMN IF NOT EXISTS club_id text REFERENCES public.clubs(id) ON DELETE CASCADE;
ALTER TABLE public.monthly_payments ADD COLUMN IF NOT EXISTS club_id text REFERENCES public.clubs(id) ON DELETE CASCADE;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS club_id text REFERENCES public.clubs(id) ON DELETE CASCADE;
ALTER TABLE public.club_events ADD COLUMN IF NOT EXISTS club_id text REFERENCES public.clubs(id) ON DELETE CASCADE;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS club_id text REFERENCES public.clubs(id) ON DELETE CASCADE;
ALTER TABLE public.equipment ADD COLUMN IF NOT EXISTS club_id text REFERENCES public.clubs(id) ON DELETE CASCADE;
ALTER TABLE public.player_evaluations ADD COLUMN IF NOT EXISTS club_id text REFERENCES public.clubs(id) ON DELETE CASCADE;
ALTER TABLE public.development_plans ADD COLUMN IF NOT EXISTS club_id text REFERENCES public.clubs(id) ON DELETE CASCADE;
ALTER TABLE public.discipline_records ADD COLUMN IF NOT EXISTS club_id text REFERENCES public.clubs(id) ON DELETE CASCADE;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS club_id text REFERENCES public.clubs(id) ON DELETE CASCADE;
ALTER TABLE public.media_gallery ADD COLUMN IF NOT EXISTS club_id text REFERENCES public.clubs(id) ON DELETE CASCADE;
ALTER TABLE public.scouting_players ADD COLUMN IF NOT EXISTS club_id text REFERENCES public.clubs(id) ON DELETE CASCADE;

UPDATE public.players SET club_id = 'club-fc-autentic' WHERE club_id IS NULL;
UPDATE public.trainings SET club_id = 'club-fc-autentic' WHERE club_id IS NULL;
UPDATE public.matches SET club_id = 'club-fc-autentic' WHERE club_id IS NULL;
UPDATE public.player_observations po SET club_id = p.club_id FROM public.players p WHERE po.player_id = p.id AND po.club_id IS NULL;
UPDATE public.training_payments tp SET club_id = t.club_id FROM public.trainings t WHERE tp.training_id = t.id AND tp.club_id IS NULL;
UPDATE public.monthly_payments mp SET club_id = p.club_id FROM public.players p WHERE mp.player_id = p.id AND mp.club_id IS NULL;
UPDATE public.transactions SET club_id = 'club-fc-autentic' WHERE club_id IS NULL;
UPDATE public.club_events SET club_id = 'club-fc-autentic' WHERE club_id IS NULL;
UPDATE public.documents SET club_id = 'club-fc-autentic' WHERE club_id IS NULL;
UPDATE public.equipment SET club_id = 'club-fc-autentic' WHERE club_id IS NULL;
UPDATE public.player_evaluations pe SET club_id = p.club_id FROM public.players p WHERE pe.player_id = p.id AND pe.club_id IS NULL;
UPDATE public.development_plans dp SET club_id = p.club_id FROM public.players p WHERE dp.player_id = p.id AND dp.club_id IS NULL;
UPDATE public.discipline_records dr SET club_id = p.club_id FROM public.players p WHERE dr.player_id = p.id AND dr.club_id IS NULL;
UPDATE public.chat_messages SET club_id = 'club-fc-autentic' WHERE club_id IS NULL;
UPDATE public.media_gallery SET club_id = 'club-fc-autentic' WHERE club_id IS NULL;
UPDATE public.scouting_players SET club_id = 'club-fc-autentic' WHERE club_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_players_club_id ON public.players(club_id);
CREATE INDEX IF NOT EXISTS idx_trainings_club_id ON public.trainings(club_id);
CREATE INDEX IF NOT EXISTS idx_matches_club_id ON public.matches(club_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user_club ON public.club_memberships(user_id, club_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.club_invitations(token);
CREATE INDEX IF NOT EXISTS idx_subscriptions_club_id ON public.subscriptions(club_id);

CREATE OR REPLACE FUNCTION public.fill_related_club_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.club_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  IF TG_TABLE_NAME IN ('player_observations', 'player_evaluations', 'development_plans', 'discipline_records', 'monthly_payments') THEN
    SELECT p.club_id INTO NEW.club_id
    FROM public.players p
    WHERE p.id = NEW.player_id;
  ELSIF TG_TABLE_NAME = 'training_payments' THEN
    SELECT t.club_id INTO NEW.club_id
    FROM public.trainings t
    WHERE t.id = NEW.training_id;
  END IF;

  IF NEW.club_id IS NULL THEN
    NEW.club_id := 'club-fc-autentic';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fill_player_observations_club_id ON public.player_observations;
CREATE TRIGGER trg_fill_player_observations_club_id BEFORE INSERT OR UPDATE ON public.player_observations
FOR EACH ROW EXECUTE FUNCTION public.fill_related_club_id();

DROP TRIGGER IF EXISTS trg_fill_training_payments_club_id ON public.training_payments;
CREATE TRIGGER trg_fill_training_payments_club_id BEFORE INSERT OR UPDATE ON public.training_payments
FOR EACH ROW EXECUTE FUNCTION public.fill_related_club_id();

DROP TRIGGER IF EXISTS trg_fill_monthly_payments_club_id ON public.monthly_payments;
CREATE TRIGGER trg_fill_monthly_payments_club_id BEFORE INSERT OR UPDATE ON public.monthly_payments
FOR EACH ROW EXECUTE FUNCTION public.fill_related_club_id();

DROP TRIGGER IF EXISTS trg_fill_player_evaluations_club_id ON public.player_evaluations;
CREATE TRIGGER trg_fill_player_evaluations_club_id BEFORE INSERT OR UPDATE ON public.player_evaluations
FOR EACH ROW EXECUTE FUNCTION public.fill_related_club_id();

DROP TRIGGER IF EXISTS trg_fill_development_plans_club_id ON public.development_plans;
CREATE TRIGGER trg_fill_development_plans_club_id BEFORE INSERT OR UPDATE ON public.development_plans
FOR EACH ROW EXECUTE FUNCTION public.fill_related_club_id();

DROP TRIGGER IF EXISTS trg_fill_discipline_records_club_id ON public.discipline_records;
CREATE TRIGGER trg_fill_discipline_records_club_id BEFORE INSERT OR UPDATE ON public.discipline_records
FOR EACH ROW EXECUTE FUNCTION public.fill_related_club_id();

-- 4) Helper functions RLS. SECURITY DEFINER evita recursia in policies pe club_memberships.
CREATE OR REPLACE FUNCTION public.current_user_is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.platform_role = 'super_admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.current_user_club_role(target_club_id text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cm.role
  FROM public.club_memberships cm
  WHERE cm.user_id = auth.uid()
    AND cm.club_id = target_club_id
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_user_has_club_role(target_club_id text, allowed_roles text[])
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.current_user_is_super_admin()
    OR EXISTS (
      SELECT 1
      FROM public.club_memberships cm
      WHERE cm.user_id = auth.uid()
        AND cm.club_id = target_club_id
        AND cm.role = ANY(allowed_roles)
    );
$$;

CREATE OR REPLACE FUNCTION public.current_user_can_read_club(target_club_id text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.current_user_is_super_admin()
    OR EXISTS (
      SELECT 1
      FROM public.club_memberships cm
      WHERE cm.user_id = auth.uid()
        AND cm.club_id = target_club_id
    );
$$;

CREATE OR REPLACE FUNCTION public.current_user_can_read_player(target_player_id bigint, target_club_id text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.current_user_is_super_admin()
    OR EXISTS (
      SELECT 1
      FROM public.club_memberships cm
      WHERE cm.user_id = auth.uid()
        AND cm.club_id = target_club_id
        AND (
          cm.role IN ('club_owner', 'coach')
          OR (cm.role = 'player' AND cm.player_id = target_player_id)
          OR (cm.role = 'parent' AND target_player_id = ANY(cm.child_player_ids))
        )
    );
$$;

CREATE OR REPLACE FUNCTION public.current_user_email()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM auth.users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.club_has_no_members(target_club_id text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.club_memberships cm WHERE cm.club_id = target_club_id
  );
$$;

CREATE OR REPLACE FUNCTION public.current_user_has_pending_invitation(target_club_id text, target_role text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.club_invitations ci
    WHERE ci.club_id = target_club_id
      AND ci.role = target_role
      AND ci.status = 'pending'
      AND lower(ci.email) = lower(public.current_user_email())
  );
$$;

CREATE OR REPLACE FUNCTION public.club_has_active_subscription(target_club_id text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.clubs c
    WHERE c.id = target_club_id AND (c.blocked = true OR c.status = 'blocked')
  )
  AND EXISTS (
    SELECT 1
    FROM public.subscriptions s
    WHERE s.club_id = target_club_id
      AND s.status IN ('active', 'trialing')
      AND (s.expires_at IS NULL OR s.expires_at >= now())
  );
$$;

REVOKE ALL ON FUNCTION public.current_user_is_super_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_user_club_role(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_user_has_club_role(text, text[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_user_can_read_club(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_user_can_read_player(bigint, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_user_email() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.club_has_no_members(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_user_has_pending_invitation(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.club_has_active_subscription(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_club_role(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_has_club_role(text, text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_can_read_club(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_can_read_player(bigint, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_email() TO authenticated;
GRANT EXECUTE ON FUNCTION public.club_has_no_members(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_has_pending_invitation(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.club_has_active_subscription(text) TO authenticated;

-- 5) Trigger: plan Free/Basic limiteaza jucatorii; abonament expirat blocheaza antrenamente noi.
CREATE OR REPLACE FUNCTION public.enforce_club_player_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  limit_players integer;
  current_players integer;
BEGIN
  IF NEW.club_id IS NULL THEN
    NEW.club_id := 'club-fc-autentic';
  END IF;

  IF NOT public.club_has_active_subscription(NEW.club_id) THEN
    RAISE EXCEPTION 'Clubul este blocat sau abonamentul este expirat.';
  END IF;

  SELECT s.max_players INTO limit_players
  FROM public.subscriptions s
  WHERE s.club_id = NEW.club_id
  LIMIT 1;

  IF limit_players IS NOT NULL THEN
    SELECT count(*) INTO current_players
    FROM public.players p
    WHERE p.club_id = NEW.club_id
      AND (TG_OP = 'INSERT' OR p.id <> NEW.id);

    IF current_players >= limit_players THEN
      RAISE EXCEPTION 'Limita de % jucatori pentru abonamentul curent a fost atinsa.', limit_players;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_club_player_limit ON public.players;
CREATE TRIGGER trg_enforce_club_player_limit
BEFORE INSERT OR UPDATE OF club_id ON public.players
FOR EACH ROW EXECUTE FUNCTION public.enforce_club_player_limit();

CREATE OR REPLACE FUNCTION public.enforce_training_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.club_id IS NULL THEN
    NEW.club_id := 'club-fc-autentic';
  END IF;
  IF NOT public.club_has_active_subscription(NEW.club_id) THEN
    RAISE EXCEPTION 'Nu poti crea antrenamente: club blocat sau abonament expirat.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_training_subscription ON public.trainings;
CREATE TRIGGER trg_enforce_training_subscription
BEFORE INSERT ON public.trainings
FOR EACH ROW EXECUTE FUNCTION public.enforce_training_subscription();

-- 6) RLS
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_invitations ENABLE ROW LEVEL SECURITY;

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

-- Drop policies vechi largi din schema initiala.
DROP POLICY IF EXISTS "players_role_select" ON public.players;
DROP POLICY IF EXISTS "players_admin_coach_write" ON public.players;
DROP POLICY IF EXISTS "trainings_role_select" ON public.trainings;
DROP POLICY IF EXISTS "trainings_admin_coach_write" ON public.trainings;
DROP POLICY IF EXISTS "attendance_role_select" ON public.attendance;
DROP POLICY IF EXISTS "attendance_admin_coach_write" ON public.attendance;
DROP POLICY IF EXISTS "club_role_read_matches" ON public.matches;
DROP POLICY IF EXISTS "club_admin_coach_manage_matches" ON public.matches;
DROP POLICY IF EXISTS "admin_coach_full_player_modules" ON public.player_observations;
DROP POLICY IF EXISTS "own_player_observations_read" ON public.player_observations;
DROP POLICY IF EXISTS "admin_full_finance" ON public.training_payments;
DROP POLICY IF EXISTS "admin_full_monthly_finance" ON public.monthly_payments;
DROP POLICY IF EXISTS "admin_full_transactions" ON public.transactions;
DROP POLICY IF EXISTS "admin_coach_manage_events" ON public.club_events;
DROP POLICY IF EXISTS "authenticated_read_club_events" ON public.club_events;
DROP POLICY IF EXISTS "admin_coach_manage_admin_modules" ON public.documents;
DROP POLICY IF EXISTS "authenticated_read_documents" ON public.documents;
DROP POLICY IF EXISTS "admin_coach_manage_equipment" ON public.equipment;
DROP POLICY IF EXISTS "admin_coach_manage_evaluations" ON public.player_evaluations;
DROP POLICY IF EXISTS "own_evaluations_read" ON public.player_evaluations;
DROP POLICY IF EXISTS "admin_coach_manage_plans" ON public.development_plans;
DROP POLICY IF EXISTS "admin_coach_manage_discipline" ON public.discipline_records;
DROP POLICY IF EXISTS "club_chat_read_write" ON public.chat_messages;
DROP POLICY IF EXISTS "admin_coach_manage_media" ON public.media_gallery;
DROP POLICY IF EXISTS "authenticated_read_media" ON public.media_gallery;
DROP POLICY IF EXISTS "admin_coach_manage_scouting" ON public.scouting_players;

-- Drop policies SaaS daca re-rulam.
DROP POLICY IF EXISTS "saas_clubs_read" ON public.clubs;
DROP POLICY IF EXISTS "saas_clubs_insert" ON public.clubs;
DROP POLICY IF EXISTS "saas_clubs_update" ON public.clubs;
DROP POLICY IF EXISTS "saas_memberships_read" ON public.club_memberships;
DROP POLICY IF EXISTS "saas_memberships_insert" ON public.club_memberships;
DROP POLICY IF EXISTS "saas_memberships_update" ON public.club_memberships;
DROP POLICY IF EXISTS "saas_subscriptions_read" ON public.subscriptions;
DROP POLICY IF EXISTS "saas_subscriptions_manage" ON public.subscriptions;
DROP POLICY IF EXISTS "saas_invitations_read" ON public.club_invitations;
DROP POLICY IF EXISTS "saas_invitations_manage" ON public.club_invitations;
DROP POLICY IF EXISTS "saas_invitations_accept_own" ON public.club_invitations;

CREATE POLICY "saas_clubs_read"
ON public.clubs FOR SELECT TO authenticated
USING (public.current_user_can_read_club(id) OR created_by = auth.uid());

CREATE POLICY "saas_clubs_insert"
ON public.clubs FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "saas_clubs_update"
ON public.clubs FOR UPDATE TO authenticated
USING (public.current_user_has_club_role(id, ARRAY['club_owner']) OR public.current_user_is_super_admin())
WITH CHECK (public.current_user_has_club_role(id, ARRAY['club_owner']) OR public.current_user_is_super_admin());

CREATE POLICY "saas_memberships_read"
ON public.club_memberships FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.current_user_has_club_role(club_id, ARRAY['club_owner']) OR public.current_user_is_super_admin());

CREATE POLICY "saas_memberships_insert"
ON public.club_memberships FOR INSERT TO authenticated
WITH CHECK (
  public.current_user_is_super_admin()
  OR public.current_user_has_club_role(club_id, ARRAY['club_owner'])
  OR (
    user_id = auth.uid()
    AND role = 'club_owner'
    AND public.club_has_no_members(club_id)
  )
  OR (
    user_id = auth.uid()
    AND public.current_user_has_pending_invitation(club_id, role)
  )
);

CREATE POLICY "saas_memberships_update"
ON public.club_memberships FOR UPDATE TO authenticated
USING (public.current_user_has_club_role(club_id, ARRAY['club_owner']) OR public.current_user_is_super_admin())
WITH CHECK (public.current_user_has_club_role(club_id, ARRAY['club_owner']) OR public.current_user_is_super_admin());

CREATE POLICY "saas_subscriptions_read"
ON public.subscriptions FOR SELECT TO authenticated
USING (public.current_user_has_club_role(club_id, ARRAY['club_owner']) OR public.current_user_is_super_admin());

CREATE POLICY "saas_subscriptions_manage"
ON public.subscriptions FOR ALL TO authenticated
USING (public.current_user_is_super_admin() OR public.current_user_has_club_role(club_id, ARRAY['club_owner']))
WITH CHECK (public.current_user_is_super_admin() OR public.current_user_has_club_role(club_id, ARRAY['club_owner']));

CREATE POLICY "saas_invitations_read"
ON public.club_invitations FOR SELECT TO authenticated
USING (
  public.current_user_has_club_role(club_id, ARRAY['club_owner'])
  OR public.current_user_is_super_admin()
  OR lower(email) = lower(public.current_user_email())
);

CREATE POLICY "saas_invitations_manage"
ON public.club_invitations FOR ALL TO authenticated
USING (public.current_user_has_club_role(club_id, ARRAY['club_owner']) OR public.current_user_is_super_admin())
WITH CHECK (public.current_user_has_club_role(club_id, ARRAY['club_owner']) OR public.current_user_is_super_admin());

CREATE POLICY "saas_invitations_accept_own"
ON public.club_invitations FOR UPDATE TO authenticated
USING (status = 'pending' AND lower(email) = lower(public.current_user_email()))
WITH CHECK (status IN ('pending', 'accepted') AND lower(email) = lower(public.current_user_email()));

-- Policies pentru tabelele existente
DROP POLICY IF EXISTS "saas_players_read" ON public.players;
DROP POLICY IF EXISTS "saas_players_manage" ON public.players;
CREATE POLICY "saas_players_read" ON public.players FOR SELECT TO authenticated
USING (public.current_user_can_read_player(id, club_id));
CREATE POLICY "saas_players_manage" ON public.players FOR ALL TO authenticated
USING (public.current_user_has_club_role(club_id, ARRAY['club_owner','coach']))
WITH CHECK (public.current_user_has_club_role(club_id, ARRAY['club_owner','coach']));

DROP POLICY IF EXISTS "saas_trainings_read" ON public.trainings;
DROP POLICY IF EXISTS "saas_trainings_manage" ON public.trainings;
CREATE POLICY "saas_trainings_read" ON public.trainings FOR SELECT TO authenticated
USING (public.current_user_can_read_club(club_id));
CREATE POLICY "saas_trainings_manage" ON public.trainings FOR ALL TO authenticated
USING (public.current_user_has_club_role(club_id, ARRAY['club_owner','coach']))
WITH CHECK (public.current_user_has_club_role(club_id, ARRAY['club_owner','coach']) AND public.club_has_active_subscription(club_id));

DROP POLICY IF EXISTS "saas_matches_read" ON public.matches;
DROP POLICY IF EXISTS "saas_matches_manage" ON public.matches;
CREATE POLICY "saas_matches_read" ON public.matches FOR SELECT TO authenticated
USING (public.current_user_can_read_club(club_id));
CREATE POLICY "saas_matches_manage" ON public.matches FOR ALL TO authenticated
USING (public.current_user_has_club_role(club_id, ARRAY['club_owner','coach']))
WITH CHECK (public.current_user_has_club_role(club_id, ARRAY['club_owner','coach']));

DROP POLICY IF EXISTS "saas_attendance_read" ON public.attendance;
DROP POLICY IF EXISTS "saas_attendance_manage" ON public.attendance;
CREATE POLICY "saas_attendance_read" ON public.attendance FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.trainings t WHERE t.id = training_id AND public.current_user_can_read_club(t.club_id)));
CREATE POLICY "saas_attendance_manage" ON public.attendance FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.trainings t WHERE t.id = training_id AND public.current_user_has_club_role(t.club_id, ARRAY['club_owner','coach'])))
WITH CHECK (EXISTS (SELECT 1 FROM public.trainings t WHERE t.id = training_id AND public.current_user_has_club_role(t.club_id, ARRAY['club_owner','coach'])));

DROP POLICY IF EXISTS "saas_observations_read" ON public.player_observations;
DROP POLICY IF EXISTS "saas_observations_manage" ON public.player_observations;
CREATE POLICY "saas_observations_read" ON public.player_observations FOR SELECT TO authenticated
USING (public.current_user_can_read_player(player_id, club_id));
CREATE POLICY "saas_observations_manage" ON public.player_observations FOR ALL TO authenticated
USING (public.current_user_has_club_role(club_id, ARRAY['club_owner','coach']))
WITH CHECK (public.current_user_has_club_role(club_id, ARRAY['club_owner','coach']));

DROP POLICY IF EXISTS "saas_finance_training_manage" ON public.training_payments;
DROP POLICY IF EXISTS "saas_finance_monthly_manage" ON public.monthly_payments;
DROP POLICY IF EXISTS "saas_transactions_manage" ON public.transactions;
CREATE POLICY "saas_finance_training_manage" ON public.training_payments FOR ALL TO authenticated
USING (public.current_user_has_club_role(club_id, ARRAY['club_owner']))
WITH CHECK (public.current_user_has_club_role(club_id, ARRAY['club_owner']));
CREATE POLICY "saas_finance_monthly_manage" ON public.monthly_payments FOR ALL TO authenticated
USING (public.current_user_has_club_role(club_id, ARRAY['club_owner']))
WITH CHECK (public.current_user_has_club_role(club_id, ARRAY['club_owner']));
CREATE POLICY "saas_transactions_manage" ON public.transactions FOR ALL TO authenticated
USING (public.current_user_has_club_role(club_id, ARRAY['club_owner']))
WITH CHECK (public.current_user_has_club_role(club_id, ARRAY['club_owner']));

DROP POLICY IF EXISTS "saas_club_events_read" ON public.club_events;
DROP POLICY IF EXISTS "saas_club_events_manage" ON public.club_events;
CREATE POLICY "saas_club_events_read" ON public.club_events FOR SELECT TO authenticated
USING (public.current_user_can_read_club(club_id));
CREATE POLICY "saas_club_events_manage" ON public.club_events FOR ALL TO authenticated
USING (public.current_user_has_club_role(club_id, ARRAY['club_owner','coach']))
WITH CHECK (public.current_user_has_club_role(club_id, ARRAY['club_owner','coach']));

DROP POLICY IF EXISTS "saas_documents_read" ON public.documents;
DROP POLICY IF EXISTS "saas_documents_manage" ON public.documents;
CREATE POLICY "saas_documents_read" ON public.documents FOR SELECT TO authenticated
USING (public.current_user_can_read_club(club_id));
CREATE POLICY "saas_documents_manage" ON public.documents FOR ALL TO authenticated
USING (public.current_user_has_club_role(club_id, ARRAY['club_owner','coach']))
WITH CHECK (public.current_user_has_club_role(club_id, ARRAY['club_owner','coach']));

DROP POLICY IF EXISTS "saas_equipment_manage" ON public.equipment;
CREATE POLICY "saas_equipment_manage" ON public.equipment FOR ALL TO authenticated
USING (public.current_user_has_club_role(club_id, ARRAY['club_owner','coach']))
WITH CHECK (public.current_user_has_club_role(club_id, ARRAY['club_owner','coach']));

DROP POLICY IF EXISTS "saas_evaluations_read" ON public.player_evaluations;
DROP POLICY IF EXISTS "saas_evaluations_manage" ON public.player_evaluations;
CREATE POLICY "saas_evaluations_read" ON public.player_evaluations FOR SELECT TO authenticated
USING (public.current_user_can_read_player(player_id, club_id));
CREATE POLICY "saas_evaluations_manage" ON public.player_evaluations FOR ALL TO authenticated
USING (public.current_user_has_club_role(club_id, ARRAY['club_owner','coach']))
WITH CHECK (public.current_user_has_club_role(club_id, ARRAY['club_owner','coach']));

DROP POLICY IF EXISTS "saas_development_read" ON public.development_plans;
DROP POLICY IF EXISTS "saas_development_manage" ON public.development_plans;
CREATE POLICY "saas_development_read" ON public.development_plans FOR SELECT TO authenticated
USING (public.current_user_can_read_player(player_id, club_id));
CREATE POLICY "saas_development_manage" ON public.development_plans FOR ALL TO authenticated
USING (public.current_user_has_club_role(club_id, ARRAY['club_owner','coach']))
WITH CHECK (public.current_user_has_club_role(club_id, ARRAY['club_owner','coach']));

DROP POLICY IF EXISTS "saas_discipline_read" ON public.discipline_records;
DROP POLICY IF EXISTS "saas_discipline_manage" ON public.discipline_records;
CREATE POLICY "saas_discipline_read" ON public.discipline_records FOR SELECT TO authenticated
USING (public.current_user_can_read_player(player_id, club_id));
CREATE POLICY "saas_discipline_manage" ON public.discipline_records FOR ALL TO authenticated
USING (public.current_user_has_club_role(club_id, ARRAY['club_owner','coach']))
WITH CHECK (public.current_user_has_club_role(club_id, ARRAY['club_owner','coach']));

DROP POLICY IF EXISTS "saas_chat_read_write" ON public.chat_messages;
CREATE POLICY "saas_chat_read_write" ON public.chat_messages FOR ALL TO authenticated
USING (public.current_user_can_read_club(club_id))
WITH CHECK (public.current_user_can_read_club(club_id));

DROP POLICY IF EXISTS "saas_media_read" ON public.media_gallery;
DROP POLICY IF EXISTS "saas_media_manage" ON public.media_gallery;
CREATE POLICY "saas_media_read" ON public.media_gallery FOR SELECT TO authenticated
USING (public.current_user_can_read_club(club_id));
CREATE POLICY "saas_media_manage" ON public.media_gallery FOR ALL TO authenticated
USING (public.current_user_has_club_role(club_id, ARRAY['club_owner','coach']))
WITH CHECK (public.current_user_has_club_role(club_id, ARRAY['club_owner','coach']));

DROP POLICY IF EXISTS "saas_scouting_manage" ON public.scouting_players;
CREATE POLICY "saas_scouting_manage" ON public.scouting_players FOR ALL TO authenticated
USING (public.current_user_has_club_role(club_id, ARRAY['club_owner','coach']))
WITH CHECK (public.current_user_has_club_role(club_id, ARRAY['club_owner','coach']));
