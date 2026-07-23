-- ============================================================================
-- Tactici (tactics board) — tabel, RLS și realtime
-- Rulează acest fișier în Supabase SQL Editor (proiectul aplicației).
-- Este idempotent: îl poți rula de mai multe ori fără efecte secundare.
-- ============================================================================

-- 1) Tabel -------------------------------------------------------------------
create table if not exists public.tactics (
  id bigint generated always as identity primary key,
  name text not null,
  formation text not null default '4-3-3',
  is_published boolean not null default false,
  -- { slotId: playerId } — jucătorul de pe fiecare poziție din primul 11
  assignments jsonb not null default '{}'::jsonb,
  -- [playerId, ...] — rezervele de pe bancă
  subs jsonb not null default '[]'::jsonb,
  captain_id bigint,
  -- { penalty, freekick, corner } — executanții fazelor fixe
  set_pieces jsonb not null default '{}'::jsonb,
  -- { mentality, style, width, defensiveLine, pressing, tempo }
  team_instructions jsonb not null default '{}'::jsonb,
  -- { playerId: { role, runs, ... } }
  player_instructions jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  club_id uuid references public.clubs(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tactics_club_id on public.tactics(club_id);

-- 2) RLS ---------------------------------------------------------------------
alter table public.tactics enable row level security;

-- Staff-ul (owner/admin/coach) vede toate tacticile clubului; ceilalți membri
-- (jucători/părinți/viewer) văd doar tacticile publicate ale clubului lor.
drop policy if exists tactics_select_saas on public.tactics;
create policy tactics_select_saas on public.tactics
  for select to authenticated using (
    public.current_user_has_club_role(club_id, array['club_owner','admin','coach'])
    or (is_published and public.current_user_can_read_club(club_id))
  );

-- Doar staff-ul poate crea/modifica/șterge tactici.
drop policy if exists tactics_write_saas on public.tactics;
create policy tactics_write_saas on public.tactics
  for all to authenticated
  using (public.current_user_has_club_role(club_id, array['club_owner','admin','coach']))
  with check (public.current_user_has_club_role(club_id, array['club_owner','admin','coach']));

-- 3) Realtime ----------------------------------------------------------------
drop trigger if exists realtime_broadcast_tactics on public.tactics;
create trigger realtime_broadcast_tactics
  after insert or update or delete on public.tactics
  for each row execute function public.realtime_broadcast_all_changes();
