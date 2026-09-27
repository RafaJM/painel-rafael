import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, MapPin, Settings } from 'lucide-react'
import { useTabela } from '../lib/useTabela'
import { horaSP, useEventosDoDia, type Agenda } from '../lib/agenda'

export default function AgendaDoDia({ hoje }: { hoje: string }) {
  const agendas = useTabela<Agenda>('agendas')
  const { eventos, falhas, erro, carregando, recarregar } = useEventosDoDia(hoje)
  const [agora, setAgora] = useState(() => Date.now())

  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), 60_000)
    return () => clearInterval(t)
  }, [])

  // Recarrega quando uma agenda é adicionada/alterada
  const assinatura = agendas.linhas.map((a) => `${a.id}${a.ativa}${a.ical_url}`).join()
  useEffect(() => {
    if (!agendas.carregando) recarregar()
  }, [assinatura, agendas.carregando, recarregar])

  const semAgenda = !agendas.carregando && agendas.linhas.length === 0

  return (
    <section className="rounded-2xl border border-borda bg-cartao p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold">
          <CalendarDays size={18} className="text-slate-400" /> Agenda de hoje
        </h2>
        <Link to="/agendas" className="-m-1 p-1 text-slate-500" aria-label="Configurar agendas">
          <Settings size={18} />
        </Link>
      </div>

      {semAgenda ? (
        <Link to="/agendas" className="text-sm text-destaque">
          Conectar sua agenda do Google →
        </Link>
      ) : carregando ? (
        <p className="text-sm text-slate-500">Carregando…</p>
      ) : erro ? (
        <p className="text-sm text-red-300">{erro}</p>
      ) : eventos.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhum compromisso hoje.</p>
      ) : (
        <ul className="space-y-2.5">
          {eventos.map((e, i) => {
            const passou = !e.diaInteiro && new Date(e.fim).getTime() < agora
            const acontecendo =
              !e.diaInteiro && new Date(e.inicio).getTime() <= agora && new Date(e.fim).getTime() > agora
            return (
              <li key={i} className={`flex gap-3 ${passou ? 'opacity-40' : ''}`}>
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: e.cor }} />
                <span className="w-24 shrink-0 text-sm tabular-nums text-slate-400">
                  {e.diaInteiro ? 'Dia inteiro' : `${horaSP(e.inicio)}–${horaSP(e.fim)}`}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="leading-snug">
                    {e.titulo}
                    {acontecendo && (
                      <span className="ml-2 rounded-full bg-destaque/15 px-2 py-0.5 text-[11px] text-destaque">
                        agora
                      </span>
                    )}
                  </div>
                  {e.local && (
                    <div className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-500">
                      <MapPin size={12} /> {e.local}
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
      {falhas.length > 0 && (
        <p className="mt-3 text-xs text-amber-300">Não consegui ler: {falhas.join(', ')}. Confira o endereço.</p>
      )}
    </section>
  )
}
