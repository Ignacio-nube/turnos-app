import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { AppointmentStatusBadge } from '@/components/appointments/AppointmentStatusBadge'
import { Card, CardContent } from '@/components/ui/card'

interface AppointmentResult {
  id: string
  client_name: string
  client_email: string
  client_phone?: string | null
  start_time: string
  end_time: string
  status: string | null
  notes?: string | null
  professionals?: { name: string; specialty?: string | null } | null
  services?: { name: string; color?: string | null; duration_minutes?: number } | null
}

interface AppointmentResultCardProps {
  appointment: AppointmentResult
}

export function AppointmentResultCard({ appointment: apt }: AppointmentResultCardProps) {
  return (
    <Card className="my-1">
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div
            className="h-8 w-8 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: apt.services?.color ?? '#6366f1' }}
          >
            {apt.client_name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium text-sm truncate">{apt.client_name}</p>
              <AppointmentStatusBadge status={apt.status} />
            </div>
            <p className="text-xs text-muted-foreground">
              {apt.services?.name} · {apt.professionals?.name}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {format(new Date(apt.start_time), "EEEE d 'de' MMM, HH:mm", { locale: es })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
