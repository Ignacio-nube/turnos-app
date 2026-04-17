'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Professional, Service } from '@/lib/supabase/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Plus, Edit, Trash2, UserX } from 'lucide-react'

const professionalSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  specialty: z.string().optional(),
  bio: z.string().optional(),
})

type ProfessionalFormData = z.infer<typeof professionalSchema>

interface ProfessionalWithServices extends Professional {
  professional_services?: {
    service_id: string
    services: { name: string } | null
  }[]
}

interface ProfesionalesClientProps {
  professionals: ProfessionalWithServices[]
  services: Service[]
}

export function ProfesionalesClient({ professionals: initialProfessionals, services }: ProfesionalesClientProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Professional | null>(null)
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const form = useForm<ProfessionalFormData>({
    resolver: zodResolver(professionalSchema),
    defaultValues: { name: '', email: '', phone: '', specialty: '', bio: '' },
  })

  const openNew = () => {
    form.reset({ name: '', email: '', phone: '', specialty: '', bio: '' })
    setSelectedServices([])
    setEditing(null)
    setOpen(true)
  }

  const openEdit = (p: ProfessionalWithServices) => {
    form.reset({
      name: p.name,
      email: p.email,
      phone: p.phone ?? '',
      specialty: p.specialty ?? '',
      bio: p.bio ?? '',
    })
    setSelectedServices(p.professional_services?.map(ps => ps.service_id) ?? [])
    setEditing(p)
    setOpen(true)
  }

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev =>
      prev.includes(serviceId) ? prev.filter(id => id !== serviceId) : [...prev, serviceId]
    )
  }

  const onSubmit = async (data: ProfessionalFormData) => {
    setSaving(true)
    try {
      const res = await fetch(editing ? `/api/professionals/${editing.id}` : '/api/professionals', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, service_ids: selectedServices }),
      })
      if (!res.ok) throw new Error()
      toast.success(editing ? 'Profesional actualizado' : 'Profesional creado')
      setOpen(false)
      router.refresh()
    } catch {
      toast.error('Error al guardar el profesional')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este profesional?')) return
    try {
      const res = await fetch(`/api/professionals/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Profesional eliminado')
      router.refresh()
    } catch {
      toast.error('Error al eliminar el profesional')
    }
  }

  const handleToggleActive = async (p: Professional) => {
    try {
      const res = await fetch(`/api/professionals/${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !p.active }),
      })
      if (!res.ok) throw new Error()
      toast.success(p.active ? 'Profesional desactivado' : 'Profesional activado')
      router.refresh()
    } catch {
      toast.error('Error al cambiar estado')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openNew} aria-label="Agregar nuevo profesional">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo profesional
        </Button>
      </div>

      {!initialProfessionals.length ? (
        <div className="flex flex-col items-center py-16 text-center">
          <svg className="h-16 w-16 text-muted-foreground/20 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-lg font-medium text-muted-foreground">No hay profesionales registrados</p>
          <Button onClick={openNew} className="mt-4">Agregar el primero</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {initialProfessionals.map((p) => (
            <Card key={p.id} className={!p.active ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="text-lg">
                      {p.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate">{p.name}</p>
                      {!p.active && <Badge variant="outline" className="text-xs">Inactivo</Badge>}
                    </div>
                    {p.specialty && <p className="text-sm text-muted-foreground">{p.specialty}</p>}
                    <p className="text-xs text-muted-foreground mt-1">{p.email}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {p.professional_services?.slice(0, 3).map(ps => (
                        <Badge key={ps.service_id} variant="secondary" className="text-xs">
                          {ps.services?.name}
                        </Badge>
                      ))}
                      {(p.professional_services?.length ?? 0) > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{(p.professional_services?.length ?? 0) - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(p)}
                    className="flex-1"
                    aria-label={`Editar ${p.name}`}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleActive(p)}
                    aria-label={p.active ? `Desactivar ${p.name}` : `Activar ${p.name}`}
                  >
                    <UserX className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(p.id)}
                    aria-label={`Eliminar ${p.name}`}
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar profesional' : 'Nuevo profesional'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input id="name" {...form.register('name')} />
              {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" {...form.register('email')} />
              {form.formState.errors.email && <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" {...form.register('phone')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialty">Especialidad</Label>
                <Input id="specialty" {...form.register('specialty')} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Biografía</Label>
              <Textarea id="bio" rows={2} {...form.register('bio')} />
            </div>
            <div className="space-y-2">
              <Label>Servicios que ofrece</Label>
              <div className="flex flex-wrap gap-2">
                {services.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleService(s.id)}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                      selectedServices.includes(s.id)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border hover:bg-accent'
                    }`}
                    aria-label={`${selectedServices.includes(s.id) ? 'Quitar' : 'Agregar'} servicio ${s.name}`}
                    aria-pressed={selectedServices.includes(s.id)}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear profesional'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
