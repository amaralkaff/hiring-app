import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ exists: false }, { status: 200 })
    }

    const supabase = await createClient()
    const { data } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    return NextResponse.json({ exists: !!data }, { status: 200 })
  } catch (e) {
    return NextResponse.json({ exists: false }, { status: 200 })
  }
}
