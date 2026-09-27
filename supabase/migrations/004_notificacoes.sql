-- =====================================================================
-- Etapa 7 — Notificações push às 04:30 (briefing) e 19:30 (revisão)
-- ATENÇÃO: não rode este arquivo; rode a versão preenchida com o segredo
-- em supabase/local/004_notificacoes_preenchido.sql (fora do Git).
-- =====================================================================

-- Aparelhos inscritos para receber notificações
create table public.push_inscricoes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  dispositivo text,
  created_at  timestamptz not null default now()
);
alter table public.push_inscricoes enable row level security;
create policy dono on public.push_inscricoes for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- O banco chama a função /api/notificar da Vercel nos horários exatos
create extension if not exists pg_net;

select cron.schedule('notificacao-briefing', '30 7 * * *', $$
  select net.http_post(
    url := 'https://painel-rafael-pi.vercel.app/api/notificar?tipo=briefing',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-segredo', '<SEGREDO>'),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  )
$$);  -- 04:30 em São Paulo

select cron.schedule('notificacao-revisao', '30 22 * * *', $$
  select net.http_post(
    url := 'https://painel-rafael-pi.vercel.app/api/notificar?tipo=revisao',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-segredo', '<SEGREDO>'),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  )
$$);  -- 19:30 em São Paulo
