import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Successfully exchanged code for session
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'

      if (isLocalEnv) {
        return NextResponse.redirect(`${new URL(request.url).origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${new URL(request.url).origin}${next}`)
      }
    }
  }

  // If there's an error or no code, redirect to login with error
  const loginUrl = new URL(`${new URL(request.url).origin}/login`)
  loginUrl.searchParams.set('error', 'oauth_callback_failed')
  loginUrl.searchParams.set('message', 'Google login failed. Please try again.')

  return NextResponse.redirect(loginUrl.toString())
}