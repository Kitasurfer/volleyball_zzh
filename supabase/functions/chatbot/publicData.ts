/** Read strictly as an anonymous spectator, even when the chat visitor is an administrator. */
export async function publicRows<T>(table: 'skv_public_scores' | 'content_items', params: URLSearchParams) {
  const base = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_ANON_KEY');
  if (!base || !key) throw new Error('public_data_unavailable');
  const response = await fetch(`${base.replace(/\/$/, '')}/rest/v1/${table}?${params}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(4000),
  });
  if (!response.ok) throw new Error('public_data_unavailable');
  const rows: unknown = await response.json();
  if (!Array.isArray(rows)) throw new Error('invalid_public_response');
  return rows as T[];
}
