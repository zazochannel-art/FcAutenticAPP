-- ============================================================================
-- FC Autentic — fix creare club (RLS)
-- Rulează în Supabase SQL Editor. Idempotent, sigur de re-rulat.
--
-- Cauză: createClub face insert().select() ca să obțină id-ul clubului nou.
-- RETURNING-ul cere o politică de SELECT care să vadă rândul nou, dar
-- politicile existente cer o apartenență activă — care încă nu există la
-- momentul creării. Rezultat: „new row violates row-level security policy”.
-- ============================================================================

-- 1) INSERT: acceptă created_by NULL (default-ul coloanei) sau egal cu
--    utilizatorul curent; interzice atribuirea clubului altcuiva.
drop policy if exists "Utilizatorii pot crea cluburi" on public.clubs;
create policy "Utilizatorii pot crea cluburi" on public.clubs
  for insert to authenticated
  with check (created_by is null or created_by = auth.uid());

-- 2) SELECT: creatorul își poate citi propriul club imediat după creare,
--    înainte ca membership-ul de owner să fie inserat. Asta face să meargă
--    insert().select() din createClub.
drop policy if exists clubs_select_own_created on public.clubs;
create policy clubs_select_own_created on public.clubs
  for select to authenticated
  using (created_by = auth.uid());
