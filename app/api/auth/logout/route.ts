import { createClient } from '@/lib/supabase'

export async function POST() {
  try {
    const supabase = createClient()

    const { error } = await supabase.auth.signOut()

    if (error) {
      return Response.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return Response.json({
      success: true,
    })
  } catch (error) {
    console.error('Logout error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}