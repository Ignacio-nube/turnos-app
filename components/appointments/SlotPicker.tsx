'use client'

import { useEffect, useState } from 'react'
import { format, isPast } from 'date-fns'
import { es } from 'date-fns/locale'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Slot {
  slot_start: string
  slot_end: string
}

interface SlotPickerProps {
  professionalId: string
  date: Date
  duration: number
  selectedSlot: string | null
  onSelect: (slotStart: string) => void
}

const HOUR_GROUPS = [
  { label: 'Mañana', from: 6, to: 12 },
  { label: 'Tarde', from: 12, to: 18 },
  { label: 'Noche', from: 18, to: 24 },
]

export function SlotPicker({ professionalId, date, duration, selectedSlot, onSelect }: SlotPickerProps) {
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!professionalId || !date) return

    const fetchSlots = async () => {
      setLoading(true)
      setError(null)
      try {
        const dateStr = format(date, 'yyyy-MM-dd')
        const res = await fetch(
          `/api/available-slots?professional_id=${professionalId}&date=${dateStr}&duration=${duration}`
        )
        if (!res.ok) throw new Error('Error al cargar slots')
        const data = await res.json()
        setSlots((data as Slot[]).filter(s => s.slot_start != null && s.slot_end != null))
      } catch {
        setError('No se pudieron cargar los horarios disponibles')
      } finally {
        setLoading(false)
      }
    }

    fetchSlots()
  }, [professionalId, date, duration])

  if (loading) {
    return (
      <div className="space-y-4">
        {HOUR_GROUPS.map((g) => (
          <div key={g.label}>
            <p className="text-xs font-medium text-muted-foreground mb-2">{g.label}</p>
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-9 rounded-md" />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>
  }

  if (!slots.length) {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <svg className="h-10 w-10 text-muted-foreground/30 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm text-muted-foreground">No hay horarios disponibles para este día</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {HOUR_GROUPS.map((group) => {
        const groupSlots = slots.filter((s) => {
          const hour = new Date(s.slot_start).getHours()
          return hour >= group.from && hour < group.to
        })
        if (!groupSlots.length) return null

        return (
          <div key={group.label}>
            <p className="text-xs font-medium text-muted-foreground mb-2">{group.label}</p>
            <div className="grid grid-cols-4 gap-2">
              {groupSlots.map((slot) => {
                const isPastSlot = isPast(new Date(slot.slot_start))
                const isSelected = selectedSlot === slot.slot_start
                return (
                  <Button
                    key={slot.slot_start}
                    type="button"
                    variant={isSelected ? 'default' : 'outline'}
                    size="sm"
                    disabled={isPastSlot}
                    onClick={() => onSelect(slot.slot_start)}
                    className={cn('text-xs', isPastSlot && 'opacity-40')}
                    aria-label={`Seleccionar horario ${format(new Date(slot.slot_start), 'HH:mm')}`}
                    aria-pressed={isSelected}
                  >
                    {format(new Date(slot.slot_start), 'HH:mm')}
                  </Button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
