-- ============================================================================
-- FC Autentic — alăturare prin cod ca jucător SAU părinte
-- Rulează în Supabase SQL Editor. Idempotent, sigur de re-rulat.
--
-- Actualizează trigger-ul de signup ca să respecte rolul dorit
-- (raw_user_meta_data->>'desired_role'): 'player' sau 'parent'. Restul
-- fluxului (membership pending, aprobare de owner) rămâne neschimbat;
-- pentru părinți NU se creează un rând de jucător la aprobare.
-- ============================================================================

create or replace function public.handle_new_player_signup()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  player_group text;
  display_name text;
  target_club uuid;
  join_code_input text;
  desired_role text;
  profile_role public.app_role;
begin
  display_name := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
  player_group := coalesce(nullif(new.raw_user_meta_data->>'group_name', ''), 'U19');
  join_code_input := nullif(trim(new.raw_user_meta_data->>'join_code'), '');

  desired_role := lower(coalesce(nullif(new.raw_user_meta_data->>'desired_role', ''), 'player'));
  if desired_role not in ('player', 'parent') then
    desired_role := 'player';
  end if;
  profile_role := desired_role::public.app_role;

  if join_code_input is not null then
    select id into target_club from public.clubs
    where upper(join_code) = upper(join_code_input) and blocked = false
    limit 1;
  end if;

  if target_club is not null then
    insert into public.profiles (id, full_name, role, assigned_groups, email)
    values (new.id, display_name, profile_role, array[player_group], new.email);

    insert into public.club_memberships (user_id, club_id, role, assigned_groups, status)
    values (new.id, target_club, desired_role, array[player_group], 'pending')
    on conflict (user_id, club_id) do nothing;
  else
    insert into public.profiles (id, full_name, role, assigned_groups, email)
    values (new.id, display_name, profile_role, '{}', new.email);
  end if;

  return new;
end;
$$;
