# SKV Volleyball Match Center

## Deployment

1. Deploy and test on a separate Supabase/Netlify environment first. Do not run the
   scoring integration tests against the production database. Use the existing
   site build and the standard SPA fallback. No new Edge Function, Netlify service,
   server credential, or production Supabase project is required.
2. Check the target migration history. Apply
   `20261121090000_skv_match_center.sql` and
   `20261121091000_skv_tournament_management.sql` before deploying the frontend.
   They only add `skv_*` objects. The Supabase `supabase_realtime` publication must
   exist. If the target has other pending migrations, review them separately;
   do not blindly push the entire working directory.
3. Set the existing public client configuration for the intended environment:
   `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
   `VITE_SUPABASE_FUNCTIONS_URL`. Never expose a service-role credential in Vite.
   Confirm that Netlify serves `/match-center-sw.js` as JavaScript and that
   direct visits to `/scoreboard/:matchId/display` and `/competitions/:competitionId`
   resolve via the SPA fallback. Deploy after a successful `npm run build`.
4. Provision the referees as regular Supabase Auth users with individual
   email/password credentials. In `/admin/scoreboard`, assign each user to their
   match by existing email and expiration. Do not use admin credentials on the
   scoring devices. The admin UI remains protected by the existing `admin` role.
5. Rehearse using two referees, two courts and at least one spectator per court.
   Check scoring, undo, explicit confirmation, Wi-Fi loss/reconnection, expired
   and revoked assignments, projector readability, older iOS devices, and page
   reload after the browser has cached the referee screen. Check the existing
   `/competitions` table and archive separately against VLW. Start the actual
   tournament with the confirmed venue, schedule and rules; these are not seeded.
6. If necessary, roll back the Netlify frontend to the previous deploy and leave
   the additive database objects intact. Do not drop the event history. Retain
   the locations of both Netlify versions and take a database backup first.

An earlier audit found a plaintext admin credential in the project documentation.
The owner must revoke/rotate it and arrange removal from documentation and
secret-bearing history before tournament deployment. This branch does not change
or rotate existing credentials.

## Routes and operation

| Route | Purpose |
| --- | --- |
| `/scoreboard` | Public live matches and results, local history and assigned matches |
| `/scoreboard/new` | Start a device-only game or create a private server match after signing in |
| `/scoreboard/:matchId/control` | Referee controls, local queue, private match protocol |
| `/scoreboard/:matchId` | Public read-only scoreboard, spectator URL/QR code, print |
| `/scoreboard/:matchId/display` | Standalone TV/projection display and browser fullscreen |
| `/competitions/:competitionId` | Club schedule, results, standings and CSV |
| `/admin/competitions` | Competition/ranking configuration, teams, fixtures and Round Robin |
| `/admin/scoreboard` | Match publication/scheduling, referee grants, control links and CSV |

To link a VLW match, an admin can open the new-game link beside it in
`/competitions`. The local scoreboard is explicitly unofficial. The existing VLW
request, result and standings are untouched. Local results are never sent to VLW.

The active referee claims a 90-second lease and the app renews it while open.
An admin can force a takeover. The current referee can release it with an empty
queue. After an internet outage, leave the existing screen or reload the same
tab on a previously loaded device. Events remain in IndexedDB until acknowledged.
If a competing device has taken over, automatic replay stops. Compare the device
and server scores; download the draft if needed, archive it and keep the server
score, then use the recorded correction flow if authorized. Do not calculate a
combined score by adding the two queues. A revoked referee can download the
draft but cannot archive it on the server; hand it to an administrator.

## Data and transaction model

- `skv_competitions`, `skv_teams`, `skv_competition_teams`: configuration and
  registered entrants; composite foreign keys validate both sides of a fixture.
- `skv_matches`: rules snapshot, stable A/B team identities, canonical JSON
  state, ordered sets, time metadata and version. There is no independent copy
  of set rows to update. Sets and winners can only be changed by the server reducer.
- `skv_match_events`: immutable journal for application roles, primary key
  `(match_id, sequence)`, globally unique client event UUID, and an index for
  references from undo events. `skv_match_referees` limits access per match and
  `skv_match_leases` fences the active device. `skv_match_conflicts` retains the
  original archived offline events and the revision against which they were reviewed.
- `skv_public_scores`: separate RLS-protected, read-only projection, keyed by match,
  indexed by recency and competition/schedule, and published to Supabase Realtime.
  It does not contain identities, referee grants or the action log.
- The fixture index `(competition_id, scheduled_at)` supports server overlap checks.
  Membership and active-referee lookup indexes support admin reads.

Authenticated RPCs: `skv_read_match`, `skv_list_matches`, `skv_control_snapshot`,
`skv_match_history`, `skv_acquire_lease`, `skv_release_lease`, `skv_apply_event`,
`skv_archive_conflict`, `skv_save_competition`, `skv_add_team`, `skv_create_match`,
`skv_create_schedule`, `skv_edit_match`, `skv_assign_referee`. `skv_standings`
can also be read anonymously for published competitions. All score writes check
current rights and ownership in PostgreSQL under a match row lock, deduplicate
by UUID, compare the base version and use the SQL reducer. Projection updates
are in the same transaction. The TypeScript reducer is for optimistic display
only. For standings, the database ranks confirmed results on demand using the
tournament's point awards and ordered criteria. Reopening a result removes it
until reconfirmed.

## Verification commands

```sh
npm run test -- --run src/lib/matchRules.test.ts
npm run build
psql -X "$MATCH_CENTER_TEST_DB_URL" -f scripts/test-match-center.sql
```

The SQL suite assumes an isolated Supabase database with both new migrations
applied and an administrator-level test connection. It rolls fixture changes
back. Run `supabase start` only in a separate, unlinked test workdir; retain
only the two scoring migrations there if testing this module independently.

Use `npm run preview -- --host 127.0.0.1 --port 4317 --strictPort` to serve the
built site. With `CHROME_BIN` set to a local Chrome or Chromium executable:

```sh
node scripts/smoke-match-center.cjs
node scripts/test-match-center-browser.cjs
```

The first script does not need a backend. The second needs the preview built
against the isolated Supabase stack and the local test credentials supplied
through `MATCH_CENTER_ANON_KEY` and `MATCH_CENTER_SERVICE_KEY` to the script.
The latter exists only in the test process, not in the Vite build. The script
creates fixture accounts and matches and refuses non-loopback URLs.

## Limits to consider for tournament day

- The venue needs a network path from the referee device to Supabase for
  spectators to receive updates. No changes are published while the referee is
  offline. Browser storage can be evicted; do not use private browsing or clear
  the device's storage during the event. Test the actual browser and Wi-Fi.
- A device-only game remains device-only. Start a server game when publication
  or cross-device history is needed. Publishing and VLW linking require an admin.
- Results can be reopened and the current/last set corrected. Editing an earlier
  set in an already-advanced match and reopening a walkover are not supported.
- Fixture generation supports up to 20 teams and does not overwrite an existing
  schedule. Court labels and slot durations are configured when making the
  schedule; there is no centralized court registry or playoff generator.
- No player roster/rotation, substitution management, score cap, or official
  electronic match-sheet submission. No automatic comparison to a subsequently
  reported official VLW result. Tournament and match history management does not
  hard-delete records.
