-- Helper function to retry vector job ingestion from admin panel
-- Requires caller JWT to have role = 'admin'

create or replace function public.admin_retry_vector_job(job_id uuid)
returns public.vector_jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  attempted_role text := coalesce(auth.jwt()->>'role', '');
  retry_record public.vector_jobs;
begin
  if attempted_role <> 'admin' then
    raise exception 'Unauthorized';
  end if;

  update public.vector_jobs
    set status = 'pending',
        error = null,
        started_at = null,
        completed_at = null,
        updated_at = now()
  where id = job_id
  returning * into retry_record;

  if retry_record.id is null then
    raise exception 'Vector job % not found', job_id;
  end if;

  return retry_record;
end;
$$;
