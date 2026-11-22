-- Track team timeouts (2 per set) inside the set score like the TypeScript reducer.
create or replace function public.skv_reduce_current_set(s jsonb, r jsonb, a jsonb,
  undo_state jsonb)
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
  if kind in ('MATCH_STARTED','SET_STARTED','POINT_AWARDED','SERVE_CHANGED','WALKOVER',
    'TIMEOUT_CALLED') and coalesce(side, '') not in ('a','b')
  then raise exception 'invalid_action'; end if;
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
          'a',0,'b',0,'target',target,'winner',null,'timeouts_a',0,'timeouts_b',0)));
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
    when 'TIMEOUT_CALLED' then
      if status <> 'live' or n = 0 or last_set->>'winner' is not null
      then raise exception 'invalid_action'; end if;
      x := coalesce((last_set->>('timeouts_' || side))::integer, 0) + 1;
      if x > 2 then raise exception 'invalid_action'; end if;
      sets := jsonb_set(sets,array[(n-1)::text],
        last_set || jsonb_build_object('timeouts_' || side, x));
      return s || jsonb_build_object('sets',sets);
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
