import { useState, type ReactNode } from 'react'
import { JANELAS, type Janela } from '../lib/graficos'

export interface BarraGrafico {
  chave: string
  rotulo: string // eixo x
  detalhe: string // nome do período na leitura
  valor: number | null // null = sem dados no período
  complemento?: string // ex.: "3 de 5", "4 noites"
}

/**
 * Gráfico de barras com seletor de janela (dia / semana / mês).
 * A leitura no topo mostra a barra atual, ou a tocada.
 */
export default function GraficoJanelas({
  titulo,
  subtitulo,
  calcular,
  maximo,
  guias,
  formatar,
  resumo,
  extra,
}: {
  titulo: string
  subtitulo?: string
  calcular: (janela: Janela) => BarraGrafico[]
  maximo: number
  guias: number[]
  formatar: (valor: number) => string
  resumo?: (janela: Janela, barras: BarraGrafico[]) => ReactNode
  extra?: ReactNode
}) {
  const [janela, setJanela] = useState<Janela>('dia')
  const [selecionada, setSelecionada] = useState<number | null>(null)
  const barras = calcular(janela)

  const iFoco = selecionada ?? barras.length - 1
  const foco = barras[iFoco]
  const rotularAlternado = janela !== 'dia' || barras.length > 10
  const altura = (v: number) => `${Math.min(Math.max((v / maximo) * 100, 2), 100)}%`

  return (
    <section className="rounded-2xl border border-borda bg-cartao p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">{titulo}</h2>
          {subtitulo && <p className="text-xs text-slate-500">{subtitulo}</p>}
        </div>
        <div className="flex shrink-0 rounded-full bg-fundo p-0.5 text-xs" role="tablist">
          {JANELAS.map((j) => (
            <button
              key={j.valor}
              role="tab"
              aria-selected={janela === j.valor}
              onClick={() => {
                setJanela(j.valor)
                setSelecionada(null)
              }}
              className={`rounded-full px-3 py-1 ${janela === j.valor ? 'bg-borda text-white' : 'text-slate-400'}`}
            >
              {j.rotulo}
            </button>
          ))}
        </div>
      </div>

      {extra}

      <div className="mb-3 flex items-baseline gap-2">
        <span className="text-3xl font-semibold tabular-nums">
          {foco.valor === null ? '—' : formatar(foco.valor)}
        </span>
        <span className="text-sm text-slate-400">
          {foco.detalhe}
          {foco.complemento && ` · ${foco.complemento}`}
        </span>
      </div>

      <div className="relative h-32" onMouseLeave={() => setSelecionada(null)}>
        {guias.map((v) => (
          <div
            key={v}
            className="absolute inset-x-0 border-t border-dashed border-borda"
            style={{ bottom: `${(v / maximo) * 100}%` }}
          >
            <span className="absolute -top-2 right-0 bg-cartao pl-1 text-[10px] leading-none text-slate-500">
              {formatar(v)}
            </span>
          </div>
        ))}
        <div className="absolute inset-x-0 bottom-0 border-t border-borda" />
        <div className="absolute inset-0 right-8 flex items-end gap-[2px]">
          {barras.map((b, i) => (
            <button
              key={b.chave}
              onMouseEnter={() => setSelecionada(i)}
              onClick={() => setSelecionada(selecionada === i ? null : i)}
              className="flex h-full flex-1 items-end justify-center"
              aria-label={`${b.detalhe}: ${b.valor === null ? 'sem dados' : formatar(b.valor)}${
                b.complemento ? `, ${b.complemento}` : ''
              }`}
            >
              {b.valor !== null && (
                <div
                  className={`w-full max-w-7 rounded-t-[4px] transition-[height] ${
                    i === iFoco ? 'bg-destaque' : 'bg-grafico'
                  }`}
                  style={{ height: altura(b.valor) }}
                />
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-1.5 mr-8 flex gap-[2px] text-[10px] text-slate-500">
        {barras.map((b, i) => (
          <span key={b.chave} className={`flex-1 text-center ${i === iFoco ? 'text-slate-200' : ''}`}>
            {!rotularAlternado || (barras.length - 1 - i) % 2 === 0 || i === iFoco ? b.rotulo : ''}
          </span>
        ))}
      </div>

      {resumo && <div className="mt-3 text-xs text-slate-400">{resumo(janela, barras)}</div>}
    </section>
  )
}
