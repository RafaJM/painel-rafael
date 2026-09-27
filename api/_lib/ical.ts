// Leitura de agendas iCal compartilhada pelas funções /api/agenda e /api/notificar.
import ICAL from 'ical.js'

export interface Evento {
  agenda: string
  cor: string
  titulo: string
  inicio: string // ISO com horário, ou AAAA-MM-DD se for dia inteiro
  fim: string
  diaInteiro: boolean
  local: string | null
}

type EventoBruto = Omit<Evento, 'agenda' | 'cor'>

const OFFSET_SP = '-03:00' // o Brasil não tem mais horário de verão
const LIMITE_ITERACOES = 20_000
const CACHE_MS = 5 * 60_000

export function somarDias(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export function hojeSP(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date())
}

/** Eventos de um .ics que caem entre diaInicio (inclusive) e diaFim (exclusive), dias de SP. */
export function expandir(ics: string, diaInicio: string, diaFim: string): EventoBruto[] {
  const raiz = new ICAL.Component(ICAL.parse(ics))
  for (const tz of raiz.getAllSubcomponents('vtimezone')) ICAL.TimezoneService.register(tz)

  const janelaIni = new Date(`${diaInicio}T00:00:00${OFFSET_SP}`).getTime()
  const janelaFim = new Date(`${diaFim}T00:00:00${OFFSET_SP}`).getTime()

  const principais = new Map<string, ICAL.Event>()
  const excecoes: ICAL.Event[] = []
  for (const v of raiz.getAllSubcomponents('vevent')) {
    const ev = new ICAL.Event(v)
    if (v.hasProperty('recurrence-id')) excecoes.push(ev)
    else principais.set(ev.uid, ev)
  }
  const soltas: ICAL.Event[] = []
  for (const ex of excecoes) {
    const mestre = principais.get(ex.uid)
    if (mestre) mestre.relateException(ex)
    else soltas.push(ex)
  }

  const saida: EventoBruto[] = []
  const considerar = (item: ICAL.Event, ini: ICAL.Time, fim: ICAL.Time) => {
    if (item.component.getFirstPropertyValue('status') === 'CANCELLED') return
    if (ini.isDate) {
      const a = ini.toString()
      const b = fim ? fim.toString() : somarDias(a, 1)
      if (a < diaFim && b > diaInicio) {
        saida.push({ titulo: item.summary || '(sem título)', inicio: a, fim: b, diaInteiro: true, local: item.location || null })
      }
      return
    }
    const a = ini.toJSDate()
    const b = fim ? fim.toJSDate() : a
    if (a.getTime() < janelaFim && Math.max(b.getTime(), a.getTime() + 1) > janelaIni) {
      saida.push({
        titulo: item.summary || '(sem título)',
        inicio: a.toISOString(),
        fim: b.toISOString(),
        diaInteiro: false,
        local: item.location || null,
      })
    }
  }

  // Margem de 2 dias para ocorrências remarcadas por exceção
  const pararEm = janelaFim + 2 * 86_400_000
  for (const ev of [...principais.values(), ...soltas]) {
    if (!ev.isRecurring()) {
      considerar(ev, ev.startDate, ev.endDate)
      continue
    }
    const it = ev.iterator()
    for (let i = 0; i < LIMITE_ITERACOES; i++) {
      const prox = it.next()
      if (!prox || prox.toJSDate().getTime() >= pararEm) break
      const det = ev.getOccurrenceDetails(prox)
      considerar(det.item, det.startDate, det.endDate)
    }
  }
  return saida
}

const cache = new Map<string, { em: number; texto: string }>()

export async function baixar(url: string): Promise<string> {
  const guardado = cache.get(url)
  if (guardado && Date.now() - guardado.em < CACHE_MS) return guardado.texto
  const resp = await fetch(url, { signal: AbortSignal.timeout(10_000) })
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  const texto = await resp.text()
  cache.set(url, { em: Date.now(), texto })
  return texto
}

/** Eventos de um período em todas as agendas; nomes das que falharam em `falhas`. */
export async function eventosDasAgendas(
  agendas: { nome: string; ical_url: string; cor: string }[],
  dia: string,
  dias = 1,
): Promise<{ eventos: Evento[]; falhas: string[] }> {
  const falhas: string[] = []
  const listas = await Promise.all(
    agendas.map(async (a) => {
      try {
        if (!a.ical_url.startsWith('https://')) throw new Error('endereço precisa começar com https://')
        const ics = await baixar(a.ical_url)
        return expandir(ics, dia, somarDias(dia, dias)).map((e) => ({ ...e, agenda: a.nome, cor: a.cor }))
      } catch {
        falhas.push(a.nome)
        return []
      }
    }),
  )
  const eventos = listas
    .flat()
    .sort((x, y) => Number(y.diaInteiro) - Number(x.diaInteiro) || x.inicio.localeCompare(y.inicio))
  return { eventos, falhas }
}
