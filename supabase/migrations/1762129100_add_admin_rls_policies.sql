-- Admin-focused RLS policies for Supabase project
-- Expects JWT to carry raw app metadata with role = 'admin'

drop policy if exists "Admin read content" on public.content_items;
create policy "Admin read content"
  on public.content_items
  for select
  using ((auth.jwt()->>'role') = 'admin');

drop policy if exists "Admin manage content" on public.content_items;
create policy "Admin manage content"
  on public.content_items
  for all
  using ((auth.jwt()->>'role') = 'admin')
  with check ((auth.jwt()->>'role') = 'admin');

drop policy if exists "Admin read media" on public.media_assets;
create policy "Admin read media"
  on public.media_assets
  for select
  using ((auth.jwt()->>'role') = 'admin');

drop policy if exists "Admin manage media" on public.media_assets;
create policy "Admin manage media"
  on public.media_assets
  for all
  using ((auth.jwt()->>'role') = 'admin')
  with check ((auth.jwt()->>'role') = 'admin');

drop policy if exists "Admin read content-media links" on public.content_media_links;
create policy "Admin read content-media links"
  on public.content_media_links
  for select
  using ((auth.jwt()->>'role') = 'admin');

drop policy if exists "Admin read vector jobs" on public.vector_jobs;
create policy "Admin read vector jobs"
  on public.vector_jobs
  for select
  using ((auth.jwt()->>'role') = 'admin');

drop policy if exists "Admin manage vector jobs" on public.vector_jobs;
create policy "Admin manage vector jobs"
  on public.vector_jobs
  for update
  using ((auth.jwt()->>'role') = 'admin')
  with check ((auth.jwt()->>'role') = 'admin');
