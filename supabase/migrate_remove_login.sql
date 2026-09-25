-- ============================================================
-- MIGRAÇÃO: remover o login (Supabase Auth)
-- Rode UMA vez no SQL Editor de um banco que já foi criado com o schema antigo.
-- Os dados existentes (perfis, lançamentos, aportes) são preservados.
-- ============================================================

-- Perfis deixam de depender de auth.users
alter table public.users drop constraint if exists users_id_fkey;
alter table public.users alter column id set default gen_random_uuid();
alter table public.users alter column email drop not null;
alter table public.users drop constraint if exists users_email_key;

-- Políticas antigas (baseadas em auth.uid()) saem...
drop policy if exists "users_select_self_or_partner" on public.users;
drop policy if exists "users_update_self" on public.users;
drop policy if exists "couples_select_members" on public.couples;
drop policy if exists "couples_insert_self" on public.couples;
drop policy if exists "couples_update_members" on public.couples;
drop policy if exists "finance_select_self_or_partner" on public.incomes_expenses;
drop policy if exists "finance_insert_self" on public.incomes_expenses;
drop policy if exists "finance_update_self" on public.incomes_expenses;
drop policy if exists "finance_delete_self" on public.incomes_expenses;
drop policy if exists "savings_select_couple" on public.savings;
drop policy if exists "savings_insert_self_or_couple" on public.savings;
drop policy if exists "savings_delete_owner" on public.savings;
drop function if exists public.current_couple_id();

-- ...e entra o acesso aberto (o casal inteiro enxerga e edita tudo)
drop policy if exists "open_access" on public.users;
create policy "open_access" on public.users
  for all to anon, authenticated using (true) with check (true);
drop policy if exists "open_access" on public.couples;
create policy "open_access" on public.couples
  for all to anon, authenticated using (true) with check (true);
drop policy if exists "open_access" on public.incomes_expenses;
create policy "open_access" on public.incomes_expenses
  for all to anon, authenticated using (true) with check (true);
drop policy if exists "open_access" on public.savings;
create policy "open_access" on public.savings
  for all to anon, authenticated using (true) with check (true);
