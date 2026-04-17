import { createClient } from '@/lib/supabase/server'
import { ProfesionalesClient } from '@/components/profesionales/ProfesionalesClient'

export default async function ProfesionalesPage() {
  const supabase = await createClient()

  const { data: professionals } = await supabase
    .from('professionals')
    .select('*, professional_services(service_id, services(name))')
    .order('name')

  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('active', true)
    .order('name')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Profesionales</h2>
        <p className="text-muted-foreground">Gestión del equipo de profesionales</p>
      </div>
      <ProfesionalesClient
        professionals={professionals ?? []}
        services={services ?? []}
      />
    </div>
  )
}
