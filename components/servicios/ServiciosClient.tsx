'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Service } from '@/lib/supabase/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Clock, DollarSign, Plus, Edit, Trash2 } from 'lucide-react'

const serviceSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  description: z.string().optional(),
  duration_minutes: z.number().min(5, 'Mínimo 5 minutos').max(480, 'Máximo 8 horas'),
  price: z.number().min(0).optional(),
  color: z.string().min(1),
})

type ServiceFormData = z.infer<typeof serviceSchema>

const COLOR_PRESETS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#64748b',
]

interface ServiciosClientProps {
  services: Service[]
}

export function ServiciosClient({ services: initialServices }: ServiciosClientProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Service | null>(null)
  const [saving, setSaving] = useState(false)

  const form = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: '',
      description: '',
      duration_minutes: 30,
      price: undefined,
      color: '#6366f1',
    },
  })

  const watchColor = form.watch('color')

  const openNew = () => {
    form.reset({ name: '', description: '', duration_minutes: 30, price: undefined, color: '#6366f1' })
    setEditing(null)
    setOpen(true)
  }

  const openEdit = (s: Service) => {
    form.reset({
      name: s.name,
      description: s.description ?? '',
      duration_minutes: s.duration_minutes,
      price: s.price ?? undefined,
      color: s.color ?? '#6366f1',
    })
    setEditing(s)
    setOpen(true)
  }

  const onSubmit = async (data: ServiceFormData) => {
    setSaving(true)
    try {
      const res = await fetch(editing ? `/api/services/${editing.id}` : '/api/services', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error()
      toast.success(editing ? 'Servicio actualizado' : 'Servicio creado')
      setOpen(false)
      router.refresh()
    } catch {
      toast.error('Error al guardar el servicio')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este servicio?')) return
    try {
      const res = await fetch(`/api/services/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Servicio eliminado')
      router.refresh()
    } catch {
      toast.error('Error al eliminar el servicio')
    }
  }

  const handleToggleActive = async (s: Service) => {
    try {
      const res = await fetch(`/api/services/${s.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !s.active }),
      })
      if (!res.ok) throw new Error()
      toast.success(s.active ? 'Servicio desactivado' : 'Servicio activado')
      router.refresh()
    } catch {
      toast.error('Error al cambiar estado')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openNew} aria-label="Agregar nuevo servicio">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo servicio
        </Button>
      </div>

      {!initialServices.length ? (
        <div className="flex flex-col items-center py-16 text-center">
          <svg className="h-16 w-16 text-muted-foreground/20 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <p className="text-lg font-medium text-muted-foreground">No hay servicios registrados</p>
          <Button onClick={openNew} className="mt-4">Crear el primero</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {initialServices.map((s) => (
            <Card key={s.id} className={!s.active ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className="h-10 w-10 rounded-lg shrink-0 flex items-center justify-center"
                    style={{ backgroundColor: s.color ?? '#6366f1' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate">{s.name}</p>
                      {!s.active && <Badge variant="outline" className="text-xs">Inactivo</Badge>}
                    </div>
                    {s.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{s.description}</p>}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {s.duration_minutes} min
                      </span>
                      {s.price && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {s.price}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(s)}
                    className="flex-1"
                    aria-label={`Editar ${s.name}`}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleActive(s)}
                    aria-label={s.active ? `Desactivar ${s.name}` : `Activar ${s.name}`}
                  >
                    {s.active ? 'Desactivar' : 'Activar'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(s.id)}
                    aria-label={`Eliminar ${s.name}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar servicio' : 'Nuevo servicio'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="svc-name">Nombre *</Label>
              <Input id="svc-name" {...form.register('name')} />
              {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="svc-description">Descripción</Label>
              <Textarea id="svc-description" rows={2} {...form.register('description')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="svc-duration">Duración (minutos) *</Label>
                <Input id="svc-duration" type="number" min={5} max={480} {...form.register('duration_minutes', { valueAsNumber: true })} />
                {form.formState.errors.duration_minutes && <p className="text-xs text-destructive">{form.formState.errors.duration_minutes.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="svc-price">Precio (opcional)</Label>
                <Input id="svc-price" type="number" min={0} step={0.01} {...form.register('price', { valueAsNumber: true })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded border" style={{ backgroundColor: watchColor }} />
                <div className="flex flex-wrap gap-1.5">
                  {COLOR_PRESETS.map(c => (
                    <button
                      key={c}
                      type="button"
                      className={`h-6 w-6 rounded-full transition-all ${watchColor === c ? 'ring-2 ring-offset-1 ring-foreground scale-110' : ''}`}
                      style={{ backgroundColor: c }}
                      onClick={() => form.setValue('color', c)}
                      aria-label={`Seleccionar color ${c}`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear servicio'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
