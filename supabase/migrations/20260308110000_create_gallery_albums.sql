-- Gallery albums base table (required by gallery_subalbums migration)
-- Convergent: production already has these tables from manual setup with a
-- slightly different shape, so every statement is idempotent.

create table if not exists public.gallery_albums (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  event_date timestamptz,
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  sort_order integer not null default 0,
  cover_image_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Convergence for pre-existing production tables (missing columns only;
-- type differences like varchar/text or date/timestamptz are compatible).
alter table public.gallery_albums
  add column if not exists sort_order integer not null default 0;
alter table public.gallery_albums
  add column if not exists cover_image_id uuid;
alter table public.gallery_albums
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create table if not exists public.gallery_album_translations (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.gallery_albums(id) on delete cascade,
  language text not null,
  title text not null,
  subtitle text,
  description text,
  unique (album_id, language)
);

create index if not exists gallery_albums_status_idx on public.gallery_albums (status, sort_order, event_date desc nulls last);
create index if not exists gallery_album_translations_album_idx on public.gallery_album_translations (album_id, language);

drop trigger if exists gallery_albums_set_updated_at on public.gallery_albums;
create trigger gallery_albums_set_updated_at
  before update on public.gallery_albums
  for each row execute function public.set_updated_at();

alter table public.gallery_albums enable row level security;
alter table public.gallery_album_translations enable row level security;

drop policy if exists "Public read published albums" on public.gallery_albums;
create policy "Public read published albums"
  on public.gallery_albums
  for select
  using (status = 'published');

drop policy if exists "Admin manage albums" on public.gallery_albums;
create policy "Admin manage albums"
  on public.gallery_albums
  for all
  using ((auth.jwt()->'app_metadata'->>'role') = 'admin' or auth.role() = 'service_role')
  with check ((auth.jwt()->'app_metadata'->>'role') = 'admin' or auth.role() = 'service_role');

drop policy if exists "Public read album translations" on public.gallery_album_translations;
create policy "Public read album translations"
  on public.gallery_album_translations
  for select
  using (true);

drop policy if exists "Admin manage album translations" on public.gallery_album_translations;
create policy "Admin manage album translations"
  on public.gallery_album_translations
  for all
  using ((auth.jwt()->'app_metadata'->>'role') = 'admin' or auth.role() = 'service_role')
  with check ((auth.jwt()->'app_metadata'->>'role') = 'admin' or auth.role() = 'service_role');
