drop policy if exists "Admin read content" on public.content_items;
create policy "Admin read content"
  on public.content_items
  for select
  using ((auth.jwt()->'app_metadata'->>'role') = 'admin');

drop policy if exists "Admin manage content" on public.content_items;
create policy "Admin manage content"
  on public.content_items
  for all
  using ((auth.jwt()->'app_metadata'->>'role') = 'admin')
  with check ((auth.jwt()->'app_metadata'->>'role') = 'admin');

drop policy if exists "Admin read media" on public.media_assets;
create policy "Admin read media"
  on public.media_assets
  for select
  using ((auth.jwt()->'app_metadata'->>'role') = 'admin');

drop policy if exists "Admin manage media" on public.media_assets;
create policy "Admin manage media"
  on public.media_assets
  for all
  using ((auth.jwt()->'app_metadata'->>'role') = 'admin')
  with check ((auth.jwt()->'app_metadata'->>'role') = 'admin');

drop policy if exists "Admin read content-media links" on public.content_media_links;
create policy "Admin read content-media links"
  on public.content_media_links
  for select
  using ((auth.jwt()->'app_metadata'->>'role') = 'admin');

drop policy if exists "Admin read vector jobs" on public.vector_jobs;
create policy "Admin read vector jobs"
  on public.vector_jobs
  for select
  using ((auth.jwt()->'app_metadata'->>'role') = 'admin');

drop policy if exists "Admin manage vector jobs" on public.vector_jobs;
create policy "Admin manage vector jobs"
  on public.vector_jobs
  for update
  using ((auth.jwt()->'app_metadata'->>'role') = 'admin')
  with check ((auth.jwt()->'app_metadata'->>'role') = 'admin');

drop policy if exists "Admin insert vector jobs" on public.vector_jobs;
create policy "Admin insert vector jobs"
  on public.vector_jobs
  for insert
  with check ((auth.jwt()->'app_metadata'->>'role') = 'admin');

create or replace function public.admin_retry_vector_job(job_id uuid)
returns public.vector_jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  attempted_role text := coalesce(auth.jwt()->'app_metadata'->>'role', '');
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

create or replace function public.admin_enqueue_vector_job(content_id uuid, reason text default 'admin_manual')
returns public.vector_jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  attempted_role text := coalesce(auth.jwt()->'app_metadata'->>'role', '');
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
