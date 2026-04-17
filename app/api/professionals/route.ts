import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('professionals')
      .select('*, professional_services(service_id)')
      .order('name')
    if (error) throw error
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Error al obtener profesionales' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { service_ids, ...body } = await req.json()

    const { data: professional, error } = await supabase
      .from('professionals')
      .insert(body)
      .select()
      .single()

    if (error) throw error

    if (service_ids?.length) {
      await supabase.from('professional_services').insert(
        service_ids.map((sid: string) => ({
          professional_id: professional.id,
          service_id: sid,
        }))
      )
    }

    return NextResponse.json(professional, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Error al crear profesional' }, { status: 500 })
  }
}
