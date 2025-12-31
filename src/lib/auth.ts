import { supabase } from './supabase'
import type { User, Session } from '@supabase/supabase-js'

// ============================================================================
// TypeScript Interfaces
// ============================================================================

export interface SignUpData {
  email: string
  password: string
  fullName: string
  role?: 'candidate' | 'admin'
}

export interface SignInData {
  email: string
  password: string
}

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  role: 'candidate' | 'admin'
  avatar_url: string | null
  created_at: string
  updated_at: string
}

// ============================================================================
// Authentication Functions
// ============================================================================

/**
 * Sign up a new user
 * @param data - User signup data including email, password, fullName, and optional role
 * @returns User data or throws error
 */
export async function signUp(data: SignUpData) {
  try {
    const { email, password, fullName, role = 'candidate' } = data

    const { data: authData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role
        }
      }
    })

    if (error) throw error

    if (!authData.user) {
      throw new Error('Failed to create user account')
    }

    return authData
  } catch (error) {
    console.error('Sign up error:', error)
    throw error
  }
}

/**
 * Sign in an existing user
 * @param data - User signin data with email and password
 * @returns Session data or throws error
 */
export async function signIn(data: SignInData) {
  try {
    const { email, password } = data

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error

    if (!authData.session) {
      throw new Error('Failed to create session')
    }

    return authData
  } catch (error) {
    console.error('Sign in error:', error)
    throw error
  }
}

/**
 * Sign out the current user
 * @returns Promise that resolves when sign out is complete
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Sign out error:', error)
    throw error
  }
}

/**
 * Get the current session
 * @returns Current session or null
 */
export async function getSession() {
  try {
    const { data, error } = await supabase.auth.getSession()

    if (error) throw error

    return data.session
  } catch (error) {
    console.error('Get session error:', error)
    throw error
  }
}

/**
 * Get the current user
 * @returns Current user or null
 */
export async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getUser()

    if (error) throw error

    return data.user
  } catch (error) {
    console.error('Get current user error:', error)
    throw error
  }
}

/**
 * Get the current user's profile from the database
 * @returns User profile with role information or null
 */
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  try {
    // First, get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError) throw userError
    if (!user) return null

    // Then, fetch the profile from the database
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      // If profile doesn't exist, this might be a new user
      console.warn('Profile not found for user:', user.id)
      return null
    }

    return profile as UserProfile
  } catch (error) {
    console.error('Get current user profile error:', error)
    throw error
  }
}

/**
 * Setup authentication state change listener
 * @param callback - Function to call when auth state changes
 * @returns Subscription object for cleanup
 */
export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void
) {
  try {
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (event, session) => {
        callback(event, session)
      }
    )

    return subscription
  } catch (error) {
    console.error('Auth state change listener error:', error)
    throw error
  }
}

/**
 * Update user profile in the database
 * @param userId - User ID
 * @param updates - Profile updates
 * @returns Updated profile or throws error
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>
) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error

    return data as UserProfile
  } catch (error) {
    console.error('Update user profile error:', error)
    throw error
  }
}

/**
 * Reset password for a user
 * @param email - User's email address
 * @returns Promise that resolves when reset email is sent
 */
export async function resetPassword(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Reset password error:', error)
    throw error
  }
}

/**
 * Update user's password
 * @param newPassword - New password
 * @returns Promise that resolves when password is updated
 */
export async function updatePassword(newPassword: string) {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Update password error:', error)
    throw error
  }
}

/**
 * Upload profile photo to storage and update profile
 * @param userId - User ID
 * @param file - Profile photo file
 * @returns Updated profile with avatar_url
 */
export async function uploadProfilePhoto(userId: string, file: File) {
  try {
    // Validate file
    if (!file) {
      throw new Error('No file provided')
    }

    console.log('Uploading profile photo:', {
      fileName: file.name,
      fileSize: file.size,
      fileSizeMB: (file.size / 1024 / 1024).toFixed(2) + 'MB',
      fileType: file.type
    });

    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      throw new Error(`File size must be less than 5MB (current: ${(file.size / 1024 / 1024).toFixed(2)}MB)`)
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Only JPG, PNG, and WebP images are allowed (detected: ${file.type})`)
    }

    // Generate file path: userId/timestamp_filename
    const timestamp = Date.now()
    const sanitizedName = file.name.toLowerCase().replace(/[^a-z0-9.-]/g, '_')
    const filePath = `${userId}/${timestamp}_${sanitizedName}`

    // Upload to profile-photos bucket
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) throw uploadError
    if (!uploadData) throw new Error('Upload failed - no data returned')

    // Get public URL for the uploaded photo
    const { data: urlData } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(filePath)

    const avatarUrl = urlData.publicUrl

    // Update profile with avatar_url
    const { data: profile, error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', userId)
      .select()
      .single()

    if (updateError) {
      // If profile update fails, try to delete the uploaded file
      await supabase.storage.from('profile-photos').remove([filePath])
      throw updateError
    }

    return profile as UserProfile
  } catch (error) {
    console.error('Upload profile photo error:', error)
    throw error
  }
}
