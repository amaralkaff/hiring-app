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
      .maybeSingle()

    // If user doesn't exist in users table, create default profile
    if (!userData && data.user?.id) {
      console.log('User profile not found in login API, creating default profile for user:', data.user.id)
      try {
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            role: 'applicant'
          })

        if (insertError) {
          console.error('Error creating default user profile in login API:', insertError)
        } else {
          console.log('Default user profile created successfully in login API')
        }
      } catch (insertError) {
        console.error('Unexpected error creating user profile in login API:', insertError)
      }
    }

    const userRole = userData?.role || 'applicant'
    const redirectPath = userRole === 'admin' ? '/dashboard' : '/jobs'

    return Response.json({
      success: true,
      user: data.user,
      session: data.session,
      role: userRole,
      redirectPath,
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}