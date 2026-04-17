import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { AppointmentDetail } from '@/components/appointments/AppointmentDetail'

export default async function TurnoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: appointment }, { data: professionals }, { data: services }, { data: professionalServices }] =
    await Promise.all([
      supabase
        .from('appointments')
        .select('*, professionals(id, name, specialty), services(id, name, color, duration_minutes)')
        .eq('id', id)
        .single(),
      supabase.from('professionals').select('*').eq('active', true).order('name'),
      supabase.from('services').select('*').eq('active', true).order('name'),
      supabase.from('professional_services').select('*'),
    ])

  if (!appointment) notFound()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Detalle del turno</h2>
        <p className="text-muted-foreground">Ver y editar información del turno</p>
      </div>
      <AppointmentDetail
        appointment={appointment}
        professionals={professionals ?? []}
        services={services ?? []}
        professionalServices={professionalServices ?? []}
      />
    </div>
  )
}
