'use client'

import 'temporal-polyfill/global'
import { Temporal } from 'temporal-polyfill'
import { useNextCalendarApp, ScheduleXCalendar } from '@schedule-x/react'
import { createViewWeek, createViewDay, createViewMonthGrid, createViewMonthAgenda } from '@schedule-x/calendar'
import { createEventsServicePlugin } from '@schedule-x/events-service'
import { useEffect, useCallback, useMemo, useState, useRef } from 'react'
import { AppointmentWithRelations } from '@/lib/supabase/types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { AppointmentStatusBadge } from '@/components/appointments/AppointmentStatusBadge'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'
import { Maximize, X } from 'lucide-react'

import '@schedule-x/theme-shadcn/dist/index.css'

const TZ = 'America/Argentina/Buenos_Aires'
// Palette of distinct colors used when a service has no color defined
const FALLBACK_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316']

function toZDT(isoStr: string): Temporal.ZonedDateTime {
  return Temporal.Instant.from(new Date(isoStr).toISOString()).toZonedDateTimeISO(TZ)
}

function formatART(isoStr: string, fmt: string): string {
  const zdt = toZDT(isoStr)
  return format(
    new Date(zdt.year, zdt.month - 1, zdt.day, zdt.hour, zdt.minute, zdt.second),
    fmt,
    { locale: es }
  )
}

interface AppCalendarProps {
  appointments: AppointmentWithRelations[]
}

