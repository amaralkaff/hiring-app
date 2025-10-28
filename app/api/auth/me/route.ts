import { createClient } from '@/utils/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    let user = null;
    let error: { message?: string } | null = null;

    try {
      const { data, error: authError } = await supabase.auth.getUser();
      user = data.user;
      error = authError;
    } catch {
      error = { message: 'Unknown error occurred' };
    }

    if (error && !error.message?.includes('Auth session missing')) {
      return Response.json(
        { error: error.message },
        { status: 401 }
      )
    }

    if (!user) {
      return Response.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Fetch user role from users table
    const { data: userData, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (roleError) {
      console.error('Error fetching user role:', roleError)
    }

    // If user doesn't exist in users table, create default profile
    if (!userData) {
      console.log('User profile not found in API, creating default profile for user:', user.id)
      try {
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            role: 'applicant'
          })

        if (insertError) {
          console.error('Error creating default user profile in API:', insertError)
        } else {
          console.log('Default user profile created successfully in API')
        }
      } catch (insertError) {
        console.error('Unexpected error creating user profile in API:', insertError)
      }
    }

    return Response.json({
      success: true,
      user: {
        ...user,
        role: userData?.role || 'applicant',
      },
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('Get user error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}