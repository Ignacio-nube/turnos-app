import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)

    const professionalId = searchParams.get('professional_id')
    const date = searchParams.get('date')
    const duration = searchParams.get('duration')

    if (!professionalId || !date || !duration) {
      return NextResponse.json(
        { error: 'Faltan parámetros: professional_id, date, duration' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase.rpc('get_available_slots', {
      p_professional_id: professionalId,
      p_date: date,
      p_duration_minutes: parseInt(duration),
    })

    if (error) throw error

    return NextResponse.json(data ?? [])
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener slots disponibles' }, { status: 500 })
  }
}
