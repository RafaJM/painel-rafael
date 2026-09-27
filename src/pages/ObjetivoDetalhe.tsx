import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Circle, CircleCheck, Pencil, Plus, Trash2 } from 'lucide-react'
import { useTabela } from '../lib/useTabela'
import { useHoje } from '../lib/useHoje'
import { diaDe, prazoRelativo } from '../lib/datas'
import { agruparUltimo } from '../lib/graficos'
import { ordenarEtapas, progresso, type Etapa, type Objetivo, type Snapshot } from '../lib/objetivos'
import BarraProgresso from '../components/BarraProgresso'
import GraficoJanelas from '../components/GraficoJanelas'
import EditorObjetivo from '../components/EditorObjetivo'

function LinhaEtapa({
  etapa,
  onAlternar,
  onRenomear,
  onExcluir,
}: {
  etapa: Etapa
  onAlternar: () => void
  onRenomear: (titulo: string) => void
  onExcluir: () => void
}) {
  const [editando, setEditando] = useState(false)
  const [texto, setTexto] = useState(etapa.titulo)

  function concluirEdicao(e?: FormEvent) {
    e?.preventDefault()
    const t = texto.trim()
    if (t && t !== etapa.titulo) onRenomear(t)
    else setTexto(etapa.titulo)
    setEditando(false)
  }

  return (
    <li className="flex items-center gap-3 py-2">
      <button onClick={onAlternar} className="-m-1 p-1" aria-label={etapa.feito ? 'Desmarcar etapa' : 'Concluir etapa'}>
        {etapa.feito ? (
          <CircleCheck size={22} className="text-destaque" />
        ) : (
          <Circle size={22} className="text-slate-500" />
        )}
      </button>
      {editando ? (
        <form onSubmit={concluirEdicao} className="flex flex-1 items-center gap-2">
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onBlur={() => concluirEdicao()}
            autoFocus
            className="min-w-0 flex-1 rounded-lg border border-borda bg-fundo px-2 py-1 outline-none focus:border-destaque"
          />
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onExcluir}
            className="p-1 text-slate-500 hover:text-red-300"
            aria-label="Excluir etapa"
          >
            <Trash2 size={16} />
          </button>
        </form>
      ) : (
        <>
          <span className={`flex-1 leading-snug ${etapa.feito ? 'text-slate-500 line-through' : ''}`}>
            {etapa.titulo}
          </span>
          <button onClick={() => setEditando(true)} className="p-1 text-slate-600 hover:text-slate-300" aria-label="Editar etapa">
            <Pencil size={15} />
          </button>
        </>
      )}
    </li>
  )
}

export default function ObjetivoDetalhe() {
  const { id = '' } = useParams()
  const hoje = useHoje()
  const navegar = useNavigate()
  const objetivos = useTabela<Objetivo>('objetivos', { coluna: 'id', valor: id })
  const etapas = useTabela<Etapa>('objetivo_etapas', { coluna: 'objetivo_id', valor: id })
  const snapshots = useTabela<Snapshot>('objetivo_snapshots', { coluna: 'objetivo_id', valor: id })
  const [nova, setNova] = useState('')
  const [editando, setEditando] = useState(false)

  const objetivo = objetivos.linhas[0]
  const lista = ordenarEtapas(etapas.linhas)
  const p = progresso(lista)

  if (objetivos.carregando) return <p className="text-sm text-slate-500">Carregando…</p>
  if (!objetivo) {
    return (
      <div>
        <p className="text-slate-400">Objetivo não encontrado.</p>
        <Link to="/objetivos" className="text-sm text-destaque">
          ← Voltar
        </Link>
      </div>
    )
  }

  // Evolução: fotos diárias do banco + o valor de agora para hoje
  const inicio = diaDe(objetivo.created_at)
  const pontos = [
    ...snapshots.linhas.filter((s) => s.data !== hoje).map((s) => ({ data: s.data, valor: Number(s.pct) })),
    { data: hoje, valor: p.pct },
  ].filter((s) => s.data >= inicio)

  async function adicionar(e: FormEvent) {
    e.preventDefault()
    const titulo = nova.trim()
    if (!titulo) return
    setNova('')
    const ordem = Math.max(0, ...lista.map((x) => x.ordem)) + 1
    await etapas.inserir({ objetivo_id: id, titulo, ordem })
  }

  return (
    <div className="space-y-5">
      <div>
        <Link to="/objetivos" className="mb-2 inline-flex items-center gap-1 text-sm text-slate-400">
          <ChevronLeft size={16} /> Objetivos
        </Link>
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold leading-tight">{objetivo.titulo}</h1>
          <button onClick={() => setEditando(true)} className="mt-1 p-1 text-slate-500" aria-label="Editar objetivo">
            <Pencil size={18} />
          </button>
        </div>
        {objetivo.descricao && <p className="mt-1 text-sm text-slate-400">{objetivo.descricao}</p>}
        {objetivo.prazo && <p className="mt-1 text-xs text-slate-500">Prazo {prazoRelativo(objetivo.prazo)}</p>}
      </div>

      <section className="rounded-2xl border border-borda bg-cartao p-4">
        <div className="mb-3 flex items-center gap-3">
          <BarraProgresso pct={p.pct} />
          <span className="shrink-0 text-sm tabular-nums">{p.pct}%</span>
        </div>
        <ul className="divide-y divide-borda">
          {lista.map((e) => (
            <LinhaEtapa
              key={e.id}
              etapa={e}
              onAlternar={() => etapas.atualizar(e.id, { feito: !e.feito })}
              onRenomear={(titulo) => etapas.atualizar(e.id, { titulo })}
              onExcluir={() => etapas.remover(e.id)}
            />
          ))}
        </ul>
        <form onSubmit={adicionar} className="mt-3 flex gap-2">
          <input
            value={nova}
            onChange={(e) => setNova(e.target.value)}
            placeholder="Nova etapa…"
            className="min-w-0 flex-1 rounded-xl border border-borda bg-fundo px-3 py-2.5 outline-none focus:border-destaque"
          />
          <button className="rounded-xl bg-destaque px-3 text-slate-900" aria-label="Adicionar etapa">
            <Plus size={20} />
          </button>
        </form>
        {etapas.erro && <p className="mt-2 text-sm text-red-300">{etapas.erro}</p>}
      </section>

      <GraficoJanelas
        titulo="Evolução do progresso"
        maximo={100}
        guias={[50, 100]}
        formatar={(v) => `${Math.round(v)}%`}
        calcular={(janela) => agruparUltimo(pontos, janela, hoje)}
      />

      {editando && (
        <EditorObjetivo
          objetivo={objetivo}
          onFechar={() => setEditando(false)}
          onSalvar={async (d) => {
            await objetivos.atualizar(objetivo.id, d)
          }}
          onExcluir={async () => {
            await objetivos.remover(objetivo.id)
            navegar('/objetivos')
          }}
        />
      )}
    </div>
  )
}
