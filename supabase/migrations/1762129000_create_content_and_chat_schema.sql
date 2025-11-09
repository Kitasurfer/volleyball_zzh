-- Content, media, chat, and vector job schema
-- Requires Supabase postgres environment

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null,
  language text not null default 'de',
  summary text,
  body_markdown text,
  body_html text,
  type text not null,
  tags text[] default '{}',
  author_id uuid,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (language, slug)
);

create index if not exists content_items_slug_idx on public.content_items (slug);
create index if not exists content_items_type_idx on public.content_items (type);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null unique,
  title text,
  description text,
  language text,
  media_type text not null,
  width integer,
  height integer,
  duration_seconds numeric,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists media_assets_language_idx on public.media_assets (language);
create index if not exists media_assets_type_idx on public.media_assets (media_type);

create table if not exists public.content_media_links (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references public.content_items(id) on delete cascade,
  media_id uuid not null references public.media_assets(id) on delete cascade,
  role text not null default 'inline',
  position integer not null default 0,
  created_at timestamptz not null default now(),
  unique (content_id, media_id, role)
);

create index if not exists content_media_links_content_idx on public.content_media_links (content_id, position);

create table if not exists public.vector_jobs (
  id uuid primary key default gen_random_uuid(),
  content_id uuid references public.content_items(id) on delete cascade,
  status text not null check (status in ('pending', 'processing', 'completed', 'failed')),
  error text,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

create index if not exists vector_jobs_status_idx on public.vector_jobs (status);

create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_hash text not null,
  language text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  last_activity timestamptz not null default now()
);

create index if not exists chat_sessions_user_hash_idx on public.chat_sessions (user_hash);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  role text not null check (role in ('system', 'user', 'assistant', 'tool')),
  content text not null,
  citations jsonb not null default '[]'::jsonb,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_session_idx on public.chat_messages (session_id, created_at);

create trigger content_items_set_updated_at
  before update on public.content_items
  for each row execute function public.set_updated_at();

create trigger media_assets_set_updated_at
  before update on public.media_assets
  for each row execute function public.set_updated_at();

create trigger vector_jobs_set_updated_at
  before update on public.vector_jobs
  for each row execute function public.set_updated_at();

create trigger chat_sessions_set_last_activity
  before update on public.chat_sessions
  for each row execute function public.set_updated_at();

alter table public.content_items enable row level security;
alter table public.media_assets enable row level security;
alter table public.content_media_links enable row level security;
alter table public.vector_jobs enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;

create policy if not exists "Read published content"
  on public.content_items
  for select
  using (published_at is not null and published_at <= now());

create policy if not exists "Service role manage content"
  on public.content_items
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy if not exists "Public read media"
  on public.media_assets
  for select
  using (true);

create policy if not exists "Service role manage media"
  on public.media_assets
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy if not exists "Public read content-media links"
  on public.content_media_links
  for select
  using (true);

create policy if not exists "Service role manage content-media links"
  on public.content_media_links
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy if not exists "Service role manage vector jobs"
  on public.vector_jobs
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy if not exists "Service role manage chat sessions"
  on public.chat_sessions
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy if not exists "Service role manage chat messages"
  on public.chat_messages
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
