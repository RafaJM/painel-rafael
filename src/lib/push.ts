import { supabase } from './supabase'
import { VAPID_PUBLICA } from '../../api/_lib/vapid'

export type EstadoPush = 'sem-suporte' | 'bloqueado' | 'desativado' | 'ativado'

export function suportaPush(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

function chaveParaBytes(base64url: string): Uint8Array<ArrayBuffer> {
  const base64 = (base64url + '='.repeat((4 - (base64url.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')
  const bruto = atob(base64)
  const bytes = new Uint8Array(new ArrayBuffer(bruto.length))
  for (let i = 0; i < bruto.length; i++) bytes[i] = bruto.charCodeAt(i)
  return bytes
}

async function registro(): Promise<ServiceWorkerRegistration | null> {
  // Em desenvolvimento (localhost) o service worker não é registrado
  return (await navigator.serviceWorker.getRegistration()) ?? null
}

async function salvaNoBanco(endpoint: string): Promise<boolean> {
  const { data } = await supabase.from('push_inscricoes').select('id').eq('endpoint', endpoint).maybeSingle()
  return Boolean(data)
}

/** "Ativado" só quando o navegador está inscrito E o banco tem o registro. */
export async function estadoPush(): Promise<EstadoPush> {
  if (!suportaPush()) return 'sem-suporte'
  if (Notification.permission === 'denied') return 'bloqueado'
  const reg = await registro()
  const inscricao = await reg?.pushManager.getSubscription()
  return inscricao && (await salvaNoBanco(inscricao.endpoint)) ? 'ativado' : 'desativado'
}

export async function ativarPush(): Promise<EstadoPush> {
  if (!suportaPush()) return 'sem-suporte'
  const permissao = await Notification.requestPermission()
  if (permissao !== 'granted') return permissao === 'denied' ? 'bloqueado' : 'desativado'

  const reg = await registro()
  if (!reg) throw new Error('As notificações só funcionam no app publicado (Vercel), não no localhost.')
  const inscricao =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: chaveParaBytes(VAPID_PUBLICA) }))

  const dados = inscricao.toJSON()
  const { error } = await supabase.from('push_inscricoes').upsert(
    {
      endpoint: inscricao.endpoint,
      p256dh: dados.keys!.p256dh,
      auth: dados.keys!.auth,
      dispositivo: /Android/i.test(navigator.userAgent) ? 'Android' : /Windows/i.test(navigator.userAgent) ? 'Windows' : 'Outro',
    },
    { onConflict: 'endpoint' },
  )
  if (error) throw new Error(`Não consegui salvar a inscrição: ${error.message}`)
  if (!(await salvaNoBanco(inscricao.endpoint))) {
    throw new Error('A inscrição não apareceu no banco depois de salva. Me envie esta mensagem.')
  }
  return 'ativado'
}

export async function desativarPush(): Promise<EstadoPush> {
  const reg = await registro()
  const inscricao = await reg?.pushManager.getSubscription()
  if (inscricao) {
    await supabase.from('push_inscricoes').delete().eq('endpoint', inscricao.endpoint)
    await inscricao.unsubscribe()
  }
  return 'desativado'
}

/** Pede ao servidor para enviar agora o briefing ou a revisão (só para você). */
export async function testarPush(tipo: 'briefing' | 'revisao'): Promise<string> {
  const { data } = await supabase.auth.getSession()
  const resp = await fetch(`/api/notificar?tipo=${tipo}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${data.session?.access_token ?? ''}` },
  })
  const corpo = await resp.json().catch(() => ({}))
  if (!resp.ok) throw new Error(corpo.erro ?? `HTTP ${resp.status}`)
  if (corpo.enviadas) return `Enviada para ${corpo.enviadas} aparelho(s).`
  if (!corpo.inscritos) return 'Nenhuma inscrição sua encontrada no banco. Desligue e ative de novo neste aparelho.'
  if (corpo.removidas) return 'A inscrição deste aparelho tinha expirado e foi removida. Ative de novo.'
  return `O envio falhou: ${(corpo.falhas ?? []).join(' | ') || 'motivo desconhecido'}`
}
