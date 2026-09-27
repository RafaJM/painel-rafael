import { inicioSemana } from './datas'
import type { PontoDia } from './graficos'

export type Frequencia = 'diaria' | 'semanal'

export interface Erro {
  id: string
  nome: string
  descricao: string | null
  frequencia: Frequencia
  ativo: boolean
  created_at: string
}

export interface RegistroErro {
  id: string
  erro_id: string
  periodo: string // o dia, ou a segunda-feira da semana
  errou: boolean
}

/** Período em que um erro é avaliado num dado dia. */
export function periodoDe(erro: Pick<Erro, 'frequencia'>, dia: string): string {
  return erro.frequencia === 'semanal' ? inicioSemana(dia) : dia
}

/**
 * Pontos para o gráfico de recorrência: por período, quantas avaliações
 * foram feitas (previstos) e em quantas o erro aconteceu (feitos).
 */
export function pontosRecorrencia(registros: RegistroErro[], erroId?: string): PontoDia[] {
  const porData = new Map<string, PontoDia>()
  for (const r of registros) {
    if (erroId && r.erro_id !== erroId) continue
    const p = porData.get(r.periodo) ?? { data: r.periodo, previstos: 0, feitos: 0 }
    p.previstos += 1
    if (r.errou) p.feitos += 1
    porData.set(r.periodo, p)
  }
  return [...porData.values()]
}
