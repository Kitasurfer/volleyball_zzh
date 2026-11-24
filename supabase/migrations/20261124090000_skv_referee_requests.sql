create table public.skv_referee_requests (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.skv_matches on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 80),
  status text not null default 'pending' check (status in ('pending','approved','rejected','revoked')),
  granted_scope text not null default 'match' check (granted_scope in ('match','court','competition')),
  created_at timestamptz not null default now(),
  decided_at timestamptz
);
create unique index skv_referee_requests_pending_idx on public.skv_referee_requests
  (match_id, user_id) where status = 'pending';
alter table public.skv_referee_requests enable row level security;
revoke all on public.skv_referee_requests from public, anon, authenticated;

create function public.skv_anonymous() returns boolean
language sql stable set search_path = ''
as $$ select coalesce(auth.jwt()->>'is_anonymous','false')::boolean $$;
revoke all on function public.skv_anonymous() from public, anon, authenticated;
grant execute on function public.skv_anonymous() to authenticated;

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
    team_a,team_b,court,scheduled_at,duration_minutes,published,rules,created_by)
  values (cid,ext,a,b,
    case when a is not null then (select t.name from public.skv_teams t where t.id = a)
      else btrim(config->>'team_a') end,
    case when b is not null then (select t.name from public.skv_teams t where t.id = b)
      else btrim(config->>'team_b') end,
    court_label,starts,minutes,pub,rules,auth.uid()) returning id into mid;
  return mid;
end $$;

create function public.skv_request_referee(mid uuid, referee_name text) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare m public.skv_matches; rid uuid;
begin
  if auth.uid() is null then raise exception 'access_denied'; end if;
  select * into m from public.skv_matches where id = mid;
  if not found or m.state->>'status' in ('completed','cancelled') then
    raise exception 'invalid_action'; end if;
  if public.skv_can_score(mid) then raise exception 'invalid_action'; end if;
  insert into public.skv_referee_requests (match_id,user_id,name)
    values (mid,auth.uid(),btrim(referee_name))
  on conflict (match_id,user_id) where status = 'pending'
    do update set name = excluded.name returning id into rid;
  return rid;
end $$;

create function public.skv_referee_status(mid uuid) returns text
language plpgsql stable security definer set search_path = ''
as $$
declare s text;
begin
  if auth.uid() is null then return 'anonymous'; end if;
  if public.skv_can_score(mid) then return 'scoring'; end if;
  select r.status into s from public.skv_referee_requests r
    where r.match_id = mid and r.user_id = auth.uid()
    order by r.created_at desc limit 1;
  return coalesce(s,'none');
end $$;

create function public.skv_referee_requests(cid uuid default null)
returns table (id uuid, match_id uuid, name text, status text, created_at timestamptz,
  team_a text, team_b text, court text, scheduled_at timestamptz, competition_id uuid)
language sql stable security definer set search_path = ''
as $$
  select r.id, r.match_id, r.name, r.status, r.created_at, m.team_a, m.team_b, m.court,
    m.scheduled_at, m.competition_id
  from public.skv_referee_requests r join public.skv_matches m on m.id = r.match_id
  where (cid is null or m.competition_id = cid)
    and r.status in ('pending','approved')
    and auth.uid() is not null and public.skv_admin()
  order by r.status = 'approved', r.created_at desc limit 100
$$;

create function public.skv_review_referee(rid uuid, approve boolean, scope text default 'match',
  expires timestamptz default null) returns void
language plpgsql security definer set search_path = ''
as $$
declare r public.skv_referee_requests; m public.skv_matches; until timestamptz;
begin
  if auth.uid() is null or not public.skv_admin() then raise exception 'access_denied'; end if;
  select * into r from public.skv_referee_requests where id = rid for update;
  if not found or r.status in ('rejected','revoked') or scope not in
    ('match','court','competition') then raise exception 'invalid_action'; end if;
  select * into m from public.skv_matches where id = r.match_id;
  update public.skv_referee_requests set decided_at = clock_timestamp(),
    status = case when approve then 'approved' else
      case when r.status = 'approved' then 'revoked' else 'rejected' end end,
    granted_scope = case when approve then scope else granted_scope end
    where id = rid;
  if not approve then
    update public.skv_match_referees ref set revoked_at = clock_timestamp()
      from public.skv_matches target
      where ref.match_id = target.id and ref.user_id = r.user_id and
        (target.id = r.match_id or (m.competition_id is not null and
          target.competition_id = m.competition_id and
          (r.granted_scope = 'competition' or
            (r.granted_scope = 'court' and m.court <> '' and
              lower(target.court) = lower(m.court)))));
    update public.skv_match_leases l set expires_at = clock_timestamp(), fence = l.fence+1
      from public.skv_matches target
      where l.match_id = target.id and l.user_id = r.user_id and
        (target.id = r.match_id or (m.competition_id is not null and
          target.competition_id = m.competition_id and
          (r.granted_scope = 'competition' or
            (r.granted_scope = 'court' and m.court <> '' and
              lower(target.court) = lower(m.court)))));
    return;
  end if;
  until := coalesce(expires, clock_timestamp() + interval '12 hours');
  if not coalesce(until > now() and until <= now()+interval '30 days',false)
    then raise exception 'invalid_expiry'; end if;
  insert into public.skv_match_referees (match_id,user_id,expires_at,revoked_at)
    select target.id, r.user_id, until, null from public.skv_matches target
    where target.state->>'status' <> 'cancelled' and (target.id = r.match_id or (
      m.competition_id is not null and target.competition_id = m.competition_id and
      (scope = 'competition' or
        (scope = 'court' and m.court <> '' and lower(target.court) = lower(m.court)))))
  on conflict (match_id,user_id) do update set
    expires_at = excluded.expires_at, revoked_at = null;
end $$;

revoke all on function public.skv_request_referee(uuid,text), public.skv_referee_status(uuid),
  public.skv_referee_requests(uuid), public.skv_review_referee(uuid,boolean,text,timestamptz)
  from public, anon;
grant execute on function public.skv_request_referee(uuid,text), public.skv_referee_status(uuid),
  public.skv_referee_requests(uuid), public.skv_review_referee(uuid,boolean,text,timestamptz)
  to authenticated;
