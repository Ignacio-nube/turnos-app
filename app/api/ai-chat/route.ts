import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { tool } from 'ai'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const { messages } = await req.json()
  const supabase = await createClient()

  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: `Sos un asistente de gestión de turnos. Tenés acceso a la base de datos de citas del negocio.
    Cuando el usuario pregunta sobre turnos, usá las herramientas disponibles para consultar la base de datos.
    Respondé siempre en español, de forma concisa y útil.
    Cuando traigas turnos, SIEMPRE usá la herramienta searchAppointments y presentá los resultados.
    Fecha y hora actual: ${new Date().toISOString()}`,
    messages,
    tools: {
      searchAppointments: tool({
        description: 'Busca turnos en la base de datos por diferentes criterios',
        parameters: z.object({
          client_name: z.string().optional().describe('Nombre del cliente a buscar'),
          professional_name: z.string().optional().describe('Nombre del profesional'),
          service_name: z.string().optional().describe('Nombre del servicio'),
          date_from: z.string().optional().describe('Fecha de inicio en formato ISO (YYYY-MM-DD)'),
          date_to: z.string().optional().describe('Fecha de fin en formato ISO (YYYY-MM-DD)'),
          status: z.enum(['confirmed', 'cancelled', 'completed', 'no_show']).optional(),
          limit: z.number().optional().default(10),
        }),
        execute: async ({ client_name, date_from, date_to, status, limit }) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let query: any = supabase
            .from('appointments')
            .select('*, professionals(name, specialty), services(name, duration_minutes, color)')
            .order('start_time', { ascending: true })
            .limit(limit ?? 10)

          if (client_name) query = query.ilike('client_name', `%${client_name}%`)
          if (date_from) query = query.gte('start_time', date_from)
          if (date_to) query = query.lte('start_time', date_to + 'T23:59:59')
          if (status) query = query.eq('status', status)

          const { data, error } = await query
          if (error) return { error: error.message, appointments: [], total: 0 }
          return { appointments: data ?? [], total: data?.length ?? 0 }
        },
      }),
      getStats: tool({
        description: 'Obtiene estadísticas y métricas de los turnos',
        parameters: z.object({
          period: z.enum(['today', 'week', 'month']).describe('Período a analizar'),
        }),
        execute: async ({ period }) => {
          const now = new Date()
          let dateFrom: string

          if (period === 'today') {
            dateFrom = now.toISOString().split('T')[0]
          } else if (period === 'week') {
            const weekAgo = new Date(now)
            weekAgo.setDate(now.getDate() - 7)
            dateFrom = weekAgo.toISOString().split('T')[0]
          } else {
            const monthAgo = new Date(now)
            monthAgo.setMonth(now.getMonth() - 1)
            dateFrom = monthAgo.toISOString().split('T')[0]
          }

          const { data } = await supabase
            .from('appointments')
            .select('status, services(name)')
            .gte('start_time', dateFrom)

          return {
            total: data?.length ?? 0,
            confirmed: data?.filter((a: { status: string | null }) => a.status === 'confirmed').length ?? 0,
            cancelled: data?.filter((a: { status: string | null }) => a.status === 'cancelled').length ?? 0,
            completed: data?.filter((a: { status: string | null }) => a.status === 'completed').length ?? 0,
          }
        },
      }),
      updateAppointmentStatus: tool({
        description: 'Actualiza el estado de un turno (confirmar, cancelar, marcar como completado)',
        parameters: z.object({
          appointment_id: z.string().uuid(),
          new_status: z.enum(['confirmed', 'cancelled', 'completed', 'no_show']),
        }),
        execute: async ({ appointment_id, new_status }) => {
          const { data, error } = await supabase
            .from('appointments')
            .update({ status: new_status, updated_at: new Date().toISOString() })
            .eq('id', appointment_id)
            .select()
            .single()

          if (error) return { success: false, error: error.message }
          return { success: true, appointment: data }
        },
      }),
    },
  })

  return result.toDataStreamResponse({
    getErrorMessage: (error) => {
      console.error('[AI Chat Error]', error)
      if (error instanceof Error) return error.message
      return 'Error desconocido'
    },
  })
}
