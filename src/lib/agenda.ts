import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'
import type { Evento } from '../../api/_lib/ical'

export type { Evento }

export interface Agenda {
  id: string
  nome: string
  ical_url: string
  cor: string
  ativa: boolean
}

export const CORES_AGENDA = ['#2dd4bf', '#60a5fa', '#f472b6', '#fbbf24', '#a78bfa']

const ATUALIZAR_A_CADA = 10 * 60_000

/** Eventos do dia vindos de /api/agenda (função de servidor na Vercel). */
export function useEventosDoDia(dia: string) {
  const [eventos, setEventos] = useState<Evento[]>([])
  const [falhas, setFalhas] = useState<string[]>([])
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) return
    try {
      const resp = await fetch(`/api/agenda?dia=${dia}`, { headers: { Authorization: `Bearer ${token}` } })
      const corpo = await resp.json()
      if (!resp.ok) throw new Error(corpo.erro ?? `HTTP ${resp.status}`)
      setEventos(corpo.eventos)
      setFalhas(corpo.falhas)
      setErro(null)
    } catch (e) {
      setErro(import.meta.env.DEV ? 'A agenda só funciona no endereço publicado (Vercel).' : String(e))
    } finally {
      setCarregando(false)
    }
  }, [dia])

  useEffect(() => {
    carregar()
    const relogio = setInterval(carregar, ATUALIZAR_A_CADA)
    const aoVoltar = () => document.visibilityState === 'visible' && carregar()
    document.addEventListener('visibilitychange', aoVoltar)
    return () => {
      clearInterval(relogio)
      document.removeEventListener('visibilitychange', aoVoltar)
    }
  }, [carregar])

  return { eventos, falhas, erro, carregando, recarregar: carregar }
}

export function horaSP(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }).format(
    new Date(iso),
  )
}
