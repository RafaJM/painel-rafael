import { useState, type FormEvent } from 'react'
import Folha from './Folha'
import { CATEGORIAS_PADRAO, DIAS_CURTOS, type Habito } from '../lib/rotina'

const campo =
  'w-full rounded-xl border border-borda bg-fundo px-3 py-2.5 outline-none focus:border-destaque'
const rotulo = 'mb-1 block text-xs text-slate-400'

export default function EditorHabito({
  habito,
  categorias,
  onSalvar,
  onExcluir,
  onFechar,
}: {
  habito: Habito | null
  categorias: string[]
  onSalvar: (dados: Partial<Habito>) => Promise<void>
  onExcluir?: () => Promise<void>
  onFechar: () => void
}) {
  const [nome, setNome] = useState(habito?.nome ?? '')
  const [categoria, setCategoria] = useState(habito?.categoria ?? 'Pessoal')
  const [dias, setDias] = useState<number[]>(habito?.dias_semana ?? [0, 1, 2, 3, 4, 5, 6])
  const [horario, setHorario] = useState(habito?.horario?.slice(0, 5) ?? '')
  const [ativo, setAtivo] = useState(habito?.ativo ?? true)
  const [confirmarExclusao, setConfirmarExclusao] = useState(false)

  const opcoesCategoria = [...new Set([...CATEGORIAS_PADRAO, ...categorias])]

  function alternarDia(d: number) {
    setDias((ds) => (ds.includes(d) ? ds.filter((x) => x !== d) : [...ds, d].sort()))
  }

  async function salvar(e: FormEvent) {
    e.preventDefault()
    if (!nome.trim() || dias.length === 0) return
    await onSalvar({
      nome: nome.trim(),
      categoria: categoria.trim() || 'Pessoal',
      dias_semana: dias,
      horario: horario || null,
      ativo,
    })
    onFechar()
  }

  return (
    <Folha titulo={habito ? 'Editar hábito' : 'Novo hábito'} onFechar={onFechar}>
      <form onSubmit={salvar} className="space-y-4">
        <div>
          <label className={rotulo}>Nome</label>
          <input className={campo} value={nome} onChange={(e) => setNome(e.target.value)} autoFocus={!habito} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={rotulo}>Categoria</label>
            <input
              className={campo}
              list="categorias-habito"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
            />
            <datalist id="categorias-habito">
              {opcoesCategoria.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div>
            <label className={rotulo}>Horário (ordena a lista)</label>
            <input type="time" className={campo} value={horario} onChange={(e) => setHorario(e.target.value)} />
          </div>
        </div>
        <div>
          <label className={rotulo}>Dias da semana</label>
          <div className="flex gap-1.5">
            {DIAS_CURTOS.map((letra, d) => (
              <button
                key={d}
                type="button"
                onClick={() => alternarDia(d)}
                aria-pressed={dias.includes(d)}
                className={`h-10 flex-1 rounded-xl text-sm font-medium ${
                  dias.includes(d) ? 'bg-destaque text-slate-900' : 'border border-borda text-slate-400'
                }`}
              >
                {letra}
              </button>
            ))}
          </div>
          {dias.length === 0 && <p className="mt-1 text-xs text-red-400">Escolha pelo menos um dia.</p>}
        </div>
        {habito && (
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={ativo}
              onChange={(e) => setAtivo(e.target.checked)}
              className="h-5 w-5 accent-teal-400"
            />
            Ativo (desmarque para pausar sem perder o histórico)
          </label>
        )}

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
                Excluir com histórico
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
