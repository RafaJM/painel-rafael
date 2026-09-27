import { useState, type FormEvent } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, Circle, CircleCheck, Plus, X } from 'lucide-react'
import { useTabela } from '../lib/useTabela'
import { useHoje } from '../lib/useHoje'
import { dataCurta, diaSemanaCurto, somarDias } from '../lib/datas'
import { agruparMedia } from '../lib/graficos'
import BarraProgresso from '../components/BarraProgresso'
import GraficoJanelas from '../components/GraficoJanelas'
import EditorItem from '../components/EditorItem'

export interface ItemLifestyle {
  id: string
  nome: string
  categoria: string | null
  ativo: boolean
}

export interface RegistroLifestyle {
  id: string
  data: string
  item_id: string | null
  texto: string | null
  created_at: string
}

const MAX_DIAS_ATRAS = 30

export default function Lifestyle() {
  const hoje = useHoje()
  const [diasAtras, setDiasAtras] = useState(0)
  const dia = somarDias(hoje, -diasAtras)

  const itens = useTabela<ItemLifestyle>('lifestyle_itens')
  const registros = useTabela<RegistroLifestyle>('lifestyle_registros', {
    coluna: 'data',
    valor: somarDias(hoje, -400),
    op: 'gte',
  })
  const [momento, setMomento] = useState('')
  const [editando, setEditando] = useState<ItemLifestyle | 'novo' | null>(null)
  const [verCadastro, setVerCadastro] = useState(false)

  const doDia = registros.linhas.filter((r) => r.data === dia)
  const registroDoItem = (itemId: string) => doDia.find((r) => r.item_id === itemId)
  const ativos = itens.linhas.filter((i) => i.ativo).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  const marcados = ativos.filter((i) => registroDoItem(i.id)).length
  const momentos = doDia.filter((r) => !r.item_id).sort((a, b) => a.created_at.localeCompare(b.created_at))
  const pontos = registros.linhas.map((r) => ({ data: r.data, valor: 1 }))

  async function alternar(item: ItemLifestyle) {
    const r = registroDoItem(item.id)
    if (r) await registros.remover(r.id)
    else await registros.inserir({ data: dia, item_id: item.id })
  }

  async function registrarMomento(e: FormEvent) {
    e.preventDefault()
    const texto = momento.trim()
    if (!texto) return
    setMomento('')
    await registros.inserir({ data: dia, texto })
  }

  const nomeDia =
    diasAtras === 0 ? 'Hoje' : diasAtras === 1 ? 'Ontem' : `${diaSemanaCurto(dia)} ${dataCurta(dia)}`

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Lifestyle</h1>

      <section className="rounded-2xl border border-borda bg-cartao p-4">
        <div className="mb-3 flex items-center justify-between">
          <button
            onClick={() => setDiasAtras((d) => Math.min(d + 1, MAX_DIAS_ATRAS))}
            className="-m-1 p-1 text-slate-400"
            aria-label="Dia anterior"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="font-semibold">{nomeDia}</span>
          <button
            onClick={() => setDiasAtras((d) => Math.max(d - 1, 0))}
            disabled={diasAtras === 0}
            className="-m-1 p-1 text-slate-400 disabled:opacity-20"
            aria-label="Próximo dia"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {ativos.length > 0 && (
          <>
            <div className="mb-2 flex items-center gap-3">
              <BarraProgresso pct={Math.round((marcados / ativos.length) * 100)} />
              <span className="shrink-0 text-sm tabular-nums">
                {marcados}/{ativos.length}
              </span>
            </div>
            <ul className="-mx-1 mb-4">
              {ativos.map((i) => {
                const ok = Boolean(registroDoItem(i.id))
                return (
                  <li key={i.id}>
                    <button
                      onClick={() => alternar(i)}
                      className="flex w-full items-center gap-3 rounded-xl px-1 py-2 text-left active:bg-borda/40"
                    >
                      {ok ? (
                        <CircleCheck size={22} className="shrink-0 text-destaque" />
                      ) : (
                        <Circle size={22} className="shrink-0 text-slate-500" />
                      )}
                      <span className="flex-1">{i.nome}</span>
                      {i.categoria && <span className="text-xs text-slate-500">{i.categoria}</span>}
                    </button>
                  </li>
                )
              })}
            </ul>
          </>
        )}

        <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Momentos bons</h3>
        {momentos.length > 0 && (
          <ul className="mb-3 space-y-1.5">
            {momentos.map((m) => (
              <li key={m.id} className="flex items-start gap-2 rounded-xl bg-fundo px-3 py-2 text-sm">
                <span className="flex-1 leading-snug">{m.texto}</span>
                <button
                  onClick={() => registros.remover(m.id)}
                  className="-m-1 p-1 text-slate-600 hover:text-red-300"
                  aria-label="Apagar momento"
                >
                  <X size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={registrarMomento} className="flex gap-2">
          <input
            value={momento}
            onChange={(e) => setMomento(e.target.value)}
            placeholder="Algo bom que aconteceu…"
            className="min-w-0 flex-1 rounded-xl border border-borda bg-fundo px-3 py-2.5 outline-none focus:border-destaque"
          />
          <button className="rounded-xl bg-destaque px-3 text-slate-900" aria-label="Registrar momento">
            <Plus size={20} />
          </button>
        </form>
        {(itens.erro || registros.erro) && <p className="mt-2 text-sm text-red-300">{itens.erro || registros.erro}</p>}
      </section>

      <GraficoJanelas
        titulo="Frequência de coisas boas"
        subtitulo="itens marcados + momentos registrados"
        maximo={(barras) => Math.max(4, ...barras.map((b) => b.valor ?? 0))}
        guias={[]}
        formatar={(v) => String(Math.round(v))}
        calcular={(janela) =>
          agruparMedia(pontos, janela, hoje).map((b) => ({
            ...b,
            valor: b.total || null,
            complemento: b.total ? (b.total === 1 ? 'registro' : 'registros') : undefined,
          }))
        }
        resumo={(_j, barras) => {
          const total = barras.reduce((s, b) => s + (b.valor ?? 0), 0)
          return total ? (
            <>
              Total no período exibido: <span className="text-slate-200">{total}</span>
            </>
          ) : null
        }}
      />

      <section>
        <div className="mb-2 flex items-center justify-between">
          <button onClick={() => setVerCadastro((v) => !v)} className="flex items-center gap-1 text-sm text-slate-400">
            <ChevronDown size={16} className={verCadastro ? '' : '-rotate-90'} />
            Itens do checklist ({itens.linhas.length})
          </button>
          <button
            onClick={() => setEditando('novo')}
            className="flex items-center gap-1 rounded-full bg-destaque/15 px-3 py-1.5 text-sm text-destaque"
          >
            <Plus size={16} /> Novo item
          </button>
        </div>
        {verCadastro && itens.linhas.length > 0 && (
          <div className="divide-y divide-borda overflow-hidden rounded-2xl border border-borda bg-cartao">
            {itens.linhas.map((i) => (
              <button
                key={i.id}
                onClick={() => setEditando(i)}
                className={`block w-full px-4 py-3 text-left ${i.ativo ? '' : 'opacity-50'}`}
              >
                {i.nome}
                {i.categoria && <span className="ml-2 text-xs text-slate-500">{i.categoria}</span>}
              </button>
            ))}
          </div>
        )}
      </section>

      {editando && (
        <EditorItem
          key={editando === 'novo' ? 'novo' : editando.id}
          titulo={editando === 'novo' ? 'Novo item' : 'Editar item'}
          item={editando === 'novo' ? null : editando}
          categorias={[...new Set(itens.linhas.map((i) => i.categoria).filter((c): c is string => Boolean(c)))]}
          rotuloAtivo="Ativo no checklist"
          onFechar={() => setEditando(null)}
          onSalvar={async (d) => {
            if (editando === 'novo') await itens.inserir(d)
            else await itens.atualizar(editando.id, d)
          }}
          onExcluir={
            editando === 'novo'
              ? undefined
              : async () => {
                  await itens.remover(editando.id)
                  await registros.recarregar()
                }
          }
        />
      )}
    </div>
  )
}
