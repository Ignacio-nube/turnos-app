import { createClient } from '@/lib/supabase/server'
import { AppointmentWithRelations } from '@/lib/supabase/types'
import { AppointmentCard } from '@/components/appointments/AppointmentCard'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { TurnosFilter } from '@/components/appointments/TurnosFilter'

interface SearchParams {
  status?: string
  search?: string
}

export default async function TurnosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const supabase = await createClient()
  const params = await searchParams

  let query = supabase
    .from('appointments')
    .select('*, professionals(id, name, specialty), services(id, name, color, duration_minutes)')
    .order('start_time', { ascending: false })

  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status)
  }
  if (params.search) {
    query = query.ilike('client_name', `%${params.search}%`)
  }

  const { data: appointments } = await query

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Turnos</h2>
          <p className="text-muted-foreground">{appointments?.length ?? 0} turnos encontrados</p>
        </div>
        <Button nativeButton={false} render={<Link href="/turnos/nuevo" />} aria-label="Agregar nuevo turno">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo turno
        </Button>
      </div>

      <TurnosFilter />

      {!appointments?.length ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <svg className="h-16 w-16 text-muted-foreground/20 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-lg font-medium text-muted-foreground">No hay turnos para mostrar</p>
          <p className="text-sm text-muted-foreground mt-1">Probá cambiando los filtros o creá un nuevo turno</p>
          <Button className="mt-4" nativeButton={false} render={<Link href="/turnos/nuevo" />}>
            Crear primer turno
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {(appointments as AppointmentWithRelations[]).map(apt => (
            <AppointmentCard key={apt.id} appointment={apt} />
          ))}
        </div>
      )}
    </div>
  )
}
