import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { TodaySchedule } from '@/components/dashboard/TodaySchedule'
import { UpcomingAppointments } from '@/components/dashboard/UpcomingAppointments'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CalendarDays, CheckCircle, Clock, AlertCircle, ExternalLink, QrCode } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'

async function DashboardMetrics() {
  try {
    const supabase = await createClient()
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString()

    const { data: todayAppointments, error } = await supabase
      .from('appointments')
      .select('id, status, start_time, client_name, services(name)')
      .gte('start_time', startOfDay)
      .lte('start_time', endOfDay)

    if (error) throw error

    const total = todayAppointments?.length ?? 0
    const completed = todayAppointments?.filter(a => a.status === 'completed').length ?? 0
    const pending = todayAppointments?.filter(a => a.status === 'confirmed').length ?? 0

    const now = new Date()
    const nextAppointment = todayAppointments
      ?.filter(a => a.status === 'confirmed' && new Date(a.start_time) >= now)
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())[0]

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Turnos de hoy"
          value={total}
          subtitle={format(today, "EEEE d 'de' MMMM", { locale: es })}
          icon={CalendarDays}
        />
        <MetricCard
          title="Próximo turno"
          value={nextAppointment ? format(new Date(nextAppointment.start_time), 'HH:mm') : '—'}
          subtitle={nextAppointment ? nextAppointment.client_name : 'Sin turnos'}
          icon={Clock}
          iconColor="text-blue-500"
        />
        <MetricCard
          title="Completados hoy"
          value={completed}
          subtitle={`de ${total} totales`}
          icon={CheckCircle}
          iconColor="text-green-500"
        />
        <MetricCard
          title="Turnos pendientes"
          value={pending}
          subtitle="confirmados y sin atender"
          icon={AlertCircle}
          iconColor="text-amber-500"
        />
      </div>
    )
  } catch (err) {
    console.error('[DashboardMetrics]', err)
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
        No se pudieron cargar las métricas. Verificá que las variables de entorno de Supabase estén configuradas en Vercel y que el proyecto no esté pausado.
      </div>
    )
  }
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Resumen del día y próximas citas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            nativeButton={false}
            render={<Link href="/reservar" target="_blank" />}
          >
            <ExternalLink className="h-4 w-4" />
            Página de turnos
          </Button>
          <Button
            variant="default"
            size="sm"
            className="gap-2"
            nativeButton={false}
            render={<Link href="/qr" target="_blank" />}
          >
            <QrCode className="h-4 w-4" />
            Imprimir QR
          </Button>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[100px] rounded-xl" />
            ))}
          </div>
        }
      >
        <DashboardMetrics />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Agenda de hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>}>
              <TodaySchedule />
            </Suspense>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Próximos turnos</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>}>
              <UpcomingAppointments />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
