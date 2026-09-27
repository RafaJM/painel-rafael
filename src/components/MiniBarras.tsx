/** Versão compacta do gráfico para os cartões da Home (sem interação). */
export default function MiniBarras({
  barras,
  maximo = 100,
}: {
  barras: { chave: string; valor: number | null }[]
  maximo?: number
}) {
  return (
    <div className="flex h-10 items-end gap-[2px]" aria-hidden>
      {barras.map((b, i) => (
        <div key={b.chave} className="flex h-full flex-1 items-end border-b border-borda">
          {b.valor !== null && (
            <div
              className={`w-full rounded-t-[3px] ${i === barras.length - 1 ? 'bg-destaque' : 'bg-grafico'}`}
              style={{ height: `${Math.min(Math.max((b.valor / maximo) * 100, 4), 100)}%` }}
            />
          )}
        </div>
      ))}
    </div>
  )
}
