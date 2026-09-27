import { useState, type FormEvent } from 'react'
import Folha from './Folha'
import type { Objetivo } from '../lib/objetivos'

const campo =
  'w-full rounded-xl border border-borda bg-fundo px-3 py-2.5 outline-none focus:border-destaque'
const rotulo = 'mb-1 block text-xs text-slate-400'

export default function EditorObjetivo({
  objetivo,
  onSalvar,
  onExcluir,
  onFechar,
}: {
  objetivo: Objetivo | null
  onSalvar: (d: Partial<Objetivo>) => Promise<void>
  onExcluir?: () => Promise<void>
  onFechar: () => void
}) {
  const [titulo, setTitulo] = useState(objetivo?.titulo ?? '')
  const [descricao, setDescricao] = useState(objetivo?.descricao ?? '')
  const [prazo, setPrazo] = useState(objetivo?.prazo ?? '')
  const [arquivado, setArquivado] = useState(objetivo?.arquivado ?? false)
  const [confirmar, setConfirmar] = useState(false)

  async function salvar(e: FormEvent) {
    e.preventDefault()
    if (!titulo.trim()) return
    await onSalvar({ titulo: titulo.trim(), descricao: descricao.trim() || null, prazo: prazo || null, arquivado })
    onFechar()
  }

  return (
    <Folha titulo={objetivo ? 'Editar objetivo' : 'Novo objetivo'} onFechar={onFechar}>
      <form onSubmit={salvar} className="space-y-4">
        <div>
          <label className={rotulo}>Objetivo</label>
          <input className={campo} value={titulo} onChange={(e) => setTitulo(e.target.value)} autoFocus={!objetivo} />
        </div>
        <div>
          <label className={rotulo}>Descrição (opcional)</label>
          <textarea className={campo} rows={2} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
        </div>
        <div>
          <label className={rotulo}>Prazo (opcional)</label>
          <input type="date" className={campo} value={prazo} onChange={(e) => setPrazo(e.target.value)} />
        </div>
        {objetivo && (
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={arquivado}
              onChange={(e) => setArquivado(e.target.checked)}
              className="h-5 w-5 accent-teal-400"
            />
            Arquivado (concluído ou abandonado)
          </label>
        )}
        <div className="flex items-center gap-3 pt-1">
          {onExcluir &&
            (confirmar ? (
              <button
                type="button"
                onClick={async () => {
                  await onExcluir()
                  onFechar()
                }}
                className="rounded-xl bg-red-500/20 px-4 py-2.5 text-sm text-red-300"
              >
                Excluir com etapas
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmar(true)}
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
