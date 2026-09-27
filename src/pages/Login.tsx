import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function entrar(e: FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setErro(null)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha })
    if (error) setErro('E-mail ou senha incorretos.')
    setEnviando(false)
  }

  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <form onSubmit={entrar} className="w-full max-w-sm space-y-4">
        <img src="/icon.svg" alt="" className="h-14 w-14" />
        <h1 className="text-2xl font-semibold">Painel Rafael</h1>
        <input
          type="email"
          autoComplete="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-borda bg-cartao px-4 py-3 outline-none focus:border-destaque"
          required
        />
        <input
          type="password"
          autoComplete="current-password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="w-full rounded-xl border border-borda bg-cartao px-4 py-3 outline-none focus:border-destaque"
          required
        />
        {erro && <p className="text-sm text-red-400">{erro}</p>}
        <button
          disabled={enviando}
          className="w-full rounded-xl bg-destaque py-3 font-semibold text-slate-900 disabled:opacity-60"
        >
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
