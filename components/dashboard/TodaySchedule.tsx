import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { AppointmentStatusBadge } from '@/components/appointments/AppointmentStatusBadge'
import { Clock } from 'lucide-react'

export async function TodaySchedule() {
  const supabase = await createClient()
  const today = new Date()
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString()

  const { data: appointments } = await supabase
    .from('appointments')
    .select('*, professionals(name), services(name, color)')
    .gte('start_time', startOfDay)
    .lte('start_time', endOfDay)
    .neq('status', 'cancelled')
    .order('start_time', { ascending: true })

  if (!appointments?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <svg className="h-12 w-12 text-muted-foreground/30 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-sm text-muted-foreground">No hay turnos para hoy</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {appointments.map((apt) => (
        <div key={apt.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
          <div
            className="h-2 w-2 rounded-full shrink-0"
            style={{ backgroundColor: (apt.services as { color?: string | null } | null)?.color ?? '#6366f1' }}
          />
          <div className="flex items-center gap-1 text-sm text-muted-foreground min-w-[80px]">
            <Clock className="h-3 w-3" />
            {format(new Date(apt.start_time), 'HH:mm', { locale: es })}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{apt.client_name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {(apt.services as { name?: string } | null)?.name} · {(apt.professionals as { name?: string } | null)?.name}
            </p>
          </div>
          <AppointmentStatusBadge status={apt.status} />
        </div>
      ))}
    </div>
  )
}
