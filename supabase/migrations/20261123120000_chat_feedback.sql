-- Anonymous write-only reactions, correlated with the opaque turn ID in the Edge log.
create table if not exists public.chat_message_feedback (
  message_id uuid not null,
  session_id uuid not null,
  feedback_type text not null check (feedback_type in ('like', 'dislike')),
  created_at timestamptz not null default now(),
  primary key (session_id, message_id)
);
alter table public.chat_message_feedback enable row level security;
revoke all on public.chat_message_feedback from public, anon, authenticated;
grant insert (message_id, session_id, feedback_type) on public.chat_message_feedback to anon, authenticated;
create policy "Visitors may submit chat feedback" on public.chat_message_feedback
  for insert to anon, authenticated with check (feedback_type in ('like', 'dislike'));

-- Widget telemetry: event names and coarse counters only, never message text.
create table if not exists public.chat_analytics (
  id bigint generated always as identity primary key,
  event_type text not null check (char_length(event_type) <= 64),
  language text not null check (language in ('de', 'en', 'ru', 'it')),
  user_hash text not null check (char_length(user_hash) <= 64),
  session_id uuid,
  event_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.chat_analytics enable row level security;
revoke all on public.chat_analytics from public, anon, authenticated;
grant insert (event_type, language, user_hash, session_id, event_data) on public.chat_analytics to anon, authenticated;
create policy "Visitors may log chat events" on public.chat_analytics
  for insert to anon, authenticated
  with check (event_type ~ '^[a-z_]+$' and jsonb_typeof(event_data) = 'object');
