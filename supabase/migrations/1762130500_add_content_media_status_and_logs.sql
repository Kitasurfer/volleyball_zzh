-- Add status column for content items and action log tables

alter table if exists public.content_items
  add column if not exists status text not null default 'draft' check (status in ('draft', 'review', 'published'));

create table if not exists public.content_action_logs (
  id uuid primary key default gen_random_uuid(),
  content_id uuid references public.content_items(id) on delete cascade,
  admin_id uuid,
  action text not null,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists content_action_logs_content_idx on public.content_action_logs (content_id, created_at desc);

create table if not exists public.media_action_logs (
  id uuid primary key default gen_random_uuid(),
  media_id uuid references public.media_assets(id) on delete cascade,
  admin_id uuid,
  action text not null,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists media_action_logs_media_idx on public.media_action_logs (media_id, created_at desc);
