create index skv_competition_teams_team_idx on public.skv_competition_teams (team_id);
create index skv_referees_user_idx on public.skv_match_referees (user_id, match_id)
  where revoked_at is null;

create function public.skv_save_competition(cid uuid, config jsonb) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  tiebreak jsonb := config->'standings'->'order';
  points jsonb := config->'standings'->'points';
  existing public.skv_competitions;
  k text;
begin
  if auth.uid() is null or not public.skv_admin() then raise exception 'access_denied'; end if;
  perform public.skv_validate_rules(config->'rules');
  if jsonb_typeof(tiebreak) is distinct from 'array' or
    jsonb_typeof(points) is distinct from 'object'
  then raise exception 'invalid_rules'; end if;
  if jsonb_array_length(tiebreak) not between 1 and 5 or exists (
    select from jsonb_array_elements_text(tiebreak) v(k)
    where v.k is null or v.k not in ('points','wins','setDifference','ballDifference','ballFor')
  ) or (select count(distinct v.k) from jsonb_array_elements_text(tiebreak) v(k))
    <> jsonb_array_length(tiebreak) then raise exception 'invalid_rules'; end if;
  foreach k in array array['win','loss','decidingWin','decidingLoss','walkoverWin','walkoverLoss']
  loop
    if not coalesce((points->>k)::integer between 0 and 100,false)
    then raise exception 'invalid_rules'; end if;
  end loop;
  if cid is null then
    insert into public.skv_competitions (name,venue,description,starts_at,visibility,rules,standings)
    values (btrim(config->>'name'),coalesce(config->>'venue',''),
      coalesce(config->>'description',''),nullif(config->>'starts_at','')::timestamptz,
      config->>'visibility',config->'rules',config->'standings') returning id into cid;
  else
    select * into strict existing from public.skv_competitions where id = cid for update;
    if existing.rules <> config->'rules' and exists (
      select from public.skv_matches where competition_id = cid
    ) then raise exception 'rules_locked'; end if;
    update public.skv_competitions set name = btrim(config->>'name'),
      venue = coalesce(config->>'venue',''), description = coalesce(config->>'description',''),
      starts_at = nullif(config->>'starts_at','')::timestamptz, visibility = config->>'visibility',
      rules = config->'rules', standings = config->'standings' where id = cid;
    -- Refresh projected metadata without touching match event versions.
    update public.skv_matches set updated_at = clock_timestamp() where competition_id = cid;
  end if;
  return cid;
end $$;

create function public.skv_add_team(cid uuid, team_name text) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare tid uuid;
begin
  if auth.uid() is null or not public.skv_admin() then raise exception 'access_denied'; end if;
  insert into public.skv_teams(name) values (btrim(team_name))
    on conflict (name) do update set name = excluded.name returning id into tid;
  if cid is not null then
    insert into public.skv_competition_teams values (cid,tid) on conflict do nothing;
  end if;
  return tid;
end $$;

create function public.skv_check_schedule(cid uuid, mid uuid, starts timestamptz,
  minutes integer, court_label text, a uuid, b uuid) returns void
language plpgsql set search_path = ''
as $$
begin
  if cid is null or starts is null then return; end if;
  if exists (select from public.skv_matches m where m.competition_id = cid
    and m.id is distinct from mid and m.state->>'status' <> 'cancelled'
    and m.scheduled_at is not null
    and tstzrange(m.scheduled_at, m.scheduled_at + make_interval(mins => m.duration_minutes))
      && tstzrange(starts, starts + make_interval(mins => minutes))
    and ((court_label <> '' and lower(m.court) = lower(court_label)) or
      m.team_a_id in (a,b) or m.team_b_id in (a,b)))
  then raise exception 'schedule_overlap'; end if;
end $$;

create function public.skv_create_match(config jsonb) returns uuid
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
  rules jsonb;
  mid uuid;
