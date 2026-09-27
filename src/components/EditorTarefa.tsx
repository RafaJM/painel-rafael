import { useState, type FormEvent } from 'react'
import Folha from './Folha'
import {
  PRIORIDADE_ROTULO,
  STATUS_ROTULO,
  type Prioridade,
  type Status,
  type Tarefa,
} from '../lib/tarefas'

const campo =
  'w-full rounded-xl border border-borda bg-fundo px-3 py-2.5 outline-none focus:border-destaque'
const rotulo = 'mb-1 block text-xs text-slate-400'

export default function EditorTarefa({
  tarefa,
  onSalvar,
  onExcluir,
  onFechar,
}: {
  tarefa: Tarefa | null
  onSalvar: (dados: Partial<Tarefa>) => Promise<void>
  onExcluir?: () => Promise<void>
  onFechar: () => void
}) {
  const [titulo, setTitulo] = useState(tarefa?.titulo ?? '')
  const [status, setStatus] = useState<Status>(tarefa?.status ?? 'pendente')
  const [prioridade, setPrioridade] = useState<Prioridade>(tarefa?.prioridade ?? 'media')
  const [prazo, setPrazo] = useState(tarefa?.prazo ?? '')
  const [destaque, setDestaque] = useState(tarefa?.destaque_em ?? '')
  const [notas, setNotas] = useState(tarefa?.notas ?? '')
  const [confirmarExclusao, setConfirmarExclusao] = useState(false)

  async function salvar(e: FormEvent) {
    e.preventDefault()
    if (!titulo.trim()) return
    await onSalvar({
      titulo: titulo.trim(),
      status,
      prioridade,
      prazo: prazo || null,
      destaque_em: destaque || null,
      notas: notas.trim() || null,
    })
    onFechar()
  }

  return (
    <Folha titulo={tarefa ? 'Editar tarefa' : 'Nova tarefa'} onFechar={onFechar}>
      <form onSubmit={salvar} className="space-y-4">
        <div>
          <label className={rotulo}>Título</label>
          <input className={campo} value={titulo} onChange={(e) => setTitulo(e.target.value)} autoFocus={!tarefa} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={rotulo}>Status</label>
            <select className={campo} value={status} onChange={(e) => setStatus(e.target.value as Status)}>
              {Object.entries(STATUS_ROTULO).map(([v, r]) => (
                <option key={v} value={v}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={rotulo}>Prioridade</label>
            <select
              className={campo}
              value={prioridade}
              onChange={(e) => setPrioridade(e.target.value as Prioridade)}
            >
              {Object.entries(PRIORIDADE_ROTULO).map(([v, r]) => (
                <option key={v} value={v}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={rotulo}>Prazo</label>
            <input type="date" className={campo} value={prazo} onChange={(e) => setPrazo(e.target.value)} />
          </div>
          <div>
            <label className={rotulo}>★ Prioridade do dia a partir de</label>
            <input type="date" className={campo} value={destaque} onChange={(e) => setDestaque(e.target.value)} />
          </div>
        </div>
        <div>
          <label className={rotulo}>Notas</label>
          <textarea className={campo} rows={3} value={notas} onChange={(e) => setNotas(e.target.value)} />
        </div>

        <div className="flex items-center gap-3 pt-1">
          {onExcluir &&
            (confirmarExclusao ? (
              <button
                type="button"
                onClick={async () => {
                  await onExcluir()
                  onFechar()
                }}
                className="rounded-xl bg-red-500/20 px-4 py-2.5 text-sm text-red-300"
              >
                Confirmar exclusão
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmarExclusao(true)}
                className="px-2 py-2.5 text-sm text-slate-500 hover:text-red-300"
              >
                Excluir
              </button>
            ))}
          <button className="ml-auto rounded-xl bg-destaque px-5 py-2.5 font-semibold text-slate-900">Salvar</button>
        </div>
      </form>
    </Folha>
  )
}
