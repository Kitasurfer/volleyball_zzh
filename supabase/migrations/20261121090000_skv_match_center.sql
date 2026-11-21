create table public.skv_competitions (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 100),
  venue text not null default '' check (length(venue) <= 100),
  description text not null default '' check (length(description) <= 2000),
  starts_at timestamptz,
  visibility text not null default 'private' check (visibility in ('private', 'public')),
  rules jsonb not null,
  standings jsonb not null,
  created_by uuid default auth.uid() references auth.users on delete set null,
  created_at timestamptz not null default now()
);

create table public.skv_teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(btrim(name)) between 1 and 80)
);

create table public.skv_competition_teams (
  competition_id uuid references public.skv_competitions on delete cascade,
  team_id uuid references public.skv_teams on delete restrict,
  primary key (competition_id, team_id)
);

create table public.skv_matches (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid references public.skv_competitions on delete restrict,
  external_match_id text unique check (length(external_match_id) between 1 and 100),
  team_a_id uuid references public.skv_teams on delete restrict,
  team_b_id uuid references public.skv_teams on delete restrict,
  team_a text not null check (length(btrim(team_a)) between 1 and 80),
  team_b text not null check (length(btrim(team_b)) between 1 and 80),
  court text not null default '' check (length(court) <= 80),
  scheduled_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  duration_minutes integer not null default 60 check (duration_minutes between 5 and 480),
  published boolean not null default false,
  rules jsonb not null,
  state jsonb not null default '{"status":"scheduled","sets":[],"serve":null,"firstServe":null,
    "left":"a","switched":false,"winner":null,"outcome":null}',
  version integer not null default 0 check (version >= 0),
  created_by uuid references auth.users on delete set null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  foreign key (competition_id, team_a_id)
    references public.skv_competition_teams(competition_id, team_id),
  foreign key (competition_id, team_b_id)
    references public.skv_competition_teams(competition_id, team_id),
  check (team_a_id is null or team_b_id is null or team_a_id <> team_b_id),
  check (competition_id is null or
    (external_match_id is null and team_a_id is not null and team_b_id is not null))
);
create index skv_matches_schedule_idx on public.skv_matches (competition_id, scheduled_at);

create table public.skv_match_referees (
  match_id uuid references public.skv_matches on delete cascade,
  user_id uuid references auth.users on delete cascade,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  primary key (match_id, user_id)
);

create table public.skv_match_leases (
  match_id uuid primary key references public.skv_matches on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  device_id uuid not null,
  fence integer not null check (fence > 0),
  expires_at timestamptz not null
);

create table public.skv_match_events (
  match_id uuid references public.skv_matches on delete restrict,
  event_id uuid not null unique,
  sequence integer not null,
  base_version integer not null check (base_version = sequence - 1),
  actor_id uuid references auth.users on delete set null,
  action jsonb not null,
  before_state jsonb not null,
  reference_event_id uuid references public.skv_match_events(event_id) on delete restrict,
  client_created_at timestamptz not null,
  server_created_at timestamptz not null default clock_timestamp(),
  primary key (match_id, sequence)
);
create index skv_events_reference_idx on public.skv_match_events (reference_event_id)
  where reference_event_id is not null;

create table public.skv_match_conflicts (
  id uuid primary key,
  match_id uuid not null references public.skv_matches on delete restrict,
  actor_id uuid references auth.users on delete set null,
  queued_events jsonb not null,
  local_state jsonb not null,
  server_version integer not null,
  decision text not null,
  created_at timestamptz not null default now()
);

create table public.skv_public_scores (
  match_id uuid primary key references public.skv_matches on delete cascade,
  competition_id uuid,
  competition_name text,
  external_match_id text,
  team_a text not null,
  team_b text not null,
  court text not null,
  scheduled_at timestamptz,
  finished_at timestamptz,
  state jsonb not null,
  version integer not null,
  updated_at timestamptz not null
);
create index skv_public_recent_idx on public.skv_public_scores (updated_at desc);
create index skv_public_competition_idx on public.skv_public_scores (competition_id, scheduled_at);