begin
  if auth.uid() is null or ((cid is not null or ext is not null or pub or a is not null or
    b is not null) and not public.skv_admin()) then raise exception 'access_denied'; end if;
  if cid is not null then
    select c.rules into strict rules from public.skv_competitions c where c.id = cid for update;
    perform public.skv_check_schedule(cid,null,starts,minutes,court_label,a,b);
  else
    rules := config->'rules';
  end if;
  perform public.skv_validate_rules(rules);
  insert into public.skv_matches (competition_id,external_match_id,team_a_id,team_b_id,
    team_a,team_b,court,scheduled_at,duration_minutes,published,rules,created_by)
  values (cid,ext,a,b,
    case when a is not null then (select t.name from public.skv_teams t where t.id = a)
      else btrim(config->>'team_a') end,
    case when b is not null then (select t.name from public.skv_teams t where t.id = b)
      else btrim(config->>'team_b') end,
    court_label,starts,minutes,pub,rules,auth.uid()) returning id into mid;
  return mid;
end $$;

create function public.skv_create_schedule(fixtures jsonb) returns integer
language plpgsql security definer set search_path = ''
as $$
declare fixture jsonb; cid uuid;
begin
  if auth.uid() is null or not public.skv_admin() then raise exception 'access_denied'; end if;
  if jsonb_typeof(fixtures) is distinct from 'array' or
    jsonb_array_length(fixtures) not between 1 and 190 then raise exception 'invalid_action'; end if;
  cid := (fixtures->0->>'competition_id')::uuid;
  perform 1 from public.skv_competitions where id = cid for update;
  if not found then raise exception 'invalid_action'; end if;
  if exists (select from public.skv_matches where competition_id = cid
    and state->>'status' <> 'cancelled') then raise exception 'schedule_exists'; end if;
  for fixture in select value from jsonb_array_elements(fixtures) loop
    if (fixture->>'competition_id')::uuid is distinct from cid
    then raise exception 'invalid_action'; end if;
    perform public.skv_create_match(fixture);
  end loop;
  return jsonb_array_length(fixtures);
end $$;

create function public.skv_edit_match(mid uuid, config jsonb) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  m public.skv_matches;
  cid uuid;
  starts timestamptz := (config->>'scheduled_at')::timestamptz;
  minutes integer := coalesce((config->>'duration_minutes')::integer,60);
  court_label text := btrim(coalesce(config->>'court',''));
begin
  if auth.uid() is null or not public.skv_admin() then raise exception 'access_denied'; end if;
  select competition_id into strict cid from public.skv_matches where id = mid;
  perform 1 from public.skv_competitions where id = cid for update;
  select * into strict m from public.skv_matches where id = mid for update;
  if m.state->>'status' = 'scheduled' then
    perform public.skv_check_schedule(cid,mid,starts,minutes,court_label,m.team_a_id,m.team_b_id);
    update public.skv_matches set scheduled_at = starts, court = court_label,
      duration_minutes = minutes, published = (config->>'published')::boolean,
      updated_at = clock_timestamp() where id = mid;
  else
    update public.skv_matches set published = (config->>'published')::boolean,
      updated_at = clock_timestamp() where id = mid;
  end if;
end $$;

create function public.skv_assign_referee(mid uuid, email_address text, expires timestamptz,
  revoke_access boolean) returns void
language plpgsql security definer set search_path = ''
as $$
declare uid uuid;
begin
  if auth.uid() is null or not public.skv_admin() then raise exception 'access_denied'; end if;
  perform 1 from public.skv_matches where id = mid for update;
  if not found then raise exception 'invalid_action'; end if;
  select id into uid from auth.users where lower(email) = lower(btrim(email_address));
  if uid is null then raise exception 'account_not_found'; end if;
  if revoke_access then
    update public.skv_match_referees set revoked_at = clock_timestamp()
      where match_id = mid and user_id = uid;
    update public.skv_match_leases set expires_at = clock_timestamp(), fence = fence+1
      where match_id = mid and user_id = uid;
  else
    if not coalesce(expires > now() and expires <= now()+interval '30 days',false)
    then raise exception 'invalid_expiry'; end if;
    if exists (select from public.skv_match_referees where match_id = mid and user_id = uid
      and expires_at <= now() and revoked_at is null) then
      update public.skv_match_leases set expires_at = clock_timestamp(), fence = fence+1
        where match_id = mid and user_id = uid;
    end if;
    insert into public.skv_match_referees values(mid,uid,expires,null)
      on conflict (match_id,user_id) do update set
        expires_at = excluded.expires_at, revoked_at = null;
  end if;
