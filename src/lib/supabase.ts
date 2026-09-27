import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const chave = import.meta.env.VITE_SUPABASE_KEY as string | undefined

export const configurado = Boolean(url && chave)

export const supabase = createClient(url ?? 'http://localhost', chave ?? 'nao-configurado', {
  auth: { persistSession: true, autoRefreshToken: true },
})
