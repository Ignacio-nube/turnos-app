'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useCallback } from 'react'

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'confirmed', label: 'Confirmados' },
  { value: 'completed', label: 'Completados' },
  { value: 'cancelled', label: 'Cancelados' },
  { value: 'no_show', label: 'No asistió' },
]

export function TurnosFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentStatus = searchParams.get('status') ?? 'all'
  const currentSearch = searchParams.get('search') ?? ''

  const updateFilter = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/turnos?${params.toString()}`)
  }, [router, searchParams])

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Input
        placeholder="Buscar por nombre del cliente..."
        defaultValue={currentSearch}
        onChange={(e) => updateFilter('search', e.target.value)}
        className="sm:max-w-xs"
        aria-label="Buscar turnos por nombre"
      />
      <div className="flex gap-2 flex-wrap">
        {STATUS_OPTIONS.map(opt => (
          <Button
            key={opt.value}
            variant={currentStatus === opt.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateFilter('status', opt.value)}
            aria-label={`Filtrar por ${opt.label}`}
            aria-pressed={currentStatus === opt.value}
          >
            {opt.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
