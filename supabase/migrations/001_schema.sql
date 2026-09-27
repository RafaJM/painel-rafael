-- =====================================================================
-- Painel Rafael — schema inicial (todos os módulos)
-- Rodar uma vez no Supabase: SQL Editor > New query > colar > Run
-- =====================================================================

-- ---------- Tipos e funções utilitárias ----------
create type public.status_tarefa as enum ('pendente', 'em_andamento', 'feito');
create type public.prioridade as enum ('alta', 'media', 'baixa');  -- ordem do enum = ordem de importância

create or replace function public.tg_touch() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- Preenche concluida_em quando a tarefa vira 'feito' e limpa se voltar atrás
create or replace function public.tg_tarefa_conclusao() returns trigger
language plpgsql as $$
begin
  if new.status = 'feito' then
    if tg_op = 'INSERT' or old.status is distinct from 'feito' then
      new.concluida_em = now();
    end if;
  else
    new.concluida_em = null;
  end if;
  return new;
end $$;

-- Mesmo comportamento para itens com booleano "feito"
create or replace function public.tg_etapa_conclusao() returns trigger
language plpgsql as $$
begin
  if new.feito then
    if tg_op = 'INSERT' or not old.feito then
      new.concluida_em = now();
    end if;
  else
    new.concluida_em = null;
  end if;
  return new;
end $$;

-- ---------- 2. Trabalho Formal ----------
create table public.trabalho_tarefas (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users on delete cascade,
  titulo       text not null check (length(trim(titulo)) > 0),
  status       public.status_tarefa not null default 'pendente',
  prazo        date,
  prioridade   public.prioridade not null default 'media',
  destaque_em  date,          -- a partir desta data aparece nas prioridades do dia
  notas        text,
  concluida_em timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---------- 3. Trabalho Pessoal ----------
create table public.pessoal_tarefas (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users on delete cascade,
  titulo       text not null check (length(trim(titulo)) > 0),
  status       public.status_tarefa not null default 'pendente',
  prazo        date,
  prioridade   public.prioridade not null default 'media',
  destaque_em  date,
  notas        text,
  concluida_em timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---------- 4. Estudos ----------
create table public.estudos_tarefas (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users on delete cascade,
  titulo       text not null check (length(trim(titulo)) > 0),
  status       public.status_tarefa not null default 'pendente',
  prazo        date,
  prioridade   public.prioridade not null default 'media',
  destaque_em  date,
  notas        text,
  concluida_em timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---------- 5. Rotina Fixa ----------
create table public.habitos (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  nome        text not null check (length(trim(nome)) > 0),
  categoria   text not null default 'pessoal',            -- saúde, casa, pessoal...
  dias_semana smallint[] not null default '{0,1,2,3,4,5,6}',  -- 0 = domingo
  horario     time,                                        -- só para ordenar
  ativo       boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Uma linha por hábito por dia previsto (gerada por pg_cron na etapa 2),
-- para o histórico não mudar se o hábito for editado depois.
create table public.habito_registros (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  habito_id  uuid not null references public.habitos on delete cascade,
  data       date not null,
  feito      boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (habito_id, data)
);

-- ---------- 6. Sono ----------
create table public.sono_registros (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  data       date not null,                                     -- manhã em que acordou
  horas      numeric(3,1) not null check (horas between 0 and 24),
  qualidade  smallint check (qualidade between 1 and 3),        -- 1 ruim, 2 ok, 3 boa
  nota       text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, data)
);

-- ---------- 7. Lista de Compras ----------
create table public.compras_itens (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  nome       text not null check (length(trim(nome)) > 0),
  categoria  text,
  quantidade text,
  ativo      boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- "Reset" mensal = nova chave de mês; nada é apagado
create table public.compras_checks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  item_id    uuid not null references public.compras_itens on delete cascade,
  mes        date not null check (extract(day from mes) = 1),
  comprado   boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (item_id, mes)
);

-- ---------- 8. Objetivos ----------
create table public.objetivos (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users on delete cascade,
  titulo       text not null check (length(trim(titulo)) > 0),
  descricao    text,
  prazo        date,
  arquivado    boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.objetivo_etapas (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users on delete cascade,
  objetivo_id  uuid not null references public.objetivos on delete cascade,
  titulo       text not null check (length(trim(titulo)) > 0),
  ordem        int not null default 0,
  feito        boolean not null default false,
  concluida_em timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Foto diária do % de cada objetivo (pg_cron) → gráfico de evolução
create table public.objetivo_snapshots (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  objetivo_id uuid not null references public.objetivos on delete cascade,
  data        date not null,
  pct         numeric(5,2) not null,
  unique (objetivo_id, data)
);

-- ---------- 9. Lifestyle ----------
create table public.lifestyle_itens (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  nome       text not null check (length(trim(nome)) > 0),
  categoria  text,
  ativo      boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Serve para os dois usos: check de item fixo (item_id) ou momento livre (texto)
create table public.lifestyle_registros (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  data       date not null,
  item_id    uuid references public.lifestyle_itens on delete cascade,
  texto      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (item_id is not null or length(trim(coalesce(texto, ''))) > 0)
);
create unique index lifestyle_registros_item_dia on public.lifestyle_registros (item_id, data)
  where item_id is not null;

-- ---------- 10. Erros a Eliminar ----------
create table public.erros (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  nome       text not null check (length(trim(nome)) > 0),
  descricao  text,
  frequencia text not null default 'diaria' check (frequencia in ('diaria', 'semanal')),
  ativo      boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.erro_registros (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  erro_id    uuid not null references public.erros on delete cascade,
  periodo    date not null,        -- o dia, ou a segunda-feira da semana
  errou      boolean not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (erro_id, periodo)
);

-- ---------- 1. Home: agenda ----------
create table public.agendas (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  nome       text not null,
  ical_url   text not null,          -- endereço secreto iCal
  cor        text not null default '#2dd4bf',
  ativa      boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Triggers, RLS e Realtime para todas as tabelas ----------
do $$
declare
  t text;
begin
  foreach t in array array[
    'trabalho_tarefas', 'pessoal_tarefas', 'estudos_tarefas',
    'habitos', 'habito_registros', 'sono_registros',
    'compras_itens', 'compras_checks',
    'objetivos', 'objetivo_etapas', 'objetivo_snapshots',
    'lifestyle_itens', 'lifestyle_registros',
    'erros', 'erro_registros', 'agendas'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy dono on public.%I for all to authenticated
         using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
    execute format('create index on public.%I (user_id)', t);
    execute format('alter publication supabase_realtime add table public.%I', t);
    if t <> 'objetivo_snapshots' then
      execute format(
        'create trigger touch before update on public.%I
           for each row execute function public.tg_touch()', t);
    end if;
  end loop;

  foreach t in array array['trabalho_tarefas', 'pessoal_tarefas', 'estudos_tarefas'] loop
    execute format(
      'create trigger conclusao before insert or update on public.%I
         for each row execute function public.tg_tarefa_conclusao()', t);
  end loop;
end $$;

create trigger conclusao before insert or update on public.objetivo_etapas
  for each row execute function public.tg_etapa_conclusao();
