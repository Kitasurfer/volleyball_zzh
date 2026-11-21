-- Keep the original reducer for every event already present in the journal.
alter function public.skv_reduce_score(jsonb,jsonb,jsonb,jsonb) rename to skv_reduce_current_set;
create function public.skv_reduce_score(s jsonb, r jsonb, a jsonb, undo_state jsonb)
returns jsonb language plpgsql immutable set search_path = ''
as $$
declare
  sets jsonb := s->'sets';
  n integer := jsonb_array_length(sets);
  pos integer;
  corrected jsonb;
  needed integer := ((r->>'bestOf')::integer + 1) / 2;
  winner text;
begin
  if a->>'type' is distinct from 'EARLIER_SET_CORRECTED' then
    return public.skv_reduce_current_set(s,r,a,undo_state);
  end if;
  pos := (a->>'setNumber')::integer;
  if pos is null or pos < 1 or pos >= n then raise exception 'invalid_action'; end if;
  corrected := public.skv_reduce_current_set(
    s || jsonb_build_object('sets',jsonb_build_array(sets->(pos-1))), r,
    a || '{"type":"POINT_CORRECTED"}'::jsonb, null)->'sets'->0;
  if corrected->>'winner' is null then raise exception 'invalid_set_history'; end if;
  sets := jsonb_set(sets,array[(pos-1)::text],corrected);
  -- Every later set must still have been legal to start.
  if exists (select from jsonb_array_elements(sets - (n-1)) e
    group by e->>'winner' having count(*) >= needed)
  then raise exception 'invalid_set_history'; end if;
  select e->>'winner' into winner from jsonb_array_elements(sets) e
    where e->>'winner' is not null group by e->>'winner' having count(*) >= needed;
  return s || jsonb_build_object('sets',sets,'winner',winner);
end $$;
revoke all on function public.skv_reduce_score(jsonb,jsonb,jsonb,jsonb) from public, anon, authenticated;

create table public.skv_local_imports (
  source_id uuid primary key,
  match_id uuid not null unique references public.skv_matches on delete restrict,
  fingerprint bytea not null,
  imported_version integer not null
);
alter table public.skv_local_imports enable row level security;
revoke all on public.skv_local_imports from public, anon, authenticated;

-- Replay the device journal under the same rules, lease and version checks as live scoring.
create function public.skv_publish_local_match(source_id uuid, config jsonb, events jsonb)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare
  prior public.skv_local_imports;
  fingerprint bytea;
  mid uuid;
  device uuid := gen_random_uuid();
  fence integer;
  item jsonb;
  revision integer := 0;
  played_at timestamptz;
  started timestamptz;
  status text;
begin
  if auth.uid() is null or not public.skv_admin() then raise exception 'access_denied'; end if;
  if source_id is null or jsonb_typeof(config) is distinct from 'object'
    or jsonb_typeof(events) is distinct from 'array' then raise exception 'invalid_action'; end if;
  if jsonb_array_length(events) not between 1 and 5000 or pg_column_size(events) > 4194304
    then raise exception 'invalid_action'; end if;
  fingerprint := sha256(convert_to(jsonb_build_array(config,events)::text,'UTF8'));
  perform pg_advisory_xact_lock(hashtextextended(source_id::text,0));
  select * into prior from public.skv_local_imports i where i.source_id = skv_publish_local_match.source_id;
  if found then
    if prior.fingerprint <> fingerprint then raise exception 'event_reused'; end if;
    return prior.match_id;
  end if;
  mid := public.skv_create_match(jsonb_build_object('team_a',config->>'team_a',
    'team_b',config->>'team_b','rules',config->'rules','court',config->>'court'));
  fence := (public.skv_acquire_lease(mid,device,false)->>'fence')::integer;
  for item in select value from jsonb_array_elements(events) loop
    played_at := (item->>'at')::timestamptz;
    status := public.skv_apply_event(mid,device,fence,(item->>'id')::uuid,revision,
      played_at,item->'action')->'match'->'state'->>'status';
    if item->'action'->>'type' = 'MATCH_STARTED' then started := played_at; end if;
    revision := revision + 1;
  end loop;
  if status is distinct from 'completed' then raise exception 'invalid_action'; end if;
  perform public.skv_release_lease(mid,device,fence);
  update public.skv_matches set published = true, started_at = started,
    finished_at = played_at, updated_at = clock_timestamp() where id = mid;
  insert into public.skv_local_imports values (source_id,mid,fingerprint,revision);
  return mid;
end $$;
revoke all on function public.skv_publish_local_match(uuid,jsonb,jsonb) from public, anon;
grant execute on function public.skv_publish_local_match(uuid,jsonb,jsonb) to authenticated;

create or replace function public.skv_match_history(mid uuid) returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare imported_version integer;
begin
  if not public.skv_can_score(mid) then raise exception 'access_denied'; end if;
  select i.imported_version into imported_version from public.skv_local_imports i where i.match_id = mid;
  return coalesce((select jsonb_agg(jsonb_build_object('id',event_id,'action',action,
    'sequence',sequence,'before',before_state,'reference',reference_event_id,
    'at',case when sequence <= imported_version then client_created_at else server_created_at end)
    order by sequence) from public.skv_match_events where match_id = mid),'[]');
end $$;
