import { useState, type FormEvent } from 'react'
import { ChevronDown, Plus, SlidersHorizontal } from 'lucide-react'
import { useTabela } from '../lib/useTabela'
import { hojeISO } from '../lib/datas'
import {
  dataDestaquePadrao,
  ordenar,
  proximoStatus,
  resumo,
  type Criterio,
  type Painel,
  type Tarefa,
} from '../lib/tarefas'
import BarraProgresso from '../components/BarraProgresso'
import LinhaTarefa from '../components/LinhaTarefa'
import EditorTarefa from '../components/EditorTarefa'

function lerCriterio(chave: string): Criterio {
  try {
    return localStorage.getItem(chave) === 'prioridade' ? 'prioridade' : 'prazo'
  } catch {
    return 'prazo'
  }
}

export default function PainelTarefas({ painel }: { painel: Painel }) {
  const { linhas, carregando, erro, inserir, atualizar, remover } = useTabela<Tarefa>(painel.tabela)
  const chaveOrdem = `ordem-${painel.tabela}`
  const [criterio, setCriterio] = useState<Criterio>(() => lerCriterio(chaveOrdem))
  const [novoTitulo, setNovoTitulo] = useState('')
  const [editando, setEditando] = useState<Tarefa | 'nova' | null>(null)
  const [verFeitas, setVerFeitas] = useState(false)

  const hoje = hojeISO()
  const r = resumo(linhas, hoje)
  const abertas = ordenar(
    linhas.filter((t) => t.status !== 'feito'),
    criterio,
  )
  const feitas = linhas
    .filter((t) => t.status === 'feito')
    .sort((a, b) => (b.concluida_em ?? '').localeCompare(a.concluida_em ?? ''))

  function trocarCriterio(c: Criterio) {
    setCriterio(c)
    try {
      localStorage.setItem(chaveOrdem, c)
    } catch {
      /* preferência só local; ignorar se indisponível */
    }
  }

  async function adicionarRapido(e: FormEvent) {
    e.preventDefault()
    const titulo = novoTitulo.trim()
    if (!titulo) return
    setNovoTitulo('')
    await inserir({ titulo })
  }

  const linha = (t: Tarefa) => (
    <LinhaTarefa
      key={t.id}
      tarefa={t}
      onAbrir={() => setEditando(t)}
      onStatus={() => atualizar(t.id, { status: proximoStatus(t.status) })}
      onDestaque={() => atualizar(t.id, { destaque_em: t.destaque_em ? null : dataDestaquePadrao(t, hoje) })}
    />
  )

  return (
    <div>
      <header className="mb-5">
        <h1 className="text-2xl font-semibold">{painel.nome}</h1>
        <div className="mt-3 flex items-center gap-3">
          <BarraProgresso pct={r.pct} />
          <span className="shrink-0 text-sm font-medium tabular-nums">{r.pct}%</span>
        </div>
        <p className="mt-1.5 text-xs text-slate-400">
          {r.pendentes} {r.pendentes === 1 ? 'pendente' : 'pendentes'} · {r.feitas} feitas
          {r.atrasadas > 0 && <span className="text-red-400"> · {r.atrasadas} atrasadas</span>}
        </p>
      </header>

      <form onSubmit={adicionarRapido} className="mb-4 flex gap-2">
        <input
          value={novoTitulo}
          onChange={(e) => setNovoTitulo(e.target.value)}
          placeholder="Nova tarefa…"
          className="min-w-0 flex-1 rounded-xl border border-borda bg-cartao px-4 py-3 outline-none focus:border-destaque"
        />
        <button className="rounded-xl bg-destaque px-4 text-slate-900" aria-label="Adicionar">
          <Plus size={22} />
        </button>
        <button
          type="button"
          onClick={() => setEditando('nova')}
          className="rounded-xl border border-borda px-3 text-slate-400"
          aria-label="Adicionar com detalhes"
        >
          <SlidersHorizontal size={20} />
        </button>
      </form>

      <div className="mb-3 flex items-center gap-2 text-xs">
        <span className="text-slate-500">Ordenar por</span>
        {(['prazo', 'prioridade'] as Criterio[]).map((c) => (
          <button
            key={c}
            onClick={() => trocarCriterio(c)}
            className={`rounded-full px-3 py-1 ${
              criterio === c ? 'bg-destaque/15 text-destaque' : 'text-slate-400'
            }`}
          >
            {c === 'prazo' ? 'Prazo' : 'Prioridade'}
          </button>
        ))}
      </div>

      {erro && <p className="mb-3 rounded-xl bg-red-500/10 px-4 py-2 text-sm text-red-300">{erro}</p>}

      {carregando ? (
        <p className="text-sm text-slate-500">Carregando…</p>
      ) : abertas.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-borda px-4 py-8 text-center text-sm text-slate-500">
          Nada pendente aqui.
        </p>
      ) : (
        <div className="divide-y divide-borda overflow-hidden rounded-2xl border border-borda bg-cartao">
          {abertas.map(linha)}
        </div>
      )}

      {feitas.length > 0 && (
        <div className="mt-6">
          <button
            onClick={() => setVerFeitas((v) => !v)}
            className="mb-2 flex items-center gap-1 text-sm text-slate-400"
          >
            <ChevronDown size={16} className={verFeitas ? '' : '-rotate-90'} />
            Concluídas ({feitas.length})
          </button>
          {verFeitas && (
            <div className="divide-y divide-borda overflow-hidden rounded-2xl border border-borda bg-cartao/60">
              {feitas.map(linha)}
            </div>
          )}
        </div>
      )}

      {editando && (
        <EditorTarefa
          key={editando === 'nova' ? 'nova' : editando.id}
          tarefa={editando === 'nova' ? null : editando}
          onFechar={() => setEditando(null)}
          onSalvar={async (dados) => {
            if (editando === 'nova') await inserir(dados)
            else await atualizar(editando.id, dados)
          }}
          onExcluir={editando === 'nova' ? undefined : () => remover(editando.id)}
        />
      )}
    </div>
  )
}
