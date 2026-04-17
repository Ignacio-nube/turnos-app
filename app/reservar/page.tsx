import { createClient } from '@/lib/supabase/server'
import { PublicBookingForm } from './PublicBookingForm'

export default async function ReservarPage() {
  const supabase = await createClient()

  const [{ data: services }, { data: professionals }, { data: professionalServices }] =
    await Promise.all([
      supabase.from('services').select('*').eq('active', true).order('name'),
      supabase.from('professionals').select('*').eq('active', true).order('name'),
      supabase.from('professional_services').select('professional_id, service_id'),
    ])

  return (
    <div className="space-y-2">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Reservar turno</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Elegí el servicio, el profesional y el horario que mejor te convenga.
        </p>
      </div>
      <PublicBookingForm
        services={services ?? []}
        professionals={professionals ?? []}
        professionalServices={professionalServices ?? []}
      />
    </div>
  )
}
