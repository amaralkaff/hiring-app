import { createClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createClient()

    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
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