import { useState, type FormEvent } from 'react'
import { Minus, Plus } from 'lucide-react'
import { useTabela } from '../lib/useTabela'
import { useHoje } from '../lib/useHoje'
import { dataCurta, diaSemanaCurto, somarDias } from '../lib/datas'
import { agruparMedia } from '../lib/graficos'
import { formatarHoras, QUALIDADES, rotuloQualidade, type RegistroSono } from '../lib/sono'
import GraficoJanelas from '../components/GraficoJanelas'

function FormSono({
  dia,
  hoje,
  existente,
  sugestao,
  onTrocarDia,
  onSalvar,
  onExcluir,
}: {
  dia: string
  hoje: string
  existente: RegistroSono | undefined
  sugestao: number
  onTrocarDia: (d: string) => void
  onSalvar: (d: Partial<RegistroSono>) => Promise<void>
  onExcluir?: () => Promise<void>
}) {
  const [horas, setHoras] = useState(existente ? Number(existente.horas) : sugestao)
  const [qualidade, setQualidade] = useState<number | null>(existente?.qualidade ?? null)
  const [nota, setNota] = useState(existente?.nota ?? '')
  const [salvo, setSalvo] = useState(false)

  const ajustar = (delta: number) => setHoras((h) => Math.min(Math.max(Math.round((h + delta) * 4) / 4, 0), 24))

  async function salvar(e: FormEvent) {
    e.preventDefault()
    await onSalvar({ data: dia, horas, qualidade: qualidade as RegistroSono['qualidade'], nota: nota.trim() || null })
    setSalvo(true)
  }

  return (
    <form onSubmit={salvar} className="rounded-2xl border border-borda bg-cartao p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-semibold">Como foi a noite?</h2>
        <label className="flex items-center gap-2 text-xs text-slate-400">
          Acordei em
          <input
            type="date"
            value={dia}
            max={hoje}
            onChange={(e) => e.target.value && onTrocarDia(e.target.value)}
            className="rounded-lg border border-borda bg-fundo px-2 py-1 text-sm text-slate-200"
          />
        </label>
      </div>

      <div className="mb-4 flex items-center justify-center gap-5">
        <button type="button" onClick={() => ajustar(-0.5)} className="rounded-full border border-borda p-3" aria-label="Menos meia hora">
          <Minus size={20} />
        </button>
        <div className="w-28 text-center">
          <div className="text-4xl font-semibold tabular-nums">{formatarHoras(horas)}</div>
          <div className="text-xs text-slate-500">dormidas</div>
        </div>
        <button type="button" onClick={() => ajustar(0.5)} className="rounded-full border border-borda p-3" aria-label="Mais meia hora">
          <Plus size={20} />
        </button>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2">
        {QUALIDADES.map((q) => (
          <button
            key={q.valor}
            type="button"
            onClick={() => setQualidade(qualidade === q.valor ? null : q.valor)}
            aria-pressed={qualidade === q.valor}
            className={`rounded-xl py-2.5 text-sm font-medium ${
              qualidade === q.valor ? `bg-borda ${q.classe}` : 'border border-borda text-slate-400'
            }`}
          >
            {q.rotulo}
          </button>
        ))}
      </div>

      <input
        value={nota}
        onChange={(e) => setNota(e.target.value)}
        placeholder="Observação (opcional)"
        className="mb-4 w-full rounded-xl border border-borda bg-fundo px-3 py-2.5 outline-none focus:border-destaque"
      />

      <div className="flex items-center gap-3">
        {onExcluir && (
          <button type="button" onClick={onExcluir} className="px-2 py-2.5 text-sm text-slate-500 hover:text-red-300">
            Excluir
          </button>
        )}
        {salvo && <span className="text-sm text-destaque">Salvo ✓</span>}
        <button className="ml-auto rounded-xl bg-destaque px-5 py-2.5 font-semibold text-slate-900">
          {existente ? 'Atualizar' : 'Registrar'}
        </button>
      </div>
    </form>
  )
}

export default function Sono() {
  const hoje = useHoje()
  const { linhas, erro, inserir, atualizar, remover } = useTabela<RegistroSono>('sono_registros', {
    coluna: 'data',
    valor: somarDias(hoje, -400),
    op: 'gte',
  })
  const [dia, setDia] = useState(hoje)

  const ordenados = linhas.slice().sort((a, b) => b.data.localeCompare(a.data))
  const existente = linhas.find((r) => r.data === dia)
  const pontos = linhas.map((r) => ({ data: r.data, valor: Number(r.horas) }))
  const maximo = Math.max(10, ...pontos.map((p) => Math.ceil(p.valor)))

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Sono</h1>
      {erro && <p className="text-sm text-red-300">{erro}</p>}

      <FormSono
        key={`${dia}-${existente?.id ?? 'novo'}`}
        dia={dia}
        hoje={hoje}
        existente={existente}
        sugestao={ordenados[0] ? Number(ordenados[0].horas) : 7}
        onTrocarDia={setDia}
        onSalvar={async (d) => {
          if (existente) await atualizar(existente.id, d)
          else await inserir(d)
        }}
        onExcluir={existente ? () => remover(existente.id) : undefined}
      />

      <GraficoJanelas
        titulo="Horas dormidas"
        maximo={maximo}
        guias={[6, 8]}
        formatar={formatarHoras}
        calcular={(janela) =>
          agruparMedia(pontos, janela, hoje).map((b) => {
            const registro = janela === 'dia' ? linhas.find((r) => r.data === b.chave) : undefined
            return {
              ...b,
              valor: b.media,
              complemento:
                janela === 'dia'
                  ? rotuloQualidade(registro?.qualidade ?? null) || undefined
                  : b.n
                    ? `média de ${b.n} ${b.n === 1 ? 'noite' : 'noites'}`
                    : undefined,
            }
          })
        }
        resumo={(_janela, barras) => {
          const comDados = barras.filter((b) => b.valor !== null)
          if (!comDados.length) return null
          const media = comDados.reduce((s, b) => s + b.valor!, 0) / comDados.length
          return (
            <>
              Média no período exibido: <span className="text-slate-200">{formatarHoras(media)}</span>
            </>
          )
        }}
      />

      {ordenados.length > 0 && (
        <section>
          <h2 className="mb-2 px-1 text-sm text-slate-400">Últimos registros</h2>
          <div className="divide-y divide-borda overflow-hidden rounded-2xl border border-borda bg-cartao">
            {ordenados.slice(0, 10).map((r) => {
              const q = QUALIDADES.find((x) => x.valor === r.qualidade)
              return (
                <button
                  key={r.id}
                  onClick={() => {
                    setDia(r.data)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left"
                >
                  <span className="w-20 text-sm text-slate-400">
                    {r.data === hoje ? 'Hoje' : `${diaSemanaCurto(r.data)} ${dataCurta(r.data)}`}
                  </span>
                  <span className="flex-1 font-medium tabular-nums">{formatarHoras(Number(r.horas))}</span>
                  {q && <span className={`text-sm ${q.classe}`}>{q.rotulo}</span>}
                </button>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
