import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'

type ComId = { id: string }

function mesclar<T extends ComId>(linhas: T[], nova: T): T[] {
  const i = linhas.findIndex((l) => l.id === nova.id)
  if (i === -1) return [...linhas, nova]
  const copia = linhas.slice()
  copia[i] = nova
  return copia
}

/**
 * Carrega uma tabela inteira e a mantém sincronizada em tempo real
 * (Supabase Realtime). Também recarrega ao reconectar e quando o app
 * volta para o primeiro plano, que é quando o celular costuma perder o socket.
 */
export function useTabela<T extends ComId>(
  tabela: string,
  filtro?: { coluna: string; valor: string; op?: 'eq' | 'gte' },
) {
  const [linhas, setLinhas] = useState<T[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const coluna = filtro?.coluna
  const valor = filtro?.valor
  const op = filtro?.op ?? 'eq'

  const recarregar = useCallback(async () => {
    let consulta = supabase.from(tabela).select('*')
    if (coluna && valor !== undefined) consulta = consulta[op](coluna, valor)
    const { data, error } = await consulta
    if (error) setErro(error.message)
    else {
      setErro(null)
      setLinhas(data as T[])
    }
    setCarregando(false)
  }, [tabela, coluna, valor, op])

  useEffect(() => {
    setCarregando(true)
    recarregar()
    const canal = supabase
      .channel(`${tabela}-${crypto.randomUUID()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tabela,
          ...(coluna && valor !== undefined ? { filter: `${coluna}=${op}.${valor}` } : {}),
        },
        (p) => {
        if (p.eventType === 'DELETE') {
          const id = (p.old as ComId).id
          setLinhas((ls) => ls.filter((l) => l.id !== id))
        } else {
          setLinhas((ls) => mesclar(ls, p.new as T))
        }
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') recarregar()
      })

    const aoVoltar = () => {
      if (document.visibilityState === 'visible') recarregar()
    }
    document.addEventListener('visibilitychange', aoVoltar)
    return () => {
      supabase.removeChannel(canal)
      document.removeEventListener('visibilitychange', aoVoltar)
    }
  }, [tabela, coluna, valor, op, recarregar])

  const inserir = useCallback(
    async (dados: Partial<T>) => {
      const { data, error } = await supabase
        .from(tabela)
        .insert(dados as Record<string, unknown>)
        .select()
        .single()
      if (error) {
        setErro(error.message)
        return null
      }
      setLinhas((ls) => mesclar(ls, data as T))
      return data as T
    },
    [tabela],
  )

  const atualizar = useCallback(
    async (id: string, dados: Partial<T>) => {
      // Aplica na hora para a interface responder sem esperar a rede
      setLinhas((ls) => ls.map((l) => (l.id === id ? { ...l, ...dados } : l)))
      const { data, error } = await supabase
        .from(tabela)
        .update(dados as Record<string, unknown>)
        .eq('id', id)
        .select()
        .single()
      if (error) {
        setErro(error.message)
        recarregar()
        return null
      }
      setLinhas((ls) => mesclar(ls, data as T))
      return data as T
    },
    [tabela, recarregar],
  )

  const remover = useCallback(
    async (id: string) => {
      setLinhas((ls) => ls.filter((l) => l.id !== id))
      const { error } = await supabase.from(tabela).delete().eq('id', id)
      if (error) {
        setErro(error.message)
        recarregar()
      }
    },
    [tabela, recarregar],
  )

  return { linhas, carregando, erro, recarregar, inserir, atualizar, remover }
}
