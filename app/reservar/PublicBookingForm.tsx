'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'
import { appointmentSchema, AppointmentFormData } from '@/lib/validations/appointment'
import { Professional, Service } from '@/lib/supabase/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { SlotPicker } from '@/components/appointments/SlotPicker'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, Check, Clock, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PublicBookingFormProps {
  professionals: Professional[]
  services: Service[]
  professionalServices: { professional_id: string; service_id: string }[]
}

const STEPS = ['Servicio', 'Fecha y horario', 'Tus datos']

export function PublicBookingForm({ professionals, services, professionalServices }: PublicBookingFormProps) {
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
    },
  })

  const watchService = form.watch('service_id')
  const watchProfessional = form.watch('professional_id')
  const watchStartTime = form.watch('start_time')

  const selectedService = services.find(s => s.id === watchService)
  const selectedProfessional = professionals.find(p => p.id === watchProfessional)

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
      router.push('/reservar/confirmado')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al crear turno')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
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

            {/* Paso 1: Servicio y profesional */}
            {step === 0 && (
              <div className="space-y-5">
                <div className="space-y-3">
                  <Label className="text-base font-medium">¿Qué servicio necesitás?</Label>
                  <div className="grid gap-2">
                    {services.map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          form.setValue('service_id', s.id)
                          form.setValue('professional_id', '')
                        }}
                        className={cn(
                          'flex items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted',
                          watchService === s.id && 'border-primary bg-primary/5'
                        )}
                      >
                        <span
                          className="mt-0.5 h-4 w-4 rounded-full shrink-0"
                          style={{ backgroundColor: s.color ?? '#6366f1' }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{s.name}</p>
                          {s.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{s.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1">
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {s.duration_minutes} min
                            </span>
                            {s.price != null && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <DollarSign className="h-3 w-3" />
                                {s.price}
                              </span>
                            )}
                          </div>
                        </div>
                        {watchService === s.id && (
                          <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        )}
                      </button>
                    ))}
                  </div>
                  {form.formState.errors.service_id && (
                    <p className="text-xs text-destructive">{form.formState.errors.service_id.message}</p>
                  )}
                </div>

                {watchService && (
                  <div className="space-y-3">
                    <Label className="text-base font-medium">¿Con quién querés atenderte?</Label>
                    {availableProfessionals.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No hay profesionales disponibles para este servicio.</p>
                    ) : (
                      <div className="grid gap-2">
                        {availableProfessionals.map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => form.setValue('professional_id', p.id)}
                            className={cn(
                              'flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted',
                              watchProfessional === p.id && 'border-primary bg-primary/5'
                            )}
                          >
                            <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0 text-sm font-medium">
                              {p.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{p.name}</p>
                              {p.specialty && (
                                <p className="text-xs text-muted-foreground">{p.specialty}</p>
                              )}
                            </div>
                            {watchProfessional === p.id && (
                              <Check className="h-4 w-4 text-primary shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                    {form.formState.errors.professional_id && (
                      <p className="text-xs text-destructive">{form.formState.errors.professional_id.message}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Paso 2: Fecha y horario */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-base font-medium">Elegí una fecha</Label>
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
                    <Label className="text-base font-medium">
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

            {/* Paso 3: Datos del cliente */}
            {step === 2 && (
              <div className="space-y-4">
                {watchStartTime && selectedService && (
                  <div className="p-3 rounded-lg bg-muted text-sm space-y-1">
                    <p className="font-medium">Resumen de tu turno</p>
                    <p className="text-muted-foreground">
                      {selectedService.name}
                      {selectedProfessional && ` con ${selectedProfessional.name}`}
                    </p>
                    <p className="text-muted-foreground">
                      {format(new Date(watchStartTime), "EEEE d 'de' MMMM 'a las' HH:mm", { locale: es })}
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="client_name">Nombre completo *</Label>
                  <Input
                    id="client_name"
                    placeholder="Ej: María García"
                    {...form.register('client_name')}
                  />
                  {form.formState.errors.client_name && (
                    <p className="text-xs text-destructive">{form.formState.errors.client_name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_email">Email *</Label>
                  <Input
                    id="client_email"
                    type="email"
                    placeholder="maria@ejemplo.com"
                    {...form.register('client_email')}
                  />
                  {form.formState.errors.client_email && (
                    <p className="text-xs text-destructive">{form.formState.errors.client_email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_phone">Teléfono (opcional)</Label>
                  <Input
                    id="client_phone"
                    type="tel"
                    placeholder="+54 11 1234-5678"
                    {...form.register('client_phone')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notas (opcional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="¿Algún comentario adicional?"
                    rows={3}
                    {...form.register('notes')}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-between mt-6 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => step > 0 ? setStep(s => s - 1) : router.back()}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                {step === 0 ? 'Volver' : 'Anterior'}
              </Button>

              {step < STEPS.length - 1 ? (
                <Button
                  type="button"
                  onClick={() => setStep(s => s + 1)}
                  disabled={!canGoNext()}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Confirmando...' : 'Confirmar turno'}
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
