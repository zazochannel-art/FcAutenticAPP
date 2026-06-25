-- FC Autentic: Supabase Auth + roluri + RLS
-- Rulează acest fișier în Supabase SQL Editor după ce creezi proiectul.
-- IMPORTANT: folosește cheia anon/publishable în aplicație, niciodată service_role.

create type public.app_role as enum ('admin', 'coach', 'player', 'parent');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role public.app_role not null default 'player',
  assigned_groups text[] not null default '{}',
  player_id bigint,
  child_player_id bigint,
  created_at timestamptz not null default now()
);

create table public.players (
  id bigint generated always as identity primary key,
  no integer not null,
  name text not null,
  role text not null,
  group_name text not null,
  status text not null default 'Activ',
  created_at timestamptz not null default now()
);

create table public.trainings (
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
  created_at timestamptz not null default now()
);

create table public.attendance (
  training_id bigint references public.trainings(id) on delete cascade,
  player_id bigint references public.players(id) on delete cascade,
  status text not null check (status in ('present', 'absent', 'late', 'injured', 'excused')),
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  primary key (training_id, player_id)
);

alter table public.profiles enable row level security;
alter table public.players enable row level security;
alter table public.trainings enable row level security;
alter table public.attendance enable row level security;

create or replace function public.current_profile()
returns public.profiles
language sql
stable
security invoker
as $$
  select * from public.profiles where id = (select auth.uid())
$$;

create policy "profiles_select_own_or_admin"
on public.profiles for select
to authenticated
using (
  id = (select auth.uid())
  or (select role from public.profiles where id = (select auth.uid())) = 'admin'
);

create policy "profiles_admin_manage"
on public.profiles for all
to authenticated
using ((select role from public.profiles where id = (select auth.uid())) = 'admin')
with check ((select role from public.profiles where id = (select auth.uid())) = 'admin');

-- Permite citirea propriului profil creat automat la signup.
-- Rolul nu se ia din user_metadata; triggerul de mai jos setează mereu 'player'.

create or replace function public.handle_new_player_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_player_id bigint;
  player_group text;
begin
  player_group := coalesce(new.raw_user_meta_data->>'group_name', 'U19');

  insert into public.players (no, name, role, group_name, status)
  values (
    coalesce(nullif(new.raw_user_meta_data->>'player_no', '')::integer, 0),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'player_position', 'Jucător'),
    player_group,
    'Activ'
  )
  returning id into new_player_id;

  insert into public.profiles (id, full_name, role, assigned_groups, player_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'player',
    array[player_group],
    new_player_id
  );

  return new;
end;
$$;

revoke all on function public.handle_new_player_signup() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_fc_autentic on auth.users;
create trigger on_auth_user_created_fc_autentic
after insert on auth.users
for each row execute function public.handle_new_player_signup();

create policy "players_role_select"
on public.players for select
to authenticated
using (
  (select role from public.profiles where id = (select auth.uid())) = 'admin'
  or (
    (select role from public.profiles where id = (select auth.uid())) = 'coach'
    and group_name = any((select assigned_groups from public.profiles where id = (select auth.uid())))
  )
  or id = (select player_id from public.profiles where id = (select auth.uid()))
  or id = (select child_player_id from public.profiles where id = (select auth.uid()))
);

create policy "players_admin_coach_write"
on public.players for insert
to authenticated
with check (
  (select role from public.profiles where id = (select auth.uid())) = 'admin'
  or (
    (select role from public.profiles where id = (select auth.uid())) = 'coach'
    and group_name = any((select assigned_groups from public.profiles where id = (select auth.uid())))
  )
);

create policy "trainings_role_select"
on public.trainings for select
to authenticated
using (
  (select role from public.profiles where id = (select auth.uid())) = 'admin'
  or (
    (select role from public.profiles where id = (select auth.uid())) = 'coach'
    and group_name = any((select assigned_groups from public.profiles where id = (select auth.uid())))
  )
  or group_name = (
    select group_name from public.players where id = (select player_id from public.profiles where id = (select auth.uid()))
  )
  or group_name = (
    select group_name from public.players where id = (select child_player_id from public.profiles where id = (select auth.uid()))
  )
);

