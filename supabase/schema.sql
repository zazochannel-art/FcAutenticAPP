-- ============================================================================
-- FC Autentic — schema consolidată Supabase
-- Generată din baza de date live (proiect yzsujfpapspbdqypkrmp) la 2026-07-20.
-- Înlocuiește vechile fișiere: supabase-schema.sql, supabase-saas-migration.sql,
-- supabase-saas-stabilization-20260701.sql.
--
-- Script idempotent: poate fi rulat pe o bază goală pentru a o recrea complet,
-- sau re-rulat fără erori de duplicate.
-- IMPORTANT: în aplicație se folosește doar cheia anon, niciodată service_role.
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- 1) Tipuri
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_type
    where typnamespace = 'public'::regnamespace and typname = 'app_role'
  ) then
    create type public.app_role as enum ('admin', 'coach', 'player', 'parent');
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- 2) Tabele multi-tenant (SaaS)
-- ----------------------------------------------------------------------------
create table if not exists public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan text default 'Free',
  logo_url text,
  city text,
  country text,
  contact_email text,
  phone text,
  description text,
  groups text[] not null default array['U13','U16','U19','Juniori','Seniori'],
  status text not null default 'active',
  blocked boolean not null default false,
  primary_color text,
  secondary_color text,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz default now()
);

