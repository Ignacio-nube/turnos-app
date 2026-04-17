'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'
import { appointmentSchema, AppointmentFormData } from '@/lib/validations/appointment'
import { AppointmentWithRelations, Professional, Service } from '@/lib/supabase/types'
import { AppointmentStatusBadge } from './AppointmentStatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { SlotPicker } from './SlotPicker'
import { Save, Trash2 } from 'lucide-react'

interface AppointmentDetailProps {
  appointment: AppointmentWithRelations
  professionals: Professional[]
  services: Service[]
  professionalServices: { professional_id: string; service_id: string }[]
}

const STATUS_OPTIONS = [
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'completed', label: 'Completado' },
  { value: 'cancelled', label: 'Cancelado' },
  { value: 'no_show', label: 'No asistió' },
]

export function AppointmentDetail({
  appointment: apt,
  professionals,
  services,
  professionalServices,
}: AppointmentDetailProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date(apt.start_time))
  const [currentStatus, setCurrentStatus] = useState(apt.status ?? 'confirmed')
  const [editingSlot, setEditingSlot] = useState(false)

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      professional_id: apt.professional_id ?? '',
      service_id: apt.service_id ?? '',
      client_name: apt.client_name,
      client_email: apt.client_email,
      client_phone: apt.client_phone ?? '',
      start_time: apt.start_time,
      notes: apt.notes ?? '',
    },
  })

  const watchService = form.watch('service_id')
  const watchProfessional = form.watch('professional_id')
  const watchStartTime = form.watch('start_time')

  const selectedService = services.find(s => s.id === watchService)
  const availableProfessionals = watchService
    ? professionals.filter(p =>
        professionalServices.some(ps => ps.service_id === watchService && ps.professional_id === p.id)
      )
    : professionals

  const onSubmit = async (data: AppointmentFormData) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/appointments/${apt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, status: currentStatus }),
      })
      if (!res.ok) throw new Error('Error al guardar')
      toast.success('Turno actualizado')
      router.refresh()
    } catch {
      toast.error('No se pudo actualizar el turno')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('¿Eliminár este turno permanentemente?')) return
    try {
      const res = await fetch(`/api/appointments/${apt.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Turno eliminado')
      router.push('/turnos')
      router.refresh()
    } catch {
      toast.error('No se pudo eliminar el turno')
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Estado del turno</CardTitle>
            <AppointmentStatusBadge status={currentStatus} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            {STATUS_OPTIONS.map(opt => (
              <Button
                key={opt.value}
                variant={currentStatus === opt.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentStatus(opt.value)}
                aria-label={`Cambiar estado a ${opt.label}`}
                aria-pressed={currentStatus === opt.value}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Información del turno</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="service_id">Servicio</Label>
                <Select
                  value={watchService || null}
                  onValueChange={(val) => form.setValue('service_id', val ?? '')}
                  items={services.filter(s => s.active).map(s => ({ value: s.id, label: s.name }))}
                >
                  <SelectTrigger id="service_id" className="w-full">
                    <SelectValue placeholder="Seleccioná servicio" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.filter(s => s.active).map(s => (
                      <SelectItem key={s.id} value={s.id} label={s.name}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="professional_id">Profesional</Label>
                <Select
                  value={watchProfessional || null}
                  onValueChange={(val) => form.setValue('professional_id', val ?? '')}
                  items={availableProfessionals.map(p => ({ value: p.id, label: p.name }))}
                >
                  <SelectTrigger id="professional_id" className="w-full">
                    <SelectValue placeholder="Seleccioná profesional" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProfessionals.map(p => (
                      <SelectItem key={p.id} value={p.id} label={p.name}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Fecha y hora</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingSlot(!editingSlot)}
                >
                  {editingSlot ? 'Cancelar' : 'Cambiar horario'}
                </Button>
              </div>
              {!editingSlot ? (
                <p className="text-sm font-medium">
                  {format(new Date(apt.start_time), "EEEE d 'de' MMMM 'a las' HH:mm", { locale: es })}
                </p>
              ) : (
                <div className="space-y-3">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date)
                      form.setValue('start_time', '')
                    }}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    locale={es}
                    className="rounded-md border"
                  />
                  {selectedDate && (
                    <SlotPicker
                      professionalId={watchProfessional}
                      date={selectedDate}
                      duration={selectedService?.duration_minutes ?? 30}
                      selectedSlot={watchStartTime || null}
                      onSelect={(slot) => form.setValue('start_time', slot)}
                    />
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_name">Nombre del cliente</Label>
              <Input id="client_name" {...form.register('client_name')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client_email">Email</Label>
                <Input id="client_email" type="email" {...form.register('client_email')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client_phone">Teléfono</Label>
                <Input id="client_phone" {...form.register('client_phone')} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea id="notes" rows={3} {...form.register('notes')} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between mt-4">
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            aria-label="Eliminar turno"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar
          </Button>
          <Button type="submit" disabled={saving} aria-label="Guardar cambios">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </div>
  )
}
