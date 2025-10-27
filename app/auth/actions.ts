'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'

// Define proper types for login state
interface LoginState {
  error?: string | null;
  success: boolean;
  message?: string;
}

export async function login(prevState: LoginState, formData: FormData) {
  'use server'

  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const loginMethod = formData.get('method') as string

  if (!email || !email.includes('@')) {
    return { error: 'Email tidak valid', success: false }
  }

  try {
    if (loginMethod === 'password' && password) {
      // Password-based login
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        return { error: 'Email atau password salah', success: false }
      }

      // Get user role to determine correct redirect
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single()

      const userRole = userData?.role || 'applicant'
      const redirectPath = userRole === 'admin' ? '/dashboard' : '/jobs'

      revalidatePath('/', 'layout')

      // Small delay to allow client-side auth state to update
      await new Promise(resolve => setTimeout(resolve, 100))

      redirect(redirectPath)
    } else {
      // Passwordless magic link authentication for login
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:3000'}/auth/confirm`,
          shouldCreateUser: false, // Don't create new users from login page
          data: {
            role: 'applicant' // Ensure role is set for existing users too
          }
        }
      })

      if (error) {
        console.error('Login magic link error:', error)
        return { error: error.message, success: false }
      }

      return {
        success: true,
        message: 'Tautan ajaib telah dikirim ke email Anda. Silakan periksa inbox Anda untuk masuk.',
        error: null
      }
    }
  } catch (error) {
    // Handle Next.js redirect errors - these are expected and not actual errors
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
      // This is the expected redirect, don't treat it as an error
      throw error; // Re-throw to let Next.js handle the redirect
    }

    console.error('Unexpected error during login:', error)
    return { error: 'Terjadi kesalahan. Silakan coba lagi.', success: false }
  }
}

export async function register(formData: FormData) {
  'use server'

  const supabase = await createClient()
  const email = formData.get('email') as string
  const method = (formData.get('method') as string) || 'magic'
  const password = (formData.get('password') as string) || ''

  if (!email || !email.includes('@')) {
    return { error: 'Alamat email tidak valid' }
  }

  try {
    // Check if user already exists by attempting to get user info
    const { data: existingUser } = await supabase
      .from('users')
      .select('email, role')
      .eq('email', email)
      .single();

    if (existingUser) {
      return {
        error: 'Email ini sudah terdaftar. Silakan masuk.',
        errorCode: 'EMAIL_ALREADY_REGISTERED'
      };
    }

    if (method === 'password') {
      // Password-based registration
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:3000'}/auth/confirm`,
          data: {
            full_name: email.split('@')[0],
            role: 'applicant',
            created_at: new Date().toISOString(),
          },
        },
      })

      if (signUpError) {
        if (
          signUpError.message.includes('User already registered') ||
          signUpError.message.includes('duplicate') ||
          signUpError.message.includes('already been registered')
        ) {
          return {
            error: 'Email ini sudah terdaftar. Silakan masuk.',
            errorCode: 'EMAIL_ALREADY_REGISTERED',
          }
        }
        return { error: signUpError.message }
      }

      // Whether confirmation is required depends on Supabase settings; we redirect to magic-link-sent for consistency
      return {
        success: true,
        message: 'Akun berhasil didaftarkan. Jika perlu konfirmasi, kami telah mengirim email verifikasi.'
      }
    }

    // Default: passwordless magic link authentication
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:3000'}/auth/confirm`,
        shouldCreateUser: true, // Allow user creation for new registrations
        data: {
          full_name: email.split('@')[0], // Extract name from email
          role: 'applicant', // Explicitly set default role to applicant
          created_at: new Date().toISOString()
        }
      }
    })

    if (error) {
      console.error('Magic link error:', error)

      // Check if error indicates user already exists
      if (error.message.includes('User already registered') ||
          error.message.includes('duplicate') ||
          error.message.includes('already been registered')) {
        return {
          error: 'Email ini sudah terdaftar. Silakan masuk.',
          errorCode: 'EMAIL_ALREADY_REGISTERED'
        };
      }

      return { error: error.message }
    }

    return {
      success: true,
      message: 'Tautan ajaib telah dikirim ke email Anda. Silakan periksa inbox Anda untuk masuk.'
    }
  } catch (error) {
    // Handle Next.js redirect errors - these are expected and not actual errors
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
      // This is the expected redirect, don't treat it as an error
      throw error; // Re-throw to let Next.js handle the redirect
    }

    console.error('Unexpected error during register:', error)
    return { error: 'Terjadi kesalahan. Silakan coba lagi.' }
  }
}

export async function createAdminUser(formData: FormData) {
  'use server'

  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email dan password diperlukan' }
  }

  try {
    // Create the user with password (for admin setup)
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:3000'}/auth/confirm`,
        data: {
          full_name: 'Admin User',
          created_at: new Date().toISOString()
        }
      }
    })

    if (signUpError) {
      console.error('Admin creation error:', signUpError)
      return { error: signUpError.message }
    }

    // If user was created successfully, promote them to admin role
    if (data.user) {
      const { error: promoteError } = await supabase.rpc('promote_user_to_admin', {
        user_email: email
      })

      if (promoteError) {
        console.error('Error promoting user to admin:', promoteError)
        // Don't fail the whole process if promotion fails, user can be promoted later
      }
    }

    // Try to sign in immediately (for development/demo purposes)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (signInError) {
      // If sign in fails, return success message for email confirmation
      return {
        success: true,
        message: 'Admin user created! Please check your email for confirmation, then login.'
      }
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
  } catch (error) {
    // Handle Next.js redirect errors - these are expected and not actual errors
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
      // This is the expected redirect, don't treat it as an error
      throw error; // Re-throw to let Next.js handle the redirect
    }

    console.error('Unexpected error during admin creation:', error)
    return { error: 'Terjadi kesalahan saat membuat admin. Silakan coba lagi.' }
  }
}

export async function signInWithGoogle() {
  'use server'

  const supabase = await createClient()

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/confirm`,
        scopes: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })

    if (error) {
      console.error('Google OAuth error:', error)
      return { error: 'Gagal login dengan Google. Silakan coba lagi.' }
    }

    // For server-side implementation, we need to handle the redirect
    if (data.url) {
      redirect(data.url)
    }

    return { success: true, data }
  } catch (error) {
    // Handle Next.js redirect errors - these are expected and not actual errors
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
      // This is the expected redirect, don't treat it as an error
      throw error; // Re-throw to let Next.js handle the redirect
    }

    console.error('Unexpected Google OAuth error:', error)
    return { error: 'Gagal login dengan Google. Silakan coba lagi.' }
  }
}

export async function signOut() {
  'use server'

  const supabase = await createClient()

  try {
    // Sign out the user
    const { error } = await supabase.auth.signOut()

    if (error) {
      // Suppress expected auth errors - they're normal during logout
      if (!error.message?.includes('AuthSessionMissingError')) {
        console.error('Unexpected error signing out:', error)
      }
    }

    // Revalidate the cache to clear any cached data
    revalidatePath('/', 'layout')

    // Redirect to login page
    redirect('/login')
  } catch (error) {
    // Suppress expected redirect and auth errors - they're normal
    if (error instanceof Error && !error.message.includes('NEXT_REDIRECT')) {
      console.error('Unexpected logout error:', error)
    }
    // Still redirect to login even if there's an error
    redirect('/login')
  }
}

export async function checkEmailRegistered(email: string) {
  'use server'
  const supabase = await createClient()
  if (!email || !email.includes('@')) return { exists: false }
  try {
    const { data } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()
    return { exists: !!data }
  } catch {
    return { exists: false }
  }
}