-- League match days are modelled as competitions, so tournament matches must be
-- allowed to carry their external (SAMS/VLW) match id for result verification.
-- The remaining integrity rules (placeholder teams, distinct teams) already
-- live in their own constraints, so the integrity check is dropped entirely.
alter table public.skv_matches drop constraint if exists skv_matches_competition_integrity;
