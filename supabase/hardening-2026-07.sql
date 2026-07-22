-- ============================================================================
-- FC Autentic — întărire securitate (hardening) 2026-07
-- Rulează în Supabase SQL Editor. Idempotent, sigur de re-rulat.
-- Rezolvă avertismentele advisor-ului de securitate:
--   * clubs INSERT cu WITH CHECK (true)
--   * funcții SECURITY DEFINER de acțiune apelabile de rolul anon
-- ============================================================================

-- 1) Un utilizator nu poate atribui clubul altui utilizator. Acceptăm created_by
--    NULL (compatibil cu clientul care nu-l trimite explicit) sau egal cu
--    utilizatorul curent — dar nu id-ul altcuiva.
drop policy if exists "Utilizatorii pot crea cluburi" on public.clubs;
create policy "Utilizatorii pot crea cluburi" on public.clubs
  for insert to authenticated with check (created_by is null or created_by = auth.uid());

-- 2) Funcțiile de acțiune se apelează doar autentificat — le scoatem din anon.
--    ATENȚIE: nu atinge helper-ele current_user_* (sunt folosite în RLS și
--    trebuie să rămână executabile de authenticated).
revoke execute on function public.approve_club_member(uuid) from public, anon;
grant  execute on function public.approve_club_member(uuid) to authenticated;

revoke execute on function public.request_club_membership(text, text) from public, anon;
grant  execute on function public.request_club_membership(text, text) to authenticated;

revoke execute on function public.accept_club_invitation(text) from public, anon;
grant  execute on function public.accept_club_invitation(text) to authenticated;

revoke execute on function public.get_club_members(uuid) from public, anon;
grant  execute on function public.get_club_members(uuid) to authenticated;

-- 3) (Manual, din Dashboard) Activează „Leaked password protection”:
--    Authentication → Policies → Enable HaveIBeenPwned check.
