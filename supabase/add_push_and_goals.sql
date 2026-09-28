-- ============================================================
-- MIGRAÇÃO: metas do casal + lembretes por notificação
-- Rode uma vez no SQL Editor. Idempotente (pode rodar de novo sem problema).
-- ============================================================

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  title text not null,
  target_amount numeric(12,2) not null check (target_amount > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table public.goals enable row level security;
alter table public.push_subscriptions enable row level security;

drop policy if exists "open_access" on public.goals;
create policy "open_access" on public.goals
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "open_access" on public.push_subscriptions;
create policy "open_access" on public.push_subscriptions
  for all to anon, authenticated using (true) with check (true);
