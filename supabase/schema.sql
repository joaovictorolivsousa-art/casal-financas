-- ============================================================
-- SCHEMA: Controle Financeiro para Casais
-- Banco: Supabase (PostgreSQL). Sem login: o acesso é aberto via anon key (RLS liberada).
-- Já tem o banco criado com a versão antiga? Rode supabase/migrate_remove_login.sql.
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- 1. COUPLES (vínculo entre dois usuários) — criada antes de users
-- ------------------------------------------------------------
create table public.couples (
  id uuid primary key default gen_random_uuid(),
  user_a_id uuid,
  user_b_id uuid,
  invite_code text unique not null default substr(md5(random()::text), 1, 8),
  status text not null default 'pending' check (status in ('pending', 'active')),
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 2. USERS (perfis do casal — sem Supabase Auth)
-- ------------------------------------------------------------
create table public.users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  avatar_url text,
  couple_id uuid references public.couples(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.couples
  add constraint fk_couples_user_a foreign key (user_a_id) references public.users(id) on delete cascade,
  add constraint fk_couples_user_b foreign key (user_b_id) references public.users(id) on delete cascade;

-- ------------------------------------------------------------
-- 3. INCOMES_EXPENSES (dados financeiros mensais por usuário)
-- ------------------------------------------------------------
create table public.incomes_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  reference_month date not null default date_trunc('month', now()),
  net_salary numeric(12,2) not null default 0,
  fixed_expenses numeric(12,2) not null default 0,
  save_percentage numeric(5,2) not null default 60.00 check (save_percentage between 0 and 100),
  leisure_percentage numeric(5,2) not null default 40.00 check (leisure_percentage between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pct_sum_100 check (save_percentage + leisure_percentage = 100),
  unique (user_id, reference_month)
);

-- ------------------------------------------------------------
-- 4. SAVINGS (aportes individuais e/ou do casal)
-- ------------------------------------------------------------
create table public.savings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade, -- null = aporte manual do casal
  couple_id uuid references public.couples(id) on delete cascade,
  amount numeric(12,2) not null,
  source text not null default 'auto' check (source in ('auto', 'manual')),
  description text,
  reference_date date not null default now(),
  created_at timestamptz not null default now()
);

create index idx_incomes_expenses_user_month on public.incomes_expenses(user_id, reference_month);
create index idx_savings_couple on public.savings(couple_id, reference_date);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
alter table public.users enable row level security;
alter table public.couples enable row level security;
alter table public.incomes_expenses enable row level security;
alter table public.savings enable row level security;

-- Sem login não há auth.uid(): o casal inteiro enxerga e edita tudo.
create policy "open_access" on public.users
  for all to anon, authenticated using (true) with check (true);
create policy "open_access" on public.couples
  for all to anon, authenticated using (true) with check (true);
create policy "open_access" on public.incomes_expenses
  for all to anon, authenticated using (true) with check (true);
create policy "open_access" on public.savings
  for all to anon, authenticated using (true) with check (true);
