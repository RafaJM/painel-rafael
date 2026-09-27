import {
  Briefcase,
  GraduationCap,
  House,
  Moon,
  Repeat,
  Rocket,
  ShieldAlert,
  ShoppingCart,
  Sparkles,
  Target,
  type LucideIcon,
} from 'lucide-react'

export interface Modulo {
  rota: string
  nome: string
  icone: LucideIcon
  pronto: boolean
}

export const MODULOS: Modulo[] = [
  { rota: '/', nome: 'Início', icone: House, pronto: true },
  { rota: '/trabalho', nome: 'Trabalho Formal', icone: Briefcase, pronto: true },
  { rota: '/pessoal', nome: 'Trabalho Pessoal', icone: Rocket, pronto: true },
  { rota: '/estudos', nome: 'Estudos', icone: GraduationCap, pronto: true },
  { rota: '/rotina', nome: 'Rotina Fixa', icone: Repeat, pronto: true },
  { rota: '/sono', nome: 'Sono', icone: Moon, pronto: true },
  { rota: '/compras', nome: 'Lista de Compras', icone: ShoppingCart, pronto: true },
  { rota: '/objetivos', nome: 'Objetivos', icone: Target, pronto: true },
  { rota: '/lifestyle', nome: 'Lifestyle', icone: Sparkles, pronto: true },
  { rota: '/erros', nome: 'Erros a Eliminar', icone: ShieldAlert, pronto: true },
]
