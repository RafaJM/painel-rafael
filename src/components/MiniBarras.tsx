import type { Barra } from '../lib/graficos'

/** Versão compacta do gráfico para os cartões da Home (sem interação). */
export default function MiniBarras({ barras }: { barras: Barra[] }) {
  return (
    <div className="flex h-10 items-end gap-[2px]" aria-hidden>
      {barras.map((b, i) => (
        <div key={b.chave} className="flex h-full flex-1 items-end border-b border-borda">
          {b.pct !== null && (
            <div
              className={`w-full rounded-t-[3px] ${i === barras.length - 1 ? 'bg-destaque' : 'bg-grafico'}`}
              style={{ height: `${Math.max(b.pct, 4)}%` }}
            />
          )}
        </div>
      ))}
    </div>
  )
}
