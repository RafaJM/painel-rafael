import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, CircleCheck, Circle } from 'lucide-react'
import { useTabela } from '../lib/useTabela'
import { useHoje } from '../lib/useHoje'
import { dataPorExtenso, diaDe, prazoRelativo, saudacao } from '../lib/datas'
import { agrupar } from '../lib/graficos'
import { sincronizarRotina, useSerieRotina, type RegistroHabito } from '../lib/rotina'
import MiniBarras from '../components/MiniBarras'
import { PAINEIS, prioridadesDoDia, resumo, type ItemPrioridade, type Tarefa } from '../lib/tarefas'
import BarraProgresso from '../components/BarraProgresso'

const LIMITE_PRIORIDADES = 3

export default function Home() {
  // Ordem fixa: uma fonte por painel
  const fontes = [
    useTabela<Tarefa>('trabalho_tarefas'),
    useTabela<Tarefa>('pessoal_tarefas'),
    useTabela<Tarefa>('estudos_tarefas'),
  ]
  const hoje = useHoje()
  const registrosHoje = useTabela<RegistroHabito>('habito_registros', { coluna: 'data', valor: hoje })
  const serieRotina = useSerieRotina(hoje, hoje, registrosHoje.linhas)
  const rotina7 = agrupar(serieRotina, 'dia', hoje).slice(-7)
  const rotinaHoje = rotina7[rotina7.length - 1]

  useEffect(() => {
    sincronizarRotina(hoje)
  }, [hoje])

  const itens: ItemPrioridade[] = PAINEIS.flatMap((painel, i) =>
    fontes[i].linhas.map((tarefa) => ({ painel, tarefa })),
  )
  const pendentes = prioridadesDoDia(itens, hoje)
  const doDia = pendentes.slice(0, LIMITE_PRIORIDADES)
  const feitasHoje = itens.filter(
    ({ tarefa: t }) =>
      t.status === 'feito' && t.destaque_em && t.destaque_em <= hoje && t.concluida_em && diaDe(t.concluida_em) === hoje,
  )

  function concluir({ painel, tarefa }: ItemPrioridade, feito: boolean) {
    const i = PAINEIS.indexOf(painel)
    fontes[i].atualizar(tarefa.id, { status: feito ? 'feito' : 'pendente' })
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm capitalize text-slate-400">{dataPorExtenso(hoje)}</p>
        <h1 className="text-2xl font-semibold">{saudacao()}, Rafael</h1>
      </header>

      <section className="rounded-2xl border border-borda bg-cartao p-4">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-semibold">Prioridades do dia</h2>
          {feitasHoje.length > 0 && (
            <span className="text-xs text-destaque">{feitasHoje.length} feitas hoje</span>
          )}
        </div>
        {doDia.length === 0 && feitasHoje.length === 0 ? (
          <p className="text-sm text-slate-500">
            Nenhuma prioridade para hoje. Marque ★ nas tarefas dos painéis.
          </p>
        ) : (
          <ul className="space-y-1">
            {doDia.map((item) => (
              <li key={item.tarefa.id} className="flex items-start gap-3 py-1.5">
                <button onClick={() => concluir(item, true)} className="-m-1 p-1" aria-label="Concluir">
                  <Circle size={22} className="text-slate-500" />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="leading-snug">{item.tarefa.titulo}</div>
                  <div className="mt-0.5 text-xs text-slate-400">
                    {item.painel.curto}
                    {item.tarefa.prazo && ` · prazo ${prazoRelativo(item.tarefa.prazo)}`}
                  </div>
                </div>
              </li>
            ))}
            {feitasHoje.map((item) => (
              <li key={item.tarefa.id} className="flex items-start gap-3 py-1.5">
                <button onClick={() => concluir(item, false)} className="-m-1 p-1" aria-label="Desfazer">
                  <CircleCheck size={22} className="text-destaque" />
                </button>
                <div className="flex-1 leading-snug text-slate-500 line-through">{item.tarefa.titulo}</div>
              </li>
            ))}
          </ul>
        )}
        {pendentes.length > LIMITE_PRIORIDADES && (
          <p className="mt-2 text-xs text-slate-500">
            +{pendentes.length - LIMITE_PRIORIDADES} outras marcadas com ★ aguardando
          </p>
        )}
      </section>

      <Link to="/rotina" className="block rounded-2xl border border-borda bg-cartao p-4">
        <div className="mb-3 flex items-baseline justify-between">
          <span className="font-semibold">Rotina de hoje</span>
          <span className="text-sm tabular-nums text-slate-300">
            {rotinaHoje.pct === null ? '—' : `${rotinaHoje.feitos}/${rotinaHoje.previstos} · ${rotinaHoje.pct}%`}
          </span>
        </div>
        <MiniBarras barras={rotina7} />
        <p className="mt-1.5 text-xs text-slate-500">Últimos 7 dias</p>
      </Link>

      <section className="rounded-2xl border border-dashed border-borda p-4 text-sm text-slate-500">
        <div className="flex items-center gap-2">
          <CalendarDays size={18} /> Agenda do dia — chega na etapa 4
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {PAINEIS.map((painel, i) => {
          const r = resumo(fontes[i].linhas, hoje)
          return (
            <Link key={painel.tabela} to={painel.rota} className="rounded-2xl border border-borda bg-cartao p-4">
              <div className="mb-2 flex items-baseline justify-between">
                <span className="font-medium">{painel.curto}</span>
                <span className="text-sm tabular-nums text-slate-300">{r.pct}%</span>
              </div>
              <BarraProgresso pct={r.pct} />
              <p className="mt-2 text-xs text-slate-400">
                {r.pendentes} pendentes
                {r.atrasadas > 0 && <span className="text-red-400"> · {r.atrasadas} atrasadas</span>}
              </p>
            </Link>
          )
        })}
      </section>
    </div>
  )
}
