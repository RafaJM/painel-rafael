import { useEffect, useState } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { ativarPush, desativarPush, estadoPush, testarPush, type EstadoPush } from '../lib/push'

const TEXTO_ESTADO: Record<EstadoPush, string> = {
  'sem-suporte': 'Este navegador não suporta notificações. No Android, use o app instalado pelo Chrome.',
  bloqueado:
    'As notificações estão bloqueadas. Libere em: configurações do Android → Apps → Painel → Notificações.',
  desativado: 'Notificações desligadas neste aparelho.',
  ativado: 'Notificações ligadas neste aparelho.',
}

export default function Notificacoes() {
  const [estado, setEstado] = useState<EstadoPush | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const [mensagem, setMensagem] = useState<string | null>(null)

  useEffect(() => {
    estadoPush().then(setEstado)
  }, [])

  async function executar(acao: () => Promise<EstadoPush | string>) {
    setOcupado(true)
    setMensagem(null)
    try {
      const r = await acao()
      if (r === 'sem-suporte' || r === 'bloqueado' || r === 'desativado' || r === 'ativado') setEstado(r)
      else setMensagem(r)
    } catch (e) {
      setMensagem(e instanceof Error ? e.message : String(e))
    } finally {
      setOcupado(false)
    }
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Notificações</h1>

      <section className="space-y-3 rounded-2xl border border-borda bg-cartao p-4 text-sm">
        <div>
          <div className="font-medium">04:30 · Briefing</div>
          <p className="text-slate-400">Compromissos do dia, prioridades (★) e hábitos previstos.</p>
        </div>
        <div>
          <div className="font-medium">19:30 · Revisão</div>
          <p className="text-slate-400">Hábitos em aberto, erros para avaliar e registro do sono.</p>
        </div>
      </section>

      <section className="rounded-2xl border border-borda bg-cartao p-4">
        <div className="mb-4 flex items-start gap-3">
          {estado === 'ativado' ? (
            <Bell size={22} className="mt-0.5 shrink-0 text-destaque" />
          ) : (
            <BellOff size={22} className="mt-0.5 shrink-0 text-slate-500" />
          )}
          <p className="text-sm">{estado ? TEXTO_ESTADO[estado] : 'Verificando…'}</p>
        </div>

        {estado === 'desativado' && (
          <button
            disabled={ocupado}
            onClick={() => executar(ativarPush)}
            className="w-full rounded-xl bg-destaque py-3 font-semibold text-slate-900 disabled:opacity-60"
          >
            Ativar neste aparelho
          </button>
        )}

        {estado === 'ativado' && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                disabled={ocupado}
                onClick={() => executar(() => testarPush('briefing'))}
                className="rounded-xl border border-borda py-2.5 text-sm disabled:opacity-60"
              >
                Testar briefing
              </button>
              <button
                disabled={ocupado}
                onClick={() => executar(() => testarPush('revisao'))}
                className="rounded-xl border border-borda py-2.5 text-sm disabled:opacity-60"
              >
                Testar revisão
              </button>
            </div>
            <button
              disabled={ocupado}
              onClick={() => executar(desativarPush)}
              className="w-full py-2 text-sm text-slate-500 hover:text-red-300"
            >
              Desligar neste aparelho
            </button>
          </div>
        )}

        {mensagem && <p className="mt-3 text-sm text-slate-300">{mensagem}</p>}
      </section>

      <p className="px-1 text-xs text-slate-500">
        Ative em cada aparelho onde quiser receber (celular e/ou computador).
      </p>
    </div>
  )
}
