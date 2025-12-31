import { supabase } from './supabase'
import type { CandidateApplication } from '../types'

// ============================================================================
// TypeScript Interfaces
// ============================================================================

interface AdminActionLog {
  admin_id: string
  application_id: string
  action: string
  details: Record<string, any>
}

// ============================================================================
// Application CRUD Functions
// ============================================================================

/**
 * Create a new application in draft status
 * @param userId - User ID of the applicant
 * @param data - Partial application data
 * @returns Created application or throws error
 */
export async function createApplication(
  userId: string,
  data: Partial<CandidateApplication>
): Promise<CandidateApplication> {
  try {
    const { data: application, error } = await supabase
      .from('candidate_applications')
      .insert({
        user_id: userId,
        status: 'draft',
        ...data
      })
      .select()
      .single()

    if (error) throw error
    if (!application) throw new Error('Failed to create application')

    return application as CandidateApplication
  } catch (error) {
    console.error('Create application error:', error)
    throw error
  }
}

/**
 * Update an existing application
 * @param applicationId - Application ID
 * @param data - Partial application data to update
 * @returns Updated application or throws error
 */
export async function updateApplication(
  applicationId: string,
  data: Partial<CandidateApplication>
): Promise<CandidateApplication> {
  try {
    const { data: application, error } = await supabase
      .from('candidate_applications')
      .update(data)
      .eq('id', applicationId)
      .select()
      .single()

    if (error) throw error
    if (!application) throw new Error('Failed to update application')

    return application as CandidateApplication
  } catch (error) {
    console.error('Update application error:', error)
    throw error
  }
}

/**
 * Submit an application (change status from draft to submitted)
 * @param applicationId - Application ID
 * @returns Updated application or throws error
 */
export async function submitApplication(
  applicationId: string
): Promise<CandidateApplication> {
  try {
    const { data: application, error } = await supabase
      .from('candidate_applications')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString()
      })
      .eq('id', applicationId)
      .select()
      .single()

    if (error) throw error
    if (!application) throw new Error('Failed to submit application')

    return application as CandidateApplication
  } catch (error) {
    console.error('Submit application error:', error)
    throw error
  }
}

/**
 * Get the most recent application for a user
 * @param userId - User ID
 * @returns User's most recent application or null
 */
export async function getUserApplication(
  userId: string
): Promise<CandidateApplication | null> {
  try {
    const { data: application, error } = await supabase
      .from('candidate_applications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      // If no application found, return null instead of throwing
      if (error.code === 'PGRST116') return null
      throw error
    }

    return application as CandidateApplication
  } catch (error) {
    console.error('Get user application error:', error)
    throw error
  }
}

/**
 * Get all applications for a user (for users with multiple applications)
 * @param userId - User ID
 * @returns Array of user's applications
 */
export async function getUserApplications(
  userId: string
): Promise<CandidateApplication[]> {
  try {
    const { data: applications, error } = await supabase
      .from('candidate_applications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return (applications || []) as CandidateApplication[]
  } catch (error) {
    console.error('Get user applications error:', error)
    throw error
  }
}

/**
 * Get a specific application by ID
 * @param applicationId - Application ID
 * @returns Application data with profile merged or null
 */
export async function getApplicationById(applicationId: string) {
  try {
    // Step 1: Fetch application WITHOUT joins
    const { data: application, error: appError } = await supabase
      .from('candidate_applications')
      .select('*')
      .eq('id', applicationId)
      .single()

    if (appError) {
      if (appError.code === 'PGRST116') return null
      throw appError
    }

    if (!application) return null

    // Step 2: Fetch profile separately
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, avatar_url')
      .eq('id', application.user_id)
      .single()

    if (profileError) {
      console.warn('Profile not found for user_id:', application.user_id)
    }

    // Step 3: Merge application + profile
    return {
      ...application,
      profile: profile || null
    }
  } catch (error) {
    console.error('Get application by ID error:', error)
    throw error
  }
}

/**
 * Get all applications (admin function)
 * @param filters - Optional filters (status, search, etc.)
 * @returns Array of all applications with profiles merged
 */
export async function getAllApplications(filters?: {
  status?: string
  searchQuery?: string
}) {
  try {
    // Step 1: Fetch applications WITHOUT joins
    let query = supabase
      .from('candidate_applications')
      .select('*')
      .order('submitted_at', { ascending: false, nullsLast: true })
      .order('created_at', { ascending: false })

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }

    const { data: applications, error: appError } = await query

    if (appError) throw appError
    if (!applications || applications.length === 0) return []

    // Step 2: Extract unique user_id values
    const userIds = [...new Set(applications.map(app => app.user_id))]

    // Step 3: Fetch profiles separately
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, avatar_url')
      .in('id', userIds)

    if (profileError) {
      console.warn('Error fetching profiles:', profileError)
    }

    // Step 4: Merge applications + profiles
    const profilesMap = new Map()
    profiles?.forEach(profile => {
      profilesMap.set(profile.id, profile)
    })

    const mergedApplications = applications.map(app => ({
      ...app,
      profile: profilesMap.get(app.user_id) || null
    }))

    // Apply search filter if provided
    if (filters?.searchQuery) {
      const searchLower = filters.searchQuery.toLowerCase()
      return mergedApplications.filter(app => {
        const name = app.profile?.full_name || app.name || ''
        const email = app.profile?.email || app.email || ''
        const post = app.post_applied_for || ''
        return (
          name.toLowerCase().includes(searchLower) ||
          email.toLowerCase().includes(searchLower) ||
          post.toLowerCase().includes(searchLower)
        )
      })
    }

    return mergedApplications
  } catch (error) {
    console.error('Get all applications error:', error)
    throw error
  }
}