alter table public.skv_competitions enable row level security;
alter table public.skv_teams enable row level security;
alter table public.skv_competition_teams enable row level security;
alter table public.skv_matches enable row level security;
alter table public.skv_match_referees enable row level security;
alter table public.skv_match_leases enable row level security;
alter table public.skv_match_events enable row level security;
alter table public.skv_match_conflicts enable row level security;
alter table public.skv_public_scores enable row level security;

revoke all on public.skv_competitions, public.skv_teams, public.skv_competition_teams,
  public.skv_matches, public.skv_match_referees, public.skv_match_leases,
  public.skv_match_events, public.skv_match_conflicts, public.skv_public_scores
  from public, anon, authenticated;
grant select (id, name, venue, description, starts_at, visibility, rules, standings)
  on public.skv_competitions to anon, authenticated;
grant select on public.skv_public_scores to anon, authenticated;
grant select on public.skv_teams, public.skv_competition_teams to authenticated;

create function public.skv_admin() returns boolean language sql stable set search_path = ''
as $$ select coalesce(auth.jwt()->'app_metadata'->>'role' = 'admin', false) $$;
revoke all on function public.skv_admin() from public, anon;
grant execute on function public.skv_admin() to authenticated;

create policy skv_public_competitions on public.skv_competitions for select
  to anon, authenticated using (visibility = 'public');
create policy skv_admin_competitions on public.skv_competitions for select
  to authenticated using (public.skv_admin());
create policy skv_admin_teams on public.skv_teams for select
  to authenticated using (public.skv_admin());
create policy skv_admin_competition_teams on public.skv_competition_teams for select
  to authenticated using (public.skv_admin());
create policy skv_spectator_scores on public.skv_public_scores for select
  to anon, authenticated using (true);

create function public.skv_can_score(mid uuid) returns boolean
language sql stable set search_path = ''
as $$
  select auth.uid() is not null and (public.skv_admin() or exists (
    select from public.skv_matches m where m.id = mid and m.competition_id is null
      and m.created_by = auth.uid()
  ) or exists (
    select from public.skv_match_referees r where r.match_id = mid and r.user_id = auth.uid()
      and r.revoked_at is null and r.expires_at > statement_timestamp()
  ))
$$;

create function public.skv_validate_rules(r jsonb) returns void
language plpgsql immutable set search_path = ''
as $$
begin
  if not coalesce(jsonb_typeof(r) = 'object' and (r->>'bestOf')::integer in (1,3,5)
    and (r->>'points')::integer between 1 and 100
    and (r->>'deciding')::integer between 1 and 100
    and (r->>'margin')::integer between 1 and 5
    and (r->>'switchAt')::integer between 0 and (r->>'deciding')::integer, false)
  then raise exception 'invalid_rules'; end if;
end $$;

-- This reducer is mirrored by matchRules.ts for optimistic/offline display.
create function public.skv_reduce_score(s jsonb, r jsonb, a jsonb, undo_state jsonb)
returns jsonb language plpgsql immutable set search_path = ''
as $$
declare
  kind text := a->>'type';
  status text := s->>'status';
  side text := a->>'side';
  sets jsonb := s->'sets';
  n integer := jsonb_array_length(sets);
  best integer := (r->>'bestOf')::integer;
  last_set jsonb := sets->(n-1);
  x integer;
  y integer;
  target integer;
  winning_side text;
