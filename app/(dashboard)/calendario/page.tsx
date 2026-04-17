import { createClient } from '@/lib/supabase/server'
import { AppCalendar } from '@/components/calendar/AppCalendar'
import { AppointmentWithRelations } from '@/lib/supabase/types'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import Link from 'next/link'

export default async function CalendarioPage() {
  const supabase = await createClient()

  const [{ data: appointments }, { data: professionals }] = await Promise.all([
    supabase
      .from('appointments')
      .select('*, professionals(id, name, specialty), services(id, name, color, duration_minutes)')
      .neq('status', 'cancelled')
      .order('start_time', { ascending: true }),
    supabase
      .from('professionals')
      .select('id, name, specialty, active')
      .eq('active', true)
      .order('name'),
  ])

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Calendario</h2>
          <p className="text-muted-foreground">Vista de todos los turnos</p>
        </div>
      </div>

      {professionals && professionals.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-muted-foreground font-medium">Ver por profesional:</span>
          {professionals.map((p) => {
            const initials = p.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
            return (
              <Button
                key={p.id}
                variant="outline"
                size="sm"
                nativeButton={false}
                render={<Link href={`/calendario/profesional/${p.id}`} />}
                className="gap-2 h-7 text-xs"
              >
                <Avatar className="h-4 w-4">
                  <AvatarFallback className="text-[9px]">{initials}</AvatarFallback>
                </Avatar>
                {p.name.split(' ').slice(0, 2).join(' ')}
              </Button>
            )
          })}
        </div>
      )}

      <AppCalendar appointments={(appointments ?? []) as AppointmentWithRelations[]} />
    </div>
  )
}
