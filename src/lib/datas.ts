// Todas as datas do app são "dias" no fuso de São Paulo, no formato AAAA-MM-DD.
const TZ = 'America/Sao_Paulo'

const FORMATO_DIA = new Intl.DateTimeFormat('en-CA', {
  timeZone: TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** Dia (em São Paulo) de um instante: timestamp do banco ou Date. */
export function diaDe(instante: string | Date): string {
  return FORMATO_DIA.format(new Date(instante))
}

export function hojeISO(): string {
  return diaDe(new Date())
}

function paraUTC(iso: string): Date {
  const [a, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(a, m - 1, d))
}

function paraISO(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function somarDias(iso: string, n: number): string {
  const d = paraUTC(iso)
  d.setUTCDate(d.getUTCDate() + n)
  return paraISO(d)
}

/** 0 = domingo … 6 = sábado */
export function diaSemana(iso: string): number {
  return paraUTC(iso).getUTCDay()
}

/** Segunda-feira da semana de `iso`. */
export function inicioSemana(iso: string): string {
  return somarDias(iso, -((diaSemana(iso) + 6) % 7))
}

export function inicioMes(iso: string): string {
  return iso.slice(0, 8) + '01'
}

export function somarMeses(iso: string, n: number): string {
  const d = paraUTC(inicioMes(iso))
  d.setUTCMonth(d.getUTCMonth() + n)
  return paraISO(d)
}

export function nomeMes(iso: string, formato: 'short' | 'long' = 'long'): string {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', month: formato })
    .format(paraUTC(iso))
    .replace('.', '')
}

export function diaSemanaCurto(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', weekday: 'short' })
    .format(paraUTC(iso))
    .replace('.', '')
}

export function diasAte(iso: string, base = hojeISO()): number {
  return Math.round((paraUTC(iso).getTime() - paraUTC(base).getTime()) / 86_400_000)
}

export function dataCurta(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', day: '2-digit', month: '2-digit' }).format(
    paraUTC(iso),
  )
}

export function dataPorExtenso(iso = hojeISO()): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(paraUTC(iso))
}

export function saudacao(): string {
  const hora = Number(
    new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', hourCycle: 'h23' }).format(new Date()),
  )
  return hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'
}

/** "hoje", "amanhã", "ontem", "em 3 dias", "há 2 dias" ou a data curta. */
export function prazoRelativo(iso: string): string {
  const d = diasAte(iso)
  if (d === 0) return 'hoje'
  if (d === 1) return 'amanhã'
  if (d === -1) return 'ontem'
  if (d > 1 && d <= 6) return `em ${d} dias`
  if (d < -1 && d >= -6) return `há ${-d} dias`
  return dataCurta(iso)
}