begin
  if kind in ('MATCH_STARTED','SET_STARTED','POINT_AWARDED','SERVE_CHANGED','WALKOVER')
    and coalesce(side, '') not in ('a','b') then raise exception 'invalid_action'; end if;
  if kind = 'MATCH_STARTED' and coalesce(a->>'left','a') not in ('a','b')
    then raise exception 'invalid_action'; end if;
  if kind in ('POINT_CORRECTED','MATCH_REOPENED','MATCH_CANCELLED','WALKOVER')
    and coalesce(length(btrim(a->>'reason')), 0) not between 1 and 500
    then raise exception 'invalid_action'; end if;

  case kind
    when 'MATCH_STARTED', 'SET_STARTED' then
      if (kind = 'MATCH_STARTED' and status <> 'scheduled') or
        (kind = 'SET_STARTED' and
          (status <> 'live' or last_set->>'winner' is null or s->>'winner' is not null))
      then raise exception 'invalid_action'; end if;
      target := case when n + 1 = best and best > 1 then (r->>'deciding')::integer
        else (r->>'points')::integer end;
      return s || jsonb_build_object('status','live','serve',side,'firstServe',side,
        'switched',false,'left',case when n = 0 then coalesce(a->>'left', s->>'left')
          when s->>'left' = 'a' then 'b' else 'a' end,
        'sets', sets || jsonb_build_array(jsonb_build_object(
          'a',0,'b',0,'target',target,'winner',null)));
    when 'POINT_AWARDED', 'POINT_CORRECTED' then
      if status <> 'live' or n = 0 or
        (kind = 'POINT_AWARDED' and last_set->>'winner' is not null)
      then raise exception 'invalid_action'; end if;
      if kind = 'POINT_AWARDED' then
        x := (last_set->>'a')::integer + (side = 'a')::integer;
        y := (last_set->>'b')::integer + (side = 'b')::integer;
        s := s || jsonb_build_object('serve',side);
      else
        x := (a->>'a')::integer;
        y := (a->>'b')::integer;
      end if;
      if not coalesce(x between 0 and 2147483646 and y between 0 and 2147483646,false)
      then raise exception 'invalid_action'; end if;
      if greatest(x,y) >= (last_set->>'target')::integer and
        abs(x-y) >= (r->>'margin')::integer
      then winning_side := case when x > y then 'a' else 'b' end; end if;
      sets := jsonb_set(sets,array[(n-1)::text],
        last_set || jsonb_build_object('a',x,'b',y,'winner',winning_side));
      if (select count(*) from jsonb_array_elements(sets) e where e->>'winner' = winning_side)
        < (best+1)/2 then winning_side := null; end if;
      return s || jsonb_build_object('sets',sets,'winner',winning_side);
    when 'EVENT_UNDONE' then
      if status not in ('live','paused') or undo_state is null
      then raise exception 'invalid_action'; end if;
      return undo_state;
    when 'SERVE_CHANGED' then
      if status <> 'live' or n = 0 or last_set->>'winner' is not null
      then raise exception 'invalid_action'; end if;
      return s || jsonb_build_object('serve',side);
    when 'SIDES_SWITCHED' then
      if status <> 'live' then raise exception 'invalid_action'; end if;
      return s || jsonb_build_object('left',case when s->>'left' = 'a' then 'b' else 'a' end,
        'switched',(s->>'switched')::boolean or
          (n = best and best > 1 and last_set->>'winner' is null and
            (r->>'switchAt')::integer > 0 and
            greatest((last_set->>'a')::integer,(last_set->>'b')::integer) >=
              (r->>'switchAt')::integer));
    when 'MATCH_PAUSED' then
      if status <> 'live' then raise exception 'invalid_action'; end if;
      return s || '{"status":"paused"}'::jsonb;
    when 'MATCH_RESUMED' then
      if status <> 'paused' then raise exception 'invalid_action'; end if;
      return s || '{"status":"live"}'::jsonb;
    when 'MATCH_COMPLETED' then
      if status <> 'live' or s->>'winner' is null then raise exception 'invalid_action'; end if;
      return s || '{"status":"completed","outcome":"played"}'::jsonb;
    when 'MATCH_REOPENED' then
      if status <> 'completed' or s->>'outcome' <> 'played'
      then raise exception 'invalid_action'; end if;
      return s || '{"status":"live","outcome":null}'::jsonb;
    when 'MATCH_CANCELLED' then
      if status in ('completed','cancelled') then raise exception 'invalid_action'; end if;
      return s || '{"status":"cancelled","outcome":null,"winner":null}'::jsonb;
    when 'WALKOVER' then
      if status not in ('scheduled','live','paused') then raise exception 'invalid_action'; end if;
      return s || jsonb_build_object('status','completed','outcome','walkover','winner',side);
    else raise exception 'invalid_action';
  end case;
end $$;

create function public.skv_project_score() returns trigger language plpgsql set search_path = ''
as $$
declare c public.skv_competitions;
begin
  select * into c from public.skv_competitions where id = new.competition_id;
  if not new.published or (c.id is not null and c.visibility <> 'public') then
    delete from public.skv_public_scores where match_id = new.id;
  else
    insert into public.skv_public_scores values (
      new.id, c.id, c.name, new.external_match_id, new.team_a, new.team_b, new.court,
      new.scheduled_at, new.finished_at, new.state - 'firstServe' - 'switched',
      new.version, new.updated_at
    ) on conflict (match_id) do update set competition_name = excluded.competition_name,
      team_a = excluded.team_a, team_b = excluded.team_b, court = excluded.court,
      scheduled_at = excluded.scheduled_at, finished_at = excluded.finished_at, state = excluded.state,
      version = excluded.version, updated_at = excluded.updated_at;
  end if;
  return new;
