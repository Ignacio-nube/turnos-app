'use client'

import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { AppointmentWithRelations } from '@/lib/supabase/types'
import { AppointmentStatusBadge } from './AppointmentStatusBadge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreVertical, Edit, XCircle, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface AppointmentCardProps {
  appointment: AppointmentWithRelations
}

export function AppointmentCard({ appointment: apt }: AppointmentCardProps) {
  const router = useRouter()

  const updateStatus = async (status: string) => {
    try {
      const res = await fetch(`/api/appointments/${apt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error()
      toast.success('Estado actualizado')
      router.refresh()
    } catch {
      toast.error('No se pudo actualizar el estado')
    }
  }

  return (
    <Card className="hover:bg-accent/30 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className="h-10 w-10 rounded-full shrink-0 flex items-center justify-center text-white text-sm font-bold mt-0.5"
              style={{ backgroundColor: (apt.services as { color?: string | null } | null)?.color ?? '#6366f1' }}
            >
              {apt.client_name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-semibold truncate">{apt.client_name}</p>
              <p className="text-sm text-muted-foreground truncate">
                {(apt.services as { name?: string } | null)?.name} · {(apt.professionals as { name?: string } | null)?.name}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {format(new Date(apt.start_time), "EEEE d 'de' MMM, HH:mm", { locale: es })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <AppointmentStatusBadge status={apt.status} />
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Opciones del turno" />}
              >
                <MoreVertical className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem render={<Link href={`/turnos/${apt.id}`} />}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateStatus('completed')}>
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  Marcar completado
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => updateStatus('cancelled')}
                  className="text-destructive"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancelar turno
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
