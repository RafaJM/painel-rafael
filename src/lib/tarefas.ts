import { hojeISO } from './datas'

export type Status = 'pendente' | 'em_andamento' | 'feito'
export type Prioridade = 'alta' | 'media' | 'baixa'

export interface Tarefa {
  id: string
  titulo: string
  status: Status
  prazo: string | null
  prioridade: Prioridade
  destaque_em: string | null
  notas: string | null
  concluida_em: string | null
  created_at: string
}

export interface Painel {
  tabela: 'trabalho_tarefas' | 'pessoal_tarefas' | 'estudos_tarefas'
  rota: string
  nome: string
  curto: string
}

export const PAINEIS: Painel[] = [
  { tabela: 'trabalho_tarefas', rota: '/trabalho', nome: 'Trabalho Formal', curto: 'Trabalho' },
  { tabela: 'pessoal_tarefas', rota: '/pessoal', nome: 'Trabalho Pessoal', curto: 'Pessoal' },
  { tabela: 'estudos_tarefas', rota: '/estudos', nome: 'Estudos', curto: 'Estudos' },
]

export const STATUS_ROTULO: Record<Status, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em andamento',
  feito: 'Feito',
}

export const PRIORIDADE_ROTULO: Record<Prioridade, string> = {
  alta: 'Alta',
  media: 'Média',
  baixa: 'Baixa',
}

const PESO: Record<Prioridade, number> = { alta: 0, media: 1, baixa: 2 }

export function proximoStatus(s: Status): Status {
  return s === 'pendente' ? 'em_andamento' : s === 'em_andamento' ? 'feito' : 'pendente'
}

// Tarefas sem prazo vão para o fim
function compararPrazo(a: Tarefa, b: Tarefa): number {
  if (a.prazo === b.prazo) return 0
  if (!a.prazo) return 1
  if (!b.prazo) return -1
  return a.prazo < b.prazo ? -1 : 1
}

export type Criterio = 'prazo' | 'prioridade'

export function ordenar(ts: Tarefa[], criterio: Criterio): Tarefa[] {
  return ts.slice().sort((a, b) => {
    const porPrazo = compararPrazo(a, b)
    const porPrioridade = PESO[a.prioridade] - PESO[b.prioridade]
    return criterio === 'prazo' ? porPrazo || porPrioridade : porPrioridade || porPrazo
  })
}

export function resumo(ts: Tarefa[], hoje = hojeISO()) {
  const total = ts.length
  const feitas = ts.filter((t) => t.status === 'feito').length
  const atrasadas = ts.filter((t) => t.status !== 'feito' && t.prazo && t.prazo < hoje).length
  return {
    total,
    feitas,
    pendentes: total - feitas,
    atrasadas,
    pct: total ? Math.round((feitas / total) * 100) : 0,
  }
}

/** Ao marcar ★: entra nas prioridades no dia do prazo (se futuro) ou já hoje. */
export function dataDestaquePadrao(t: Tarefa, hoje = hojeISO()): string {
  return t.prazo && t.prazo > hoje ? t.prazo : hoje
}

export interface ItemPrioridade {
  painel: Painel
  tarefa: Tarefa
}

/** Tarefas marcadas cuja data de destaque já chegou e que ainda não foram feitas. */
export function prioridadesDoDia(itens: ItemPrioridade[], hoje = hojeISO()): ItemPrioridade[] {
  return itens
    .filter(({ tarefa: t }) => t.status !== 'feito' && t.destaque_em && t.destaque_em <= hoje)
    .sort(
      (a, b) =>
        PESO[a.tarefa.prioridade] - PESO[b.tarefa.prioridade] ||
        compararPrazo(a.tarefa, b.tarefa) ||
        (a.tarefa.destaque_em! < b.tarefa.destaque_em! ? -1 : 1),
    )
}
