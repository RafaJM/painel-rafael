import { useState, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { useTabela } from '../lib/useTabela'
import { CORES_AGENDA, type Agenda } from '../lib/agenda'
import Folha from '../components/Folha'

const campo =
  'w-full rounded-xl border border-borda bg-fundo px-3 py-2.5 outline-none focus:border-destaque'
const rotulo = 'mb-1 block text-xs text-slate-400'

function EditorAgenda({
  agenda,
  onSalvar,
  onExcluir,
  onFechar,
}: {
  agenda: Agenda | null
  onSalvar: (d: Partial<Agenda>) => Promise<void>
  onExcluir?: () => Promise<void>
  onFechar: () => void
}) {
  const [nome, setNome] = useState(agenda?.nome ?? 'Pessoal')
  const [url, setUrl] = useState(agenda?.ical_url ?? '')
  const [cor, setCor] = useState(agenda?.cor ?? CORES_AGENDA[0])
  const [ativa, setAtiva] = useState(agenda?.ativa ?? true)
  const [confirmar, setConfirmar] = useState(false)
  const urlValida = /^https:\/\/.+/.test(url.trim())

  async function salvar(e: FormEvent) {
    e.preventDefault()
    if (!nome.trim() || !urlValida) return
    await onSalvar({ nome: nome.trim(), ical_url: url.trim(), cor, ativa })
    onFechar()
  }

  return (
    <Folha titulo={agenda ? 'Editar agenda' : 'Conectar agenda'} onFechar={onFechar}>
      <form onSubmit={salvar} className="space-y-4">
        <div>
          <label className={rotulo}>Nome</label>
          <input className={campo} value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>
        <div>
          <label className={rotulo}>Endereço secreto no formato iCal</label>
          <input
            className={campo}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://calendar.google.com/calendar/ical/…/basic.ics"
            autoComplete="off"
            spellCheck={false}
          />
          {url && !urlValida && <p className="mt-1 text-xs text-red-400">O endereço deve começar com https://</p>}
          <p className="mt-1.5 text-xs text-slate-500">
            Google Agenda → Configurações → sua agenda → Integrar agenda → “Endereço secreto no formato iCal”.
          </p>
        </div>
        <div>
          <label className={rotulo}>Cor</label>
          <div className="flex gap-2">
            {CORES_AGENDA.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCor(c)}
                aria-label={`Cor ${c}`}
                aria-pressed={cor === c}
                className={`h-9 w-9 rounded-full ${cor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-cartao' : ''}`}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>
        {agenda && (
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={ativa}
              onChange={(e) => setAtiva(e.target.checked)}
              className="h-5 w-5 accent-teal-400"
            />
            Mostrar na Home
          </label>
        )}
        <div className="flex items-center gap-3 pt-1">
          {onExcluir &&
            (confirmar ? (
              <button
                type="button"
                onClick={async () => {
                  await onExcluir()
                  onFechar()
                }}
                className="rounded-xl bg-red-500/20 px-4 py-2.5 text-sm text-red-300"
              >
                Confirmar exclusão
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmar(true)}
                className="px-2 py-2.5 text-sm text-slate-500 hover:text-red-300"
              >
                Excluir
              </button>
            ))}
          <button
            disabled={!urlValida || !nome.trim()}
            className="ml-auto rounded-xl bg-destaque px-5 py-2.5 font-semibold text-slate-900 disabled:opacity-40"
          >
            Salvar
          </button>
        </div>
      </form>
    </Folha>
  )
}

export default function Agendas() {
  const { linhas, carregando, erro, inserir, atualizar, remover } = useTabela<Agenda>('agendas')
  const [editando, setEditando] = useState<Agenda | 'nova' | null>(null)

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Agendas</h1>
        <button
          onClick={() => setEditando('nova')}
          className="flex items-center gap-1 rounded-full bg-destaque/15 px-3 py-1.5 text-sm text-destaque"
        >
          <Plus size={16} /> Conectar
        </button>
      </div>
      <p className="mb-4 text-sm text-slate-400">
        O endereço fica guardado só no seu banco, protegido pelo seu login. Eventos do trabalho aparecem aqui quando
        seu e-mail pessoal é convidado.
      </p>
      {erro && <p className="mb-3 text-sm text-red-300">{erro}</p>}
      {carregando ? (
        <p className="text-sm text-slate-500">Carregando…</p>
      ) : linhas.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-borda px-4 py-8 text-center text-sm text-slate-500">
          Nenhuma agenda conectada.
        </p>
      ) : (
        <div className="divide-y divide-borda overflow-hidden rounded-2xl border border-borda bg-cartao">
          {linhas.map((a) => (
            <button
              key={a.id}
              onClick={() => setEditando(a)}
              className={`flex w-full items-center gap-3 px-4 py-3.5 text-left ${a.ativa ? '' : 'opacity-50'}`}
            >
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: a.cor }} />
              <span className="flex-1">{a.nome}</span>
              <span className="text-xs text-slate-500">{a.ativa ? '••••basic.ics' : 'oculta'}</span>
            </button>
          ))}
        </div>
      )}
      {editando && (
        <EditorAgenda
          agenda={editando === 'nova' ? null : editando}
          onFechar={() => setEditando(null)}
          onSalvar={async (d) => {
            if (editando === 'nova') await inserir(d)
            else await atualizar(editando.id, d)
          }}
          onExcluir={editando === 'nova' ? undefined : () => remover(editando.id)}
        />
      )}
    </div>
  )
}
