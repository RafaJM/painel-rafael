import { NavLink, Outlet } from 'react-router-dom'
import { LayoutGrid, LogOut } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { MODULOS } from '../modulos'

const NAV_CELULAR = MODULOS.slice(0, 4)

export default function Layout() {
  return (
    <div className="min-h-dvh md:flex">
      {/* Computador: barra lateral com todos os módulos */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-0.5 border-r border-borda p-3 md:flex">
        <div className="px-3 py-3 text-sm font-semibold tracking-wide text-slate-400">PAINEL RAFAEL</div>
        {MODULOS.map((m) => (
          <NavLink
            key={m.rota}
            to={m.rota}
            end={m.rota === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                isActive ? 'bg-cartao text-white' : 'text-slate-400 hover:text-slate-200'
              } ${m.pronto ? '' : 'opacity-50'}`
            }
          >
            <m.icone size={18} />
            {m.nome}
          </NavLink>
        ))}
        <button
          onClick={() => supabase.auth.signOut()}
          className="mt-auto flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-500 hover:text-slate-300"
        >
          <LogOut size={18} /> Sair
        </button>
      </aside>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-[calc(env(safe-area-inset-top)+1.25rem)] pb-[calc(env(safe-area-inset-bottom)+6rem)] md:pb-10">
        <Outlet />
      </main>

      {/* Celular: barra inferior */}
      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-borda bg-fundo/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        {[...NAV_CELULAR, { rota: '/mais', nome: 'Mais', icone: LayoutGrid }].map((m) => (
          <NavLink
            key={m.rota}
            to={m.rota}
            end={m.rota === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-2.5 text-[11px] ${
                isActive ? 'text-destaque' : 'text-slate-500'
              }`
            }
          >
            <m.icone size={22} />
            {m.nome.split(' ')[0]}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
