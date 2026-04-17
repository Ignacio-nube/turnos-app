import { createClient } from '@/lib/supabase/server'
import { ServiciosClient } from '@/components/servicios/ServiciosClient'

export default async function ServiciosPage() {
  const supabase = await createClient()
  const { data: services } = await supabase.from('services').select('*').order('name')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Servicios</h2>
        <p className="text-muted-foreground">Gestión de servicios ofrecidos</p>
      </div>
      <ServiciosClient services={services ?? []} />
    </div>
  )
}
