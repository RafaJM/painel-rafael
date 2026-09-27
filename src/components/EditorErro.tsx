import { useState, type FormEvent } from 'react'
import Folha from './Folha'
import type { Erro, Frequencia } from '../lib/erros'

const campo =
  'w-full rounded-xl border border-borda bg-fundo px-3 py-2.5 outline-none focus:border-destaque'
const rotulo = 'mb-1 block text-xs text-slate-400'

export default function EditorErro({
  erro,
  onSalvar,
  onExcluir,
  onFechar,
}: {
  erro: Erro | null
  onSalvar: (d: Partial<Erro>) => Promise<void>
  onExcluir?: () => Promise<void>
  onFechar: () => void
}) {
  const [nome, setNome] = useState(erro?.nome ?? '')
  const [descricao, setDescricao] = useState(erro?.descricao ?? '')
  const [frequencia, setFrequencia] = useState<Frequencia>(erro?.frequencia ?? 'diaria')
  const [ativo, setAtivo] = useState(erro?.ativo ?? true)
  const [confirmar, setConfirmar] = useState(false)

  async function salvar(e: FormEvent) {
    e.preventDefault()
    if (!nome.trim()) return
    await onSalvar({ nome: nome.trim(), descricao: descricao.trim() || null, frequencia, ativo })
    onFechar()
  }

  return (
    <Folha titulo={erro ? 'Editar erro' : 'Novo erro a eliminar'} onFechar={onFechar}>
      <form onSubmit={salvar} className="space-y-4">
        <div>
          <label className={rotulo}>Comportamento</label>
          <input
            className={campo}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex.: mexer no celular antes de dormir"
            autoFocus={!erro}
          />
        </div>
        <div>
          <label className={rotulo}>Detalhes (opcional)</label>
          <textarea className={campo} rows={2} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
        </div>
        <div>
          <label className={rotulo}>Avaliar</label>
          <div className="grid grid-cols-2 gap-2">
            {(['diaria', 'semanal'] as Frequencia[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFrequencia(f)}
                aria-pressed={frequencia === f}
                className={`rounded-xl py-2.5 text-sm font-medium ${
                  frequencia === f ? 'bg-destaque text-slate-900' : 'border border-borda text-slate-400'
                }`}
              >
                {f === 'diaria' ? 'Todo dia' : 'Toda semana'}
              </button>
            ))}
          </div>
        </div>
        {erro && (
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={ativo}
              onChange={(e) => setAtivo(e.target.checked)}
              className="h-5 w-5 accent-teal-400"
            />
            Ativo (desmarque quando o erro estiver superado)
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
                Excluir com histórico
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
