-- ============================================================
-- SCHEMA: Controle Financeiro para Casais
-- Banco: Supabase (PostgreSQL) com Row Level Security (RLS)
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
-- 2. USERS (perfil estendido do auth.users do Supabase)
-- ------------------------------------------------------------
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
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

create or replace function public.current_couple_id()
returns uuid language sql stable security definer as $$
  select couple_id from public.users where id = auth.uid();
$$;

create policy "users_select_self_or_partner"
  on public.users for select
  using (id = auth.uid() or couple_id = public.current_couple_id());

create policy "users_update_self"
  on public.users for update
  using (id = auth.uid());

create policy "couples_select_members"
  on public.couples for select
  using (auth.uid() in (user_a_id, user_b_id));

create policy "couples_insert_self"
  on public.couples for insert
  with check (auth.uid() = user_a_id);

create policy "couples_update_members"
  on public.couples for update
  using (auth.uid() in (user_a_id, user_b_id));

create policy "finance_select_self_or_partner"
  on public.incomes_expenses for select
  using (
    user_id = auth.uid()
    or user_id in (select id from public.users where couple_id = public.current_couple_id())
  );

create policy "finance_insert_self"
  on public.incomes_expenses for insert
  with check (user_id = auth.uid());

create policy "finance_update_self"
  on public.incomes_expenses for update
  using (user_id = auth.uid());

create policy "finance_delete_self"
  on public.incomes_expenses for delete
  using (user_id = auth.uid());

create policy "savings_select_couple"
  on public.savings for select
  using (couple_id = public.current_couple_id());

create policy "savings_insert_self_or_couple"
  on public.savings for insert
  with check (
    (user_id = auth.uid() and couple_id = public.current_couple_id())
    or (user_id is null and source = 'manual' and couple_id = public.current_couple_id())
  );

create policy "savings_delete_owner"
  on public.savings for delete
  using (user_id = auth.uid() or (user_id is null and couple_id = public.current_couple_id()));
