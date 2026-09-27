import { useEffect, useState } from 'react'
import { hojeISO } from './datas'

/** Data de hoje que vira sozinha à meia-noite, mesmo com o app aberto. */
export function useHoje(): string {
  const [hoje, setHoje] = useState(hojeISO)
  useEffect(() => {
    const atualizar = () => setHoje(hojeISO())
    const relogio = setInterval(atualizar, 60_000)
    document.addEventListener('visibilitychange', atualizar)
    return () => {
      clearInterval(relogio)
      document.removeEventListener('visibilitychange', atualizar)
    }
  }, [])
  return hoje
}