end $$;
create trigger skv_project_score after insert or update on public.skv_matches
for each row execute function public.skv_project_score();

create function public.skv_read_match(mid uuid) returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare m public.skv_matches;
begin
  if not public.skv_can_score(mid) then raise exception 'access_denied'; end if;
  select * into strict m from public.skv_matches where id = mid;
  return to_jsonb(m);
end $$;

create function public.skv_list_matches(cid uuid default null) returns setof public.skv_matches
language sql stable security definer set search_path = ''
as $$
  select * from public.skv_matches m where (cid is null or m.competition_id = cid)
    and public.skv_can_score(m.id)
  order by m.updated_at desc limit 250
$$;

create function public.skv_acquire_lease(mid uuid, device uuid, force_takeover boolean,
  expected_fence integer default null)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare l public.skv_match_leases;
begin
  perform 1 from public.skv_matches where id = mid for update;
  if not found or device is null or not public.skv_can_score(mid) or
    (force_takeover and not public.skv_admin()) then raise exception 'access_denied'; end if;
  select * into l from public.skv_match_leases where match_id = mid;
  if expected_fence is not null and (l.fence is distinct from expected_fence or
    l.user_id is distinct from auth.uid() or l.device_id is distinct from device)
  then raise exception 'lease_lost'; end if;
  if l.match_id is not null and l.expires_at > clock_timestamp() and
    (l.user_id <> auth.uid() or l.device_id <> device) and not coalesce(force_takeover,false)
  then raise exception 'lease_taken'; end if;
  insert into public.skv_match_leases values (mid,auth.uid(),device,coalesce(l.fence,0)+
    case when l.user_id = auth.uid() and l.device_id = device then 0 else 1 end,
    clock_timestamp()+interval '90 seconds')
  on conflict (match_id) do update set user_id = excluded.user_id,
    device_id = excluded.device_id, fence = excluded.fence, expires_at = excluded.expires_at
  returning * into l;
  return jsonb_build_object('fence',l.fence,'expires',l.expires_at,'match',
    (select to_jsonb(m) from public.skv_matches m where m.id = mid));
end $$;

create function public.skv_release_lease(mid uuid, device uuid, lease_fence integer)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  perform 1 from public.skv_matches where id = mid for update;
  if not found or not public.skv_can_score(mid) then raise exception 'access_denied'; end if;
  update public.skv_match_leases set expires_at = clock_timestamp(), fence = fence+1
    where match_id = mid and user_id = auth.uid() and device_id = device and fence = lease_fence;
  if not found then raise exception 'lease_lost'; end if;
end $$;

create function public.skv_apply_event(mid uuid, device uuid, lease_fence integer,
  eid uuid, base integer, happened_at timestamptz, action jsonb)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  m public.skv_matches;
  e public.skv_match_events;
  undoable public.skv_match_events;
  next_state jsonb;