create policy "trainings_admin_coach_write"
on public.trainings for all
to authenticated
using (
  (select role from public.profiles where id = (select auth.uid())) = 'admin'
  or (
    (select role from public.profiles where id = (select auth.uid())) = 'coach'
    and group_name = any((select assigned_groups from public.profiles where id = (select auth.uid())))
  )
)
with check (
  (select role from public.profiles where id = (select auth.uid())) = 'admin'
  or (
    (select role from public.profiles where id = (select auth.uid())) = 'coach'
    and group_name = any((select assigned_groups from public.profiles where id = (select auth.uid())))
  )
);

create policy "attendance_role_select"
on public.attendance for select
to authenticated
using (
  (select role from public.profiles where id = (select auth.uid())) = 'admin'
  or exists (
    select 1 from public.players p
    join public.trainings t on t.id = attendance.training_id
    where p.id = attendance.player_id
    and (
      (
        (select role from public.profiles where id = (select auth.uid())) = 'coach'
        and p.group_name = any((select assigned_groups from public.profiles where id = (select auth.uid())))
      )
      or p.id = (select player_id from public.profiles where id = (select auth.uid()))
      or p.id = (select child_player_id from public.profiles where id = (select auth.uid()))
    )
  )
);

create policy "attendance_admin_coach_write"
on public.attendance for all
to authenticated
using (
  (select role from public.profiles where id = (select auth.uid())) = 'admin'
  or exists (
    select 1 from public.players p
    where p.id = attendance.player_id
    and p.group_name = any((select assigned_groups from public.profiles where id = (select auth.uid())))
  )
)
with check (
  (select role from public.profiles where id = (select auth.uid())) = 'admin'
  or exists (
    select 1 from public.players p
    where p.id = attendance.player_id
    and p.group_name = any((select assigned_groups from public.profiles where id = (select auth.uid())))
  )
);

-- Extensii pentru aplicația completă FC Autentic: meciuri, finanțe, observații,
-- evaluări, planuri, disciplină, inventar, galerie, scouting și chat.

alter table public.players
  add column if not exists birthdate text,
  add column if not exists foot text,
  add column if not exists parent_phone text,
  add column if not exists medical_status text,
  add column if not exists allergies text,
  add column if not exists emergency_contact text,
  add column if not exists medical_expires text;

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
  primary key (month_label, group_name, player_id)
);

create table if not exists public.transactions (
  id bigint generated always as identity primary key,
  label text not null,
  value numeric not null,
  positive boolean not null default true,
  date_label text,
  created_by uuid references auth.users(id),
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
  primary key (player_id, month_label)
);

