import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from './types'

export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error(
      'Faltan variables de entorno de Supabase. ' +
      'Configurá NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en Vercel y redesplegá.'
    )
  }

  const cookieStore = await cookies()

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Ignorado en Server Components sin acceso de escritura a cookies
        }
      },
    },
  })
}
