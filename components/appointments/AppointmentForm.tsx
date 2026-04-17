'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { appointmentSchema, AppointmentFormData } from '@/lib/validations/appointment'
import { Professional, Service } from '@/lib/supabase/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { SlotPicker } from './SlotPicker'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AppointmentFormProps {
  professionals: Professional[]
  services: Service[]
  professionalServices: { professional_id: string; service_id: string }[]
  defaultValues?: Partial<AppointmentFormData>
  onSuccess?: () => void
}

const STEPS = ['Servicio y profesional', 'Fecha y horario', 'Datos del cliente']

export function AppointmentForm({ professionals, services, professionalServices, defaultValues, onSuccess }: AppointmentFormProps) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      professional_id: '',
      service_id: '',
      client_name: '',
      client_email: '',
      client_phone: '',
      start_time: '',
      notes: '',
      ...defaultValues,
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

  const canGoNext = () => {
    if (step === 0) return !!watchService && !!watchProfessional
    if (step === 1) return !!watchStartTime
    return true
  }

  const onSubmit = async (data: AppointmentFormData) => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Error al crear turno')
      }
      toast.success('Turno creado exitosamente')
      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/turnos')
        router.refresh()
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al crear turno')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Stepper */}
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div className={cn(
              'h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0 transition-colors',
              i < step ? 'bg-primary text-primary-foreground' :
              i === step ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2' :
              'bg-muted text-muted-foreground'
            )}>
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span className={cn('text-sm hidden sm:block', i === step ? 'font-medium' : 'text-muted-foreground')}>
              {label}
            </span>
            {i < STEPS.length - 1 && <div className="flex-1 h-px bg-border" />}
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={form.handleSubmit(onSubmit)}>

            {/* Paso 1 */}
            {step === 0 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="service_id">Servicio</Label>
                  <Select
                    value={watchService || null}
                    onValueChange={(val) => {
                      form.setValue('service_id', val ?? '')
                      form.setValue('professional_id', '')
                    }}
                    items={services.filter(s => s.active).map(s => ({ value: s.id, label: s.name }))}
                  >
                    <SelectTrigger id="service_id" className="w-full" aria-label="Seleccionar servicio">
                      <SelectValue placeholder="Elegí un servicio" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.filter(s => s.active).map(s => (
                        <SelectItem key={s.id} value={s.id} label={s.name}>
                          <span className="flex items-center gap-2">
                            <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: s.color ?? '#6366f1' }} />
                            {s.name} · {s.duration_minutes} min{s.price ? ` · $${s.price}` : ''}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.service_id && (
                    <p className="text-xs text-destructive">{form.formState.errors.service_id.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="professional_id">Profesional</Label>
                  <Select
                    value={watchProfessional || null}
                    onValueChange={(val) => form.setValue('professional_id', val ?? '')}
                    disabled={!watchService}
                    items={availableProfessionals.filter(p => p.active).map(p => ({ value: p.id, label: p.name }))}
                  >
                    <SelectTrigger id="professional_id" className="w-full" aria-label="Seleccionar profesional">
                      <SelectValue placeholder={watchService ? 'Elegí un profesional' : 'Primero seleccioná un servicio'} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProfessionals.filter(p => p.active).map(p => (
                        <SelectItem key={p.id} value={p.id} label={p.name}>
                          {p.name}{p.specialty ? ` — ${p.specialty}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.professional_id && (
                    <p className="text-xs text-destructive">{form.formState.errors.professional_id.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* Paso 2 */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Seleccioná una fecha</Label>
                  <div className="flex justify-center">
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
                  </div>
                </div>

                {selectedDate && (
                  <div className="space-y-2">
                    <Label>
                      Horarios disponibles — {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
                    </Label>
                    <SlotPicker
                      professionalId={watchProfessional}
                      date={selectedDate}
                      duration={selectedService?.duration_minutes ?? 30}
                      selectedSlot={watchStartTime || null}
                      onSelect={(slot) => form.setValue('start_time', slot)}
                    />
                  </div>
                )}

                {form.formState.errors.start_time && (
                  <p className="text-xs text-destructive">{form.formState.errors.start_time.message}</p>
                )}
              </div>
            )}

            {/* Paso 3 */}
            {step === 2 && (
              <div className="space-y-4">
                {watchStartTime && (
                  <div className="p-3 rounded-md bg-muted text-sm">
                    <p className="font-medium">Resumen del turno</p>
                    <p className="text-muted-foreground">
                      {selectedService?.name} · {format(new Date(watchStartTime), "EEEE d 'de' MMMM 'a las' HH:mm", { locale: es })}
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="client_name">Nombre completo *</Label>
                  <Input id="client_name" placeholder="Ej: María García" {...form.register('client_name')} aria-label="Nombre del cliente" />
                  {form.formState.errors.client_name && (
                    <p className="text-xs text-destructive">{form.formState.errors.client_name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_email">Email *</Label>
                  <Input id="client_email" type="email" placeholder="maria@ejemplo.com" {...form.register('client_email')} aria-label="Email del cliente" />
                  {form.formState.errors.client_email && (
                    <p className="text-xs text-destructive">{form.formState.errors.client_email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_phone">Teléfono (opcional)</Label>
                  <Input id="client_phone" type="tel" placeholder="+54 11 1234-5678" {...form.register('client_phone')} aria-label="Teléfono del cliente" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notas (opcional)</Label>
                  <Textarea id="notes" placeholder="Información adicional..." rows={3} {...form.register('notes')} aria-label="Notas adicionales" />
                </div>
              </div>
            )}

            <div className="flex justify-between mt-6 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => step > 0 ? setStep(s => s - 1) : router.back()}
                aria-label="Paso anterior"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                {step === 0 ? 'Cancelar' : 'Anterior'}
              </Button>

              {step < STEPS.length - 1 ? (
                <Button type="button" onClick={() => setStep(s => s + 1)} disabled={!canGoNext()} aria-label="Siguiente paso">
                  Siguiente
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button type="submit" disabled={submitting} aria-label="Confirmar turno">
                  {submitting ? 'Guardando...' : 'Confirmar turno'}
                  <Check className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
