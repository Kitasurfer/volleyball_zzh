alter table public.skv_matches add column referee_team text
  check (referee_team is null or length(btrim(referee_team)) between 1 and 100);

create or replace function public.skv_create_match(config jsonb) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  cid uuid := (config->>'competition_id')::uuid;
  a uuid := (config->>'team_a_id')::uuid;
  b uuid := (config->>'team_b_id')::uuid;
  starts timestamptz := (config->>'scheduled_at')::timestamptz;
  minutes integer := coalesce((config->>'duration_minutes')::integer,60);
  court_label text := btrim(coalesce(config->>'court',''));
  ext text := nullif(btrim(config->>'external_match_id'),'');
  pub boolean := coalesce((config->>'published')::boolean,false);
  ref_team text := nullif(btrim(coalesce(config->>'referee_team','')),'');
  rules jsonb;
  mid uuid;
begin
  if auth.uid() is null or public.skv_anonymous() or
    ((cid is not null or ext is not null or pub or a is not null or
      b is not null) and not public.skv_admin()) then raise exception 'access_denied'; end if;
  if cid is not null then
    select c.rules into strict rules from public.skv_competitions c where c.id = cid for update;
    perform public.skv_check_schedule(cid,null,starts,minutes,court_label,a,b);
  else
    rules := config->'rules';
  end if;
  perform public.skv_validate_rules(rules);
  insert into public.skv_matches (competition_id,external_match_id,team_a_id,team_b_id,
    team_a,team_b,court,scheduled_at,duration_minutes,published,rules,referee_team,created_by)
  values (cid,ext,a,b,
    case when a is not null then (select t.name from public.skv_teams t where t.id = a)
      else btrim(config->>'team_a') end,
    case when b is not null then (select t.name from public.skv_teams t where t.id = b)
      else btrim(config->>'team_b') end,
    court_label,starts,minutes,pub,rules,ref_team,auth.uid()) returning id into mid;
  return mid;
end $$;

create or replace function public.skv_edit_match(mid uuid, config jsonb) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  m public.skv_matches;
  cid uuid;
  starts timestamptz := (config->>'scheduled_at')::timestamptz;
  minutes integer := coalesce((config->>'duration_minutes')::integer,60);
  court_label text := btrim(coalesce(config->>'court',''));
  ref_team text := nullif(btrim(coalesce(config->>'referee_team','')),'');
  has_ref boolean := config ? 'referee_team';
begin
  if auth.uid() is null or not public.skv_admin() then raise exception 'access_denied'; end if;
  select competition_id into strict cid from public.skv_matches where id = mid;
  perform 1 from public.skv_competitions where id = cid for update;
  select * into strict m from public.skv_matches where id = mid for update;
  if m.state->>'status' = 'scheduled' then
    perform public.skv_check_schedule(cid,mid,starts,minutes,court_label,m.team_a_id,m.team_b_id);
    update public.skv_matches set scheduled_at = starts, court = court_label,
      duration_minutes = minutes, published = (config->>'published')::boolean,
      referee_team = case when has_ref then ref_team else referee_team end,
      updated_at = clock_timestamp() where id = mid;
  else
    update public.skv_matches set published = (config->>'published')::boolean,
      referee_team = case when has_ref then ref_team else referee_team end,
      updated_at = clock_timestamp() where id = mid;
  end if;
end $$;

drop function public.skv_referee_requests(uuid);
create function public.skv_referee_requests(cid uuid default null)
returns table (id uuid, match_id uuid, name text, status text, created_at timestamptz,
  team_a text, team_b text, court text, scheduled_at timestamptz, competition_id uuid,
  referee_team text)
language sql stable security definer set search_path = ''
as $$
  select r.id, r.match_id, r.name, r.status, r.created_at, m.team_a, m.team_b, m.court,
    m.scheduled_at, m.competition_id, m.referee_team
  from public.skv_referee_requests r join public.skv_matches m on m.id = r.match_id
  where (cid is null or m.competition_id = cid)
    and r.status in ('pending','approved')
    and auth.uid() is not null and public.skv_admin()
  order by r.status = 'approved', r.created_at desc limit 100
$$;

revoke all on function public.skv_referee_requests(uuid) from public, anon;
grant execute on function public.skv_referee_requests(uuid) to authenticated;
