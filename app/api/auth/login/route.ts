import { createClient } from '@/utils/supabase/server'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return Response.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

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

    // Get user role for proper redirect
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', data.user?.id)
      .single()

    const userRole = userData?.role || 'applicant'
    const redirectPath = userRole === 'admin' ? '/dashboard' : '/jobs'

    return Response.json({
      success: true,
      user: data.user,
      session: data.session,
      role: userRole,
      redirectPath,
    })
  } catch (error) {
    console.error('Login error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}