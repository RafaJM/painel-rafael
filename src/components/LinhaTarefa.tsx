import { Circle, CircleCheck, CircleDot, Star } from 'lucide-react'
import { dataCurta, hojeISO, prazoRelativo } from '../lib/datas'
import { PRIORIDADE_ROTULO, type Prioridade, type Status, type Tarefa } from '../lib/tarefas'

const COR_PRIORIDADE: Record<Prioridade, string> = {
  alta: 'text-red-400',
  media: 'text-amber-300',
  baixa: 'text-slate-400',
}

export function IconeStatus({ status }: { status: Status }) {
  if (status === 'feito') return <CircleCheck size={22} className="text-destaque" />
  if (status === 'em_andamento') return <CircleDot size={22} className="text-amber-300" />
  return <Circle size={22} className="text-slate-500" />
}

export default function LinhaTarefa({
  tarefa: t,
  onStatus,
  onDestaque,
  onAbrir,
}: {
  tarefa: Tarefa
  onStatus: () => void
  onDestaque: () => void
  onAbrir: () => void
}) {
  const hoje = hojeISO()
  const feita = t.status === 'feito'
  const atrasada = !feita && t.prazo && t.prazo < hoje
  const destacadaHoje = t.destaque_em && t.destaque_em <= hoje
  const destacadaFutura = t.destaque_em && t.destaque_em > hoje

  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <button onClick={onStatus} className="-m-1 p-1" aria-label="Mudar status">
        <IconeStatus status={t.status} />
      </button>
      <button onClick={onAbrir} className="min-w-0 flex-1 text-left">
        <div className={`leading-snug ${feita ? 'text-slate-500 line-through' : ''}`}>{t.titulo}</div>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
          <span className={COR_PRIORIDADE[t.prioridade]}>{PRIORIDADE_ROTULO[t.prioridade]}</span>
          {t.status === 'em_andamento' && <span className="text-amber-300">Em andamento</span>}
          {t.prazo && (
            <span
              className={atrasada ? 'text-red-400' : t.prazo === hoje && !feita ? 'text-amber-300' : 'text-slate-400'}
            >
              {atrasada ? 'Atrasada · ' : 'Prazo '}
              {prazoRelativo(t.prazo)}
            </span>
          )}
          {destacadaFutura && <span className="text-yellow-300/80">★ a partir de {dataCurta(t.destaque_em!)}</span>}
        </div>
      </button>
      {!feita && (
        <button onClick={onDestaque} className="-m-1 p-1" aria-label="Marcar como prioridade">
          <Star
            size={20}
            className={destacadaHoje ? 'fill-yellow-300 text-yellow-300' : destacadaFutura ? 'text-yellow-300' : 'text-slate-600'}
          />
        </button>
      )}
    </div>
  )
}
