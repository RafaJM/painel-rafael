// Função de servidor da Vercel: POST /api/notificar?tipo=briefing|revisao
// Chamada pelo pg_cron do Supabase às 04:30 e 19:30 (header x-segredo),
// ou pelo botão de teste do app (header Authorization com o login do usuário).
import { createECDH } from 'node:crypto'
import webpush from 'web-push'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { eventosDasAgendas, hojeSP } from './_lib/ical.js'
import { VAPID_PUBLICA } from './_lib/vapid.js'

type Tipo = 'briefing' | 'revisao'
interface Mensagem {
  titulo: string
  corpo: string
  url: string
}

const PAINEIS = { trabalho_tarefas: 'Trabalho', pessoal_tarefas: 'Pessoal', estudos_tarefas: 'Estudos' } as const
const PESO: Record<string, number> = { alta: 0, media: 1, baixa: 2 }

function json(corpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  })
}

function horaSP(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }).format(
    new Date(iso),
  )
}

function inicioSemana(dia: string): string {
  const d = new Date(`${dia}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7))
  return d.toISOString().slice(0, 10)
}

/** A chave privada gera a chave pública usada pelo app? */
function chavesVapidCombinam(privada: string): boolean {
  try {
    const ecdh = createECDH('prime256v1')
    ecdh.setPrivateKey(Buffer.from(privada.trim(), 'base64url'))
    return ecdh.getPublicKey().toString('base64url') === VAPID_PUBLICA
  } catch {
    return false
  }
}

const plural =(n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`

async function montarBriefing(db: SupabaseClient, userId: string, hoje: string): Promise<Mensagem> {
  const [agendas, rotina, ...tarefas] = await Promise.all([
    db.from('agendas').select('nome, ical_url, cor').eq('user_id', userId).eq('ativa', true),
    db.from('habito_registros').select('id').eq('user_id', userId).eq('data', hoje),
    ...Object.keys(PAINEIS).map((t) =>
      db
        .from(t)
        .select('titulo, prioridade, prazo')
        .eq('user_id', userId)
        .neq('status', 'feito')
        .lte('destaque_em', hoje),
    ),
  ])

  const linhas: string[] = []

  const { eventos } = await eventosDasAgendas(agendas.data ?? [], hoje)
  if (eventos.length === 0) linhas.push('Agenda: livre hoje')
  else {
    const primeiro = eventos.find((e) => !e.diaInteiro)
    linhas.push(
      `Agenda: ${plural(eventos.length, 'compromisso', 'compromissos')}` +
        (primeiro ? ` · 1º às ${horaSP(primeiro.inicio)}, ${primeiro.titulo}` : ` · ${eventos[0].titulo}`),
    )
  }

  const prioridades = tarefas
    .flatMap((r) => (r.data ?? []) as { titulo: string; prioridade: string; prazo: string | null }[])
    .sort((a, b) => PESO[a.prioridade] - PESO[b.prioridade] || (a.prazo ?? '9999').localeCompare(b.prazo ?? '9999'))
  if (prioridades.length) {
    linhas.push(`Prioridades: ${prioridades.slice(0, 3).map((p) => p.titulo).join('; ')}`)
  }

  const habitos = rotina.data?.length ?? 0
  if (habitos) linhas.push(`Rotina: ${plural(habitos, 'hábito', 'hábitos')} hoje`)

  return { titulo: 'Bom dia! Seu dia em resumo', corpo: linhas.join('\n'), url: '/' }
}

async function montarRevisao(db: SupabaseClient, userId: string, hoje: string): Promise<Mensagem> {
  const semana = inicioSemana(hoje)
  const [rotina, erros, registrosErro, sono] = await Promise.all([
    db.from('habito_registros').select('feito').eq('user_id', userId).eq('data', hoje),
    db.from('erros').select('id, frequencia').eq('user_id', userId).eq('ativo', true),
    db.from('erro_registros').select('erro_id, periodo').eq('user_id', userId).in('periodo', [hoje, semana]),
    db.from('sono_registros').select('id').eq('user_id', userId).eq('data', hoje),
  ])

  const linhas: string[] = []
  let url = '/'

  const regs = rotina.data ?? []
  const abertos = regs.filter((r) => !r.feito).length
  if (abertos) {
    linhas.push(`Rotina: ${abertos} de ${regs.length} em aberto`)
    url = '/rotina'
  } else if (regs.length) linhas.push('Rotina: completa ✓')

  const avaliados = new Set((registrosErro.data ?? []).map((r) => `${r.erro_id}|${r.periodo}`))
  const pendentes = (erros.data ?? []).filter(
    (e) => !avaliados.has(`${e.id}|${e.frequencia === 'semanal' ? semana : hoje}`),
  ).length
  if (pendentes) {
    linhas.push(`Erros a eliminar: ${pendentes} para avaliar`)
    if (url === '/') url = '/erros'
  }

  if (!sono.data?.length) {
    linhas.push('Sono: registre a noite de hoje')
    if (url === '/') url = '/sono'
  }

  const tudoEmDia = !abertos && !pendentes && sono.data?.length
  return {
    titulo: 'Revisão do dia',
    corpo: tudoEmDia ? 'Tudo em dia. Bom descanso!' : linhas.join('\n'),
    url,
  }
}

export async function POST(request: Request): Promise<Response> {
  const faltando = ['VITE_SUPABASE_URL', 'SUPABASE_SECRET_KEY', 'VAPID_PRIVATE_KEY', 'NOTIFICAR_SEGREDO'].filter(
    (v) => !process.env[v],
  )
  if (faltando.length) return json({ erro: `Variáveis faltando na Vercel: ${faltando.join(', ')}` }, 500)

  const chaveSecreta = process.env.SUPABASE_SECRET_KEY!.trim()
  if (!chaveSecreta.startsWith('sb_secret_') && papelDoJwt(chaveSecreta) !== 'service_role') {
    return json(
      { erro: `SUPABASE_SECRET_KEY na Vercel não é uma chave secreta (começa com "${chaveSecreta.slice(0, 10)}…"; deveria começar com "sb_secret_")` },
      500,
    )
  }

  if (!chavesVapidCombinam(process.env.VAPID_PRIVATE_KEY!)) {
    return json(
      { erro: 'VAPID_PRIVATE_KEY na Vercel não corresponde à chave pública do app (confira se não trocou com o NOTIFICAR_SEGREDO)' },
      500,
    )
  }

  const tipo = new URL(request.url).searchParams.get('tipo') as Tipo | null
  if (tipo !== 'briefing' && tipo !== 'revisao') return json({ erro: 'tipo deve ser briefing ou revisao' }, 400)

  const db = createClient(process.env.VITE_SUPABASE_URL!, chaveSecreta, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // Quem recebe: todos os inscritos (agendador) ou só quem pediu o teste
  let usuarios: string[]
  const segredo = request.headers.get('x-segredo')
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (segredo) {
    if (segredo !== process.env.NOTIFICAR_SEGREDO) return json({ erro: 'Segredo inválido' }, 401)
    const { data, error } = await db.from('push_inscricoes').select('user_id')
    if (error) return json({ erro: `Falha ao ler inscrições (confira SUPABASE_SECRET_KEY): ${error.message}` }, 500)
    usuarios = [...new Set((data ?? []).map((r) => r.user_id as string))]
  } else if (token) {
    const { data, error } = await db.auth.getUser(token)
    if (error || !data.user) return json({ erro: 'Não autenticado' }, 401)
    usuarios = [data.user.id]
  } else return json({ erro: 'Não autenticado' }, 401)

  webpush.setVapidDetails('https://painel-rafael-pi.vercel.app', VAPID_PUBLICA, process.env.VAPID_PRIVATE_KEY!.trim())
  const hoje = hojeSP()
  let enviadas = 0
  let removidas = 0
  let inscritos = 0
  const falhas: string[] = []

  for (const userId of usuarios) {
    const msg = tipo === 'briefing' ? await montarBriefing(db, userId, hoje) : await montarRevisao(db, userId, hoje)
    const { data: inscricoes, error } = await db
      .from('push_inscricoes')
      .select('id, endpoint, p256dh, auth')
      .eq('user_id', userId)
    if (error) return json({ erro: `Falha ao ler inscrições (confira SUPABASE_SECRET_KEY): ${error.message}` }, 500)
    inscritos += inscricoes?.length ?? 0
    for (const s of inscricoes ?? []) {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(msg),
          { TTL: 60 * 60 * 6, urgency: 'high' },
        )
        enviadas++
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode
        if (status === 404 || status === 410) {
          // Inscrição expirou (app desinstalado, permissão revogada)
          await db.from('push_inscricoes').delete().eq('id', s.id)
          removidas++
        } else {
          const corpo = (e as { body?: string }).body ?? (e as Error).message
          falhas.push(`${status ?? 'erro'}: ${String(corpo).slice(0, 200)}`)
        }
      }
    }
  }

  return json({ inscritos, enviadas, removidas, falhas })
}
