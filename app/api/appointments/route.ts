import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { appointmentSchema } from '@/lib/validations/appointment'
import { addMinutes } from 'date-fns'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)

    const status = searchParams.get('status')
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const professionalId = searchParams.get('professional_id')

    let query = supabase
      .from('appointments')
      .select('*, professionals(name, specialty), services(name, color, duration_minutes)')
      .order('start_time', { ascending: true })

    if (status) query = query.eq('status', status)
    if (from) query = query.gte('start_time', from)
    if (to) query = query.lte('start_time', to)
    if (professionalId) query = query.eq('professional_id', professionalId)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener turnos' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json()

    const validated = appointmentSchema.safeParse(body)
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validated.error.flatten() },
        { status: 400 }
      )
    }

    const { professional_id, service_id, start_time, ...rest } = validated.data

    // Obtener duración del servicio para calcular end_time
    const { data: service } = await supabase
      .from('services')
      .select('duration_minutes')
      .eq('id', service_id)
      .single()

    const duration = service?.duration_minutes ?? 30
    const endTime = addMinutes(new Date(start_time), duration).toISOString()

    const { data, error } = await supabase
      .from('appointments')
      .insert({
        professional_id,
        service_id,
        start_time,
        end_time: endTime,
        ...rest,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear turno' }, { status: 500 })
  }
}
