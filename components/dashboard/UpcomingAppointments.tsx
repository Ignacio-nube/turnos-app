import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { AppointmentStatusBadge } from '@/components/appointments/AppointmentStatusBadge'

export async function UpcomingAppointments() {
  try {
    const supabase = await createClient()
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('*, professionals(name), services(name, color)')
      .gte('start_time', tomorrow.toISOString())
      .in('status', ['confirmed'])
      .order('start_time', { ascending: true })
      .limit(5)

    if (error) throw error

    if (!appointments?.length) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <svg className="h-12 w-12 text-muted-foreground/30 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-muted-foreground">No hay próximos turnos</p>
        </div>
      )
    }

    return (
      <div className="space-y-3">
        {appointments.map((apt) => (
          <div key={apt.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
            <div
              className="h-8 w-8 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: (apt.services as { color?: string | null } | null)?.color ?? '#6366f1' }}
            >
              {apt.client_name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{apt.client_name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {format(new Date(apt.start_time), "EEEE d 'de' MMM, HH:mm", { locale: es })}
              </p>
            </div>
            <AppointmentStatusBadge status={apt.status} />
          </div>
        ))}
      </div>
    )
  } catch (err) {
    console.error('[UpcomingAppointments]', err)
    return (
      <p className="text-sm text-destructive py-4 text-center">
        No se pudo cargar los próximos turnos.
      </p>
    )
  }
}
