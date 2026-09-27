import { Link } from 'react-router-dom'
import { useTabela } from '../lib/useTabela'
import { somarDias } from '../lib/datas'
import { agrupar, agruparMedia } from '../lib/graficos'
import { formatarHoras, rotuloQualidade, type RegistroSono } from '../lib/sono'
import { periodoDe, pontosRecorrencia, type Erro, type RegistroErro } from '../lib/erros'
import MiniBarras from './MiniBarras'

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
