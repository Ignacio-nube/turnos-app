import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('services').select('*').order('name')
    if (error) throw error
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Error al obtener servicios' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json()
    const { data, error } = await supabase.from('services').insert(body).select().single()
    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Error al crear servicio' }, { status: 500 })
  }
}
