-- =====================================================================
-- Etapa 2 — Rotina Fixa: checklist diário automático + dados do gráfico
-- Rodar uma vez no Supabase: SQL Editor > New query > colar > Run
-- =====================================================================

-- Gera as linhas do checklist de um dia a partir do cadastro de hábitos
-- e remove as linhas não marcadas de hábitos que deixaram de valer no dia.
-- Chamada pelo pg_cron (todos os hábitos) e pelo app (RLS: só os seus).
create or replace function public.sincronizar_rotina(
  d date default (now() at time zone 'America/Sao_Paulo')::date
) returns void
language sql as $$
  insert into public.habito_registros (user_id, habito_id, data)
  select h.user_id, h.id, d
  from public.habitos h
  where h.ativo and extract(dow from d)::smallint = any (h.dias_semana)
  on conflict (habito_id, data) do nothing;

  delete from public.habito_registros r
  using public.habitos h
  where r.habito_id = h.id
    and r.data = d
    and not r.feito
    and not (h.ativo and extract(dow from d)::smallint = any (h.dias_semana));
$$;

-- Todo dia às 00:05 de São Paulo (03:05 UTC; o Brasil não tem mais horário de verão)
create extension if not exists pg_cron;
select cron.schedule('rotina-diaria', '5 3 * * *', $$select public.sincronizar_rotina()$$);

-- Agregado diário para os gráficos (security_invoker: respeita o RLS)
create or replace view public.v_rotina_dia with (security_invoker = true) as
select
  data,
  count(*)::int                         as previstos,
  (count(*) filter (where feito))::int  as feitos
from public.habito_registros
group by data;
