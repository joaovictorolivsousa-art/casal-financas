-- ============================================================
-- MIGRAÇÃO: renda extra + gastos detalhados por categoria
-- Rode uma vez no SQL Editor. Idempotente (pode rodar de novo sem problema).
-- ============================================================

alter table public.incomes_expenses
  add column if not exists extra_income numeric(12,2) not null default 0;

create table if not exists public.expense_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  reference_month date not null default date_trunc('month', now()),
  category text not null,
  kind text not null default 'fixed' check (kind in ('fixed', 'variable')),
  amount numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_expense_items_user_month on public.expense_items(user_id, reference_month);

alter table public.expense_items enable row level security;

drop policy if exists "open_access" on public.expense_items;
create policy "open_access" on public.expense_items
  for all to anon, authenticated using (true) with check (true);
