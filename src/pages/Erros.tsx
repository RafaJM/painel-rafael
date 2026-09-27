import { useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useTabela } from '../lib/useTabela'
import { useHoje } from '../lib/useHoje'
import { dataCurta, diaSemanaCurto, inicioSemana, somarDias } from '../lib/datas'
import { periodoDe, pontosRecorrencia, type Erro, type RegistroErro } from '../lib/erros'
import GraficoProgresso from '../components/GraficoProgresso'
import EditorErro from '../components/EditorErro'

const MAX_DIAS_ATRAS = 30

export default function Erros() {
  const hoje = useHoje()
  const [diasAtras, setDiasAtras] = useState(0)
  const dia = somarDias(hoje, -diasAtras)

  const erros = useTabela<Erro>('erros')
  const registros = useTabela<RegistroErro>('erro_registros', {
    coluna: 'periodo',
    valor: somarDias(hoje, -400),
    op: 'gte',
  })
  const [editando, setEditando] = useState<Erro | 'novo' | null>(null)
  const [verCadastro, setVerCadastro] = useState(false)
  const [filtro, setFiltro] = useState<string | null>(null)

  const ativos = erros.linhas
    .filter((e) => e.ativo)
    .sort((a, b) => a.frequencia.localeCompare(b.frequencia) || a.nome.localeCompare(b.nome, 'pt-BR'))
  const registroDe = (e: Erro) =>
    registros.linhas.find((r) => r.erro_id === e.id && r.periodo === periodoDe(e, dia))
  const marcados = ativos.filter(registroDe)
  const evitados = marcados.filter((e) => !registroDe(e)!.errou).length

  async function marcar(e: Erro, errou: boolean) {
    const r = registroDe(e)
    if (!r) await registros.inserir({ erro_id: e.id, periodo: periodoDe(e, dia), errou })
    else if (r.errou === errou) await registros.remover(r.id) // tocar de novo desmarca
    else await registros.atualizar(r.id, { errou })
  }

  const nomeDia =
    diasAtras === 0 ? 'Hoje' : diasAtras === 1 ? 'Ontem' : `${diaSemanaCurto(dia)} ${dataCurta(dia)}`
  const cadastro = erros.linhas.slice().sort((a, b) => Number(b.ativo) - Number(a.ativo) || a.nome.localeCompare(b.nome))

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Erros a Eliminar</h1>

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
          <p className="mb-3 text-sm text-slate-400">
            {marcados.length} de {ativos.length} avaliados
            {marcados.length > 0 && ` · evitou ${evitados}`}
          </p>
        )}

        {erros.carregando || registros.carregando ? (
          <p className="text-sm text-slate-500">Carregando…</p>
        ) : ativos.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-500">Cadastre os comportamentos que quer eliminar.</p>
        ) : (
          <ul className="divide-y divide-borda">
            {ativos.map((e) => {
              const r = registroDe(e)
              return (
                <li key={e.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="leading-snug">{e.nome}</div>
                    {e.frequencia === 'semanal' && (
                      <div className="mt-0.5 text-xs text-slate-500">
                        Semana de {dataCurta(inicioSemana(dia))}
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <button
                      onClick={() => marcar(e, false)}
                      aria-pressed={r?.errou === false}
                      className={`rounded-lg px-3 py-1.5 text-sm ${
                        r?.errou === false ? 'bg-destaque text-slate-900' : 'border border-borda text-slate-400'
                      }`}
                    >
                      Evitei
                    </button>
                    <button
                      onClick={() => marcar(e, true)}
                      aria-pressed={r?.errou === true}
                      className={`rounded-lg px-3 py-1.5 text-sm ${
                        r?.errou === true ? 'bg-red-400 text-slate-900' : 'border border-borda text-slate-400'
                      }`}
                    >
                      Errei
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
        {(erros.erro || registros.erro) && <p className="mt-2 text-sm text-red-300">{erros.erro || registros.erro}</p>}
      </section>

      <GraficoProgresso
        titulo="Recorrência dos erros"
        subtitulo="% das avaliações em que errou — quanto menor, melhor"
        pontos={pontosRecorrencia(registros.linhas, filtro ?? undefined)}
        hoje={hoje}
        complemento={(errou, total) => `errou ${errou} de ${total}`}
        extra={
          erros.linhas.length > 1 && (
            <div className="-mx-1 mb-3 flex gap-1.5 overflow-x-auto px-1 pb-1 text-xs">
              {[{ id: null, nome: 'Todos' }, ...cadastro].map((e) => (
                <button
                  key={e.id ?? 'todos'}
                  onClick={() => setFiltro(e.id)}
                  className={`shrink-0 rounded-full px-3 py-1 ${
                    filtro === e.id ? 'bg-destaque/15 text-destaque' : 'border border-borda text-slate-400'
                  }`}
                >
                  {e.nome}
                </button>
              ))}
            </div>
          )
        }
      />

      <section>
        <div className="mb-2 flex items-center justify-between">
          <button onClick={() => setVerCadastro((v) => !v)} className="flex items-center gap-1 text-sm text-slate-400">
            <ChevronDown size={16} className={verCadastro ? '' : '-rotate-90'} />
            Cadastrados ({erros.linhas.length})
          </button>
          <button
            onClick={() => setEditando('novo')}
            className="flex items-center gap-1 rounded-full bg-destaque/15 px-3 py-1.5 text-sm text-destaque"
          >
            <Plus size={16} /> Novo erro
          </button>
        </div>
        {verCadastro && erros.linhas.length > 0 && (
          <div className="divide-y divide-borda overflow-hidden rounded-2xl border border-borda bg-cartao">
            {cadastro.map((e) => (
              <button
                key={e.id}
                onClick={() => setEditando(e)}
                className={`block w-full px-4 py-3 text-left ${e.ativo ? '' : 'opacity-50'}`}
              >
                <div>{e.nome}</div>
                <div className="mt-0.5 text-xs text-slate-400">
                  {e.frequencia === 'diaria' ? 'Todo dia' : 'Toda semana'}
                  {!e.ativo && ' · superado'}
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {editando && (
        <EditorErro
          key={editando === 'novo' ? 'novo' : editando.id}
          erro={editando === 'novo' ? null : editando}
          onFechar={() => setEditando(null)}
          onSalvar={async (d) => {
            if (editando === 'novo') await erros.inserir(d)
            else await erros.atualizar(editando.id, d)
          }}
          onExcluir={
            editando === 'novo'
              ? undefined
              : async () => {
                  await erros.remover(editando.id)
                  if (filtro === editando.id) setFiltro(null)
                  await registros.recarregar()
                }
          }
        />
      )}
    </div>
  )
}
