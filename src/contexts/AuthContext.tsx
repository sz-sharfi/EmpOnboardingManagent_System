import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { 
  getSession, 
  getCurrentUser, 
  getCurrentUserProfile, 
  onAuthStateChange,
  signOut as authSignOut,
  type UserProfile 
} from '../lib/auth'

// ============================================================================
// Context Type Definition
// ============================================================================

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

// ============================================================================
// Create Context
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ============================================================================
// Provider Props
// ============================================================================

interface AuthProviderProps {
  children: ReactNode
}

// ============================================================================
// Auth Provider Component
// ============================================================================

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  /**
   * Load user profile from database
   */
  const loadProfile = async () => {
    try {
      const userProfile = await getCurrentUserProfile()
      setProfile(userProfile)
    } catch (error) {
      console.error('Error loading profile:', error)
      setProfile(null)
    }
  }

  /**
   * Initialize authentication state
   */
  const initializeAuth = async () => {
    try {
      setLoading(true)

      // Get current session
      const currentSession = await getSession()
      setSession(currentSession)

      if (currentSession) {
        // Get current user
        const currentUser = await getCurrentUser()
        setUser(currentUser)

        // Load user profile if user exists
        if (currentUser) {
          await loadProfile()
        }
      }
    } catch (error) {
      console.error('Error initializing auth:', error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handle sign out
   */
  const handleSignOut = async () => {
    try {
      await authSignOut()
      setUser(null)
      setProfile(null)
      setSession(null)
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  /**
   * Refresh user profile (useful after profile updates)
   */
  const refreshProfile = async () => {
    try {
      await loadProfile()
    } catch (error) {
      console.error('Error refreshing profile:', error)
      throw error
    }
  }

  /**
   * Setup auth state listener and initialize on mount
   */
  useEffect(() => {
    // Initialize authentication state
    initializeAuth()

    // Listen for storage changes (detects login in other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.includes('supabase.auth.token')) {
        console.warn('Session changed in another tab - reloading...')
        // Reload to sync with the new session
        window.location.reload()
      }
    }

    window.addEventListener('storage', handleStorageChange)

    // Setup auth state change listener
    const subscription = onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event)

      setSession(session)

      if (session) {
        // User signed in or session refreshed
        const currentUser = await getCurrentUser()
        setUser(currentUser)

        if (currentUser) {
          await loadProfile()
        }
      } else {
        // User signed out
        setUser(null)
        setProfile(null)
      }

      // Stop loading after auth state change
      setLoading(false)
    })

    // Cleanup subscription on unmount
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      subscription?.subscription?.unsubscribe()
    }
  }, [])

  // Context value
  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    signOut: handleSignOut,
    refreshProfile
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ============================================================================
// useAuth Hook
// ============================================================================

/**
 * Custom hook to use authentication context
 * @returns Authentication context
 * @throws Error if used outside AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}

// Export context for advanced use cases
export { AuthContext }
