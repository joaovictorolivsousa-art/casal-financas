-- ============================================================
-- CORREÇÃO: remove aportes automáticos duplicados
-- Antes, cada clique em "Salvar mês" criava um novo registro em vez de
-- atualizar o do mesmo mês, inflando o total em "Nosso Futuro".
-- Rode uma vez no SQL Editor do Supabase para limpar o que já duplicou.
-- ============================================================

-- Mantém só o mais recente de cada (usuário, mês) entre os aportes automáticos.
with duplicated as (
  select
    id,
    row_number() over (
      partition by user_id, date_trunc('month', reference_date)
      order by created_at desc
    ) as rn
  from public.savings
  where source = 'auto'
)
delete from public.savings
where id in (select id from duplicated where rn > 1);

-- Normaliza a data dos aportes automáticos que restaram para o dia 1 do mês
-- (necessário para o app localizar e atualizar o registro certo a partir de agora).
update public.savings
set reference_date = date_trunc('month', reference_date)::date
where source = 'auto';
