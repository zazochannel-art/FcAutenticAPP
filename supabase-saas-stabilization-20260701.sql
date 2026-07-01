-- FC Autentic SaaS stabilization
-- Applied to Supabase project yzsujfpapspbdqypkrmp on 2026-07-01.
-- Purpose:
-- 1) add missing SaaS tables/columns used by the app;
-- 2) add club_id to secondary modules;
-- 3) add helper functions for role checks;
-- 4) replace old broad policies on core tables with club-aware policies.

create extension if not exists pgcrypto;

alter table public.clubs add column if not exists logo_url text;
alter table public.clubs add column if not exists city text;
alter table public.clubs add column if not exists country text;
alter table public.clubs add column if not exists contact_email text;
alter table public.clubs add column if not exists phone text;
alter table public.clubs add column if not exists description text;
alter table public.clubs add column if not exists groups text[] not null default array['U13','U16','U19','Juniori','Seniori'];
alter table public.clubs add column if not exists status text not null default 'active';
alter table public.clubs add column if not exists blocked boolean not null default false;
alter table public.clubs add column if not exists primary_color text;
alter table public.clubs add column if not exists secondary_color text;

alter table public.club_memberships add column if not exists assigned_groups text[] not null default '{}';
alter table public.club_memberships add column if not exists status text not null default 'active';
alter table public.club_memberships add column if not exists joined_at timestamptz not null default now();

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists platform_role text;
update public.profiles p set email = au.email from auth.users au where p.id = au.id and p.email is null;
update public.profiles set platform_role = 'super_admin' where email = 'igor.gratii.99@mail.ru';

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  plan_name text not null default 'Free',
  status text not null default 'active',
  max_players integer,
  started_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique (club_id)
);

create table if not exists public.club_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role text not null,
  club_id uuid not null references public.clubs(id) on delete cascade,
  status text not null default 'pending',
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

insert into public.subscriptions (club_id, plan_name, status, max_players)
select c.id, coalesce(c.plan, 'Free'), 'active',
  case coalesce(c.plan, 'Free') when 'Free' then 20 when 'Basic' then 50 else null end
from public.clubs c
on conflict (club_id) do nothing;

do $$
declare
  t text;
  default_club uuid := '00000000-0000-0000-0000-000000000000'::uuid;
begin
  foreach t in array array[
    'club_events','documents','equipment','media_gallery','scouting_players','chat_messages',
    'transactions','player_observations','player_evaluations','development_plans',
    'discipline_records','training_payments','monthly_payments'
  ] loop
    execute format('alter table public.%I add column if not exists club_id uuid references public.clubs(id) on delete cascade', t);
    execute format('update public.%I set club_id = $1 where club_id is null', t) using default_club;
    execute format('create index if not exists idx_%I_club_id on public.%I(club_id)', t, t);
  end loop;
end $$;

update public.players set club_id = '00000000-0000-0000-0000-000000000000'::uuid where club_id is null;
update public.trainings set club_id = '00000000-0000-0000-0000-000000000000'::uuid where club_id is null;
update public.matches set club_id = '00000000-0000-0000-0000-000000000000'::uuid where club_id is null;
update public.training_payments tp set club_id = t.club_id from public.trainings t where tp.training_id = t.id and tp.club_id is null;
update public.monthly_payments mp set club_id = p.club_id from public.players p where mp.player_id = p.id and mp.club_id is null;

create index if not exists idx_players_club_id on public.players(club_id);
create index if not exists idx_trainings_club_id on public.trainings(club_id);
create index if not exists idx_matches_club_id on public.matches(club_id);
create index if not exists idx_memberships_user_club on public.club_memberships(user_id, club_id);
create index if not exists idx_subscriptions_club_id on public.subscriptions(club_id);
create index if not exists idx_invitations_club_id on public.club_invitations(club_id);

alter table public.subscriptions enable row level security;
alter table public.club_invitations enable row level security;

create or replace function public.current_user_platform_role()
returns text language sql security definer set search_path = public stable as $$
  select coalesce((select platform_role from public.profiles where id = auth.uid()), '')
$$;

create or replace function public.current_user_is_super_admin()
returns boolean language sql security definer set search_path = public stable as $$
  select public.current_user_platform_role() = 'super_admin'
$$;

create or replace function public.current_user_has_club_role(target_club_id uuid, allowed_roles text[])
returns boolean language sql security definer set search_path = public stable as $$
  select public.current_user_is_super_admin()
    or exists (
      select 1 from public.club_memberships cm
      where cm.club_id = target_club_id
        and cm.user_id = auth.uid()
        and cm.status = 'active'
        and cm.role = any(allowed_roles)
    )
$$;

create or replace function public.current_user_can_read_club(target_club_id uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select public.current_user_is_super_admin()
    or exists (
      select 1 from public.club_memberships cm
      where cm.club_id = target_club_id
        and cm.user_id = auth.uid()
        and cm.status = 'active'
    )
$$;

create or replace function public.current_user_player_id()
returns bigint language sql security definer set search_path = public stable as $$
  select player_id from public.profiles where id = auth.uid()
$$;

create or replace function public.current_user_child_player_id()
returns bigint language sql security definer set search_path = public stable as $$
  select child_player_id from public.profiles where id = auth.uid()
$$;

create or replace function public.current_user_can_read_player(target_player_id bigint, target_club_id uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select public.current_user_has_club_role(target_club_id, array['club_owner','admin','coach'])
    or target_player_id = public.current_user_player_id()
    or target_player_id = public.current_user_child_player_id()
$$;

-- Full RLS policy definitions were applied live and should be kept in sync with this migration
-- if the database is recreated. See the current pg_policies output for exact policy state.