end $$;

create function public.skv_standings(cid uuid) returns table (
  place bigint, team text, played bigint, wins bigint, losses bigint,
  sets_for bigint, sets_against bigint, set_difference bigint, ball_for bigint,
  ball_against bigint, ball_difference bigint, points bigint
) language sql stable security definer set search_path = ''
as $$
  with config as (
    select c.standings->'points' p, c.standings->'order' ordering
    from public.skv_competitions c where c.id = cid
      and (c.visibility = 'public' or (auth.uid() is not null and public.skv_admin()))
  ), result as (
    select m.team_a_id, m.team_b_id, m.state->>'winner' winner,
      m.state->>'outcome' outcome, jsonb_array_length(m.state->'sets') = (m.rules->>'bestOf')::int
        and (m.rules->>'bestOf')::int > 1 deciding,
      count(*) filter (where s->>'winner' = 'a') sa, count(*) filter (where s->>'winner' = 'b') sb,
      coalesce(sum((s->>'a')::bigint),0) ba, coalesce(sum((s->>'b')::bigint),0) bb
    from public.skv_matches m
    left join lateral jsonb_array_elements(m.state->'sets') s on m.state->>'outcome' = 'played'
    where m.competition_id = cid and m.state->>'status' = 'completed' and exists (select from config)
    group by m.id
  ), sides as (
    select team_a_id tid, winner = 'a' won, sa sf, sb sl, ba bf, bb bl, deciding, outcome from result
    union all
    select team_b_id, winner = 'b', sb, sa, bb, ba, deciding, outcome from result
  ), totals as (
    select t.id, t.name, count(s.tid) played, count(*) filter(where s.won) wins,
      count(*) filter(where not s.won) losses,
      coalesce(sum(s.sf),0)::bigint sf, coalesce(sum(s.sl),0)::bigint sl,
      coalesce(sum(s.bf),0)::bigint bf, coalesce(sum(s.bl),0)::bigint bl,
      coalesce(sum((c.p->>case when s.outcome = 'walkover' then
        case when s.won then 'walkoverWin' else 'walkoverLoss' end
        when s.deciding then case when s.won then 'decidingWin' else 'decidingLoss' end
        else case when s.won then 'win' else 'loss' end end)::integer)
        filter (where s.tid is not null),0) points
    from config c cross join public.skv_competition_teams ct
    join public.skv_teams t on t.id = ct.team_id left join sides s on s.tid = t.id
    where ct.competition_id = cid group by t.id
  ), ordered as (
    select totals.*, array(select case k
      when 'points' then totals.points when 'wins' then totals.wins
      when 'setDifference' then totals.sf-totals.sl
      when 'ballDifference' then totals.bf-totals.bl
      when 'ballFor' then totals.bf end from jsonb_array_elements_text(c.ordering)
      with ordinality rule(k,n) order by n) sort_values
    from totals cross join config c
  )
  select rank() over(order by sort_values desc), name, played, wins, losses, sf, sl,
    sf-sl, bf, bl, bf-bl, points from ordered order by sort_values desc, name, id
$$;

revoke all on function public.skv_save_competition(uuid,jsonb), public.skv_add_team(uuid,text),
  public.skv_check_schedule(uuid,uuid,timestamptz,integer,text,uuid,uuid),
  public.skv_create_match(jsonb), public.skv_create_schedule(jsonb),
  public.skv_edit_match(uuid,jsonb), public.skv_assign_referee(uuid,text,timestamptz,boolean),
  public.skv_standings(uuid) from public, anon, authenticated;
grant execute on function public.skv_save_competition(uuid,jsonb), public.skv_add_team(uuid,text),
  public.skv_create_match(jsonb), public.skv_create_schedule(jsonb),
  public.skv_edit_match(uuid,jsonb), public.skv_assign_referee(uuid,text,timestamptz,boolean)
  to authenticated;
grant execute on function public.skv_standings(uuid) to anon, authenticated;
