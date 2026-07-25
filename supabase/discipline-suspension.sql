-- ============================================================================
-- Disciplină: durata suspendării (jucătorul e indisponibil până la această dată)
-- Rulează în Supabase SQL Editor. Idempotent.
-- ============================================================================
-- Etichetă text (ex: „29 iulie 2026"), consistentă cu restul datelor din aplicație.
alter table public.discipline_records add column if not exists suspended_until text;
