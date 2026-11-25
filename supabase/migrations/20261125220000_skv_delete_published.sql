-- Allow admins to delete published matches as long as they are not completed.
-- The published flag blocked deletion of cancelled test matches with no way
-- to unpublish them, since edits are restricted to scheduled fixtures.
create or replace function public.skv_delete_match(mid uuid) returns void
language plpgsql security definer set search_path = ''
as $$
declare m public.skv_matches;
begin
  if not public.skv_admin() then raise exception 'access_denied'; end if;
  select * into strict m from public.skv_matches where id = mid;
  if (m.state->>'status') not in ('scheduled','live','paused','cancelled')
  then raise exception 'invalid_action'; end if;
  update public.skv_match_events set reference_event_id = null where match_id = mid;
  delete from public.skv_match_events where match_id = mid;
  delete from public.skv_match_conflicts where match_id = mid;
  delete from public.skv_local_imports where match_id = mid;
  delete from public.skv_matches where id = mid;
end $$;
