'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  'use server'

  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const loginMethod = formData.get('method') as string

  if (!email || !email.includes('@')) {
    return { error: 'Email tidak valid' }
  }

  try {
    if (loginMethod === 'password' && password) {
      // Password-based login
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        return { error: 'Email atau password salah' }
      }

      revalidatePath('/', 'layout')
      redirect('/dashboard')
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
        return { error: error.message }
      }

      return {
        success: true,
        message: 'Tautan ajaib telah dikirim ke email Anda. Silakan periksa inbox Anda untuk masuk.'
      }
    }
  } catch (error) {
    console.error('Unexpected error during login:', error)
    return { error: 'Terjadi kesalahan. Silakan coba lagi.' }
  }
}

export async function signup(formData: FormData) {
  'use server'

  const supabase = await createClient()
  const email = formData.get('email') as string

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

    // Use passwordless magic link authentication
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:3000'}/auth/confirm`,
        shouldCreateUser: true, // Allow user creation for new signups
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
    console.error('Unexpected error during magic link generation:', error)
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
    console.error('Unexpected error during admin creation:', error)
    return { error: 'Terjadi kesalahan saat membuat admin. Silakan coba lagi.' }
  }
}

export async function signInWithGoogle() {
  'use server'

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:3000'}/auth/confirm`,
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

  return { success: true, data }
}

export async function signOut() {
  'use server'

  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}