-- ============================================================================
-- Hardening: închide accesul RPC direct la funcțiile interne + politica clubs
-- Rulează în Supabase SQL Editor. Idempotent.
--
-- Rezolvă avertismentele:
--   - „Public/Signed-In Users Can Execute SECURITY DEFINER Function"
--   - „RLS Policy Always True" pe public.clubs (INSERT)
-- ============================================================================

-- 1) Funcții folosite DOAR în interiorul politicilor RLS / triggerelor.
--    Execuția lor prin /rest/v1/rpc/... nu e necesară pentru aplicație, deci
--    o revocăm complet (anon + authenticated). Politicile RLS continuă să le
--    apeleze fără probleme (rulează cu privilegiile owner-ului).
revoke execute on function public.current_user_can_read_club(uuid) from anon, authenticated;
revoke execute on function public.current_user_can_read_player(bigint, uuid) from anon, authenticated;
revoke execute on function public.current_user_child_player_id() from anon, authenticated;
revoke execute on function public.current_user_has_club_role(uuid, text[]) from anon, authenticated;
revoke execute on function public.current_user_is_super_admin() from anon, authenticated;
revoke execute on function public.current_user_platform_role() from anon, authenticated;
revoke execute on function public.current_user_player_id() from anon, authenticated;
revoke execute on function public.realtime_broadcast_all_changes() from anon, authenticated;

-- 2) Funcții apelate legitim din aplicație prin rpc(): rămân disponibile pentru
--    utilizatorii autentificați, dar închidem accesul anonim.
revoke execute on function public.delete_my_account() from anon;
revoke execute on function public.get_club_members(uuid) from anon;
revoke execute on function public.approve_club_member(uuid) from anon;
revoke execute on function public.accept_club_invitation(text) from anon;
revoke execute on function public.request_club_membership(text, text) from anon;

-- 3) Politica de INSERT pe clubs: nu mai lăsăm WITH CHECK (true). Un utilizator
--    poate crea un club doar dacă created_by e al lui (sau NULL, completat de client).
drop policy if exists "Utilizatorii pot crea cluburi" on public.clubs;
create policy "Utilizatorii pot crea cluburi" on public.clubs
  for insert to authenticated
  with check (created_by is null or created_by = auth.uid());
