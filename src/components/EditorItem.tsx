import { useState, type FormEvent } from 'react'
import Folha from './Folha'

const campo =
  'w-full rounded-xl border border-borda bg-fundo px-3 py-2.5 outline-none focus:border-destaque'
const rotulo = 'mb-1 block text-xs text-slate-400'

export interface DadosItem {
  nome: string
  categoria: string | null
  quantidade?: string | null
  ativo: boolean
}

/** Editor de itens cadastrados (lista de compras, lifestyle). */
export default function EditorItem({
  titulo,
  item,
  categorias,
  comQuantidade = false,
  rotuloAtivo,
  onSalvar,
  onExcluir,
  onFechar,
}: {
  titulo: string
  item: DadosItem | null
  categorias: string[]
  comQuantidade?: boolean
  rotuloAtivo: string
  onSalvar: (d: DadosItem) => Promise<void>
  onExcluir?: () => Promise<void>
  onFechar: () => void
}) {
  const [nome, setNome] = useState(item?.nome ?? '')
  const [categoria, setCategoria] = useState(item?.categoria ?? '')
  const [quantidade, setQuantidade] = useState(item?.quantidade ?? '')
  const [ativo, setAtivo] = useState(item?.ativo ?? true)
  const [confirmar, setConfirmar] = useState(false)

  async function salvar(e: FormEvent) {
    e.preventDefault()
    if (!nome.trim()) return
    await onSalvar({
      nome: nome.trim(),
      categoria: categoria.trim() || null,
      ...(comQuantidade ? { quantidade: quantidade.trim() || null } : {}),
      ativo,
    })
    onFechar()
  }

  return (
    <Folha titulo={titulo} onFechar={onFechar}>
      <form onSubmit={salvar} className="space-y-4">
        <div>
          <label className={rotulo}>Nome</label>
          <input className={campo} value={nome} onChange={(e) => setNome(e.target.value)} autoFocus={!item} />
        </div>
        <div className={comQuantidade ? 'grid grid-cols-2 gap-3' : ''}>
          <div>
            <label className={rotulo}>Categoria</label>
            <input
              className={campo}
              list="categorias-item"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
            />
            <datalist id="categorias-item">
              {categorias.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          {comQuantidade && (
            <div>
              <label className={rotulo}>Quantidade</label>
              <input
                className={campo}
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                placeholder="Ex.: 2 kg"
              />
            </div>
          )}
        </div>
        {item && (
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={ativo}
              onChange={(e) => setAtivo(e.target.checked)}
              className="h-5 w-5 accent-teal-400"
            />
            {rotuloAtivo}
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
          <button className="ml-auto rounded-xl bg-destaque px-5 py-2.5 font-semibold text-slate-900">Salvar</button>
        </div>
      </form>
    </Folha>
  )
}
