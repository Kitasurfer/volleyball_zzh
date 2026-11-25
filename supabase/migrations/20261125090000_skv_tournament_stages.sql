-- Tournament stages (groups/playoffs), match numbers, placeholder teams,
-- quick result entry, schedule regeneration, referee-team conflict checks
-- and a plpgsql standings rewrite with walkover scoring and head-to-head.

alter table public.skv_matches
  add column stage text not null default '' check (length(stage) <= 40),
  add column match_number integer check (match_number > 0);
create unique index skv_matches_number_idx on public.skv_matches (competition_id, match_number)
  where competition_id is not null and match_number is not null;
create index skv_matches_stage_idx on public.skv_matches (competition_id, stage)
  where stage <> '';

-- Placeholder playoff teams (1A, 2B, ...) have no team id yet, so the old
-- "tournament matches must reference real teams" invariant is narrowed to the
-- external-id part and team membership is still enforced by the foreign keys.
do $$
declare cname text;
begin
  select conname into cname from pg_constraint
    where conrelid = 'public.skv_matches'::regclass and contype = 'c'
      and lower(pg_get_constraintdef(oid)) like '%team_a_id is not null%';
  if cname is not null then
    execute format('alter table public.skv_matches drop constraint %I', cname);
  end if;
end $$;
alter table public.skv_matches add constraint skv_matches_competition_integrity
  check (competition_id is null or external_match_id is null);

