import { createClient } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return Response.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return Response.json(
        { error: error.message },
        { status: 401 }
      )
    }

    return Response.json({
      success: true,
      user: data.user,
      session: data.session,
    })
  } catch (error) {
    console.error('Login error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}