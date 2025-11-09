-- Allow admins to enqueue vector jobs manually

create policy if not exists "Admin insert vector jobs"
  on public.vector_jobs
  for insert
  with check ((auth.jwt()->>'role') = 'admin');

create or replace function public.admin_enqueue_vector_job(content_id uuid, reason text default 'admin_manual')
returns public.vector_jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  attempted_role text := coalesce(auth.jwt()->>'role', '');
  inserted_record public.vector_jobs;
begin
  if attempted_role <> 'admin' then
    raise exception 'Unauthorized';
  end if;

  insert into public.vector_jobs (content_id, status, payload)
    values (content_id, 'pending', jsonb_build_object('reason', reason))
  returning * into inserted_record;

  return inserted_record;
end;
$$;
