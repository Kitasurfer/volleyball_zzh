\set ON_ERROR_STOP on
-- Run only in a disposable database with the SKV migrations installed.
begin;
insert into auth.users (id, email) values
  ('ba520000-0000-0000-0000-000000000001','admin@example.test'),
  ('ba520000-0000-0000-0000-000000000002','one@example.test'),
  ('ba520000-0000-0000-0000-000000000003','two@example.test'),
  ('ba520000-0000-0000-0000-000000000004','other@example.test');

create function pg_temp.expect_failure(query text, expected text)
returns void language plpgsql as $$
begin
  begin
    execute query;
  exception when others then
    if sqlerrm = expected or sqlstate = expected then return; end if;
    raise;
  end;
  raise exception 'Expected failure: %', expected;
end $$;

set local role authenticated;
select set_config('request.jwt.claim.sub','ba520000-0000-0000-0000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"ba520000-0000-0000-0000-000000000001",
  "app_metadata":{"role":"admin"}}',true);

do $$
declare c uuid; a uuid; b uuid; d uuid; e uuid; m uuid; n uuid;
  rules constant jsonb := '{"bestOf":1,"points":25,"deciding":15,"margin":2,"switchAt":8}';
  plan jsonb;
begin
  c := public.skv_save_competition(null,jsonb_build_object('name','SKV integration test',
    'visibility','public','rules',rules,'standings','{
      "order":["points","wins","setDifference","ballDifference"],
      "points":{"win":2,"loss":0,"decidingWin":2,"decidingLoss":1,
        "walkoverWin":1,"walkoverLoss":0}
    }'::jsonb));
  a := public.skv_add_team(c,'Test A');
  b := public.skv_add_team(c,'Test B');
  d := public.skv_add_team(c,'Test C');
  e := public.skv_add_team(c,'Test D');
  plan := jsonb_build_object('competition_id',c,'team_a_id',a,'team_b_id',b,
    'court','Test field 1','scheduled_at','2026-11-28T12:00:00Z','published',true);
  m := public.skv_create_match(plan);
  perform pg_temp.expect_failure(format('select public.skv_create_match(%L)',plan::text),
    'schedule_overlap');
  n := public.skv_create_match(plan || jsonb_build_object('court','Test field 2',
    'team_a_id',d,'team_b_id',e));
  perform public.skv_assign_referee(m,'one@example.test',now()+interval '1 day',false);
  perform public.skv_assign_referee(m,'two@example.test',now()+interval '1 day',false);
  perform public.skv_assign_referee(n,'two@example.test',now()+interval '1 day',false);
  perform set_config('test.cid',c::text,true);
  perform set_config('test.mid',m::text,true);
  perform set_config('test.mid2',n::text,true);
  perform set_config('test.local', public.skv_create_match(
    jsonb_build_object('team_a','Local A','team_b','Local B','rules',rules))::text,true);
end $$;

set local role anon;
do $$
declare m uuid := current_setting('test.mid')::uuid;
begin
  if (select count(*) from public.skv_public_scores where match_id = m) <> 1 or
    exists (select from public.skv_public_scores where match_id = current_setting('test.local')::uuid)
    then raise exception 'incorrect spectator projection'; end if;
  perform pg_temp.expect_failure('delete from public.skv_public_scores','42501');
  perform pg_temp.expect_failure('select * from public.skv_match_events','42501');
  perform pg_temp.expect_failure(format('select public.skv_read_match(%L)',m),'42501');
  perform pg_temp.expect_failure(format(
    'select public.skv_apply_event(%L,null,1,null,0,now(),%L)',m,'{}'),'42501');
end $$;

set local role authenticated;
select set_config('request.jwt.claims','{}',true);
select set_config('request.jwt.claim.sub','ba520000-0000-0000-0000-000000000004',true);
do $$
declare m uuid := current_setting('test.mid')::uuid;
begin
  perform pg_temp.expect_failure(format('select public.skv_read_match(%L)',m),'access_denied');
  perform pg_temp.expect_failure(format('select public.skv_acquire_lease(%L,%L,false)',m,
    gen_random_uuid()),'access_denied');
  perform pg_temp.expect_failure('update public.skv_matches set version = 999','42501');
end $$;

select set_config('request.jwt.claim.sub','ba520000-0000-0000-0000-000000000002',true);
do $$
declare m uuid := current_setting('test.mid')::uuid; device uuid := gen_random_uuid();
  fence integer; eid uuid := gen_random_uuid(); pt uuid := gen_random_uuid();
  t timestamptz := now();
  ack jsonb;
begin
  fence := (public.skv_acquire_lease(m,device,false)->>'fence')::integer;
  perform pg_temp.expect_failure(format('select public.skv_acquire_lease(%L,%L,false)',m,
    gen_random_uuid()),'lease_taken');
  perform public.skv_apply_event(m,device,fence,eid,0,t,'{"type":"MATCH_STARTED","side":"a"}');
  perform public.skv_apply_event(m,device,fence,pt,1,t,'{"type":"POINT_AWARDED","side":"b"}');
  ack := public.skv_apply_event(m,device,fence,pt,1,t,'{"type":"POINT_AWARDED","side":"b"}');
  if ack #>> '{match,state,sets,0,b}' <> '1' or ack->>'ack' <> '2' then
    raise exception 'duplicate event corrupted state'; end if;
  perform pg_temp.expect_failure(format('select public.skv_apply_event(%L,%L,%L,%L,1,now(),%L)',
    m,device,fence,gen_random_uuid(),'{"type":"POINT_AWARDED","side":"a"}'),'version_conflict');
  perform public.skv_apply_event(m,device,fence,gen_random_uuid(),2,t,'{"type":"EVENT_UNDONE"}');
  ack := public.skv_control_snapshot(m);
  if ack #>> '{match,state,serve}' <> 'a' or ack #>> '{match,state,sets,0,b}' <> '0' or
    ack #>> '{history,2,reference}' <> pt::text then raise exception 'undo mismatch'; end if;
  perform public.skv_apply_event(m,device,fence,gen_random_uuid(),3,t,
    '{"type":"POINT_CORRECTED","a":25,"b":24,"reason":"tested"}');
  if (public.skv_read_match(m) #>> '{state,winner}') is not null then
    raise exception 'deuce finished too early'; end if;
  perform public.skv_apply_event(m,device,fence,gen_random_uuid(),4,t,
    '{"type":"POINT_AWARDED","side":"a"}');
  perform public.skv_apply_event(m,device,fence,gen_random_uuid(),5,t,'{"type":"MATCH_COMPLETED"}');
  perform pg_temp.expect_failure(format('select public.skv_apply_event(%L,%L,%L,%L,6,now(),%L)',
    m,device,fence,gen_random_uuid(),'{"type":"MATCH_REOPENED","reason":"test"}'),'access_denied');
  perform set_config('test.device',device::text,true);
  perform set_config('test.fence',fence::text,true);
end $$;

select set_config('request.jwt.claim.sub','ba520000-0000-0000-0000-000000000003',true);
do $$
declare m uuid := current_setting('test.mid2')::uuid; device uuid := gen_random_uuid();
  fence integer;
begin
  fence := (public.skv_acquire_lease(m,device,false)->>'fence')::integer;
  perform public.skv_apply_event(m,device,fence,gen_random_uuid(),0,now(),
    '{"type":"MATCH_STARTED","side":"b","left":"b"}');
  if (select state->>'left' from public.skv_public_scores where match_id = m) <> 'b' then
    raise exception 'second court projection missing'; end if;
end $$;

select set_config('request.jwt.claim.sub','ba520000-0000-0000-0000-000000000001',true);
select set_config('request.jwt.claims','{"app_metadata":{"role":"admin"}}',true);
do $$
declare m uuid := current_setting('test.mid')::uuid; c uuid := current_setting('test.cid')::uuid;
  device uuid := gen_random_uuid(); fence integer;
begin
  if (select points from public.skv_standings(c) where team = 'Test A') <> 2 then
    raise exception 'missing points for confirmed match'; end if;
  fence := (public.skv_acquire_lease(m,device,true)->>'fence')::integer;
  if fence <= current_setting('test.fence')::integer then raise exception 'fence not advanced'; end if;
  perform public.skv_apply_event(m,device,fence,gen_random_uuid(),6,now(),
    '{"type":"MATCH_REOPENED","reason":"verified"}');
  if (select sum(points) from public.skv_standings(c)) <> 0 then
    raise exception 'unconfirmed result remained ranked'; end if;
  perform public.skv_apply_event(m,device,fence,gen_random_uuid(),7,now(),
    '{"type":"POINT_CORRECTED","a":16,"b":25,"reason":"verified"}');
  perform public.skv_apply_event(m,device,fence,gen_random_uuid(),8,now(),
    '{"type":"MATCH_COMPLETED"}');
  if (select points from public.skv_standings(c) where team = 'Test B') <> 2 or
    (select sum(points) from public.skv_standings(c)) <> 2
  then raise exception 'correction was double-counted'; end if;
end $$;

select set_config('request.jwt.claim.sub','ba520000-0000-0000-0000-000000000002',true);
select set_config('request.jwt.claims','{}',true);
do $$
declare m uuid := current_setting('test.mid')::uuid; cid uuid := gen_random_uuid();
  device uuid := current_setting('test.device')::uuid;
  fence integer := current_setting('test.fence')::integer;
begin
  perform pg_temp.expect_failure(format('select public.skv_acquire_lease(%L,%L,false,%L)',
    m,device,fence),'lease_lost');
  perform pg_temp.expect_failure(format('select public.skv_apply_event(%L,%L,%L,%L,6,now(),%L)',
    m,device,fence,gen_random_uuid(),'{"type":"MATCH_PAUSED"}'),'lease_lost');
  perform public.skv_archive_conflict(m,cid,'[{"offline":true}]','{"local":true}');
  perform public.skv_archive_conflict(m,cid,'[{"offline":true}]','{"local":true}');
end $$;

select set_config('request.jwt.claim.sub','ba520000-0000-0000-0000-000000000001',true);
select set_config('request.jwt.claims','{"app_metadata":{"role":"admin"}}',true);
select public.skv_assign_referee(current_setting('test.mid')::uuid,'one@example.test',null,true);
select public.skv_assign_referee(current_setting('test.mid2')::uuid,'two@example.test',
  clock_timestamp() + interval '1 second',false);
select pg_sleep(1.1);

do $$
declare
  src uuid := gen_random_uuid(); mid uuid; imported jsonb; actions jsonb; events jsonb;
  device uuid := gen_random_uuid(); fence integer;
  config jsonb := '{"team_a":"Device A","team_b":"Device B","rules":{"bestOf":3,"points":25,"deciding":15,"margin":2,"switchAt":8}}';
begin
  actions := '[{"type":"MATCH_STARTED","side":"a"},
    {"type":"POINT_CORRECTED","a":25,"b":18,"reason":"verified"},
    {"type":"SET_STARTED","side":"b"},
    {"type":"POINT_CORRECTED","a":25,"b":23,"reason":"verified"},
    {"type":"EARLIER_SET_CORRECTED","setNumber":1,"a":25,"b":20,"reason":"sheet"},
    {"type":"MATCH_COMPLETED"}]';
  select jsonb_agg(jsonb_build_object('id',gen_random_uuid(),'at',now() + i * interval '1 minute',
    'action',a) order by i) into events from jsonb_array_elements(actions) with ordinality as x(a,i);
  perform pg_temp.expect_failure(format('select public.skv_publish_local_match(%L,%L,%L)',
    src,config,events - 5),'invalid_action');
  mid := public.skv_publish_local_match(src,config,events);
  imported := public.skv_control_snapshot(mid);
  if public.skv_publish_local_match(src,config,events) <> mid
    or (imported->'match'->>'version')::integer <> 6
    or jsonb_array_length(imported->'history') <> 6
    or (imported->'history'->0->>'at')::timestamptz <> (events->0->>'at')::timestamptz
    or (imported->'match'->>'finished_at')::timestamptz <> (events->5->>'at')::timestamptz
    or (select state->'sets'->0->>'b' from public.skv_public_scores where match_id = mid) <> '20'
    then raise exception 'local publication did not preserve the result'; end if;
  perform pg_temp.expect_failure(format('select public.skv_publish_local_match(%L,%L,%L)',
    src,config || '{"court":"different"}',events),'event_reused');
  fence := (public.skv_acquire_lease(mid,device,false)->>'fence')::integer;
  perform public.skv_apply_event(mid,device,fence,gen_random_uuid(),6,now(),
    '{"type":"MATCH_REOPENED","reason":"Review"}');
  perform public.skv_apply_event(mid,device,fence,gen_random_uuid(),7,now(),
    '{"type":"EARLIER_SET_CORRECTED","setNumber":1,"a":23,"b":25,"reason":"Review"}');
  perform public.skv_apply_event(mid,device,fence,gen_random_uuid(),8,now(),
    '{"type":"SET_STARTED","side":"a"}');
  perform pg_temp.expect_failure(format('select public.skv_apply_event(%L,%L,%L,%L,9,now(),%L)',
    mid,device,fence,gen_random_uuid(),
    '{"type":"EARLIER_SET_CORRECTED","setNumber":1,"a":25,"b":21,"reason":"Review"}'),
    'invalid_set_history');
end $$;

select set_config('request.jwt.claims','{}',true);
select set_config('request.jwt.claim.sub','ba520000-0000-0000-0000-000000000002',true);
select pg_temp.expect_failure('select public.skv_publish_local_match(gen_random_uuid(),''{}'',''[]'')','access_denied');
select pg_temp.expect_failure(format('select public.skv_read_match(%L)',
  current_setting('test.mid')),'access_denied');
select set_config('request.jwt.claim.sub','ba520000-0000-0000-0000-000000000003',true);
select pg_temp.expect_failure(format('select public.skv_read_match(%L)',
  current_setting('test.mid2')),'access_denied');

reset role;
do $$
begin
  if (select count(*) from public.skv_match_conflicts where match_id = current_setting('test.mid')::uuid) <> 1
    or not exists (select from pg_publication_tables where pubname = 'supabase_realtime'
      and tablename = 'skv_public_scores')
  then raise exception 'archive or realtime publication mismatch'; end if;
end $$;
rollback;
