-- =====================================================================
-- Etapa 6 — Objetivos: foto diária do % de cada objetivo (gráfico de evolução)
-- Rodar uma vez no Supabase: SQL Editor > New query > colar > Run
-- =====================================================================

create or replace function public.registrar_progresso_objetivos(
  d date default (now() at time zone 'America/Sao_Paulo')::date
) returns void
language sql as $$
  insert into public.objetivo_snapshots (user_id, objetivo_id, data, pct)
  select
    o.user_id,
    o.id,
    d,
    coalesce(round(100.0 * count(e.id) filter (where e.feito) / nullif(count(e.id), 0), 2), 0)
  from public.objetivos o
  left join public.objetivo_etapas e on e.objetivo_id = o.id
  where not o.arquivado
  group by o.id, o.user_id
  on conflict (objetivo_id, data) do update set pct = excluded.pct;
$$;

-- Todo dia às 23:55 de São Paulo (02:55 UTC), com o valor final do dia
select cron.schedule('objetivos-progresso', '55 2 * * *', $$select public.registrar_progresso_objetivos()$$);

-- Primeira foto já hoje
select public.registrar_progresso_objetivos();
