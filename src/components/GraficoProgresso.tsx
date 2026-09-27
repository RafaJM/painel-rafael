import { useMemo, useState } from 'react'
import { agrupar, JANELAS, type Janela, type PontoDia } from '../lib/graficos'

/**
 * Gráfico de barras de % cumprido, com janelas dia / semana / mês.
 * Reaproveitado por todos os módulos com checklist.
 */
export default function GraficoProgresso({
  titulo,
  pontos,
  hoje,
}: {
  titulo: string
  pontos: PontoDia[]
  hoje: string
}) {
  const [janela, setJanela] = useState<Janela>('dia')
  const [selecionada, setSelecionada] = useState<number | null>(null)
  const barras = useMemo(() => agrupar(pontos, janela, hoje), [pontos, janela, hoje])

  const iFoco = selecionada ?? barras.length - 1
  const foco = barras[iFoco]
  const previstos = barras.reduce((s, b) => s + b.previstos, 0)
  const feitos = barras.reduce((s, b) => s + b.feitos, 0)
  const media = previstos ? Math.round((feitos / previstos) * 100) : null
  const rotularAlternado = janela !== 'dia' || barras.length > 10

  return (
    <section className="rounded-2xl border border-borda bg-cartao p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-semibold">{titulo}</h2>
        <div className="flex rounded-full bg-fundo p-0.5 text-xs" role="tablist">
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

      {/* Leitura da barra em foco (a atual, ou a tocada) */}
      <div className="mb-3 flex items-baseline gap-2">
        <span className="text-3xl font-semibold tabular-nums">{foco.pct === null ? '—' : `${foco.pct}%`}</span>
        <span className="text-sm text-slate-400">
          {foco.detalhe}
          {foco.previstos > 0 && ` · ${foco.feitos} de ${foco.previstos}`}
        </span>
      </div>

      <div className="relative h-32" onMouseLeave={() => setSelecionada(null)}>
        {[100, 50].map((v) => (
          <div key={v} className="absolute inset-x-0 border-t border-dashed border-borda" style={{ bottom: `${v}%` }}>
            <span className="absolute -top-2 right-0 bg-cartao pl-1 text-[10px] leading-none text-slate-500">
              {v}%
            </span>
          </div>
        ))}
        <div className="absolute inset-x-0 bottom-0 border-t border-borda" />
        <div className="absolute inset-0 right-7 flex items-end gap-[2px]">
          {barras.map((b, i) => (
            <button
              key={b.chave}
              onMouseEnter={() => setSelecionada(i)}
              onClick={() => setSelecionada(selecionada === i ? null : i)}
              className="flex h-full flex-1 items-end justify-center"
              aria-label={`${b.detalhe}: ${b.pct === null ? 'nada previsto' : `${b.pct}%, ${b.feitos} de ${b.previstos}`}`}
            >
              {b.pct !== null && (
                <div
                  className={`w-full max-w-7 rounded-t-[4px] transition-[height] ${
                    i === iFoco ? 'bg-destaque' : 'bg-grafico'
                  }`}
                  style={{ height: `${Math.max(b.pct, 2)}%` }}
                />
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-1.5 mr-7 flex gap-[2px] text-[10px] text-slate-500">
        {barras.map((b, i) => (
          <span key={b.chave} className={`flex-1 text-center ${i === iFoco ? 'text-slate-200' : ''}`}>
            {!rotularAlternado || (barras.length - 1 - i) % 2 === 0 || i === iFoco ? b.rotulo : ''}
          </span>
        ))}
      </div>

      {media !== null && (
        <p className="mt-3 text-xs text-slate-400">
          Média no período exibido: <span className="text-slate-200">{media}%</span>
        </p>
      )}
    </section>
  )
}
