import { useEffect, useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, Circle, CircleCheck, Plus } from 'lucide-react'
import { useTabela } from '../lib/useTabela'
import { useHoje } from '../lib/useHoje'
import { dataCurta, diaSemanaCurto, somarDias } from '../lib/datas'
import {
  compararHabitos,
  descreverDias,
  sincronizarRotina,
  useSerieRotina,
  type Habito,
  type RegistroHabito,
} from '../lib/rotina'
import BarraProgresso from '../components/BarraProgresso'
import GraficoProgresso from '../components/GraficoProgresso'
import EditorHabito from '../components/EditorHabito'

const MAX_DIAS_ATRAS = 30

export default function Rotina() {
  const hoje = useHoje()
  const [diasAtras, setDiasAtras] = useState(0)
  const dia = somarDias(hoje, -diasAtras)

  const habitos = useTabela<Habito>('habitos')
  const registros = useTabela<RegistroHabito>('habito_registros', { coluna: 'data', valor: dia })
  const [versao, setVersao] = useState(0)
  const serie = useSerieRotina(hoje, dia, registros.linhas, versao)
  const [editando, setEditando] = useState<Habito | 'novo' | null>(null)
  const [verCadastro, setVerCadastro] = useState(false)

  useEffect(() => {
    sincronizarRotina(hoje)
  }, [hoje])

  // Depois de mexer no cadastro: refaz o checklist de hoje e o gráfico
  async function aposMudarCadastro() {
    await sincronizarRotina(hoje)
    await registros.recarregar()
    setVersao((v) => v + 1)
  }

  const porId = new Map(habitos.linhas.map((h) => [h.id, h]))
  const checklist = registros.linhas
    .filter((r) => porId.has(r.habito_id))
    .sort((a, b) => compararHabitos(porId.get(a.habito_id)!, porId.get(b.habito_id)!))
  const feitos = checklist.filter((r) => r.feito).length
  const pct = checklist.length ? Math.round((feitos / checklist.length) * 100) : 0
  const categorias = [...new Set(habitos.linhas.map((h) => h.categoria))]
  const cadastro = habitos.linhas.slice().sort((a, b) => Number(b.ativo) - Number(a.ativo) || compararHabitos(a, b))

  const nomeDia =
    diasAtras === 0 ? 'Hoje' : diasAtras === 1 ? 'Ontem' : `${diaSemanaCurto(dia)} ${dataCurta(dia)}`

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold">Rotina Fixa</h1>
      </header>

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

        {checklist.length > 0 && (
          <div className="mb-3 flex items-center gap-3">
            <BarraProgresso pct={pct} />
            <span className="shrink-0 text-sm tabular-nums">
              {feitos}/{checklist.length}
            </span>
          </div>
        )}

        {registros.carregando || habitos.carregando ? (
          <p className="text-sm text-slate-500">Carregando…</p>
        ) : checklist.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-500">
            {habitos.linhas.length === 0
              ? 'Cadastre seus hábitos para gerar o checklist diário.'
              : 'Nenhum hábito previsto para este dia.'}
          </p>
        ) : (
          <ul className="-mx-1">
            {checklist.map((r) => {
              const h = porId.get(r.habito_id)!
              return (
                <li key={r.id}>
                  <button
                    onClick={() => registros.atualizar(r.id, { feito: !r.feito })}
                    className="flex w-full items-center gap-3 rounded-xl px-1 py-2 text-left active:bg-borda/40"
                  >
                    {r.feito ? (
                      <CircleCheck size={24} className="shrink-0 text-destaque" />
                    ) : (
                      <Circle size={24} className="shrink-0 text-slate-500" />
                    )}
                    <span className={`flex-1 ${r.feito ? 'text-slate-500 line-through' : ''}`}>{h.nome}</span>
                    <span className="text-xs text-slate-500">
                      {h.horario ? h.horario.slice(0, 5) : h.categoria}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
        {(registros.erro || habitos.erro) && (
          <p className="mt-2 text-sm text-red-300">{registros.erro || habitos.erro}</p>
        )}
      </section>

      <GraficoProgresso titulo="Conclusão da rotina" pontos={serie} hoje={hoje} />

      <section>
        <div className="mb-2 flex items-center justify-between">
          <button onClick={() => setVerCadastro((v) => !v)} className="flex items-center gap-1 text-sm text-slate-400">
            <ChevronDown size={16} className={verCadastro ? '' : '-rotate-90'} />
            Hábitos cadastrados ({habitos.linhas.length})
          </button>
          <button
            onClick={() => setEditando('novo')}
            className="flex items-center gap-1 rounded-full bg-destaque/15 px-3 py-1.5 text-sm text-destaque"
          >
            <Plus size={16} /> Novo hábito
          </button>
        </div>
        {verCadastro && habitos.linhas.length > 0 && (
          <div className="divide-y divide-borda overflow-hidden rounded-2xl border border-borda bg-cartao">
            {cadastro.map((h) => (
              <button
                key={h.id}
                onClick={() => setEditando(h)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left ${h.ativo ? '' : 'opacity-50'}`}
              >
                <div className="min-w-0 flex-1">
                  <div>{h.nome}</div>
                  <div className="mt-0.5 text-xs text-slate-400">
                    {h.categoria} · {descreverDias(h.dias_semana)}
                    {h.horario && ` · ${h.horario.slice(0, 5)}`}
                    {!h.ativo && ' · pausado'}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {editando && (
        <EditorHabito
          key={editando === 'novo' ? 'novo' : editando.id}
          habito={editando === 'novo' ? null : editando}
          categorias={categorias}
          onFechar={() => setEditando(null)}
          onSalvar={async (dados) => {
            if (editando === 'novo') await habitos.inserir(dados)
            else await habitos.atualizar(editando.id, dados)
            await aposMudarCadastro()
          }}
          onExcluir={
            editando === 'novo'
              ? undefined
              : async () => {
                  await habitos.remover(editando.id)
                  await aposMudarCadastro()
                }
          }
        />
      )}
    </div>
  )
}
