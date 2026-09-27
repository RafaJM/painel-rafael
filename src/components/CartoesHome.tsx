import { Link } from 'react-router-dom'
import { useTabela } from '../lib/useTabela'
import { inicioMes, nomeMes, somarDias } from '../lib/datas'
import { agrupar, agruparMedia } from '../lib/graficos'
import { formatarHoras, rotuloQualidade, type RegistroSono } from '../lib/sono'
import { periodoDe, pontosRecorrencia, type Erro, type RegistroErro } from '../lib/erros'
import { progresso, type Etapa, type Objetivo } from '../lib/objetivos'
import MiniBarras from './MiniBarras'
import BarraProgresso from './BarraProgresso'

const cartao = 'block rounded-2xl border border-borda bg-cartao p-4'

export function CartaoSono({ hoje }: { hoje: string }) {
  const { linhas } = useTabela<RegistroSono>('sono_registros', { coluna: 'data', valor: somarDias(hoje, -7), op: 'gte' })
  const deHoje = linhas.find((r) => r.data === hoje)
  const barras = agruparMedia(
    linhas.map((r) => ({ data: r.data, valor: Number(r.horas) })),
    'dia',
    hoje,
  ).slice(-7)

  return (
    <Link to="/sono" className={cartao}>
      <div className="mb-3 flex items-baseline justify-between">
        <span className="font-semibold">Sono</span>
        {deHoje ? (
          <span className="text-sm tabular-nums text-slate-300">
            {formatarHoras(Number(deHoje.horas))}
            {deHoje.qualidade && ` · ${rotuloQualidade(deHoje.qualidade)}`}
          </span>
        ) : (
          <span className="text-sm text-destaque">Registrar a noite →</span>
        )}
      </div>
      <MiniBarras barras={barras.map((b) => ({ chave: b.chave, valor: b.media }))} maximo={10} />
      <p className="mt-1.5 text-xs text-slate-500">Horas nos últimos 7 dias</p>
    </Link>
  )
}

export function CartaoErros({ hoje }: { hoje: string }) {
  const erros = useTabela<Erro>('erros')
  const registros = useTabela<RegistroErro>('erro_registros', {
    coluna: 'periodo',
    valor: somarDias(hoje, -7),
    op: 'gte',
  })
  const ativos = erros.linhas.filter((e) => e.ativo)
  const avaliados = ativos.filter((e) =>
    registros.linhas.some((r) => r.erro_id === e.id && r.periodo === periodoDe(e, hoje)),
  ).length
  const barras = agrupar(pontosRecorrencia(registros.linhas), 'dia', hoje).slice(-7)
  const total = barras.reduce((s, b) => s + b.previstos, 0)
  const errou = barras.reduce((s, b) => s + b.feitos, 0)

  return (
    <Link to="/erros" className={cartao}>
      <div className="mb-3 flex items-baseline justify-between">
        <span className="font-semibold">Erros a eliminar</span>
        {ativos.length > 0 && avaliados < ativos.length ? (
          <span className="text-sm text-destaque">
            Avaliar {ativos.length - avaliados} →
          </span>
        ) : (
          <span className="text-sm tabular-nums text-slate-300">
            {ativos.length ? `${avaliados}/${ativos.length} avaliados` : '—'}
          </span>
        )}
      </div>
      <MiniBarras barras={barras.map((b) => ({ chave: b.chave, valor: b.pct }))} />
      <p className="mt-1.5 text-xs text-slate-500">
        Recorrência 7 dias{total ? `: ${Math.round((errou / total) * 100)}%` : ''} · menor é melhor
      </p>
    </Link>
  )
}

interface ItemCompraResumo {
  id: string
  ativo: boolean
}

export function CartaoCompras({ hoje }: { hoje: string }) {
  const mes = inicioMes(hoje)
  const itens = useTabela<ItemCompraResumo>('compras_itens')
  const checks = useTabela<{ id: string; item_id: string }>('compras_checks', { coluna: 'mes', valor: mes })
  const ativos = itens.linhas.filter((i) => i.ativo)
  const comprados = ativos.filter((i) => checks.linhas.some((c) => c.item_id === i.id)).length
  const pct = ativos.length ? Math.round((comprados / ativos.length) * 100) : 0

  return (
    <Link to="/compras" className={cartao}>
      <div className="mb-3 flex items-baseline justify-between">
        <span className="font-semibold">Compras do mês</span>
        <span className="text-sm tabular-nums text-slate-300">
          {ativos.length ? `${comprados}/${ativos.length} · ${pct}%` : '—'}
        </span>
      </div>
      <BarraProgresso pct={pct} />
      <p className="mt-2 text-xs capitalize text-slate-500">{nomeMes(mes)}</p>
    </Link>
  )
}

export function CartaoObjetivos() {
  const objetivos = useTabela<Objetivo>('objetivos')
  const etapas = useTabela<Etapa>('objetivo_etapas')
  const ativos = objetivos.linhas
    .filter((o) => !o.arquivado)
    .map((o) => ({ o, p: progresso(etapas.linhas.filter((e) => e.objetivo_id === o.id)) }))
    .sort((a, b) => (a.o.prazo ?? '9999').localeCompare(b.o.prazo ?? '9999'))

  return (
    <Link to="/objetivos" className={cartao}>
      <div className="mb-3 flex items-baseline justify-between">
        <span className="font-semibold">Objetivos</span>
        <span className="text-sm text-slate-400">{ativos.length || '—'}</span>
      </div>
      {ativos.length === 0 ? (
        <p className="text-sm text-destaque">Criar um objetivo →</p>
      ) : (
        <ul className="space-y-2.5">
          {ativos.slice(0, 3).map(({ o, p }) => (
            <li key={o.id}>
              <div className="mb-1 flex justify-between gap-2 text-sm">
                <span className="truncate">{o.titulo}</span>
                <span className="shrink-0 tabular-nums text-slate-400">{p.pct}%</span>
              </div>
              <BarraProgresso pct={p.pct} />
            </li>
          ))}
        </ul>
      )}
      {ativos.length > 3 && <p className="mt-2 text-xs text-slate-500">+{ativos.length - 3} outros</p>}
    </Link>
  )
}

export function CartaoLifestyle({ hoje }: { hoje: string }) {
  const { linhas } = useTabela<{ id: string; data: string }>('lifestyle_registros', {
    coluna: 'data',
    valor: somarDias(hoje, -7),
    op: 'gte',
  })
  const barras = agruparMedia(
    linhas.map((r) => ({ data: r.data, valor: 1 })),
    'dia',
    hoje,
  ).slice(-7)
  const deHoje = barras[barras.length - 1].total

  return (
    <Link to="/lifestyle" className={cartao}>
      <div className="mb-3 flex items-baseline justify-between">
        <span className="font-semibold">Lifestyle</span>
        {deHoje ? (
          <span className="text-sm tabular-nums text-slate-300">
            {deHoje} {deHoje === 1 ? 'coisa boa' : 'coisas boas'} hoje
          </span>
        ) : (
          <span className="text-sm text-destaque">Registrar algo bom →</span>
        )}
      </div>
      <MiniBarras
        barras={barras.map((b) => ({ chave: b.chave, valor: b.total || null }))}
        maximo={Math.max(4, ...barras.map((b) => b.total))}
      />
      <p className="mt-1.5 text-xs text-slate-500">Registros nos últimos 7 dias</p>
    </Link>
  )
}
