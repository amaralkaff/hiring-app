'use client';

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/client'

const getRole = async (userId: string): Promise<'admin' | 'applicant'> => {
  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.error('Error fetching user role:', error)
      return 'applicant'
    }

    // If user doesn't exist in users table, create default profile
    if (!data) {
      console.log('User profile not found, creating default profile for user:', userId)
      try {
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: userId,
            role: 'applicant'
          })

        if (insertError) {
          console.error('Error creating default user profile:', insertError)
        } else {
          console.log('Default user profile created successfully')
        }
      } catch (insertError) {
        console.error('Unexpected error creating user profile:', insertError)
      }
      return 'applicant'
    }

    return data.role || 'applicant'
  } catch (error) {
    console.error('Unexpected error fetching user role:', error)
    return 'applicant'
  }
}

interface AuthContextType {
  user: User | null
  userRole: 'admin' | 'applicant' | null
  isLoading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<'admin' | 'applicant' | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    let mounted = true
    let loadingTimeout: NodeJS.Timeout

    const forceSetLoadingComplete = () => {
      if (mounted) {
        setIsLoading(false)
      }
    }

    const updateUserState = async (session: { user?: User | null } | null) => {
      if (!mounted) return

      try {
        if (session?.user) {
          setUser(session.user)
          // Get role from database with timeout
          const role = await Promise.race([
            getRole(session.user.id),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000))
          ])
          if (mounted) {
            setUserRole(role || 'applicant')
          }
        } else {
          setUser(null)
          setUserRole(null)
        }
      } catch (error) {
        console.error('Error updating user state:', error)
        if (mounted) {
          setUser(null)
          setUserRole(null)
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
          // Clear the timeout if loading completes normally
          if (loadingTimeout) {
            clearTimeout(loadingTimeout)
          }
        }
      }
    }

    // Get initial session
    const getSession = async () => {
      // Set a timeout to force loading complete after 2 seconds max (reduced)
      loadingTimeout = setTimeout(forceSetLoadingComplete, 2000)

      try {
        const { data: { session } } = await supabase.auth.getSession()
        await updateUserState(session)
      } catch (error) {
        console.error('Error getting session:', error)
        if (mounted) {
          setUser(null)
          setUserRole(null)
          setIsLoading(false)
          if (loadingTimeout) {
            clearTimeout(loadingTimeout)
          }
        }
      }
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return

      // Clear any existing timeout
      if (loadingTimeout) {
        clearTimeout(loadingTimeout)
      }

      setIsLoading(true)
      // Set a timeout for auth changes as well (reduced)
      loadingTimeout = setTimeout(forceSetLoadingComplete, 1500)

      await updateUserState(session)
    })

    return () => {
      mounted = false
      if (loadingTimeout) {
        clearTimeout(loadingTimeout)
      }
      subscription.unsubscribe()
    }
  }, [supabase])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const value = {
    user,
    userRole,
    isLoading,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}