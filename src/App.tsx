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
import Rotina from './pages/Rotina'
import Agendas from './pages/Agendas'
import Sono from './pages/Sono'
import Erros from './pages/Erros'
import Compras from './pages/Compras'
import Objetivos from './pages/Objetivos'
import ObjetivoDetalhe from './pages/ObjetivoDetalhe'
import Lifestyle from './pages/Lifestyle'

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
          <Route path="/rotina" element={<Rotina />} />
          <Route path="/agendas" element={<Agendas />} />
          <Route path="/sono" element={<Sono />} />
          <Route path="/erros" element={<Erros />} />
          <Route path="/compras" element={<Compras />} />
          <Route path="/objetivos" element={<Objetivos />} />
          <Route path="/objetivos/:id" element={<ObjetivoDetalhe />} />
          <Route path="/lifestyle" element={<Lifestyle />} />
          <Route path="/mais" element={<Mais />} />
          <Route path="*" element={<Home />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
