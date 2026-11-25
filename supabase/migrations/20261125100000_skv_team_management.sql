-- Team management: field-preserving match edits and team renames with
-- propagation of denormalized names into matches (projection refreshes
-- automatically through the skv_project_score trigger).

-- skv_edit_match previously overwrote scheduled_at/court/duration/published
-- with nulls whenever the caller only passed team resolution fields. Every
-- value is now coalesced with the stored row, so partial updates are safe.
create or replace function public.skv_edit_match(mid uuid, config jsonb) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  m public.skv_matches;
  cid uuid;
  starts timestamptz;
  minutes integer;
  court_label text;
  pub boolean;
  ref_team text := nullif(btrim(coalesce(config->>'referee_team','')),'');
  has_ref boolean := config ? 'referee_team';
  has_teams boolean := config ? 'team_a_id';
  a uuid := (config->>'team_a_id')::uuid;
  b uuid := (config->>'team_b_id')::uuid;
  a_name text;
  b_name text;
begin
  if auth.uid() is null or not public.skv_admin() then raise exception 'access_denied'; end if;
  select competition_id into strict cid from public.skv_matches where id = mid;
  perform 1 from public.skv_competitions where id = cid for update;
  select * into strict m from public.skv_matches where id = mid for update;
  starts := coalesce((config->>'scheduled_at')::timestamptz, m.scheduled_at);
  minutes := coalesce((config->>'duration_minutes')::integer, m.duration_minutes);
  court_label := coalesce(nullif(btrim(coalesce(config->>'court','')),''), m.court, '');
  pub := coalesce((config->>'published')::boolean, m.published);
  if m.state->>'status' = 'scheduled' then
    if has_teams then
      if a is null or b is null or a = b then raise exception 'invalid_action'; end if;
      perform public.skv_check_schedule(cid,mid,starts,minutes,court_label,a,b,
        case when has_ref then ref_team else m.referee_team end);
      select t.name into a_name from public.skv_teams t where t.id = a;
      select t.name into b_name from public.skv_teams t where t.id = b;
      if a_name is null or b_name is null then raise exception 'invalid_action'; end if;
      update public.skv_matches set team_a_id = a, team_b_id = b,
        team_a = a_name, team_b = b_name where id = mid;
    else
      perform public.skv_check_schedule(cid,mid,starts,minutes,court_label,m.team_a_id,m.team_b_id,
        case when has_ref then ref_team else m.referee_team end);
    end if;
    update public.skv_matches set scheduled_at = starts, court = court_label,
      duration_minutes = minutes, published = pub,
      referee_team = case when has_ref then ref_team else referee_team end,
      updated_at = clock_timestamp() where id = mid;
  else
    if has_teams then raise exception 'invalid_action'; end if;
    update public.skv_matches set published = pub,
      referee_team = case when has_ref then ref_team else referee_team end,
      updated_at = clock_timestamp() where id = mid;
  end if;
end $$;

-- Rename a team and propagate the denormalized copies stored on matches.
-- referee_team is free text, so it is rewritten where it exactly matches the
-- old name (case-insensitively); projection rows refresh via trigger.
create or replace function public.skv_rename_team(tid uuid, new_name text) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  old_name text;
  clean text := nullif(btrim(coalesce(new_name,'')),'');
begin
  if auth.uid() is null or not public.skv_admin() then raise exception 'access_denied'; end if;
  if clean is null or length(clean) > 80 then raise exception 'invalid_action'; end if;
  select t.name into strict old_name from public.skv_teams t where t.id = tid for update;
  if old_name = clean then return; end if;
  update public.skv_teams set name = clean where id = tid;
  update public.skv_matches set team_a = clean, updated_at = clock_timestamp()
    where team_a_id = tid;
  update public.skv_matches set team_b = clean, updated_at = clock_timestamp()
    where team_b_id = tid;
  update public.skv_matches set referee_team = clean, updated_at = clock_timestamp()
    where referee_team is not null and lower(referee_team) = lower(old_name);
end $$;

revoke all on function public.skv_rename_team(uuid, text) from public, anon;
grant execute on function public.skv_rename_team(uuid, text) to authenticated;
