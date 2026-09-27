import {
  dataCurta,
  diaSemanaCurto,
  inicioMes,
  inicioSemana,
  nomeMes,
  somarDias,
  somarMeses,
} from './datas'

/** Um dia de um checklist qualquer: quantos itens previstos, quantos cumpridos. */
export interface PontoDia {
  data: string
  previstos: number
  feitos: number
}

export type Janela = 'dia' | 'semana' | 'mes'

export const JANELAS: { valor: Janela; rotulo: string }[] = [
  { valor: 'dia', rotulo: 'Dia' },
  { valor: 'semana', rotulo: 'Semana' },
  { valor: 'mes', rotulo: 'Mês' },
]

export interface Barra {
  chave: string
  rotulo: string // eixo x
  detalhe: string // leitura ao tocar
  previstos: number
  feitos: number
  pct: number | null // null = nada previsto no período
}

const QUANTIDADE: Record<Janela, number> = { dia: 14, semana: 12, mes: 12 }

function chaveDe(data: string, janela: Janela): string {
  return janela === 'dia' ? data : janela === 'semana' ? inicioSemana(data) : inicioMes(data)
}

function descrever(chave: string, janela: Janela, hoje: string): Pick<Barra, 'rotulo' | 'detalhe'> {
  if (janela === 'dia') {
    return {
      rotulo: chave.slice(8),
      detalhe: chave === hoje ? 'Hoje' : `${diaSemanaCurto(chave)} ${dataCurta(chave)}`,
    }
  }
  if (janela === 'semana') {
    return {
      rotulo: dataCurta(chave),
      detalhe: chave === inicioSemana(hoje) ? 'Esta semana' : `Semana de ${dataCurta(chave)}`,
    }
  }
  return {
    rotulo: nomeMes(chave, 'short'),
    detalhe: chave === inicioMes(hoje) ? 'Este mês' : `${nomeMes(chave)} ${chave.slice(0, 4)}`,
  }
}

/** Chaves dos períodos exibidos, terminando no período atual. */
function periodos(janela: Janela, hoje: string): string[] {
  const n = QUANTIDADE[janela]
  const atual = chaveDe(hoje, janela)
  return Array.from({ length: n }, (_, i) => {
    const k = n - 1 - i
    return janela === 'dia'
      ? somarDias(atual, -k)
      : janela === 'semana'
        ? somarDias(atual, -7 * k)
        : somarMeses(atual, -k)
  })
}

/** Agrupa pontos diários nas barras da janela escolhida, terminando no período atual. */
export function agrupar(pontos: PontoDia[], janela: Janela, hoje: string): Barra[] {
  const chaves = periodos(janela, hoje)
  const soma = new Map(chaves.map((c) => [c, { previstos: 0, feitos: 0 }]))
  for (const p of pontos) {
    const s = soma.get(chaveDe(p.data, janela))
    if (s) {
      s.previstos += p.previstos
      s.feitos += p.feitos
    }
  }

  return chaves.map((chave) => {
    const { previstos, feitos } = soma.get(chave)!
    return {
      chave,
      ...descrever(chave, janela, hoje),
      previstos,
      feitos,
      pct: previstos ? Math.round((feitos / previstos) * 100) : null,
    }
  })
}

/** Um valor medido num dia (ex.: horas de sono). */
export interface PontoValor {
  data: string
  valor: number
}

export interface BarraMedia {
  chave: string
  rotulo: string
  detalhe: string
  n: number // quantos registros no período
  total: number // soma dos valores
  media: number | null
}

/** Média dos valores por período (dia / semana / mês). */
export function agruparMedia(pontos: PontoValor[], janela: Janela, hoje: string): BarraMedia[] {
  const chaves = periodos(janela, hoje)
  const soma = new Map(chaves.map((c) => [c, { total: 0, n: 0 }]))
  for (const p of pontos) {
    const s = soma.get(chaveDe(p.data, janela))
    if (s) {
      s.total += p.valor
      s.n += 1
    }
  }
  return chaves.map((chave) => {
    const { total, n } = soma.get(chave)!
    return { chave, ...descrever(chave, janela, hoje), n, total, media: n ? total / n : null }
  })
}

/** Último valor registrado em cada período (ex.: % de um objetivo ao fim da semana). */
export function agruparUltimo(pontos: PontoValor[], janela: Janela, hoje: string) {
  const chaves = periodos(janela, hoje)
  const ultimo = new Map<string, PontoValor>()
  for (const p of pontos) {
    const k = chaveDe(p.data, janela)
    const atual = ultimo.get(k)
    if (!atual || p.data > atual.data) ultimo.set(k, p)
  }
  return chaves.map((chave) => ({
    chave,
    ...descrever(chave, janela, hoje),
    valor: ultimo.get(chave)?.valor ?? null,
  }))
}
