import { Badge } from '@/components/ui/badge'
import { AppointmentStatus } from '@/lib/supabase/types'

interface AppointmentStatusBadgeProps {
  status: AppointmentStatus | string | null
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  confirmed: { label: 'Confirmado', variant: 'default' },
  completed: { label: 'Completado', variant: 'secondary' },
  cancelled: { label: 'Cancelado', variant: 'destructive' },
  no_show: { label: 'No asistió', variant: 'outline' },
}

export function AppointmentStatusBadge({ status }: AppointmentStatusBadgeProps) {
  const config = STATUS_CONFIG[status ?? ''] ?? { label: status ?? '—', variant: 'outline' as const }
  return <Badge variant={config.variant}>{config.label}</Badge>
}
