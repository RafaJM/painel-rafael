import { useEffect, useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { configurado, supabase } from './lib/supabase'
import { PAINEIS } from './lib/tarefas'
import { MODULOS } from './modulos'
import Layout from './components/Layout'
import Login from './pages/Login'
import Home from './pages/Home'
import PainelTarefas from './pages/PainelTarefas'
import Mais from './pages/Mais'
import EmBreve from './pages/EmBreve'

export default function App() {
  const [sessao, setSessao] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    if (!configurado) return
    supabase.auth.getSession().then(({ data }) => setSessao(data.session))
    const { data } = supabase.auth.onAuthStateChange((_evento, s) => setSessao(s))
    return () => data.subscription.unsubscribe()
  }, [])

  if (!configurado) {
    return (
      <div className="p-6 text-sm text-slate-300">
        Faltam as variáveis <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_KEY</code> (veja o
        SETUP.md).
      </div>
    )
  }
  if (sessao === undefined) return <div className="min-h-dvh" />
  if (!sessao) return <Login />

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          {PAINEIS.map((p) => (
            <Route key={p.tabela} path={p.rota} element={<PainelTarefas key={p.tabela} painel={p} />} />
          ))}
          {MODULOS.filter((m) => !m.pronto).map((m) => (
            <Route key={m.rota} path={m.rota} element={<EmBreve nome={m.nome} />} />
          ))}
          <Route path="/mais" element={<Mais />} />
          <Route path="*" element={<Home />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
