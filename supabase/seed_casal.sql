-- ============================================================
-- SEED: cria o casal e os perfis João e Daya (pode rodar mais de uma vez)
-- Rode DEPOIS de supabase/migrate_remove_login.sql (ou num banco criado com o schema novo).
-- ============================================================
do $$
declare
  v_couple uuid;
  v_joao uuid;
  v_daya uuid;
begin
  select id into v_couple from public.couples order by created_at limit 1;
  if v_couple is null then
    insert into public.couples (status) values ('active') returning id into v_couple;
  end if;

  select id into v_joao from public.users where full_name = 'João' limit 1;
  if v_joao is null then
    insert into public.users (full_name, couple_id) values ('João', v_couple) returning id into v_joao;
  end if;

  select id into v_daya from public.users where full_name = 'Daya' limit 1;
  if v_daya is null then
    insert into public.users (full_name, couple_id) values ('Daya', v_couple) returning id into v_daya;
  end if;

  update public.users set couple_id = v_couple where id in (v_joao, v_daya);
  update public.couples set user_a_id = v_joao, user_b_id = v_daya, status = 'active' where id = v_couple;
end $$;
