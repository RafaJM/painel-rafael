export interface RegistroSono {
  id: string
  data: string // manhã em que acordou
  horas: number
  qualidade: 1 | 2 | 3 | null
  nota: string | null
}

export const QUALIDADES = [
  { valor: 1, rotulo: 'Ruim', classe: 'text-red-300' },
  { valor: 2, rotulo: 'Ok', classe: 'text-amber-300' },
  { valor: 3, rotulo: 'Boa', classe: 'text-destaque' },
] as const

export function rotuloQualidade(q: number | null): string {
  return QUALIDADES.find((x) => x.valor === q)?.rotulo ?? ''
}

/** 7.5 → "7h30" */
export function formatarHoras(h: number): string {
  const total = Math.round(h * 60)
  const hh = Math.floor(total / 60)
  const mm = total % 60
  return mm ? `${hh}h${String(mm).padStart(2, '0')}` : `${hh}h`
}
