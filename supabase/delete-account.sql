-- ============================================================================
-- FC Autentic — ștergerea contului propriu
-- Rulează în Supabase SQL Editor. Idempotent, sigur de re-rulat.
--
-- Funcție SECURITY DEFINER care șterge contul utilizatorului curent din
-- auth.users. Ștergerea cascadează pe profil și apartenențe (FK on delete
-- cascade). Rândurile de jucător din lot NU se șterg (rămân la club).
-- ============================================================================

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Autentificare necesară.';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
