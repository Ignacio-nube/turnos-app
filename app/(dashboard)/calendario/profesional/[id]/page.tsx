import { createClient } from '@/lib/supabase/server'
import { AppointmentWithRelations, Professional } from '@/lib/supabase/types'
import { ProfessionalCalendarView } from '@/components/calendar/ProfessionalCalendarView'
import { notFound } from 'next/navigation'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ProfessionalCalendarPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: professional }, { data: appointments }] = await Promise.all([
    supabase.from('professionals').select('*').eq('id', id).single(),
    supabase
      .from('appointments')
      .select('*, professionals(id, name, specialty), services(id, name, color, duration_minutes)')
      .eq('professional_id', id)
      .neq('status', 'cancelled')
      .order('start_time', { ascending: true }),
  ])

  if (!professional) notFound()

  const initials = professional.name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/calendario" />} className="gap-1">
          <ChevronLeft className="h-4 w-4" />
          Calendario
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="text-sm font-semibold">{initials}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-xl font-bold tracking-tight">{professional.name}</h2>
          <div className="flex items-center gap-2">
            {professional.specialty && (
              <p className="text-sm text-muted-foreground">{professional.specialty}</p>
            )}
            <Badge variant={professional.active ? 'default' : 'secondary'} className="text-xs">
              {professional.active ? 'Activo' : 'Inactivo'}
            </Badge>
          </div>
        </div>
      </div>

      <ProfessionalCalendarView
        appointments={(appointments ?? []) as AppointmentWithRelations[]}
        professionalName={professional.name}
      />
    </div>
  )
}
