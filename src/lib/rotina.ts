import { useEffect, useMemo, useState } from 'react'
import { supabase } from './supabase'
import { somarDias } from './datas'
import type { PontoDia } from './graficos'

export interface Habito {
  id: string
  nome: string
  categoria: string
  dias_semana: number[]
  horario: string | null
  ativo: boolean
}

export interface RegistroHabito {
  id: string
  habito_id: string
  data: string
  feito: boolean
}

export const CATEGORIAS_PADRAO = ['Saúde', 'Casa', 'Pessoal']
export const DIAS_CURTOS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

/** Cria (ou limpa) as linhas do checklist de hoje conforme o cadastro. */
export async function sincronizarRotina(hoje: string) {
  await supabase.rpc('sincronizar_rotina', { d: hoje })
}

export function descreverDias(dias: number[]): string {
  const s = [...dias].sort().join('')
  if (s === '0123456') return 'Todos os dias'
  if (s === '12345') return 'Dias úteis'
  if (s === '06') return 'Fins de semana'
  const nomes = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
  return [...dias].sort().map((d) => nomes[d]).join(', ')
}

/** Ordena por horário (sem horário no fim) e depois por nome. */
export function compararHabitos(a: Habito, b: Habito): number {
  if (a.horario !== b.horario) {
    if (!a.horario) return 1
    if (!b.horario) return -1
    return a.horario < b.horario ? -1 : 1
  }
  return a.nome.localeCompare(b.nome, 'pt-BR')
}

/**
 * Série diária (últimos ~13 meses) para o gráfico. O dia exibido na tela
 * é recalculado a partir dos registros locais, para o gráfico responder
 * na hora em que um item é marcado.
 */
export function useSerieRotina(hoje: string, dia: string, registrosDia: RegistroHabito[], versao = 0) {
  const [serie, setSerie] = useState<PontoDia[]>([])

  useEffect(() => {
    let vivo = true
    const carregar = () =>
      supabase
        .from('v_rotina_dia')
        .select('*')
        .gte('data', somarDias(hoje, -400))
        .order('data')
        .then(({ data }) => {
          if (vivo && data) setSerie(data as PontoDia[])
        })
    carregar()
    const aoVoltar = () => document.visibilityState === 'visible' && carregar()
    document.addEventListener('visibilitychange', aoVoltar)
    return () => {
      vivo = false
      document.removeEventListener('visibilitychange', aoVoltar)
    }
  }, [hoje, versao])

  return useMemo(() => {
    const local: PontoDia = {
      data: dia,
      previstos: registrosDia.length,
      feitos: registrosDia.filter((r) => r.feito).length,
    }
    return [...serie.filter((p) => p.data !== dia), ...(local.previstos ? [local] : [])]
  }, [serie, dia, registrosDia])
}