-- headToHead becomes a valid tiebreak criterion.
create or replace function public.skv_save_competition(cid uuid, config jsonb) returns uuid
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
  if jsonb_array_length(tiebreak) not between 1 and 6 or exists (
    select from jsonb_array_elements_text(tiebreak) v(k)
    where v.k is null or v.k not in ('points','wins','headToHead','setDifference','ballDifference','ballFor')
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
    update public.skv_matches set updated_at = clock_timestamp() where competition_id = cid;
  end if;
  return cid;
end $$;

-- Public scoreboards carry the tournament labels as well.
alter table public.skv_public_scores
  add column stage text not null default '',
  add column match_number integer,
  add column rules jsonb,
  add column referee_team text;
create index skv_public_stage_idx on public.skv_public_scores (competition_id, stage)
  where stage <> '';

create or replace function public.skv_project_score() returns trigger language plpgsql set search_path = ''
as $$
declare c public.skv_competitions;
begin
  select * into c from public.skv_competitions where id = new.competition_id;
  if not new.published or (c.id is not null and c.visibility <> 'public') then
    delete from public.skv_public_scores where match_id = new.id;
  else
    insert into public.skv_public_scores (match_id, competition_id, competition_name,
      external_match_id, team_a, team_b, court, scheduled_at, finished_at, state, version,
      updated_at, stage, match_number, rules, referee_team)
    values (
      new.id, c.id, c.name, new.external_match_id, new.team_a, new.team_b, new.court,
      new.scheduled_at, new.finished_at, new.state - 'firstServe' - 'switched',
      new.version, new.updated_at, new.stage, new.match_number, new.rules, new.referee_team
    ) on conflict (match_id) do update set competition_name = excluded.competition_name,
      team_a = excluded.team_a, team_b = excluded.team_b, court = excluded.court,
      scheduled_at = excluded.scheduled_at, finished_at = excluded.finished_at, state = excluded.state,
      version = excluded.version, updated_at = excluded.updated_at, stage = excluded.stage,
      match_number = excluded.match_number, rules = excluded.rules, referee_team = excluded.referee_team;
  end if;
  return new;
end $$;

-- Republish existing rows so the new labels appear without waiting for edits.
update public.skv_matches set updated_at = updated_at where published;

drop function public.skv_check_schedule(uuid,uuid,timestamptz,integer,text,uuid,uuid);
-- Referee teams may neither play nor cover another match at the same time.
create function public.skv_check_schedule(cid uuid, mid uuid, starts timestamptz,
  minutes integer, court_label text, a uuid, b uuid, ref_team text default null)
returns void language plpgsql set search_path = ''
as $$
declare
  a_name text;
  b_name text;
begin
  if cid is null or starts is null then return; end if;
  select t.name into a_name from public.skv_teams t where t.id = a;
  select t.name into b_name from public.skv_teams t where t.id = b;
  if exists (select from public.skv_matches m where m.competition_id = cid
    and m.id is distinct from mid and m.state->>'status' <> 'cancelled'
    and m.scheduled_at is not null
    and tstzrange(m.scheduled_at, m.scheduled_at + make_interval(mins => m.duration_minutes))
      && tstzrange(starts, starts + make_interval(mins => minutes))
    and ((court_label <> '' and lower(m.court) = lower(court_label)) or
      m.team_a_id in (a,b) or m.team_b_id in (a,b) or
      (ref_team is not null and (
        lower(m.team_a) = lower(ref_team) or lower(m.team_b) = lower(ref_team) or
        lower(coalesce(m.referee_team,'')) = lower(ref_team))) or
      (m.referee_team is not null and (
        (a_name is not null and lower(m.referee_team) = lower(a_name)) or
        (b_name is not null and lower(m.referee_team) = lower(b_name))))))
  then raise exception 'schedule_overlap'; end if;
end $$;

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
  stage_label text := btrim(coalesce(config->>'stage',''));
  rules jsonb;
  mid uuid;
  numbering integer;
begin
  if auth.uid() is null or public.skv_anonymous() or
    ((cid is not null or ext is not null or pub or a is not null or
      b is not null or stage_label <> '') and not public.skv_admin())
  then raise exception 'access_denied'; end if;
  if cid is not null then
    select c.rules into strict rules from public.skv_competitions c where c.id = cid for update;
    perform public.skv_check_schedule(cid,null,starts,minutes,court_label,a,b,ref_team);
    select coalesce(max(m.match_number),0)+1 into numbering
      from public.skv_matches m where m.competition_id = cid;
  else
    rules := config->'rules';
  end if;
  perform public.skv_validate_rules(rules);
  insert into public.skv_matches (competition_id,external_match_id,team_a_id,team_b_id,
    team_a,team_b,court,scheduled_at,duration_minutes,published,rules,referee_team,stage,
    match_number,created_by)
  values (cid,ext,a,b,
    case when a is not null then (select t.name from public.skv_teams t where t.id = a)
      else btrim(config->>'team_a') end,
    case when b is not null then (select t.name from public.skv_teams t where t.id = b)
      else btrim(config->>'team_b') end,
    court_label,starts,minutes,pub,rules,ref_team,stage_label,numbering,auth.uid())
  returning id into mid;
  return mid;
end $$;

-- Resolving placeholder teams is allowed while the match has not started.
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
      duration_minutes = minutes, published = (config->>'published')::boolean,
      referee_team = case when has_ref then ref_team else referee_team end,
      updated_at = clock_timestamp() where id = mid;
  else
    if has_teams then raise exception 'invalid_action'; end if;
    update public.skv_matches set published = (config->>'published')::boolean,
      referee_team = case when has_ref then ref_team else referee_team end,
      updated_at = clock_timestamp() where id = mid;
  end if;
end $$;

-- Enter a final result in one step: the synthetic journal is replayed through
-- the regular event pipeline, so every validation of live scoring applies.
create function public.skv_enter_result(mid uuid, sets jsonb, note text) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  m public.skv_matches;
  device uuid := gen_random_uuid();
  fence integer;
  revision integer := 0;
  item jsonb;
  idx integer := 0;
  set_count integer;
begin
  if auth.uid() is null or not public.skv_admin() then raise exception 'access_denied'; end if;
  if jsonb_typeof(sets) is distinct from 'array' or
    jsonb_array_length(sets) not between 1 and 5 or
    coalesce(length(btrim(note)),0) not between 1 and 500
  then raise exception 'invalid_action'; end if;
  if exists (select from jsonb_array_elements(sets) e
    where jsonb_typeof(e.value) is distinct from 'object' or
      coalesce(e.value->>'a','') !~ '^\d{1,4}$' or coalesce(e.value->>'b','') !~ '^\d{1,4}$')
  then raise exception 'invalid_action'; end if;
  select * into strict m from public.skv_matches where id = mid for update;
  if m.state->>'status' <> 'scheduled' then raise exception 'invalid_action'; end if;
  fence := (public.skv_acquire_lease(mid,device,false)->>'fence')::integer;
  perform public.skv_apply_event(mid,device,fence,gen_random_uuid(),revision,clock_timestamp(),
    jsonb_build_object('type','MATCH_STARTED','side','a'));
  revision := revision + 1;
  set_count := jsonb_array_length(sets);
  for item in select value from jsonb_array_elements(sets) loop
    idx := idx + 1;
    perform public.skv_apply_event(mid,device,fence,gen_random_uuid(),revision,clock_timestamp(),
      jsonb_build_object('type','POINT_CORRECTED',
        'a',(item->>'a')::integer,'b',(item->>'b')::integer,'reason',note));
    revision := revision + 1;
    if idx < set_count then
      perform public.skv_apply_event(mid,device,fence,gen_random_uuid(),revision,clock_timestamp(),
        jsonb_build_object('type','SET_STARTED','side',case when idx % 2 = 1 then 'b' else 'a' end));
      revision := revision + 1;
    end if;
  end loop;
  perform public.skv_apply_event(mid,device,fence,gen_random_uuid(),revision,clock_timestamp(),
    jsonb_build_object('type','MATCH_COMPLETED'));
  perform public.skv_release_lease(mid,device,fence);
end $$;
revoke all on function public.skv_enter_result(uuid,jsonb,text) from public, anon;
grant execute on function public.skv_enter_result(uuid,jsonb,text) to authenticated;

-- Remove an untouched schedule so it can be regenerated. Any started or
-- completed match blocks the deletion on purpose.
create function public.skv_delete_schedule(cid uuid) returns integer
language plpgsql security definer set search_path = ''
as $$
declare removed integer;
begin
  if auth.uid() is null or not public.skv_admin() then raise exception 'access_denied'; end if;
  perform 1 from public.skv_competitions where id = cid for update;
  if not found then raise exception 'invalid_action'; end if;
  if exists (select from public.skv_matches m where m.competition_id = cid
    and m.state->>'status' <> 'scheduled')
  then raise exception 'schedule_started'; end if;
  if exists (select from public.skv_matches m where m.competition_id = cid and m.published)
  then raise exception 'invalid_action'; end if;
  update public.skv_match_events e set reference_event_id = null
    from public.skv_matches m where m.competition_id = cid and e.match_id = m.id;
  delete from public.skv_match_events e
    using public.skv_matches m where m.competition_id = cid and e.match_id = m.id;
  delete from public.skv_match_conflicts c
    using public.skv_matches m where m.competition_id = cid and c.match_id = m.id;
  delete from public.skv_local_imports i
    using public.skv_matches m where m.competition_id = cid and i.match_id = m.id;
  delete from public.skv_matches m where m.competition_id = cid;
  get diagnostics removed = row_count;
  return removed;
end $$;
revoke all on function public.skv_delete_schedule(uuid) from public, anon;
grant execute on function public.skv_delete_schedule(uuid) to authenticated;

-- Standings with stage filtering, walkover scoring at full set value and
-- iterative head-to-head tiebreak refinement among tied teams.
drop function public.skv_standings(uuid);
create function public.skv_standings(cid uuid, stage_filter text default null)
returns table (
  place bigint, team text, played bigint, wins bigint, losses bigint,
  sets_for bigint, sets_against bigint, set_difference bigint, ball_for bigint,
  ball_against bigint, ball_difference bigint, points bigint
) language plpgsql stable security definer set search_path = ''
as $$
declare
  ordering jsonb;
  awards jsonb;
  stats jsonb := '{}'::jsonb;
  roster jsonb := '[]'::jsonb;
  groups jsonb;
  next_groups jsonb;
  grp jsonb;
  members jsonb;
  crit text;
  rec record;
  member record;
  subgroup jsonb;
  prev_key bigint;
  tid_text text;
  pos bigint := 0;
  grp_start bigint;
  st jsonb;
begin
  select c.standings->'order', c.standings->'points' into ordering, awards
    from public.skv_competitions c
    where c.id = cid and (c.visibility = 'public' or
      (auth.uid() is not null and public.skv_admin()));
  if ordering is null then return; end if;

  -- Roster: every tournament team, or only the teams appearing in the stage.
  if stage_filter is null then
    select coalesce(jsonb_agg(jsonb_build_object('tid',x.tid::text,'name',x.tname)),'[]'::jsonb)
      into roster from (
        select t.id tid, t.name tname from public.skv_competition_teams ct
        join public.skv_teams t on t.id = ct.team_id where ct.competition_id = cid
      ) x;
  else
    select coalesce(jsonb_agg(jsonb_build_object('tid',x.tid::text,'name',x.tname)),'[]'::jsonb)
      into roster from (
        select distinct t.id tid, t.name tname from public.skv_teams t where t.id in (
          select m.team_a_id from public.skv_matches m
            where m.competition_id = cid and m.stage = stage_filter and m.team_a_id is not null
          union select m.team_b_id from public.skv_matches m
            where m.competition_id = cid and m.stage = stage_filter and m.team_b_id is not null)
      ) x;
  end if;

  -- Per-team aggregates. Walkovers are scored as full-value sets for the winner:
  -- partially recorded play is discarded on purpose, like a regular forfeit.
  for rec in
    with result as (
      select m.team_a_id, m.team_b_id, m.state->>'winner' winner,
        m.state->>'outcome' outcome,
        jsonb_array_length(m.state->'sets') = (m.rules->>'bestOf')::int
          and (m.rules->>'bestOf')::int > 1 deciding,
        count(*) filter (where s->>'winner' = 'a') sa,
        count(*) filter (where s->>'winner' = 'b') sb,
        coalesce(sum((s->>'a')::bigint),0) ba,
        coalesce(sum((s->>'b')::bigint),0) bb,
        ((m.rules->>'bestOf')::int + 1) / 2 needed,
        (m.rules->>'points')::int target_points
      from public.skv_matches m
      left join lateral jsonb_array_elements(m.state->'sets') s on m.state->>'outcome' = 'played'
      where m.competition_id = cid and m.state->>'status' = 'completed'
        and (stage_filter is null or m.stage = stage_filter)
      group by m.id
    ), sides as (
      select team_a_id tid, winner = 'a' won,
        case when outcome = 'walkover' then case when winner = 'a' then needed else 0 end
          else sa end sf,
        case when outcome = 'walkover' then case when winner = 'a' then 0 else needed end
          else sb end sl,
        case when outcome = 'walkover' then case when winner = 'a' then needed*target_points else 0 end
          else ba end bf,
        case when outcome = 'walkover' then case when winner = 'a' then 0 else needed*target_points end
          else bb end bl,
        deciding, outcome
      from result
      union all
      select team_b_id, winner = 'b',
        case when outcome = 'walkover' then case when winner = 'b' then needed else 0 end
          else sb end,
        case when outcome = 'walkover' then case when winner = 'b' then 0 else needed end
          else sa end,
        case when outcome = 'walkover' then case when winner = 'b' then needed*target_points else 0 end
          else bb end,
        case when outcome = 'walkover' then case when winner = 'b' then 0 else needed*target_points end
          else ba end,
        deciding, outcome
      from result
    )
    select (r.value->>'tid')::uuid tid, r.value->>'name' tname,
      count(s.tid) played, count(*) filter(where s.won) wins,
      count(*) filter(where not s.won) losses,
      coalesce(sum(s.sf),0)::bigint sf, coalesce(sum(s.sl),0)::bigint sl,
      coalesce(sum(s.bf),0)::bigint bf, coalesce(sum(s.bl),0)::bigint bl,
      coalesce(sum((awards->>case when s.outcome = 'walkover' then
        case when s.won then 'walkoverWin' else 'walkoverLoss' end
        when s.deciding then case when s.won then 'decidingWin' else 'decidingLoss' end
        else case when s.won then 'win' else 'loss' end end)::integer)
        filter (where s.tid is not null),0) points
    from jsonb_array_elements(roster) r
    left join sides s on s.tid = (r.value->>'tid')::uuid
    group by r.value
  loop
    stats := stats || jsonb_build_object(rec.tid::text, jsonb_build_object(
      'played',rec.played,'wins',rec.wins,'losses',rec.losses,
      'sf',rec.sf,'sl',rec.sl,'bf',rec.bf,'bl',rec.bl,'points',rec.points));
  end loop;

  -- Initial seed group: every team id, name-ordered for deterministic output.
  select jsonb_agg(r.value->>'tid' order by r.value->>'name', r.value->>'tid')
    into grp from jsonb_array_elements(roster) r;
  groups := jsonb_build_array(coalesce(grp,'[]'::jsonb));

  -- Refine groups criterion by criterion, splitting tied teams apart. Within a
  -- tied group members stay ordered by the criterion, then name, then id.
  for crit in select value from jsonb_array_elements_text(ordering) loop
    next_groups := '[]'::jsonb;
    for grp in select value from jsonb_array_elements(groups) loop
      if jsonb_array_length(grp) <= 1 then
        next_groups := next_groups || jsonb_build_array(grp);
        continue;
      end if;
      if crit = 'headToHead' then
        -- Mini-table of tournament points from mutual matches inside the group.
        select jsonb_agg(jsonb_build_object('tid',x.tid_text,'key',x.key)
          order by x.key desc, x.tname, x.tid_text) into members from (
          select rr.value->>'tid' tid_text, rr.value->>'name' tname,
            coalesce(sum((awards->>case
              when res.outcome = 'walkover' then
                case when res.won then 'walkoverWin' else 'walkoverLoss' end
              when res.deciding then
                case when res.won then 'decidingWin' else 'decidingLoss' end
              else case when res.won then 'win' else 'loss' end end)::integer),0) key
          from jsonb_array_elements(roster) rr
          left join lateral (
            select m.state->>'outcome' outcome,
              ((m.team_a_id = (rr.value->>'tid')::uuid and m.state->>'winner' = 'a') or
               (m.team_b_id = (rr.value->>'tid')::uuid and m.state->>'winner' = 'b')) won,
              jsonb_array_length(m.state->'sets') = (m.rules->>'bestOf')::int
                and (m.rules->>'bestOf')::int > 1 deciding
            from public.skv_matches m
            where m.competition_id = cid and m.state->>'status' = 'completed'
              and (stage_filter is null or m.stage = stage_filter)
              and ((m.team_a_id = (rr.value->>'tid')::uuid and
                    m.team_b_id::text in (select value from jsonb_array_elements_text(grp))) or
                   (m.team_b_id = (rr.value->>'tid')::uuid and
                    m.team_a_id::text in (select value from jsonb_array_elements_text(grp))))
          ) res on true
          where rr.value->>'tid' in (select value from jsonb_array_elements_text(grp))
          group by rr.value
        ) x;
      else
        select jsonb_agg(jsonb_build_object('tid',x.tid_text,'key',x.key)
          order by x.key desc, x.tname, x.tid_text) into members from (
          select rr.value->>'tid' tid_text, rr.value->>'name' tname, case crit
            when 'points' then (stats->(rr.value->>'tid')->>'points')::bigint
            when 'wins' then (stats->(rr.value->>'tid')->>'wins')::bigint
            when 'setDifference' then (stats->(rr.value->>'tid')->>'sf')::bigint -
              (stats->(rr.value->>'tid')->>'sl')::bigint
            when 'ballDifference' then (stats->(rr.value->>'tid')->>'bf')::bigint -
              (stats->(rr.value->>'tid')->>'bl')::bigint
            when 'ballFor' then (stats->(rr.value->>'tid')->>'bf')::bigint
            else 0 end key
          from jsonb_array_elements(roster) rr
          where rr.value->>'tid' in (select value from jsonb_array_elements_text(grp))
        ) x;
      end if;
      -- Split the ordered members into subgroups of equal keys.
      subgroup := '[]'::jsonb;
      prev_key := null;
      for member in select value from jsonb_array_elements(coalesce(members,'[]'::jsonb)) loop
        if prev_key is not null and (member.value->>'key')::bigint is distinct from prev_key then
          next_groups := next_groups || jsonb_build_array(
            (select jsonb_agg(e.value->>'tid') from jsonb_array_elements(subgroup) e));
          subgroup := '[]'::jsonb;
        end if;
        prev_key := (member.value->>'key')::bigint;
        subgroup := subgroup || jsonb_build_array(member.value);
      end loop;
      if jsonb_array_length(subgroup) > 0 then
        next_groups := next_groups || jsonb_build_array(
          (select jsonb_agg(e.value->>'tid') from jsonb_array_elements(subgroup) e));
      end if;
    end loop;
    groups := next_groups;
  end loop;

  -- Flatten groups in rank order; tied teams share the better place number and
  -- keep their deterministic name order inside the group.
  for grp in select value from jsonb_array_elements(groups) loop
    grp_start := pos + 1;
    for member in select value tid_text from jsonb_array_elements_text(grp) loop
      pos := pos + 1;
      st := stats->member.tid_text;
      place := grp_start;
      team := (select r.value->>'name' from jsonb_array_elements(roster) r
        where r.value->>'tid' = member.tid_text);
      played := (st->>'played')::bigint;
      wins := (st->>'wins')::bigint;
      losses := (st->>'losses')::bigint;
      sets_for := (st->>'sf')::bigint;
      sets_against := (st->>'sl')::bigint;
      set_difference := sets_for - sets_against;
      ball_for := (st->>'bf')::bigint;
      ball_against := (st->>'bl')::bigint;
      ball_difference := ball_for - ball_against;
      points := (st->>'points')::bigint;
      return next;
    end loop;
  end loop;
end $$;
revoke all on function public.skv_standings(uuid,text) from public, anon, authenticated;
grant execute on function public.skv_standings(uuid,text) to anon, authenticated;
