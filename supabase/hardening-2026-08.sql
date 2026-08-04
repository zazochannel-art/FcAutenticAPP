-- Întărire și performanță, august 2026.
--
-- Rulează-l o singură dată, în editorul SQL din Supabase. Fiecare bucată e
-- idempotentă, deci nu strică nimic dacă îl rulezi din nou.
--
-- Pornește de la ce au raportat consultanții proiectului: funcții cu drepturi
-- de proprietar apelabile din exterior, chei străine fără index și limita de
-- jucători din abonament care nu era impusă nicăieri.


-- ---------------------------------------------------------------------------
-- 1. Funcții care nu trebuie apelate din API
-- ---------------------------------------------------------------------------
-- `realtime_broadcast_all_changes` e o funcție de declanșator: se execută
-- singură la modificarea tabelelor. Nu are ce căuta ca punct de acces public,
-- iar acum putea fi apelată chiar și fără autentificare.
REVOKE ALL ON FUNCTION public.realtime_broadcast_all_changes() FROM anon, authenticated;

-- Helperele de mai jos sunt folosite *în interiorul* politicilor de acces.
-- Politicile rulează cu drepturile lor proprii, deci nu au nevoie ca cineva
-- nelogat să le poată apela prin `/rest/v1/rpc/...`.
REVOKE ALL ON FUNCTION public.current_user_platform_role() FROM anon;
REVOKE ALL ON FUNCTION public.current_user_is_super_admin() FROM anon;
REVOKE ALL ON FUNCTION public.current_user_player_id() FROM anon;
REVOKE ALL ON FUNCTION public.current_user_child_player_id() FROM anon;
REVOKE ALL ON FUNCTION public.current_user_can_read_club(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.current_user_can_read_player(bigint, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.current_user_has_club_role(uuid, text[]) FROM anon;


-- ---------------------------------------------------------------------------
-- 2. Indexuri pentru cheile străine
-- ---------------------------------------------------------------------------
-- 25 de chei străine nu aveau index care să le acopere. Se simte la ștergeri
-- și la orice filtrare după coloanele astea — `attendance.player_id` e cea mai
-- folosită dintre toate.
CREATE INDEX IF NOT EXISTS idx_attendance_player_id ON public.attendance (player_id);
CREATE INDEX IF NOT EXISTS idx_attendance_updated_by ON public.attendance (updated_by);
CREATE INDEX IF NOT EXISTS idx_chat_messages_author_id ON public.chat_messages (author_id);
CREATE INDEX IF NOT EXISTS idx_club_events_created_by ON public.club_events (created_by);
CREATE INDEX IF NOT EXISTS idx_club_invitations_invited_by ON public.club_invitations (invited_by);
CREATE INDEX IF NOT EXISTS idx_club_tasks_created_by ON public.club_tasks (created_by);
CREATE INDEX IF NOT EXISTS idx_clubs_created_by ON public.clubs (created_by);
CREATE INDEX IF NOT EXISTS idx_development_plans_updated_by ON public.development_plans (updated_by);
CREATE INDEX IF NOT EXISTS idx_discipline_records_created_by ON public.discipline_records (created_by);
CREATE INDEX IF NOT EXISTS idx_discipline_records_player_id ON public.discipline_records (player_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_by ON public.documents (created_by);
CREATE INDEX IF NOT EXISTS idx_equipment_created_by ON public.equipment (created_by);
CREATE INDEX IF NOT EXISTS idx_matches_created_by ON public.matches (created_by);
CREATE INDEX IF NOT EXISTS idx_media_gallery_created_by ON public.media_gallery (created_by);
CREATE INDEX IF NOT EXISTS idx_monthly_payments_player_id ON public.monthly_payments (player_id);
CREATE INDEX IF NOT EXISTS idx_monthly_payments_updated_by ON public.monthly_payments (updated_by);
CREATE INDEX IF NOT EXISTS idx_player_evaluations_updated_by ON public.player_evaluations (updated_by);
CREATE INDEX IF NOT EXISTS idx_player_observations_author_id ON public.player_observations (author_id);
CREATE INDEX IF NOT EXISTS idx_player_observations_player_id ON public.player_observations (player_id);
CREATE INDEX IF NOT EXISTS idx_scouting_players_created_by ON public.scouting_players (created_by);
CREATE INDEX IF NOT EXISTS idx_tactics_created_by ON public.tactics (created_by);
CREATE INDEX IF NOT EXISTS idx_training_payments_player_id ON public.training_payments (player_id);
CREATE INDEX IF NOT EXISTS idx_training_payments_updated_by ON public.training_payments (updated_by);
CREATE INDEX IF NOT EXISTS idx_trainings_created_by ON public.trainings (created_by);
CREATE INDEX IF NOT EXISTS idx_transactions_created_by ON public.transactions (created_by);


-- ---------------------------------------------------------------------------
-- 3. Limita de jucători din abonament
-- ---------------------------------------------------------------------------
-- `max_players` se salva și se afișa, dar nimic nu o impunea: pe planul Free se
-- puteau adăuga oricâți jucători. Aplicația verifică acum înainte să trimită,
-- dar verificarea din interfață poate fi ocolită — plasa de siguranță stă aici.
--
-- `max_players` NULL înseamnă „fără limită”.
CREATE OR REPLACE FUNCTION public.enforce_player_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  limit_value integer;
  current_count integer;
BEGIN
  SELECT s.max_players INTO limit_value
  FROM public.subscriptions s
  WHERE s.club_id = NEW.club_id
    AND s.status = 'active'
  ORDER BY s.created_at DESC NULLS LAST
  LIMIT 1;

  IF limit_value IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT count(*) INTO current_count
  FROM public.players p
  WHERE p.club_id = NEW.club_id;

  IF current_count >= limit_value THEN
    RAISE EXCEPTION
      'Planul clubului permite % jucători, iar clubul are deja %.',
      limit_value, current_count
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_player_limit() FROM anon, authenticated;

DROP TRIGGER IF EXISTS players_enforce_limit ON public.players;
CREATE TRIGGER players_enforce_limit
  BEFORE INSERT ON public.players
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_player_limit();


-- ---------------------------------------------------------------------------
-- 4. Rămâne de făcut din panoul Supabase, nu din SQL
-- ---------------------------------------------------------------------------
-- Protecția împotriva parolelor compromise (verificare la HaveIBeenPwned) e
-- oprită. Se aprinde din Authentication → Policies, nu se poate din SQL.
--
-- Tot din consultanți, dar lăsate deoparte pentru că schimbă reguli de acces și
-- merită făcute pe îndelete, nu într-un lot:
--   • 12 politici care evaluează `auth.uid()` pentru fiecare rând în loc o
--     singură dată — se rezolvă înfășurând apelul: `(select auth.uid())`.
--   • 25 de perechi de politici permisive care se suprapun pe același tabel și
--     aceeași acțiune; unificate, ar înjumătăți munca la fiecare citire.
