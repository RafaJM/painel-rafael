// Função de servidor da Vercel: GET /api/agenda?dia=AAAA-MM-DD&dias=1
// Lê as agendas do usuário (com o login dele, respeitando o RLS), baixa cada
// endereço iCal e devolve os eventos do período já expandidos (recorrências,
// exceções e cancelamentos incluídos).
import { createClient } from '@supabase/supabase-js'
import { eventosDasAgendas, hojeSP } from './_lib/ical.js'

export type { Evento } from './_lib/ical.js'

function json(corpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'private, no-store' },
  })
}

export async function GET(request: Request): Promise<Response> {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return json({ erro: 'Não autenticado' }, 401)

  const params = new URL(request.url).searchParams
  const dia = params.get('dia') ?? hojeSP()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dia)) return json({ erro: 'Parâmetro dia inválido' }, 400)
  const dias = Math.min(Math.max(Number(params.get('dias')) || 1, 1), 14)

  const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: agendas, error } = await supabase.from('agendas').select('nome, ical_url, cor').eq('ativa', true)
  if (error) return json({ erro: error.message }, 401)

  return json(await eventosDasAgendas(agendas ?? [], dia, dias))
}
