import { createClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createClient()

    let user = null;
    let error: { message?: string } | null = null;

    try {
      const { data, error: authError } = await supabase.auth.getUser();
      user = data.user;
      error = authError;
    } catch (err) {
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
      .single()

    if (roleError) {
      console.error('Error fetching user role:', roleError)
    }

    return Response.json({
      success: true,
      user: {
        ...user,
        role: userData?.role || null,
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