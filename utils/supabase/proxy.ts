import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// 1. Specify protected and public routes
const protectedRoutes = ['/dashboard', '/jobs', '/profile', '/success']

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

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

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Handle AuthSessionMissingError gracefully in middleware
    // This is expected when user is not authenticated
    user = null;
  }

  // 2. Check if the current route is protected or public
  const path = request.nextUrl.pathname
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route))

  let userRole = null;

  // 3. Fetch user role from our users table if user exists
  if (user) {
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      userRole = userData?.role;
    } catch (error) {
      console.error('Error fetching user role in middleware:', error);
    }
  }

  // 4. Redirect to /login if the user is not authenticated
  if (isProtectedRoute && !user) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // 5. Role-based route protection
  if (user && userRole) {
    // Admin routes protection
    if (path.startsWith('/dashboard') && userRole !== 'admin') {
      const redirectUrl = new URL('/jobs', request.url)
      return NextResponse.redirect(redirectUrl)
    }

    // Applicant routes protection
    if (path.startsWith('/jobs') && userRole !== 'applicant') {
      const redirectUrl = new URL('/dashboard', request.url)
      return NextResponse.redirect(redirectUrl)
    }

    // Profile route protection - only applicants can access profile
    if (path.startsWith('/profile') && userRole !== 'applicant') {
      const redirectUrl = new URL('/dashboard', request.url)
      return NextResponse.redirect(redirectUrl)
    }

    // 6. Auto-authorization: Redirect authenticated users from root and auth pages
    if (path === '/') {
      // Check if there's a magic link code parameter - if so, let it process through auth flow
      const { searchParams } = new URL(request.url)
      if (searchParams.has('code') || searchParams.has('token_hash')) {
        // Let the confirmation route handle the magic link
        return supabaseResponse
      }

      // Auto-redirect based on user role for regular root page access
      const redirectUrl = new URL(
        userRole === 'admin' ? '/dashboard' : '/jobs',
        request.url
      )
      return NextResponse.redirect(redirectUrl)
    }

    // Redirect authenticated users from login/register pages
    if ((path === '/login' || path === '/register')) {
      const redirectUrl = new URL(
        userRole === 'admin' ? '/dashboard' : '/jobs',
        request.url
      )
      return NextResponse.redirect(redirectUrl)
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

// Routes Proxy should not run on
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
}