import { Link } from 'react-router-dom'
import { CalendarDays, ChevronRight, LogOut } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { MODULOS } from '../modulos'

export default function Mais() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Módulos</h1>
      <div className="divide-y divide-borda overflow-hidden rounded-2xl border border-borda bg-cartao">
        {MODULOS.slice(4).map((m) => (
          <Link key={m.rota} to={m.rota} className="flex items-center gap-3 px-4 py-3.5">
            <m.icone size={20} className="text-slate-400" />
            <span className="flex-1">{m.nome}</span>
            {!m.pronto && <span className="text-xs text-slate-500">em breve</span>}
            <ChevronRight size={18} className="text-slate-600" />
          </Link>
        ))}
      </div>
      <h2 className="mt-6 mb-2 px-1 text-sm text-slate-500">Configurações</h2>
      <div className="overflow-hidden rounded-2xl border border-borda bg-cartao">
        <Link to="/agendas" className="flex items-center gap-3 px-4 py-3.5">
          <CalendarDays size={20} className="text-slate-400" />
          <span className="flex-1">Agendas</span>
          <ChevronRight size={18} className="text-slate-600" />
        </Link>
      </div>
      <button
        onClick={() => supabase.auth.signOut()}
        className="mt-6 flex items-center gap-2 px-1 text-sm text-slate-500"
      >
        <LogOut size={16} /> Sair
      </button>
    </div>
  )
}
