-- ============================================================
-- MIGRAÇÃO: metas pessoais (além das metas do casal)
-- Rode uma vez no SQL Editor. Idempotente (pode rodar de novo sem problema).
-- ============================================================

alter table public.goals
  add column if not exists user_id uuid references public.users(id) on delete cascade;
