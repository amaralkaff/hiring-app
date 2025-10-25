import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = '/dashboard'

  // Create redirect link without the secret token
  const url = new URL(request.url)
  const redirectTo = new URL(url.origin + next)
  redirectTo.searchParams.delete('token_hash')
  redirectTo.searchParams.delete('type')

  if (token_hash && type) {
    const supabase = await createClient()

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        type: type as 'email' | 'signup' | 'recovery',
        token_hash,
      })

      if (!error && data.user) {
        // Fresh link - successful verification
        console.log('Email confirmation successful for user:', data.user.email)

        // Check if this is a new user or returning user
        const lastSignInAt = data.user.last_sign_in_at
        const createdAt = data.user.created_at

        // If user was just created and this is first confirmation
        if (!lastSignInAt || new Date(lastSignInAt).getTime() === new Date(createdAt).getTime()) {
          redirectTo.searchParams.set('message', 'Pendaftaran berhasil! Selamat datang.')
        } else {
          redirectTo.searchParams.set('message', 'Login berhasil! Selamat datang kembali.')
        }

        return NextResponse.redirect(redirectTo)
      } else {
        // Handle different error types
        console.error('OTP verification error:', error)

        if (error?.message?.includes('expired') ||
            error?.message?.includes('Invalid') ||
            error?.message?.includes('token')) {
          // Expired or invalid link
          const errorUrl = new URL(url.origin + '/login')
          errorUrl.searchParams.set('error', 'confirmation_link_expired')
          errorUrl.searchParams.set('message', 'Tautan konfirmasi Anda telah kedaluwarsa. Silakan coba lagi.')
          return NextResponse.redirect(errorUrl)
        } else {
          // Other verification errors
          const errorUrl = new URL(url.origin + '/login')
          errorUrl.searchParams.set('error', 'confirmation_failed')
          errorUrl.searchParams.set('message', 'Konfirmasi email gagal. Silakan coba lagi.')
          return NextResponse.redirect(errorUrl)
        }
      }
    } catch (err) {
      console.error('Unexpected error during confirmation:', err)
      const errorUrl = new URL(url.origin + '/login')
      errorUrl.searchParams.set('error', 'confirmation_error')
      errorUrl.searchParams.set('message', 'Terjadi kesalahan saat konfirmasi email. Silakan coba lagi.')
      return NextResponse.redirect(errorUrl)
    }
  }

  // Missing parameters - redirect to login with error
  const errorUrl = new URL(url.origin + '/login')
  errorUrl.searchParams.set('error', 'invalid_confirmation_link')
  errorUrl.searchParams.set('message', 'Tautan konfirmasi tidak valid. Silakan periksa email Anda dan coba lagi.')
  return NextResponse.redirect(errorUrl)
}