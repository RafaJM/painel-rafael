export default function EmBreve({ nome }: { nome: string }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold">{nome}</h1>
      <p className="mt-2 text-slate-400">Este módulo chega nas próximas etapas.</p>
    </div>
  )
}
