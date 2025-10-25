import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let userRole = null;

  // Fetch user role from our users table
  if (user) {
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    userRole = userData?.role;
  }

  // Define route groups
  const adminRoutes = ['/dashboard']
  const applicantRoutes = ['/applicant/jobs', '/applicant/success', '/applicant/jobs/']
  const authRoutes = ['/auth/']

  const isAdminRoute = adminRoutes.some(route => request.nextUrl.pathname.startsWith(route))
  const isApplicantRoute = applicantRoutes.some(route => request.nextUrl.pathname.startsWith(route))
  const isAuthRoute = authRoutes.some(route => request.nextUrl.pathname.startsWith(route))

  // Redirect unauthenticated users from protected routes
  if (!user && (isAdminRoute || isApplicantRoute)) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Role-based route protection
  if (user) {
    // Admin routes protection
    if (isAdminRoute && userRole !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/applicant/jobs'
      return NextResponse.redirect(url)
    }

    // Applicant routes protection
    if (isApplicantRoute && userRole !== 'applicant') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

    // Redirect authenticated users from auth routes
    if (isAuthRoute) {
      const url = request.nextUrl.clone()
      if (userRole === 'admin') {
        url.pathname = '/dashboard'
      } else {
        url.pathname = '/applicant/jobs'
      }
      return NextResponse.redirect(url)
    }

    // Redirect authenticated users from public routes (except root and setup)
    if (request.nextUrl.pathname === '/' && userRole) {
      const url = request.nextUrl.clone()
      if (userRole === 'admin') {
        url.pathname = '/dashboard'
      } else {
        url.pathname = '/applicant/jobs'
      }
      return NextResponse.redirect(url)
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}