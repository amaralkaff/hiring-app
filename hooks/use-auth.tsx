'use client';

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/client'

const getRole = async (userId: string): Promise<'admin' | 'applicant'> => {
  const supabase = createClient()
  try {
    const { data } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()
    return data?.role || 'applicant'
  } catch {
    return 'applicant'
  }
}

interface AuthContextType {
  user: User | null
  userRole: 'admin' | 'applicant' | null
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<'admin' | 'applicant' | null>(null)
  const supabase = createClient()

  useEffect(() => {
    let mounted = true

    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!mounted) return

        if (session?.user) {
          setUser(session.user)
          // Get role from database
          getRole(session.user.id).then(role => {
            if (mounted) {
              setUserRole(role)
            }
          })
        } else {
          setUser(null)
          setUserRole(null)
        }
      } catch {
        if (mounted) {
          setUser(null)
          setUserRole(null)
        }
      }
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return

      if (session?.user) {
        setUser(session.user)
        // Get role from database
        getRole(session.user.id).then(role => {
          if (mounted) {
            setUserRole(role)
          }
        })
      } else {
        setUser(null)
        setUserRole(null)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const value = {
    user,
    userRole,
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