create table if not exists public.club_memberships (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references public.clubs(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null default 'admin',
  assigned_groups text[] not null default '{}',
  status text not null default 'active',
  joined_at timestamptz not null default now()
);

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

-- ----------------------------------------------------------------------------
-- 3) Tabele de bază
-- ----------------------------------------------------------------------------
create table if not exists public.players (
  id bigint generated always as identity primary key,
  no integer not null default 0,
  name text not null,
  role text not null default 'Jucător',
  group_name text not null default 'U19',
  status text not null default 'Activ',
  birthdate text,
  foot text,
  parent_phone text,
  medical_status text,
  allergies text,
  emergency_contact text,
  medical_expires text,
  club_id uuid references public.clubs(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role public.app_role not null default 'player',
  assigned_groups text[] not null default '{}',
  player_id bigint references public.players(id) on delete set null,
  child_player_id bigint references public.players(id) on delete set null,
  email text,
  platform_role text,
  created_at timestamptz not null default now()
);

create table if not exists public.trainings (
  id bigint generated always as identity primary key,
  state text not null default 'Viitor',
  date_label text not null,
  time_label text not null,
  location text not null,
  group_name text not null,
  coach text not null,
  theme text,
  objectives text,
  equipment text,
  exercises text,
  steps text[] not null default '{}',
  created_by uuid references auth.users(id),
  club_id uuid references public.clubs(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.attendance (
  training_id bigint references public.trainings(id) on delete cascade,
  player_id bigint references public.players(id) on delete cascade,
  status text not null check (status in ('present','absent','late','injured','excused')),
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  primary key (training_id, player_id)
);

create table if not exists public.matches (
  id bigint generated always as identity primary key,
  type text not null default 'Meci oficial',
  opponent text not null,
  group_name text not null,
  date_label text not null,
  time_label text not null,
  location text not null,
  status text not null default 'Programat',
  score text,
  notes text,
  post_notes text,
  stats text,
  call_ups jsonb not null default '{}',
  scorers jsonb not null default '{}',
  player_stats jsonb not null default '{}',
  created_by uuid references auth.users(id),
  club_id uuid references public.clubs(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.player_observations (
  id bigint generated always as identity primary key,
  player_id bigint not null references public.players(id) on delete cascade,
  type text not null,
  source text,
  date_label text,
  author_id uuid references auth.users(id),
  author_name text,
  note text not null,
  club_id uuid references public.clubs(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.training_payments (
  training_id bigint references public.trainings(id) on delete cascade,
  player_id bigint references public.players(id) on delete cascade,
  amount numeric not null default 0,
  paid boolean not null default false,
  paid_at text,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  club_id uuid references public.clubs(id) on delete cascade,
  primary key (training_id, player_id)
);

create table if not exists public.monthly_payments (
  month_label text not null,
  group_name text not null,
  player_id bigint references public.players(id) on delete cascade,
  amount numeric not null default 0,
  paid boolean not null default false,
  paid_at text,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  club_id uuid references public.clubs(id) on delete cascade,
  primary key (month_label, group_name, player_id)
);

create table if not exists public.transactions (
  id bigint generated always as identity primary key,
  label text not null,
  value numeric not null,
  positive boolean not null default true,
  date_label text,
  created_by uuid references auth.users(id),
  club_id uuid references public.clubs(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.club_events (
  id bigint generated always as identity primary key,
  type text not null,
  date_label text not null,
  time_label text,
  detail text,
  group_name text,
  created_by uuid references auth.users(id),
  club_id uuid references public.clubs(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.documents (
  id bigint generated always as identity primary key,
  title text not null,
  owner text,
  type text,
  status text,
  expires text,
  file_url text,
  created_by uuid references auth.users(id),
  club_id uuid references public.clubs(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.equipment (
  id bigint generated always as identity primary key,
  name text not null,
  category text,
  total integer not null default 0,
  assigned text,
  missing integer not null default 0,
  created_by uuid references auth.users(id),
  club_id uuid references public.clubs(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.player_evaluations (
  player_id bigint references public.players(id) on delete cascade,
  month_label text not null,
  technique integer not null default 0,
  speed integer not null default 0,
  discipline integer not null default 0,
  attitude integer not null default 0,
  tactics integer not null default 0,
  physical integer not null default 0,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  club_id uuid references public.clubs(id) on delete cascade,
  primary key (player_id, month_label)
);

create table if not exists public.development_plans (
  player_id bigint primary key references public.players(id) on delete cascade,
  focus text,
  objective text,
  exercises text,
  status text,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  club_id uuid references public.clubs(id) on delete cascade
);

create table if not exists public.discipline_records (
  id bigint generated always as identity primary key,
  player_id bigint references public.players(id) on delete cascade,
  type text not null,
  note text,
  date_label text,
  created_by uuid references auth.users(id),
  club_id uuid references public.clubs(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id bigint generated always as identity primary key,
  audience text not null,
  author_id uuid references auth.users(id),
  author_name text,
  text text not null,
  club_id uuid references public.clubs(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.media_gallery (
  id bigint generated always as identity primary key,
  type text,
  title text not null,
  url text,
  date_label text,
  created_by uuid references auth.users(id),
  club_id uuid references public.clubs(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.club_tasks (
  id bigint generated always as identity primary key,
  title text not null,
  detail text,
  priority text not null default 'NORMAL' check (priority in ('URGENT','MEDIU','NORMAL')),
  due_label text,
  assignee text,
  done boolean not null default false,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.scouting_players (
  id bigint generated always as identity primary key,
  name text not null,
  age text,
  role text,
  notes text,
  decision text,
  created_by uuid references auth.users(id),
  club_id uuid references public.clubs(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 4) Indexuri
-- ----------------------------------------------------------------------------
create index if not exists idx_players_club_id on public.players(club_id);
create index if not exists idx_trainings_club_id on public.trainings(club_id);
create index if not exists idx_matches_club_id on public.matches(club_id);
create index if not exists idx_memberships_user_club on public.club_memberships(user_id, club_id);
create unique index if not exists uq_club_memberships_user_club on public.club_memberships(user_id, club_id);
create index if not exists idx_subscriptions_club_id on public.subscriptions(club_id);
create index if not exists idx_invitations_club_id on public.club_invitations(club_id);
create index if not exists idx_club_events_club_id on public.club_events(club_id);
create index if not exists idx_documents_club_id on public.documents(club_id);
create index if not exists idx_equipment_club_id on public.equipment(club_id);
create index if not exists idx_media_gallery_club_id on public.media_gallery(club_id);
create index if not exists idx_scouting_players_club_id on public.scouting_players(club_id);
create index if not exists idx_chat_messages_club_id on public.chat_messages(club_id);
create index if not exists idx_transactions_club_id on public.transactions(club_id);
create index if not exists idx_player_observations_club_id on public.player_observations(club_id);
create index if not exists idx_player_evaluations_club_id on public.player_evaluations(club_id);
create index if not exists idx_development_plans_club_id on public.development_plans(club_id);
create index if not exists idx_discipline_records_club_id on public.discipline_records(club_id);
create index if not exists idx_training_payments_club_id on public.training_payments(club_id);
create index if not exists idx_monthly_payments_club_id on public.monthly_payments(club_id);
create index if not exists idx_club_tasks_club_id on public.club_tasks(club_id);

-- ----------------------------------------------------------------------------
-- 5) Funcții helper (roluri și acces)
-- ----------------------------------------------------------------------------
create or replace function public.my_role()
returns text language sql stable set search_path = public as $$
  select role::text from public.profiles where id = auth.uid()
$$;

create or replace function public.my_groups()
returns text[] language sql stable set search_path = public as $$
  select assigned_groups from public.profiles where id = auth.uid()
$$;

create or replace function public.current_profile()
returns public.profiles language sql stable set search_path = public as $$
  select * from public.profiles where id = (select auth.uid())
$$;

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

create or replace function public.upsert_evaluation(
  p_player_id bigint, p_month_label text, p_technique integer, p_speed integer,
  p_discipline integer, p_attitude integer, p_tactics integer, p_physical integer
) returns void language plpgsql set search_path = public as $$
begin
  insert into public.player_evaluations
    (player_id, month_label, technique, speed, discipline, attitude, tactics, physical, updated_at)
  values
    (p_player_id, p_month_label, p_technique, p_speed, p_discipline, p_attitude, p_tactics, p_physical, now())
  on conflict (player_id, month_label)
  do update set
    technique  = excluded.technique,
    speed      = excluded.speed,
    discipline = excluded.discipline,
    attitude   = excluded.attitude,
    tactics    = excluded.tactics,
    physical   = excluded.physical,
    updated_at = now();
end;
$$;

-- ----------------------------------------------------------------------------
-- 6) Trigger de signup: rând de jucător doar pentru înregistrările de jucători
--    (metadata cu group_name/player_position), legat de clubul implicit;
--    celelalte conturi primesc doar profil.
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_player_signup()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  new_player_id bigint;
  player_group text;
  display_name text;
begin
  display_name := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));

  if (new.raw_user_meta_data ? 'player_position') or (new.raw_user_meta_data ? 'group_name') then
    player_group := coalesce(new.raw_user_meta_data->>'group_name', 'U19');

    insert into public.players (no, name, role, group_name, status, club_id)
    values (
      coalesce(nullif(new.raw_user_meta_data->>'player_no', '')::integer, 0),
      display_name,
      coalesce(new.raw_user_meta_data->>'player_position', 'Jucător'),
      player_group,
      'Activ',
      '00000000-0000-0000-0000-000000000000'::uuid
    )
    returning id into new_player_id;

    insert into public.profiles (id, full_name, role, assigned_groups, player_id, email)
    values (new.id, display_name, 'player', array[player_group], new_player_id, new.email);
  else
    insert into public.profiles (id, full_name, role, assigned_groups, email)
    values (new.id, display_name, 'player', '{}', new.email);
  end if;

  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- 6b) Alăturarea la un club: acceptare invitație prin cod și cerere pending
-- ----------------------------------------------------------------------------
create or replace function public.accept_club_invitation(invite_token text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  inv record;
  user_email text;
begin
  if auth.uid() is null then
    raise exception 'Autentificare necesară.';
  end if;
  select email into user_email from auth.users where id = auth.uid();

  select * into inv from public.club_invitations where token = trim(invite_token) and status = 'pending';
  if not found then
    raise exception 'Codul de invitație nu este valid sau a fost deja folosit.';
  end if;
  if inv.expires_at is not null and inv.expires_at < now() then
    update public.club_invitations set status = 'expired' where id = inv.id;
    raise exception 'Invitația a expirat.';
  end if;
  if lower(inv.email) is distinct from lower(coalesce(user_email, '')) then
    raise exception 'Invitația a fost emisă pentru altă adresă de email.';
  end if;

  insert into public.club_memberships (user_id, club_id, role, status)
  values (auth.uid(), inv.club_id, inv.role, 'active')
  on conflict (user_id, club_id)
  do update set role = excluded.role, status = 'active';

  update public.club_invitations set status = 'accepted' where id = inv.id;
  return jsonb_build_object('club_id', inv.club_id, 'role', inv.role);
end $$;

create or replace function public.request_club_membership(target_club_name text, desired_role text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  target record;
  safe_role text;
begin
  if auth.uid() is null then
    raise exception 'Autentificare necesară.';
  end if;
  select id, name into target from public.clubs
  where lower(name) = lower(trim(target_club_name))
  limit 1;
  if not found then
    raise exception 'Nu am găsit un club cu acest nume.';
  end if;
  safe_role := case when desired_role = any(array['player','parent','coach','staff']) then desired_role else 'player' end;

  insert into public.club_memberships (user_id, club_id, role, status)
  values (auth.uid(), target.id, safe_role, 'pending')
  on conflict (user_id, club_id) do nothing;

  return jsonb_build_object('club_id', target.id, 'club_name', target.name, 'status', 'pending');
end $$;

drop trigger if exists on_auth_user_created_fc_autentic on auth.users;
create trigger on_auth_user_created_fc_autentic
  after insert on auth.users
  for each row execute function public.handle_new_player_signup();

-- ----------------------------------------------------------------------------
-- 7) Realtime broadcast pe toate tabelele aplicației
-- ----------------------------------------------------------------------------
create or replace function public.realtime_broadcast_all_changes()
returns trigger language plpgsql security definer set search_path = public, realtime as $$
declare
  v_topic text;
begin
  v_topic := TG_TABLE_SCHEMA || ':' || TG_TABLE_NAME;

  perform realtime.broadcast_changes(
    v_topic, TG_OP, TG_OP, TG_TABLE_NAME, TG_TABLE_SCHEMA, NEW, OLD
  );

  return coalesce(NEW, OLD);
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles','players','trainings','attendance','matches','player_observations',
    'training_payments','monthly_payments','transactions','club_events','documents',
    'equipment','player_evaluations','development_plans','discipline_records',
    'chat_messages','media_gallery','scouting_players','club_tasks'
  ] loop
    execute format('drop trigger if exists realtime_broadcast_%I on public.%I', t, t);
    execute format(
      'create trigger realtime_broadcast_%I after insert or update or delete on public.%I for each row execute function public.realtime_broadcast_all_changes()',
      t, t
    );
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- 8) Row Level Security
-- ----------------------------------------------------------------------------
alter table public.clubs enable row level security;
alter table public.club_memberships enable row level security;
alter table public.subscriptions enable row level security;
alter table public.club_invitations enable row level security;
alter table public.profiles enable row level security;
alter table public.players enable row level security;
alter table public.trainings enable row level security;
alter table public.attendance enable row level security;
alter table public.matches enable row level security;
alter table public.player_observations enable row level security;
alter table public.training_payments enable row level security;
alter table public.monthly_payments enable row level security;
alter table public.transactions enable row level security;
alter table public.club_events enable row level security;
alter table public.documents enable row level security;
alter table public.equipment enable row level security;
alter table public.player_evaluations enable row level security;
alter table public.development_plans enable row level security;
alter table public.discipline_records enable row level security;
alter table public.chat_messages enable row level security;
alter table public.media_gallery enable row level security;
alter table public.scouting_players enable row level security;
alter table public.club_tasks enable row level security;

-- profiles
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated using (id = auth.uid());

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated using (id = auth.uid() or public.my_role() = 'admin');

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert to authenticated with check (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles
  for all to authenticated using (public.my_role() = 'admin') with check (public.my_role() = 'admin');

drop policy if exists profiles_super_admin_saas on public.profiles;
create policy profiles_super_admin_saas on public.profiles
  for all to authenticated using (public.current_user_is_super_admin()) with check (public.current_user_is_super_admin());

-- clubs
drop policy if exists "Utilizatorii pot crea cluburi" on public.clubs;
create policy "Utilizatorii pot crea cluburi" on public.clubs
  for insert to authenticated with check (true);

drop policy if exists "Utilizatorii pot vedea cluburile proprii" on public.clubs;
create policy "Utilizatorii pot vedea cluburile proprii" on public.clubs
  for select to authenticated using (
    id in (select club_id from public.club_memberships where user_id = auth.uid())
  );

drop policy if exists clubs_select_saas on public.clubs;
create policy clubs_select_saas on public.clubs
  for select to authenticated using (public.current_user_can_read_club(id));

drop policy if exists clubs_update_saas on public.clubs;
create policy clubs_update_saas on public.clubs
  for update to authenticated
  using (public.current_user_has_club_role(id, array['club_owner']) or public.current_user_is_super_admin())
  with check (public.current_user_has_club_role(id, array['club_owner']) or public.current_user_is_super_admin());

-- club_memberships
-- Insert-ul este restricționat: creatorul clubului își adaugă membership-ul de
-- club_owner, restul utilizatorilor pot doar cere alăturarea (pending, rol
-- neprivilegiat). Update-ul este rezervat ownerilor/super adminilor, ca un
-- utilizator să nu-și poată escalada singur rolul sau statusul.
drop policy if exists "Utilizatorii pot vedea apartenențele proprii" on public.club_memberships;
create policy "Utilizatorii pot vedea apartenențele proprii" on public.club_memberships
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists memberships_select_saas on public.club_memberships;
create policy memberships_select_saas on public.club_memberships
  for select to authenticated using (
    user_id = auth.uid()
    or public.current_user_has_club_role(club_id, array['club_owner'])
    or public.current_user_is_super_admin()
  );

drop policy if exists "Utilizatorii pot adăuga apartenențe" on public.club_memberships;
drop policy if exists memberships_write_saas on public.club_memberships;

drop policy if exists memberships_insert_saas on public.club_memberships;
create policy memberships_insert_saas on public.club_memberships
  for insert to authenticated
  with check (
    (auth.uid() = user_id and role = 'club_owner' and status = 'active'
      and exists (select 1 from public.clubs c where c.id = club_id and c.created_by = auth.uid()))
    or (auth.uid() = user_id and status = 'pending' and role = any(array['player','parent','coach','staff']))
    or public.current_user_has_club_role(club_id, array['club_owner'])
    or public.current_user_is_super_admin()
  );

drop policy if exists memberships_update_saas on public.club_memberships;
create policy memberships_update_saas on public.club_memberships
  for update to authenticated
  using (public.current_user_has_club_role(club_id, array['club_owner']) or public.current_user_is_super_admin())
  with check (public.current_user_has_club_role(club_id, array['club_owner']) or public.current_user_is_super_admin());

drop policy if exists memberships_delete_saas on public.club_memberships;
create policy memberships_delete_saas on public.club_memberships
  for delete to authenticated
  using (user_id = auth.uid() or public.current_user_has_club_role(club_id, array['club_owner']) or public.current_user_is_super_admin());

-- subscriptions
drop policy if exists subscriptions_select_saas on public.subscriptions;
create policy subscriptions_select_saas on public.subscriptions
  for select to authenticated using (
    public.current_user_has_club_role(club_id, array['club_owner']) or public.current_user_is_super_admin()
  );

drop policy if exists subscriptions_write_saas on public.subscriptions;
create policy subscriptions_write_saas on public.subscriptions
  for all to authenticated
  using (public.current_user_has_club_role(club_id, array['club_owner']) or public.current_user_is_super_admin())
  with check (public.current_user_has_club_role(club_id, array['club_owner']) or public.current_user_is_super_admin());

-- club_invitations
drop policy if exists invitations_select_saas on public.club_invitations;
create policy invitations_select_saas on public.club_invitations
  for select to authenticated using (
    public.current_user_has_club_role(club_id, array['club_owner'])
    or public.current_user_is_super_admin()
    or email = (select email from public.profiles where id = auth.uid())
  );

drop policy if exists invitations_write_saas on public.club_invitations;
create policy invitations_write_saas on public.club_invitations
  for all to authenticated
  using (public.current_user_has_club_role(club_id, array['club_owner']) or public.current_user_is_super_admin())
  with check (public.current_user_has_club_role(club_id, array['club_owner']) or public.current_user_is_super_admin());

-- players
drop policy if exists players_select_saas on public.players;
create policy players_select_saas on public.players
  for select to authenticated using (public.current_user_can_read_player(id, club_id));

drop policy if exists players_insert_saas on public.players;
create policy players_insert_saas on public.players
  for insert to authenticated with check (
    public.current_user_has_club_role(club_id, array['club_owner','admin','coach'])
  );

drop policy if exists players_update_saas on public.players;
create policy players_update_saas on public.players
  for update to authenticated
  using (public.current_user_has_club_role(club_id, array['club_owner','admin','coach']))
  with check (public.current_user_has_club_role(club_id, array['club_owner','admin','coach']));

drop policy if exists players_delete_saas on public.players;
create policy players_delete_saas on public.players
  for delete to authenticated using (
    public.current_user_has_club_role(club_id, array['club_owner','admin'])
  );

-- trainings
drop policy if exists trainings_select_saas on public.trainings;
create policy trainings_select_saas on public.trainings
  for select to authenticated using (public.current_user_can_read_club(club_id));

drop policy if exists trainings_write_saas on public.trainings;
create policy trainings_write_saas on public.trainings
  for all to authenticated
  using (public.current_user_has_club_role(club_id, array['club_owner','admin','coach']))
  with check (public.current_user_has_club_role(club_id, array['club_owner','admin','coach']));

-- attendance
drop policy if exists attendance_select_saas on public.attendance;
create policy attendance_select_saas on public.attendance
  for select to authenticated using (
    exists (
      select 1 from public.trainings t
      where t.id = attendance.training_id
        and (
          public.current_user_has_club_role(t.club_id, array['club_owner','admin','coach'])
          or attendance.player_id = public.current_user_player_id()
          or attendance.player_id = public.current_user_child_player_id()
        )
    )
  );

drop policy if exists attendance_write_saas on public.attendance;
create policy attendance_write_saas on public.attendance
  for all to authenticated
  using (
    exists (
      select 1 from public.trainings t
      where t.id = attendance.training_id
        and public.current_user_has_club_role(t.club_id, array['club_owner','admin','coach'])
    )
  )
  with check (
    exists (
      select 1 from public.trainings t
      where t.id = attendance.training_id
        and public.current_user_has_club_role(t.club_id, array['club_owner','admin','coach'])
    )
  );

-- matches
drop policy if exists matches_select_saas on public.matches;
create policy matches_select_saas on public.matches
  for select to authenticated using (public.current_user_can_read_club(club_id));

drop policy if exists matches_write_saas on public.matches;
create policy matches_write_saas on public.matches
  for all to authenticated
  using (public.current_user_has_club_role(club_id, array['club_owner','admin','coach']))
  with check (public.current_user_has_club_role(club_id, array['club_owner','admin','coach']));

-- player_observations
drop policy if exists observations_select_saas on public.player_observations;
create policy observations_select_saas on public.player_observations
  for select to authenticated using (public.current_user_can_read_player(player_id, club_id));

drop policy if exists observations_write_saas on public.player_observations;
create policy observations_write_saas on public.player_observations
  for all to authenticated
  using (public.current_user_has_club_role(club_id, array['club_owner','admin','coach']))
  with check (public.current_user_has_club_role(club_id, array['club_owner','admin','coach']));

-- training_payments
drop policy if exists training_payments_select_saas on public.training_payments;
create policy training_payments_select_saas on public.training_payments
  for select to authenticated using (
    public.current_user_has_club_role(club_id, array['club_owner','admin','coach'])
    or player_id = public.current_user_player_id()
    or player_id = public.current_user_child_player_id()
  );

drop policy if exists training_payments_write_saas on public.training_payments;
create policy training_payments_write_saas on public.training_payments
  for all to authenticated
  using (public.current_user_has_club_role(club_id, array['club_owner','admin','coach']))
  with check (public.current_user_has_club_role(club_id, array['club_owner','admin','coach']));

-- monthly_payments
drop policy if exists monthly_payments_select_saas on public.monthly_payments;
create policy monthly_payments_select_saas on public.monthly_payments
  for select to authenticated using (
    public.current_user_has_club_role(club_id, array['club_owner','admin','coach'])
    or player_id = public.current_user_player_id()
    or player_id = public.current_user_child_player_id()
  );

drop policy if exists monthly_payments_write_saas on public.monthly_payments;
create policy monthly_payments_write_saas on public.monthly_payments
  for all to authenticated
  using (public.current_user_has_club_role(club_id, array['club_owner','admin','coach']))
  with check (public.current_user_has_club_role(club_id, array['club_owner','admin','coach']));

-- transactions
drop policy if exists transactions_select_saas on public.transactions;
create policy transactions_select_saas on public.transactions
  for select to authenticated using (
    public.current_user_has_club_role(club_id, array['club_owner','admin'])
  );

drop policy if exists transactions_write_saas on public.transactions;
create policy transactions_write_saas on public.transactions
  for all to authenticated
  using (public.current_user_has_club_role(club_id, array['club_owner','admin']))
  with check (public.current_user_has_club_role(club_id, array['club_owner','admin']));

-- club_events
drop policy if exists events_select_saas on public.club_events;
create policy events_select_saas on public.club_events
  for select to authenticated using (public.current_user_can_read_club(club_id));

drop policy if exists events_write_saas on public.club_events;
create policy events_write_saas on public.club_events
  for all to authenticated
  using (public.current_user_has_club_role(club_id, array['club_owner','admin','coach']))
  with check (public.current_user_has_club_role(club_id, array['club_owner','admin','coach']));

-- documents
drop policy if exists documents_select_saas on public.documents;
create policy documents_select_saas on public.documents
  for select to authenticated using (
    public.current_user_has_club_role(club_id, array['club_owner','admin','coach'])
  );

drop policy if exists documents_write_saas on public.documents;
create policy documents_write_saas on public.documents
  for all to authenticated
  using (public.current_user_has_club_role(club_id, array['club_owner','admin']))
  with check (public.current_user_has_club_role(club_id, array['club_owner','admin']));

-- equipment
drop policy if exists equipment_select_saas on public.equipment;
create policy equipment_select_saas on public.equipment
  for select to authenticated using (
    public.current_user_has_club_role(club_id, array['club_owner','admin','coach'])
  );

drop policy if exists equipment_write_saas on public.equipment;
create policy equipment_write_saas on public.equipment
  for all to authenticated
  using (public.current_user_has_club_role(club_id, array['club_owner','admin','coach']))
  with check (public.current_user_has_club_role(club_id, array['club_owner','admin','coach']));

-- player_evaluations
drop policy if exists evaluations_select_saas on public.player_evaluations;
create policy evaluations_select_saas on public.player_evaluations
  for select to authenticated using (public.current_user_can_read_player(player_id, club_id));

drop policy if exists evaluations_write_saas on public.player_evaluations;
create policy evaluations_write_saas on public.player_evaluations
  for all to authenticated
  using (public.current_user_has_club_role(club_id, array['club_owner','admin','coach']))
  with check (public.current_user_has_club_role(club_id, array['club_owner','admin','coach']));

-- development_plans
drop policy if exists development_select_saas on public.development_plans;
create policy development_select_saas on public.development_plans
  for select to authenticated using (public.current_user_can_read_player(player_id, club_id));

drop policy if exists development_write_saas on public.development_plans;
create policy development_write_saas on public.development_plans
  for all to authenticated
  using (public.current_user_has_club_role(club_id, array['club_owner','admin','coach']))
  with check (public.current_user_has_club_role(club_id, array['club_owner','admin','coach']));

-- discipline_records
drop policy if exists discipline_select_saas on public.discipline_records;
create policy discipline_select_saas on public.discipline_records
  for select to authenticated using (public.current_user_can_read_player(player_id, club_id));

drop policy if exists discipline_write_saas on public.discipline_records;
create policy discipline_write_saas on public.discipline_records
  for all to authenticated
  using (public.current_user_has_club_role(club_id, array['club_owner','admin','coach']))
  with check (public.current_user_has_club_role(club_id, array['club_owner','admin','coach']));

-- chat_messages
drop policy if exists chat_select_saas on public.chat_messages;
create policy chat_select_saas on public.chat_messages
  for select to authenticated using (public.current_user_can_read_club(club_id));

drop policy if exists chat_insert_saas on public.chat_messages;
create policy chat_insert_saas on public.chat_messages
  for insert to authenticated with check (public.current_user_can_read_club(club_id));

-- media_gallery
drop policy if exists media_select_saas on public.media_gallery;
create policy media_select_saas on public.media_gallery
  for select to authenticated using (public.current_user_can_read_club(club_id));

drop policy if exists media_write_saas on public.media_gallery;
create policy media_write_saas on public.media_gallery
  for all to authenticated
  using (public.current_user_has_club_role(club_id, array['club_owner','admin','coach']))
  with check (public.current_user_has_club_role(club_id, array['club_owner','admin','coach']));

-- scouting_players
drop policy if exists scouting_select_saas on public.scouting_players;
create policy scouting_select_saas on public.scouting_players
  for select to authenticated using (
    public.current_user_has_club_role(club_id, array['club_owner','admin','coach'])
  );

drop policy if exists scouting_write_saas on public.scouting_players;
create policy scouting_write_saas on public.scouting_players
  for all to authenticated
  using (public.current_user_has_club_role(club_id, array['club_owner','admin','coach']))
  with check (public.current_user_has_club_role(club_id, array['club_owner','admin','coach']));

-- club_tasks
drop policy if exists tasks_select_saas on public.club_tasks;
create policy tasks_select_saas on public.club_tasks
  for select to authenticated using (public.current_user_can_read_club(club_id));

drop policy if exists tasks_write_saas on public.club_tasks;
create policy tasks_write_saas on public.club_tasks
  for all to authenticated
  using (public.current_user_has_club_role(club_id, array['club_owner','admin','coach']))
  with check (public.current_user_has_club_role(club_id, array['club_owner','admin','coach']));

-- ----------------------------------------------------------------------------
-- 8b) Membrii unui club cu nume/email din profil (ecranul Staff).
--     SECURITY DEFINER: profiles nu e citibil între utilizatori; accesul e
--     restricționat la membrii clubului prin current_user_can_read_club.
-- ----------------------------------------------------------------------------
create or replace function public.get_club_members(target_club_id uuid)
returns table (
  membership_id uuid,
  user_id uuid,
  full_name text,
  email text,
  role text,
  status text,
  assigned_groups text[],
  joined_at timestamptz
) language sql security definer set search_path = public stable as $$
  select cm.id, cm.user_id, p.full_name, p.email, cm.role, cm.status, cm.assigned_groups, cm.joined_at
  from public.club_memberships cm
  left join public.profiles p on p.id = cm.user_id
  where cm.club_id = target_club_id
    and public.current_user_can_read_club(target_club_id)
  order by cm.joined_at
$$;

revoke execute on function public.get_club_members(uuid) from anon;

-- ----------------------------------------------------------------------------
-- 9) Storage: bucket pentru documente club (folosit de storageService)
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('club-documents', 'club-documents', false)
on conflict (id) do nothing;

drop policy if exists club_documents_read on storage.objects;
create policy club_documents_read on storage.objects
  for select to authenticated using (bucket_id = 'club-documents');

drop policy if exists club_documents_write on storage.objects;
create policy club_documents_write on storage.objects
  for insert to authenticated with check (bucket_id = 'club-documents');

-- ----------------------------------------------------------------------------
-- 10) Igienizare: funcțiile SECURITY DEFINER nu sunt expuse rolului anon
-- ----------------------------------------------------------------------------
revoke execute on function public.accept_club_invitation(text) from anon;
revoke execute on function public.request_club_membership(text, text) from anon;
revoke execute on function public.current_user_platform_role() from anon;
revoke execute on function public.current_user_is_super_admin() from anon;
revoke execute on function public.current_user_has_club_role(uuid, text[]) from anon;
revoke execute on function public.current_user_can_read_club(uuid) from anon;
revoke execute on function public.current_user_player_id() from anon;
revoke execute on function public.current_user_child_player_id() from anon;
revoke execute on function public.current_user_can_read_player(bigint, uuid) from anon;
revoke execute on function public.realtime_broadcast_all_changes() from anon, authenticated;

-- ----------------------------------------------------------------------------
-- 11) Primul super admin (rulează manual, cu emailul tău)
-- ----------------------------------------------------------------------------
-- update public.profiles set platform_role = 'super_admin' where email = 'EMAILUL_TAU';