begin
  select * into m from public.skv_matches where id = mid for update;
  if not found or not public.skv_can_score(mid) then raise exception 'access_denied'; end if;
  if not coalesce(jsonb_typeof(action) = 'object' and pg_column_size(action) <= 4096 and
    eid is not null and happened_at is not null, false) then raise exception 'invalid_action'; end if;
  select * into e from public.skv_match_events where event_id = eid;
  if found then
    if e.match_id <> mid or e.actor_id is distinct from auth.uid() or
      e.base_version is distinct from base or e.action is distinct from action
    then raise exception 'event_reused'; end if;
    return jsonb_build_object('ack',e.sequence,'match',to_jsonb(m));
  end if;
  if not exists (select from public.skv_match_leases l where l.match_id = mid and
    l.user_id = auth.uid() and l.device_id = device and l.fence = lease_fence and
    l.expires_at > clock_timestamp()) then raise exception 'lease_lost'; end if;
  if m.version is distinct from base then raise exception 'version_conflict'; end if;
  if action->>'type' in ('MATCH_REOPENED','MATCH_CANCELLED','WALKOVER') and
    not public.skv_admin() then raise exception 'access_denied'; end if;
  if action->>'type' = 'EVENT_UNDONE' then
    select * into undoable from public.skv_match_events candidate
    where candidate.match_id = mid and candidate.sequence > coalesce((
      select max(barrier.sequence) from public.skv_match_events barrier
      where barrier.match_id = mid and barrier.action->>'type' in
        ('MATCH_COMPLETED','MATCH_REOPENED','WALKOVER','MATCH_CANCELLED')
    ),0) and candidate.action->>'type' <> 'EVENT_UNDONE' and not exists (
      select from public.skv_match_events replacement
      where replacement.reference_event_id = candidate.event_id
    ) order by candidate.sequence desc limit 1;
  end if;
  next_state := public.skv_reduce_score(m.state,m.rules,action,undoable.before_state);
  insert into public.skv_match_events values
    (mid,eid,base+1,base,auth.uid(),action,m.state,undoable.event_id,happened_at,clock_timestamp());
  update public.skv_matches set state = next_state, version = base+1,
    started_at = case when next_state->>'status' = 'scheduled' then null
      when action->>'type' = 'MATCH_STARTED' then clock_timestamp() else m.started_at end,
    finished_at = case when next_state->>'status' in ('completed','cancelled')
      then clock_timestamp() else null end,
    updated_at = clock_timestamp() where id = mid returning * into m;
  return jsonb_build_object('ack',m.version,'match',to_jsonb(m));
end $$;

create function public.skv_match_history(mid uuid) returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.skv_can_score(mid) then raise exception 'access_denied'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id',event_id,'action',action,
    'sequence',sequence,'before',before_state,'reference',reference_event_id,
    'at',server_created_at) order by sequence) from public.skv_match_events
    where match_id = mid),'[]');
end $$;

create function public.skv_control_snapshot(mid uuid) returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object('match', public.skv_read_match(mid), 'history',
    public.skv_match_history(mid))
$$;

create function public.skv_archive_conflict(mid uuid, cid uuid, events jsonb, local_state jsonb)
returns void language plpgsql security definer set search_path = ''
as $$
declare revision integer;
begin
  select version into revision from public.skv_matches where id = mid for update;
  if not found or not public.skv_can_score(mid) then raise exception 'access_denied'; end if;
  if jsonb_typeof(events) is distinct from 'array' or pg_column_size(events) > 1048576
    or coalesce(pg_column_size(local_state),0) not between 1 and 16384
    then raise exception 'invalid_action'; end if;
  insert into public.skv_match_conflicts values
    (cid,mid,auth.uid(),events,local_state,revision,'keep_server',now()) on conflict do nothing;
  if not exists (select from public.skv_match_conflicts c where c.id = cid and
    c.match_id = mid and c.actor_id = auth.uid() and c.queued_events = events and
    c.local_state = skv_archive_conflict.local_state) then raise exception 'event_reused'; end if;
end $$;

revoke all on function public.skv_can_score(uuid), public.skv_validate_rules(jsonb),
  public.skv_reduce_score(jsonb,jsonb,jsonb,jsonb), public.skv_project_score(),
  public.skv_read_match(uuid), public.skv_list_matches(uuid),
  public.skv_acquire_lease(uuid,uuid,boolean,integer), public.skv_release_lease(uuid,uuid,integer),
  public.skv_apply_event(uuid,uuid,integer,uuid,integer,timestamptz,jsonb),
  public.skv_match_history(uuid), public.skv_control_snapshot(uuid),
  public.skv_archive_conflict(uuid,uuid,jsonb,jsonb)
  from public, anon, authenticated;
grant execute on function public.skv_read_match(uuid), public.skv_list_matches(uuid),
  public.skv_acquire_lease(uuid,uuid,boolean,integer), public.skv_release_lease(uuid,uuid,integer),
  public.skv_apply_event(uuid,uuid,integer,uuid,integer,timestamptz,jsonb),
  public.skv_match_history(uuid), public.skv_control_snapshot(uuid),
  public.skv_archive_conflict(uuid,uuid,jsonb,jsonb)
  to authenticated;

alter publication supabase_realtime add table public.skv_public_scores;
