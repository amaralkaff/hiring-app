import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// Simple CORS handler for preflight requests
export async function OPTIONS() {
  return new NextResponse(null, { status: 200 })
}

export async function GET(request: Request) {
  // Simple approach - no complex CORS handling

  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const code = searchParams.get('code')
  const email = searchParams.get('email')

  // Always use production domain for redirects
  const productionDomain = 'https://hiring-app-palepale.netlify.app'
  const redirectTo = new URL(productionDomain + '/login')
  redirectTo.searchParams.delete('token_hash')
  redirectTo.searchParams.delete('type')
  redirectTo.searchParams.delete('code')

  if ((token_hash && type) || code) {
    const supabase = await createClient()

    try {
      // Try to verify using token_hash and type first (standard Supabase format)
      let verifyData, verifyError;

      if (token_hash && type) {
        ({ data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
          type: type as 'email' | 'signup' | 'recovery',
          token_hash,
        }));
      } else if (code) {
        // Try multiple approaches for code-based verification

        // Method 1: Exchange code for session (newer Supabase method)
        ({ data: verifyData, error: verifyError } = await supabase.auth.exchangeCodeForSession(code));

        if (!verifyError && verifyData?.user) {
          // Code exchange successful - continue to user role check
        } else if (verifyError) {
          // Method 2: Try verifyOtp with token (older method)
          ({ data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
            type: 'email',
            token: code,
            email: email || '', // Include email parameter for TypeScript compliance
          }));
        }

        // Method 3: If still failing, check if user is already authenticated
        if (verifyError) {
          try {
            ({ data: verifyData, error: verifyError } = await supabase.auth.getUser());
          } catch {
            // Handle AuthSessionMissingError gracefully
            verifyError = { message: 'Authentication error' };
          }
        }
      } else {
        verifyError = { message: 'Missing verification parameters' };
      }

      if (!verifyError && verifyData?.user) {
        // Fresh link - successful verification
        console.log('Email confirmation successful for user:', verifyData.user.email)

        // Ensure user exists in database with proper fields
        const { data: existingUser } = await supabase
          .from('users')
          .select('role, full_name')
          .eq('id', verifyData.user.id)
          .single()

        let userRole = existingUser?.role

        // If user doesn't exist in database, create them
        if (!existingUser) {
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: verifyData.user.id,
              email: verifyData.user.email,
              full_name: verifyData.user.user_metadata?.full_name || verifyData.user.email?.split('@')[0] || null,
              role: 'applicant', // Default role for new users
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })

          if (insertError) {
            console.error('Error creating user record:', insertError)
            // Continue with default role even if insert fails
            userRole = 'applicant'
          } else {
            userRole = 'applicant'
            console.log('Created new user record for:', verifyData.user.email)
          }
        }

        // Update existing user's metadata if needed
        if (existingUser && verifyData.user.user_metadata?.full_name && !existingUser.full_name) {
          await supabase
            .from('users')
            .update({
              full_name: verifyData.user.user_metadata.full_name,
              updated_at: new Date().toISOString(),
            })
            .eq('id', verifyData.user.id)
        }

        const correctNext = userRole === 'admin' ? '/dashboard' : '/jobs'

        // Update redirect URL based on role - always use production domain
        const roleBasedRedirectTo = new URL(productionDomain + correctNext)
        roleBasedRedirectTo.searchParams.delete('token_hash')
        roleBasedRedirectTo.searchParams.delete('type')
        roleBasedRedirectTo.searchParams.delete('code')

        // Check if this is a new user or returning user
        const lastSignInAt = verifyData.user.last_sign_in_at
        const createdAt = verifyData.user.created_at

        // If user was just created and this is first confirmation
        if (!lastSignInAt || new Date(lastSignInAt).getTime() === new Date(createdAt).getTime()) {
          roleBasedRedirectTo.searchParams.set('message', 'Pendaftaran berhasil! Selamat datang.')
        } else {
          roleBasedRedirectTo.searchParams.set('message', 'Login berhasil! Selamat datang kembali.')
        }

        return NextResponse.redirect(roleBasedRedirectTo)
      } else {
        // Handle different error types - suppress expected auth errors
        if (!verifyError?.message?.includes('AuthSessionMissingError')) {
          console.error('OTP verification error:', verifyError)
        }

        if (verifyError?.message?.includes('expired') ||
            verifyError?.message?.includes('Invalid') ||
            verifyError?.message?.includes('token')) {
          // Expired or invalid link - use production domain
          const errorUrl = new URL(productionDomain + '/login')
          errorUrl.searchParams.set('error', 'confirmation_link_expired')
          errorUrl.searchParams.set('message', 'Tautan konfirmasi Anda telah kedaluwarsa. Silakan coba lagi.')
          return NextResponse.redirect(errorUrl)
        } else {
          // Other verification errors - use production domain
          const errorUrl = new URL(productionDomain + '/login')
          errorUrl.searchParams.set('error', 'confirmation_failed')
          errorUrl.searchParams.set('message', 'Konfirmasi email gagal. Silakan coba lagi.')
          return NextResponse.redirect(errorUrl)
        }
      }
    } catch (err) {
      console.error('Unexpected error during confirmation:', err)
      const errorUrl = new URL(productionDomain + '/login')
      errorUrl.searchParams.set('error', 'confirmation_error')
      errorUrl.searchParams.set('message', 'Terjadi kesalahan saat konfirmasi email. Silakan coba lagi.')
      return NextResponse.redirect(errorUrl)
    }
  }

  // Missing parameters - redirect to login with error
  const errorUrl = new URL(productionDomain + '/login')
  errorUrl.searchParams.set('error', 'invalid_confirmation_link')
  errorUrl.searchParams.set('message', 'Tautan konfirmasi tidak valid. Silakan periksa email Anda dan coba lagi.')
  return NextResponse.redirect(errorUrl)
}