/**
 * Get application statistics (admin function)
 * @returns Object with application counts by status
 */
export async function getApplicationStats(): Promise<{
  total: number
  submitted: number
  approved: number
  rejected: number
}> {
  try {
    const { data, error } = await supabase
      .from('candidate_applications')
      .select('status, submitted_at')

    if (error) throw error

    const stats = {
      total: data?.length || 0,
      submitted: 0,
      approved: 0,
      rejected: 0
    }

    data?.forEach((row) => {
      if (row.status === 'submitted') stats.submitted++
      if (row.status === 'approved') stats.approved++
      if (row.status === 'rejected') stats.rejected++
    })

    return stats
  } catch (error) {
    console.error('Get application stats error:', error)
    throw error
  }
}

/**
 * Log admin action to audit trail
 * @param logData - Admin action log data
 */
async function logAdminAction(logData: AdminActionLog): Promise<void> {
  try {
    const { error } = await supabase
      .from('admin_actions_log')
      .insert(logData)

    if (error) throw error
  } catch (error) {
    console.error('Log admin action error:', error)
    // Don't throw error to prevent blocking main operation
  }
}

/**
 * Approve an application (admin function)
 * @param applicationId - Application ID
 * @param adminId - Admin user ID
 * @param notes - Optional admin notes
 * @returns Updated application or throws error
 */
export async function approveApplication(
  applicationId: string,
  adminId: string,
  notes?: string
) {
  try {
    const { data, error } = await supabase
      .from('candidate_applications')
      .update({
        status: 'accepted',
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
        admin_notes: notes || null
      })
      .eq('id', applicationId)
      .select()
      .single()

    if (error) throw error
    if (!data) throw new Error('Failed to approve application')

    await logAdminAction({
      admin_id: adminId,
      application_id: applicationId,
      action: 'approve',
      details: { notes }
    })

    return data
  } catch (error) {
    console.error('Approve application error:', error)
    throw error
  }
}

/**
 * Reject an application (admin function)
 * @param applicationId - Application ID
 * @param adminId - Admin user ID
 * @param reason - Rejection reason
 * @param notes - Optional admin notes
 * @returns Updated application or throws error
 */
export async function rejectApplication(
  applicationId: string,
  adminId: string,
  reason: string,
  notes?: string
) {
  try {
    const { data, error } = await supabase
      .from('candidate_applications')
      .update({
        status: 'rejected',
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
        rejection_reason: reason,
        admin_notes: notes || null
      })
      .eq('id', applicationId)
      .select()
      .single()

    if (error) throw error
    if (!data) throw new Error('Failed to reject application')

    await logAdminAction({
      admin_id: adminId,
      application_id: applicationId,
      action: 'reject',
      details: { reason, notes }
    })

    return data
  } catch (error) {
    console.error('Reject application error:', error)
    throw error
  }
}

/**
 * Move application to under review status (admin function)
 * @param applicationId - Application ID
 * @param adminId - Admin user ID
 * @returns Updated application or throws error
 */
export async function moveToUnderReview(
  applicationId: string,
  adminId: string
): Promise<CandidateApplication> {
  try {
    const { data: application, error } = await supabase
      .from('candidate_applications')
      .update({
        status: 'under_review',
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', applicationId)
      .select()
      .single()

    if (error) throw error
    if (!application) throw new Error('Failed to update application status')

    // Log admin action
    await logAdminAction({
      admin_id: adminId,
      application_id: applicationId,
      action: 'move_to_review',
      details: {}
    })

    return application as CandidateApplication
  } catch (error) {
    console.error('Move to under review error:', error)
    throw error
  }
}

/**
 * Delete an application (admin function - use with caution)
 * @param applicationId - Application ID
 * @param adminId - Admin user ID performing the deletion
 * @returns Success status
 */
export async function deleteApplication(
  applicationId: string,
  adminId: string
): Promise<{ success: boolean }> {
  try {
    // Log the deletion before deleting
    await logAdminAction({
      admin_id: adminId,
      application_id: applicationId,
      action: 'delete',
      details: { deleted_at: new Date().toISOString() }
    })

    const { error } = await supabase
      .from('candidate_applications')
      .delete()
      .eq('id', applicationId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Delete application error:', error)
    throw error
  }
}

/**
 * Get admin action logs for an application
 * @param applicationId - Application ID
 * @returns Array of admin actions
 */
export async function getApplicationAuditLog(
  applicationId: string
): Promise<any[]> {
  try {
    const { data: logs, error } = await supabase
      .from('admin_actions_log')
      .select('*')
      .eq('application_id', applicationId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return logs || []
  } catch (error) {
    console.error('Get application audit log error:', error)
    throw error
  }
}
