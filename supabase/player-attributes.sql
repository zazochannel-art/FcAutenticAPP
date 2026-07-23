-- ============================================================================
-- Atribute jucători: rating general + poziții secundare
-- Rulează în Supabase SQL Editor. Idempotent.
-- ============================================================================
alter table public.players add column if not exists rating integer;
alter table public.players add column if not exists secondary_positions text[] not null default '{}';

-- Constrângere opțională: rating între 1 și 99 dacă e setat.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'players_rating_range'
  ) then
    alter table public.players
      add constraint players_rating_range
      check (rating is null or (rating >= 1 and rating <= 99));
  end if;
end $$;
