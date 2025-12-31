import { ReactNode, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

// ============================================================================
// Props Interface
// ============================================================================

interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: 'candidate' | 'admin'
}

// ============================================================================
// Loading Spinner Component
// ============================================================================

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="text-center">
        {/* Spinner */}
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-slate-300 border-t-blue-600 mb-4"></div>
        
        {/* Loading text */}
        <p className="text-lg text-slate-600 font-medium">
          Loading...
        </p>
      </div>
    </div>
  )
}

// ============================================================================
// Protected Route Component
// ============================================================================

/**
 * Protected Route Component
 * Protects routes from unauthorized access based on authentication and role
 * 
 * @param children - Child components to render if authorized
 * @param requiredRole - Optional role requirement ('candidate' or 'admin')
 */
export default function ProtectedRoute({ 
  children, 
  requiredRole 
}: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  useEffect(() => {
    // Log protection check for debugging
    if (!loading) {
      console.log('ProtectedRoute check:', {
        hasUser: !!user,
        hasProfile: !!profile,
        userRole: profile?.role,
        requiredRole,
        currentPath: location.pathname
      })
    }
  }, [user, profile, loading, requiredRole, location.pathname])

  // Show loading spinner while checking authentication
  if (loading) {
    return <LoadingSpinner />
  }

  // Redirect to login if not authenticated
  if (!user) {
    console.log('No user found, redirecting to login')
    return (
      <Navigate 
        to="/candidate/login" 
        state={{ from: location.pathname }} 
        replace 
      />
    )
  }

  // If profile hasn't loaded yet, show loading
  if (!profile) {
    return <LoadingSpinner />
  }

  // Check role requirement if specified
  if (requiredRole && profile.role !== requiredRole) {
    console.log('Role mismatch, redirecting:', {
      required: requiredRole,
      actual: profile.role
    })

    // Redirect based on user's actual role
    const redirectPath = profile.role === 'admin' 
      ? '/admin/dashboard' 
      : '/candidate/dashboard'

    return (
      <Navigate 
        to={redirectPath} 
        replace 
      />
    )
  }

  // User is authenticated and has correct role (if required)
  return <>{children}</>
}
