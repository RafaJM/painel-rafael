import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronDown, Plus } from 'lucide-react'
import { useTabela } from '../lib/useTabela'
import { prazoRelativo } from '../lib/datas'
import { progresso, type Etapa, type Objetivo } from '../lib/objetivos'
import BarraProgresso from '../components/BarraProgresso'
import EditorObjetivo from '../components/EditorObjetivo'

function CartaoObjetivo({ o, etapas }: { o: Objetivo; etapas: Etapa[] }) {
  const p = progresso(etapas)
  return (
    <Link to={`/objetivos/${o.id}`} className="block rounded-2xl border border-borda bg-cartao p-4">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="font-medium leading-snug">{o.titulo}</span>
        <span className="shrink-0 text-sm tabular-nums text-slate-300">{p.pct}%</span>
      </div>
      <BarraProgresso pct={p.pct} />
      <p className="mt-2 text-xs text-slate-400">
        {p.total ? `${p.feitas} de ${p.total} etapas` : 'Sem etapas ainda'}
        {o.prazo && ` · prazo ${prazoRelativo(o.prazo)}`}
      </p>
    </Link>
  )
}

export default function Objetivos() {
  const objetivos = useTabela<Objetivo>('objetivos')
  const etapas = useTabela<Etapa>('objetivo_etapas')
  const [criando, setCriando] = useState(false)
  const [verArquivados, setVerArquivados] = useState(false)
  const navegar = useNavigate()

  const etapasDe = (id: string) => etapas.linhas.filter((e) => e.objetivo_id === id)
  const ordenar = (lista: Objetivo[]) =>
    lista.slice().sort((a, b) => (a.prazo ?? '9999').localeCompare(b.prazo ?? '9999') || a.titulo.localeCompare(b.titulo))
  const ativos = ordenar(objetivos.linhas.filter((o) => !o.arquivado))
  const arquivados = ordenar(objetivos.linhas.filter((o) => o.arquivado))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Objetivos</h1>
        <button
          onClick={() => setCriando(true)}
          className="flex items-center gap-1 rounded-full bg-destaque/15 px-3 py-1.5 text-sm text-destaque"
        >
          <Plus size={16} /> Novo
        </button>
      </div>
      {objetivos.erro && <p className="text-sm text-red-300">{objetivos.erro}</p>}

      {objetivos.carregando ? (
        <p className="text-sm text-slate-500">Carregando…</p>
      ) : ativos.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-borda px-4 py-8 text-center text-sm text-slate-500">
          Crie um objetivo e divida em etapas.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {ativos.map((o) => (
            <CartaoObjetivo key={o.id} o={o} etapas={etapasDe(o.id)} />
          ))}
        </div>
      )}

      {arquivados.length > 0 && (
        <div>
          <button
            onClick={() => setVerArquivados((v) => !v)}
            className="mb-2 flex items-center gap-1 text-sm text-slate-400"
          >
            <ChevronDown size={16} className={verArquivados ? '' : '-rotate-90'} />
            Arquivados ({arquivados.length})
          </button>
          {verArquivados && (
            <div className="grid gap-3 opacity-60 sm:grid-cols-2">
              {arquivados.map((o) => (
                <CartaoObjetivo key={o.id} o={o} etapas={etapasDe(o.id)} />
              ))}
            </div>
          )}
        </div>
      )}

      {criando && (
        <EditorObjetivo
          objetivo={null}
          onFechar={() => setCriando(false)}
          onSalvar={async (d) => {
            const novo = await objetivos.inserir(d)
            if (novo) navegar(`/objetivos/${novo.id}`)
          }}
        />
      )}
    </div>
  )
}