create table if not exists public.development_plans (
  player_id bigint primary key references public.players(id) on delete cascade,
  focus text,
  objective text,
  exercises text,
  status text,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

create table if not exists public.discipline_records (
  id bigint generated always as identity primary key,
  player_id bigint references public.players(id) on delete cascade,
  type text not null,
  note text,
  date_label text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id bigint generated always as identity primary key,
  audience text not null,
  author_id uuid references auth.users(id),
  author_name text,
  text text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.media_gallery (
  id bigint generated always as identity primary key,
  type text,
  title text not null,
  url text,
  date_label text,
  created_by uuid references auth.users(id),
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
  created_at timestamptz not null default now()
);

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

create policy "club_admin_coach_manage_matches" on public.matches for all to authenticated
using ((select role from public.profiles where id = (select auth.uid())) = 'admin' or group_name = any((select assigned_groups from public.profiles where id = (select auth.uid()))))
with check ((select role from public.profiles where id = (select auth.uid())) = 'admin' or group_name = any((select assigned_groups from public.profiles where id = (select auth.uid()))));

create policy "club_role_read_matches" on public.matches for select to authenticated
using (
  (select role from public.profiles where id = (select auth.uid())) = 'admin'
  or group_name = any((select assigned_groups from public.profiles where id = (select auth.uid())))
  or group_name = (select group_name from public.players where id = (select player_id from public.profiles where id = (select auth.uid())))
  or group_name = (select group_name from public.players where id = (select child_player_id from public.profiles where id = (select auth.uid())))
);

-- Pentru modulele administrative: admin vede tot, antrenorii gestionează datele clubului.
-- Jucătorii/părinții primesc date filtrate în aplicație; pentru producție putem rafina politici per tabel.
create policy "admin_coach_full_player_modules" on public.player_observations for all to authenticated
using ((select role from public.profiles where id = (select auth.uid())) in ('admin','coach'))
with check ((select role from public.profiles where id = (select auth.uid())) in ('admin','coach'));

create policy "own_player_observations_read" on public.player_observations for select to authenticated
using (
  player_id = (select player_id from public.profiles where id = (select auth.uid()))
  or player_id = (select child_player_id from public.profiles where id = (select auth.uid()))
  or (select role from public.profiles where id = (select auth.uid())) in ('admin','coach')
);

create policy "admin_full_finance" on public.training_payments for all to authenticated
using ((select role from public.profiles where id = (select auth.uid())) = 'admin')
with check ((select role from public.profiles where id = (select auth.uid())) = 'admin');

create policy "admin_full_monthly_finance" on public.monthly_payments for all to authenticated
using ((select role from public.profiles where id = (select auth.uid())) = 'admin')
with check ((select role from public.profiles where id = (select auth.uid())) = 'admin');

create policy "admin_full_transactions" on public.transactions for all to authenticated
using ((select role from public.profiles where id = (select auth.uid())) = 'admin')
with check ((select role from public.profiles where id = (select auth.uid())) = 'admin');

create policy "admin_coach_manage_events" on public.club_events for all to authenticated
using ((select role from public.profiles where id = (select auth.uid())) in ('admin','coach'))
with check ((select role from public.profiles where id = (select auth.uid())) in ('admin','coach'));

create policy "admin_coach_manage_admin_modules" on public.documents for all to authenticated
using ((select role from public.profiles where id = (select auth.uid())) in ('admin','coach'))
with check ((select role from public.profiles where id = (select auth.uid())) in ('admin','coach'));

create policy "admin_coach_manage_equipment" on public.equipment for all to authenticated
using ((select role from public.profiles where id = (select auth.uid())) in ('admin','coach'))
with check ((select role from public.profiles where id = (select auth.uid())) in ('admin','coach'));

create policy "admin_coach_manage_evaluations" on public.player_evaluations for all to authenticated
using ((select role from public.profiles where id = (select auth.uid())) in ('admin','coach'))
with check ((select role from public.profiles where id = (select auth.uid())) in ('admin','coach'));

create policy "own_evaluations_read" on public.player_evaluations for select to authenticated
using (
  player_id = (select player_id from public.profiles where id = (select auth.uid()))
  or player_id = (select child_player_id from public.profiles where id = (select auth.uid()))
  or (select role from public.profiles where id = (select auth.uid())) in ('admin','coach')
);

create policy "admin_coach_manage_plans" on public.development_plans for all to authenticated
using ((select role from public.profiles where id = (select auth.uid())) in ('admin','coach'))
with check ((select role from public.profiles where id = (select auth.uid())) in ('admin','coach'));

create policy "admin_coach_manage_discipline" on public.discipline_records for all to authenticated
using ((select role from public.profiles where id = (select auth.uid())) in ('admin','coach'))
with check ((select role from public.profiles where id = (select auth.uid())) in ('admin','coach'));

create policy "club_chat_read_write" on public.chat_messages for all to authenticated
using (true)
with check ((select auth.uid()) is not null);

create policy "admin_coach_manage_media" on public.media_gallery for all to authenticated
using ((select role from public.profiles where id = (select auth.uid())) in ('admin','coach'))
with check ((select role from public.profiles where id = (select auth.uid())) in ('admin','coach'));

create policy "admin_coach_manage_scouting" on public.scouting_players for all to authenticated
using ((select role from public.profiles where id = (select auth.uid())) in ('admin','coach'))
with check ((select role from public.profiles where id = (select auth.uid())) in ('admin','coach'));
