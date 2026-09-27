export interface Objetivo {
  id: string
  titulo: string
  descricao: string | null
  prazo: string | null
  arquivado: boolean
  created_at: string
}

export interface Etapa {
  id: string
  objetivo_id: string
  titulo: string
  ordem: number
  feito: boolean
  concluida_em: string | null
  created_at: string
}

export interface Snapshot {
  id: string
  objetivo_id: string
  data: string
  pct: number
}

export function progresso(etapas: Etapa[]) {
  const total = etapas.length
  const feitas = etapas.filter((e) => e.feito).length
  return { total, feitas, pct: total ? Math.round((feitas / total) * 100) : 0 }
}

export function ordenarEtapas(etapas: Etapa[]): Etapa[] {
  return etapas.slice().sort((a, b) => a.ordem - b.ordem || a.created_at.localeCompare(b.created_at))
}
