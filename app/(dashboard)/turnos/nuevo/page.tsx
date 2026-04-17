import { createClient } from '@/lib/supabase/server'
import { AppointmentForm } from '@/components/appointments/AppointmentForm'

export default async function NuevoTurnoPage() {
  const supabase = await createClient()

  const [{ data: professionals }, { data: services }, { data: professionalServices }] = await Promise.all([
    supabase.from('professionals').select('*').eq('active', true).order('name'),
    supabase.from('services').select('*').eq('active', true).order('name'),
    supabase.from('professional_services').select('*'),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Nuevo turno</h2>
        <p className="text-muted-foreground">Agendá un nuevo turno en 3 simples pasos</p>
      </div>
      <AppointmentForm
        professionals={professionals ?? []}
        services={services ?? []}
        professionalServices={professionalServices ?? []}
      />
    </div>
  )
}
