export default function BarraProgresso({ pct }: { pct: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-borda">
      <div className="h-full rounded-full bg-destaque transition-all" style={{ width: `${pct}%` }} />
    </div>
  )
}
