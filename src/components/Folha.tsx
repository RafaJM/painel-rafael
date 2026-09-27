import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

/** Painel modal: sobe de baixo no celular, centralizado no computador. */
export default function Folha({
  titulo,
  onFechar,
  children,
}: {
  titulo: string
  onFechar: () => void
  children: ReactNode
}) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onFechar()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onFechar])

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 md:items-center" onClick={onFechar}>
      <div
        className="max-h-[90dvh] w-full overflow-y-auto rounded-t-2xl border border-borda bg-cartao p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] md:max-w-md md:rounded-2xl md:pb-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{titulo}</h2>
          <button onClick={onFechar} className="rounded-lg p-1 text-slate-400 hover:text-white" aria-label="Fechar">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
