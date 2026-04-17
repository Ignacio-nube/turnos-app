import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { service_ids, ...body } = await req.json()

    const { data, error } = await supabase
      .from('professionals')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    if (service_ids !== undefined) {
      await supabase.from('professional_services').delete().eq('professional_id', id)
      if (service_ids.length > 0) {
        await supabase.from('professional_services').insert(
          service_ids.map((sid: string) => ({ professional_id: id, service_id: sid }))
        )
      }
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Error al actualizar profesional' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { error } = await supabase.from('professionals').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Error al eliminar profesional' }, { status: 500 })
  }
}
