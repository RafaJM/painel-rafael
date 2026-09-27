import type { ReactNode } from 'react'
import { agrupar, type PontoDia } from '../lib/graficos'
import GraficoJanelas from './GraficoJanelas'

/**
 * Gráfico de % cumprido (feitos ÷ previstos), com janelas dia / semana / mês.
 * Reaproveitado por todos os módulos com checklist.
 */
export default function GraficoProgresso({
  titulo,
  subtitulo,
  pontos,
  hoje,
  extra,
  complemento = (feitos, previstos) => `${feitos} de ${previstos}`,
}: {
  titulo: string
  subtitulo?: string
  pontos: PontoDia[]
  hoje: string
  extra?: ReactNode
  complemento?: (feitos: number, previstos: number) => string
}) {
  return (
    <GraficoJanelas
      titulo={titulo}
      subtitulo={subtitulo}
      extra={extra}
      maximo={100}
      guias={[50, 100]}
      formatar={(v) => `${v}%`}
      calcular={(janela) =>
        agrupar(pontos, janela, hoje).map((b) => ({
          ...b,
          valor: b.pct,
          complemento: b.previstos ? complemento(b.feitos, b.previstos) : undefined,
        }))
      }
      resumo={(janela) => {
        const bs = agrupar(pontos, janela, hoje)
        const previstos = bs.reduce((s, b) => s + b.previstos, 0)
        const feitos = bs.reduce((s, b) => s + b.feitos, 0)
        if (!previstos) return null
        return (
          <>
            Média no período exibido: <span className="text-slate-200">{Math.round((feitos / previstos) * 100)}%</span>
          </>
        )
      }}
    />
  )
}
