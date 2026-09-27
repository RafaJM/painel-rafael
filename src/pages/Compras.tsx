import { useState, type FormEvent } from 'react'
import { ChevronLeft, ChevronRight, Circle, CircleCheck, Pencil, Plus } from 'lucide-react'
import { useTabela } from '../lib/useTabela'
import { useHoje } from '../lib/useHoje'
import { diaDe, inicioMes, nomeMes, somarMeses } from '../lib/datas'
import type { PontoDia } from '../lib/graficos'
import BarraProgresso from '../components/BarraProgresso'
import GraficoProgresso from '../components/GraficoProgresso'
import EditorItem from '../components/EditorItem'

interface ItemCompra {
  id: string
  nome: string
  categoria: string | null
  quantidade: string | null
  ativo: boolean
  created_at: string
}

interface CheckCompra {
  id: string
  item_id: string
  mes: string
  comprado: boolean
}

const SEM_CATEGORIA = 'Outros'
const MESES_HISTORICO = 12

export default function Compras() {
  const hoje = useHoje()
  const mesAtual = inicioMes(hoje)
  const [mesesAtras, setMesesAtras] = useState(0)
  const mes = somarMeses(mesAtual, -mesesAtras)

  const itens = useTabela<ItemCompra>('compras_itens')
  const checks = useTabela<CheckCompra>('compras_checks', {
    coluna: 'mes',
    valor: somarMeses(mesAtual, -MESES_HISTORICO),
    op: 'gte',
  })
  const [novo, setNovo] = useState('')
  const [editando, setEditando] = useState<ItemCompra | null>(null)

  const checkDe = (itemId: string, m: string) => checks.linhas.find((c) => c.item_id === itemId && c.mes === m)

  // Itens do mês: os ativos, mais os inativos que foram comprados naquele mês
  const doMes = itens.linhas.filter((i) => i.ativo || checkDe(i.id, mes))
  const comprados = doMes.filter((i) => checkDe(i.id, mes)).length
  const pct = doMes.length ? Math.round((comprados / doMes.length) * 100) : 0

  const grupos = new Map<string, ItemCompra[]>()
  for (const i of doMes.slice().sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))) {
    const g = i.categoria || SEM_CATEGORIA
    grupos.set(g, [...(grupos.get(g) ?? []), i])
  }
  const categorias = [...grupos.keys()].sort((a, b) =>
    a === SEM_CATEGORIA ? 1 : b === SEM_CATEGORIA ? -1 : a.localeCompare(b, 'pt-BR'),
  )

  // % comprado por mês, a partir do mês em que a lista começou
  const primeiroMes = itens.linhas.reduce<string | null>((m, i) => {
    const im = inicioMes(diaDe(i.created_at))
    return !m || im < m ? im : m
  }, null)
  const pontos: PontoDia[] = []
  for (let k = MESES_HISTORICO - 1; k >= 0 && primeiroMes; k--) {
    const m = somarMeses(mesAtual, -k)
    if (m < primeiroMes) continue
    const lista = itens.linhas.filter((i) => i.ativo || checkDe(i.id, m))
    pontos.push({ data: m, previstos: lista.length, feitos: lista.filter((i) => checkDe(i.id, m)).length })
  }

  async function alternar(item: ItemCompra) {
    const c = checkDe(item.id, mes)
    if (c) await checks.remover(c.id)
    else await checks.inserir({ item_id: item.id, mes, comprado: true })
  }

  async function adicionar(e: FormEvent) {
    e.preventDefault()
    const nome = novo.trim()
    if (!nome) return
    setNovo('')
    await itens.inserir({ nome })
  }

  const nomeDoMes = `${nomeMes(mes)}${mes.slice(0, 4) !== hoje.slice(0, 4) ? ` ${mes.slice(0, 4)}` : ''}`

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Lista de Compras</h1>

      <section className="rounded-2xl border border-borda bg-cartao p-4">
        <div className="mb-3 flex items-center justify-between">
          <button
            onClick={() => setMesesAtras((m) => Math.min(m + 1, MESES_HISTORICO))}
            className="-m-1 p-1 text-slate-400"
            aria-label="Mês anterior"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="font-semibold capitalize">{nomeDoMes}</span>
          <button
            onClick={() => setMesesAtras((m) => Math.max(m - 1, 0))}
            disabled={mesesAtras === 0}
            className="-m-1 p-1 text-slate-400 disabled:opacity-20"
            aria-label="Próximo mês"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {doMes.length > 0 && (
          <div className="mb-3 flex items-center gap-3">
            <BarraProgresso pct={pct} />
            <span className="shrink-0 text-sm tabular-nums">
              {comprados}/{doMes.length}
            </span>
          </div>
        )}

        {mesesAtras === 0 && (
          <form onSubmit={adicionar} className="mb-3 flex gap-2">
            <input
              value={novo}
              onChange={(e) => setNovo(e.target.value)}
              placeholder="Novo item…"
              className="min-w-0 flex-1 rounded-xl border border-borda bg-fundo px-3 py-2.5 outline-none focus:border-destaque"
            />
            <button className="rounded-xl bg-destaque px-3 text-slate-900" aria-label="Adicionar item">
              <Plus size={20} />
            </button>
          </form>
        )}

        {itens.carregando || checks.carregando ? (
          <p className="text-sm text-slate-500">Carregando…</p>
        ) : doMes.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-500">
            Cadastre os itens uma vez; a lista recomeça sozinha todo mês.
          </p>
        ) : (
          categorias.map((cat) => (
            <div key={cat} className="mt-2">
              <h3 className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">{cat}</h3>
              <ul>
                {grupos.get(cat)!.map((i) => {
                  const ok = Boolean(checkDe(i.id, mes))
                  return (
                    <li key={i.id} className="flex items-center gap-1">
                      <button
                        onClick={() => alternar(i)}
                        className="flex min-w-0 flex-1 items-center gap-3 rounded-xl py-2 text-left active:bg-borda/40"
                      >
                        {ok ? (
                          <CircleCheck size={22} className="shrink-0 text-destaque" />
                        ) : (
                          <Circle size={22} className="shrink-0 text-slate-500" />
                        )}
                        <span className={`flex-1 truncate ${ok ? 'text-slate-500 line-through' : ''}`}>{i.nome}</span>
                        {i.quantidade && <span className="text-xs text-slate-500">{i.quantidade}</span>}
                      </button>
                      <button
                        onClick={() => setEditando(i)}
                        className="p-2 text-slate-600 hover:text-slate-300"
                        aria-label={`Editar ${i.nome}`}
                      >
                        <Pencil size={15} />
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))
        )}
        {(itens.erro || checks.erro) && <p className="mt-2 text-sm text-red-300">{itens.erro || checks.erro}</p>}
      </section>

      <GraficoProgresso
        titulo="Lista comprada por mês"
        pontos={pontos}
        hoje={hoje}
        janelas={['mes']}
        complemento={(f, p) => `${f} de ${p} itens`}
      />

      {itens.linhas.some((i) => !i.ativo) && (
        <section>
          <h2 className="mb-2 px-1 text-sm text-slate-400">Itens pausados</h2>
          <div className="flex flex-wrap gap-2">
            {itens.linhas
              .filter((i) => !i.ativo)
              .map((i) => (
                <button
                  key={i.id}
                  onClick={() => setEditando(i)}
                  className="rounded-full border border-borda px-3 py-1 text-sm text-slate-400"
                >
                  {i.nome}
                </button>
              ))}
          </div>
        </section>
      )}

      {editando && (
        <EditorItem
          key={editando.id}
          titulo="Editar item"
          item={editando}
          categorias={[...new Set(itens.linhas.map((i) => i.categoria).filter((c): c is string => Boolean(c)))]}
          comQuantidade
          rotuloAtivo="Na lista (desmarque para pausar sem apagar)"
          onFechar={() => setEditando(null)}
          onSalvar={async (d) => {
            await itens.atualizar(editando.id, d)
          }}
          onExcluir={async () => {
            await itens.remover(editando.id)
            await checks.recarregar()
          }}
        />
      )}
    </div>
  )
}
