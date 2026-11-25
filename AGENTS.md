# Project notes for agents

## Verification commands
- `pnpm exec vitest run` — unit tests (reducer parity, scheduling, storage)
- `npx tsc -b --noEmit` — fast typecheck without emitting
- `pnpm run lint` — eslint; warnings pre-exist in chatbot files, errors must be zero
- `pnpm run build` — full `tsc -b && vite build` incl. prerender; the warning
  "Unable to prerender all routes" is pre-existing and not a regression

## Match center architecture
- `src/lib/matchRules.ts` (TS reducer `applyScore`) and the plpgsql reducers
  `skv_reduce_score` / `skv_reduce_current_set` in `supabase/migrations/` MUST stay in
  exact parity. Tests in `src/lib/matchRules.test.ts` act as the shared spec — extend
  them for every new event and mirror the same logic in SQL.
- Translations: `src/data/matchTranslations.ts` uses indexed arrays `[de, en, ru, it]`;
  every key needs exactly 4 entries and `t()` is typed as `keyof typeof labels`, so
  missing keys fail typecheck.
- Public projection: `skv_public_scores` is a table maintained by the trigger
  `skv_project_score` — extend both the table and the trigger when adding public fields.

## Testing SQL migrations locally
Docker is often unavailable on this machine, so `supabase start` usually hangs.
Use the scratch postgres instance instead (postgresql@14 via homebrew):
- `/tmp/skv-pgtest/reset.sh` reinitializes a scratch cluster on port 54999 with stubbed
  `auth` schema/roles and applies the full migration chain; prints `DB-RESET-OK`.
- Note the harness recreates the instance from scratch, so copy the script somewhere
  safe if needed again; migrations directory of the repo is the source of truth.
- When testing RPCs with jsonb payloads, pass nested objects with explicit `::jsonb`
  casts — `jsonb_build_object('rules','{...}')` stores a string, not an object.

## Browser testing
- The vite dev server needs no backend for `/scoreboard/new` local matches, but the
  control page requires a referee actor: either a signed-in user or, offline, a
  sessionStorage `skv-last-referee` entry. With playwright use
  `context.addInitScript` to override `navigator.onLine` and seed sessionStorage.
- `.env` points at local supabase (127.0.0.1:54321); most pages degrade gracefully
  when it is down.

## Production database
- Project ref `kxwmkvtxkaczuonnnxlj` (volleyball, Stockholm) is linked; `supabase db push`
  works. Out-of-order migrations need `--include-all`.
- The gallery tables existed in production from manual setup with a slightly different
  shape — never assume production matches local migrations exactly. To inspect production
  schema state, add a throwaway migration whose `raise exception` carries the probe result
  (transaction rolls back, nothing is recorded), run `db push`, then delete the file.
- `supabase db dump --linked` hangs against this project (lock waits) — prefer the probe.
