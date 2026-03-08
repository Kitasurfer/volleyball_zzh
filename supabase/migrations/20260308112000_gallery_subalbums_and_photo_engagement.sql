-- Gallery subalbums, photo engagement, and album-detail metadata

create table if not exists public.gallery_subalbums (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.gallery_albums(id) on delete cascade,
  slug text not null,
  event_date timestamptz,
  sort_order integer not null default 0,
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (album_id, slug)
);

create table if not exists public.gallery_subalbum_translations (
  id uuid primary key default gen_random_uuid(),
  subalbum_id uuid not null references public.gallery_subalbums(id) on delete cascade,
  language text not null,
  title text not null,
  subtitle text,
  description text,
  unique (subalbum_id, language)
);

alter table public.media_assets
  add column if not exists subalbum_id uuid references public.gallery_subalbums(id) on delete set null,
  add column if not exists caption_i18n jsonb not null default '{}'::jsonb,
  add column if not exists is_featured_gallery boolean not null default false,
  add column if not exists is_best_of_tournament boolean not null default false;

create table if not exists public.gallery_image_likes (
  id uuid primary key default gen_random_uuid(),
  image_id uuid not null references public.media_assets(id) on delete cascade,
  visitor_token text not null,
  created_at timestamptz not null default now(),
  unique (image_id, visitor_token)
);

create index if not exists gallery_subalbums_album_idx on public.gallery_subalbums (album_id, sort_order, event_date desc nulls last, created_at desc);
create index if not exists gallery_subalbum_translations_subalbum_idx on public.gallery_subalbum_translations (subalbum_id, language);
create index if not exists media_assets_subalbum_idx on public.media_assets (subalbum_id);
create index if not exists media_assets_featured_idx on public.media_assets (is_featured_gallery, is_best_of_tournament);
create index if not exists gallery_image_likes_image_idx on public.gallery_image_likes (image_id, created_at desc);

create trigger gallery_subalbums_set_updated_at
  before update on public.gallery_subalbums
  for each row execute function public.set_updated_at();

alter table public.gallery_subalbums enable row level security;
alter table public.gallery_subalbum_translations enable row level security;
alter table public.gallery_image_likes enable row level security;

create policy "Public read published subalbums"
  on public.gallery_subalbums
  for select
  using (status = 'published');

create policy "Admin manage subalbums"
  on public.gallery_subalbums
  for all
  using ((auth.jwt()->'app_metadata'->>'role') = 'admin' or auth.role() = 'service_role')
  with check ((auth.jwt()->'app_metadata'->>'role') = 'admin' or auth.role() = 'service_role');

create policy "Public read subalbum translations"
  on public.gallery_subalbum_translations
  for select
  using (true);

create policy "Admin manage subalbum translations"
  on public.gallery_subalbum_translations
  for all
  using ((auth.jwt()->'app_metadata'->>'role') = 'admin' or auth.role() = 'service_role')
  with check ((auth.jwt()->'app_metadata'->>'role') = 'admin' or auth.role() = 'service_role');

create policy "Public read gallery image likes"
  on public.gallery_image_likes
  for select
  using (true);

create policy "Public insert gallery image likes"
  on public.gallery_image_likes
  for insert
  with check (true);

create policy "Public delete own gallery image likes"
  on public.gallery_image_likes
  for delete
  using (true);

create policy "Seed subalbums from albums if missing"
  on public.gallery_subalbums
  as permissive
  for insert
  to authenticated
  with check ((auth.jwt()->'app_metadata'->>'role') = 'admin');

insert into public.gallery_subalbums (album_id, slug, event_date, sort_order, status)
select
  album.id,
  coalesce(nullif(album.slug, ''), 'subalbum-' || replace(album.id::text, '-', '')),
  album.event_date,
  0,
  case when album.status in ('draft', 'published', 'archived') then album.status else 'published' end
from public.gallery_albums album
where not exists (
  select 1
  from public.gallery_subalbums sub
  where sub.album_id = album.id
);

update public.media_assets media
set subalbum_id = sub.id
from public.gallery_subalbums sub
where media.album_id = sub.album_id
  and media.subalbum_id is null;