export function AppCalendar({ appointments }: AppCalendarProps) {
  const router = useRouter()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithRelations | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Escape exits fullscreen
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsFullscreen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  // Dispatch resize so Schedule-X recalculates after fullscreen toggle
  useEffect(() => {
    const t = setTimeout(() => window.dispatchEvent(new Event('resize')), 60)
    return () => clearTimeout(t)
  }, [isFullscreen])

  // Dark mode sync
  useEffect(() => {
    const apply = () => {
      const el = wrapperRef.current?.querySelector('.sx__calendar-wrapper') as HTMLElement | null
      if (!el) return
      el.classList.toggle('is-dark', document.documentElement.classList.contains('dark'))
    }
    apply()
    const observer = new MutationObserver(apply)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  // Build per-service color config for Schedule-X
  // colorName MUST be a valid CSS identifier (no spaces) — use cal-N
  const calendarsConfig = useMemo(() => {
    const map: Record<string, {
      colorName: string
      lightColors: { main: string; container: string; onContainer: string }
      darkColors: { main: string; container: string; onContainer: string }
    }> = {}
    let idx = 0
    let fallbackIdx = 0
    for (const apt of appointments) {
      const svcId = apt.service_id ?? 'default'
      if (map[svcId]) continue
      const rawHex = apt.services?.color ?? ''
      const hex = /^#[0-9a-fA-F]{6}$/.test(rawHex)
        ? rawHex
        : FALLBACK_COLORS[fallbackIdx++ % FALLBACK_COLORS.length]
      map[svcId] = {
        colorName: `cal-${idx++}`,
        lightColors: { main: hex, container: hex + '33', onContainer: '#111827' },
        darkColors:  { main: hex, container: hex + '55', onContainer: '#f9fafb' },
      }
    }
    return map
  }, [appointments])

  const mapToCalendarEvent = useCallback((apt: AppointmentWithRelations) => ({
    id: apt.id,
    title: `${apt.client_name} — ${apt.services?.name ?? 'Servicio'}`,
    start: toZDT(apt.start_time),
    end: toZDT(apt.end_time),
    calendarId: apt.service_id ?? 'default',
  }), [])

  const eventsService = useMemo(() => createEventsServicePlugin(), [])
  const plugins = useMemo(() => [eventsService], [eventsService])
  const today = useMemo(() => Temporal.Now.plainDateISO(TZ), [])

  const calendar = useNextCalendarApp(
    {
      views: [createViewMonthGrid(), createViewWeek(), createViewDay(), createViewMonthAgenda()],
      defaultView: createViewWeek().name,
      selectedDate: today,
      timezone: TZ,
      dayBoundaries: { start: '07:00', end: '23:00' },
      events: appointments.map(mapToCalendarEvent),
      calendars: calendarsConfig,
      locale: 'es-ES',
      callbacks: {
        onEventClick(event) {
          const apt = appointments.find(a => a.id === event.id)
          if (!apt) return
          setSelectedAppointment(apt)
          setSheetOpen(true)
        },
      },
    },
    plugins
  )

  useEffect(() => {
    if (!eventsService || !calendar) return
    try { eventsService.set(appointments.map(mapToCalendarEvent)) } catch { /* not yet connected */ }
  }, [appointments, eventsService, calendar, mapToCalendarEvent])

  // Apply dark class once calendar mounts
  useEffect(() => {
    const t = setTimeout(() => {
      const el = wrapperRef.current?.querySelector('.sx__calendar-wrapper') as HTMLElement | null
      if (el) el.classList.toggle('is-dark', document.documentElement.classList.contains('dark'))
    }, 100)
    return () => clearTimeout(t)
  }, [calendar])

  const handleCancel = async () => {
    if (!selectedAppointment) return
    try {
      const res = await fetch(`/api/appointments/${selectedAppointment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      })
      if (!res.ok) throw new Error()
      toast.success('Turno cancelado')
      setSheetOpen(false)
      setSelectedAppointment(null)
      router.refresh()
    } catch {
      toast.error('No se pudo cancelar el turno')
    }
  }

  return (
    <>
      {isFullscreen ? (
        /* ── FULLSCREEN: absolute layout so Schedule-X gets a concrete pixel height ── */
        <div className="fixed inset-0 z-[100] bg-background">
          {/* Toolbar — 44 px tall, pinned to top */}
          <div className="absolute inset-x-0 top-0 h-11 border-b bg-background flex items-center justify-between px-4 z-10">
            <span className="text-sm font-medium text-muted-foreground">Calendario</span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setIsFullscreen(false)}
              aria-label="Salir de pantalla completa"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Calendar — fills remaining space; shrinks when detail panel is open */}
          <div
            ref={wrapperRef}
            className="absolute top-11 bottom-0 left-0"
            style={{ right: selectedAppointment ? '320px' : '0' }}
          >
            <ScheduleXCalendar calendarApp={calendar} />
          </div>

          {/* Detail panel — 320 px wide, pinned to right, z-index above week header */}
          {selectedAppointment && (
            <div className="absolute top-11 right-0 bottom-0 w-80 border-l bg-background flex flex-col overflow-y-auto z-20">
              <div className="flex items-center justify-between p-4 border-b shrink-0">
                <p className="font-medium text-sm">Detalle del turno</p>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setSelectedAppointment(null)}
                  aria-label="Cerrar"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-4 p-4 overflow-y-auto">
                <div>
                  <p className="text-xs text-muted-foreground">Cliente</p>
                  <p className="font-semibold">{selectedAppointment.client_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedAppointment.client_email}</p>
                  {selectedAppointment.client_phone && (
                    <p className="text-sm text-muted-foreground">{selectedAppointment.client_phone}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Servicio</p>
                  <p className="font-medium">{selectedAppointment.services?.name ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Profesional</p>
                  <p className="font-medium">{selectedAppointment.professionals?.name ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Fecha y hora</p>
                  <p className="font-medium">
                    {formatART(selectedAppointment.start_time, "EEEE d 'de' MMMM, HH:mm")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Estado</p>
                  <div className="mt-1">
                    <AppointmentStatusBadge status={selectedAppointment.status} />
                  </div>
                </div>
                {selectedAppointment.notes && (
                  <div>
                    <p className="text-xs text-muted-foreground">Notas</p>
                    <p className="text-sm">{selectedAppointment.notes}</p>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    nativeButton={false}
                    render={<Link href={`/turnos/${selectedAppointment.id}`} />}
                    onClick={() => setIsFullscreen(false)}
                    aria-label="Editar turno"
                  >
                    Editar
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={handleCancel}
                    disabled={selectedAppointment.status === 'cancelled'}
                    aria-label="Cancelar turno"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ── NORMAL: fixed height calendar with expand button ── */
        <div className="relative h-[calc(100vh-10rem)] w-full" ref={wrapperRef}>
          <Button
            variant="ghost"
            size="icon-sm"
            className="absolute top-2 right-2 z-10 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsFullscreen(true)}
            aria-label="Pantalla completa"
          >
            <Maximize className="h-4 w-4" />
          </Button>
          <ScheduleXCalendar calendarApp={calendar} />
        </div>
      )}

      {/* Sheet — only used in normal (non-fullscreen) view */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto">
          {selectedAppointment && (
            <>
              <SheetHeader>
                <SheetTitle>Detalle del turno</SheetTitle>
              </SheetHeader>
              <div className="space-y-4 px-4 pb-4">
                <div>
                  <p className="text-xs text-muted-foreground">Cliente</p>
                  <p className="font-semibold">{selectedAppointment.client_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedAppointment.client_email}</p>
                  {selectedAppointment.client_phone && (
                    <p className="text-sm text-muted-foreground">{selectedAppointment.client_phone}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Servicio</p>
                  <p className="font-medium">{selectedAppointment.services?.name ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Profesional</p>
                  <p className="font-medium">{selectedAppointment.professionals?.name ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Fecha y hora</p>
                  <p className="font-medium">
                    {formatART(selectedAppointment.start_time, "EEEE d 'de' MMMM, HH:mm")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Estado</p>
                  <div className="mt-1">
                    <AppointmentStatusBadge status={selectedAppointment.status} />
                  </div>
                </div>
                {selectedAppointment.notes && (
                  <div>
                    <p className="text-xs text-muted-foreground">Notas</p>
                    <p className="text-sm">{selectedAppointment.notes}</p>
                  </div>
                )}
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    nativeButton={false}
                    render={<Link href={`/turnos/${selectedAppointment.id}`} />}
                    onClick={() => setSheetOpen(false)}
                    aria-label="Editar turno"
                  >
                    Editar
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={handleCancel}
                    disabled={selectedAppointment.status === 'cancelled'}
                    aria-label="Cancelar turno"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
