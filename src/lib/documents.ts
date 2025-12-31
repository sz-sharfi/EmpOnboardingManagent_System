import { supabase } from './supabase'

// ============================================================================
// TypeScript Interfaces
// ============================================================================

export interface UploadDocumentParams {
  applicationId: string
  userId: string
  documentType: string
  file: File
}

export interface DocumentRecord {
  id: string
  application_id: string
  user_id: string
  document_type: string
  file_name: string
  file_path: string
  file_size: number
  file_type: string
  status: 'uploaded' | 'verified' | 'rejected'
  verified_by?: string | null
  verified_at?: string | null
  rejection_reason?: string | null
  is_required: boolean
  uploaded_at: string
}

export interface ReplaceDocumentParams {
  documentId: string
  oldFilePath: string
  newFile: File
  applicationId: string
  userId: string
  documentType: string
}

// ============================================================================
// Storage Configuration
// ============================================================================

// CRITICAL: This MUST match the exact Supabase storage bucket name
// The bucket "documents" is DEPRECATED and should NOT be used
const STORAGE_BUCKET = 'candidate-documents' as const;

// Compile-time assertion to prevent accidental changes
if (STORAGE_BUCKET !== 'candidate-documents') {
  throw new Error('FATAL: STORAGE_BUCKET must be "candidate-documents"');
}

// Allowed document types
export const DOCUMENT_TYPES = {
  PAN_CARD: 'pan_card',
  AADHAR_CARD: 'aadhar_card',
  PASSPORT: 'passport',
  TENTH_CERTIFICATE: 'tenth_certificate',
  TWELFTH_CERTIFICATE: 'twelfth_certificate',
  BACHELORS_DEGREE: 'bachelors_degree',
  MASTERS_DEGREE: 'masters_degree',
  POLICE_CLEARANCE: 'police_clearance',
  PHOTO: 'photo',
  SIGNATURE: 'signature',
  OTHER: 'other'
} as const

// File size limits (in bytes)
export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

// Allowed MIME types
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png'
]

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Sanitize filename to prevent security issues
 */
function sanitizeFilename(filename: string): string {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
}

/**
 * Generate unique file path
 */
function generateFilePath(
  userId: string,
  applicationId: string,
  documentType: string,
  filename: string
): string {
  const timestamp = Date.now()
  const sanitized = sanitizeFilename(filename)
  return `${userId}/${applicationId}/${documentType}/${timestamp}_${sanitized}`
}

/**
 * Validate file before upload
 * @param file - File to validate (can be undefined/null)
 * @returns Validation result with error message if invalid
 */
function validateFile(file: File | null | undefined): { valid: boolean; error?: string } {
  // Guard against undefined/null files
  if (!file) {
    return {
      valid: false,
      error: 'No file provided'
    }
  }

  // Check file size (guard against undefined size property)
  if (typeof file.size !== 'number' || file.size === 0) {
    return {
      valid: false,
      error: 'Invalid file: file size is not available'
    }
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`
    }
  }

  // Check MIME type
  if (!file.type || !ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type || 'unknown'} not allowed. Allowed types: PDF, JPG, PNG`
    }
  }

  return { valid: true }
}

// ============================================================================
// Document Upload Functions
// ============================================================================

/**
 * Upload a document to storage and create database record
 * @param params - Upload parameters
 * @returns Created document record
 */
export async function uploadDocument(
  params: UploadDocumentParams
): Promise<DocumentRecord> {
  try {
    const { applicationId, userId, documentType, file } = params

    // Guard: Ensure file exists
    if (!file) {
      throw new Error(`Cannot upload ${documentType}: No file provided`)
    }

    // Validate file
    const validation = validateFile(file)
    if (!validation.valid) {
      throw new Error(`${documentType} validation failed: ${validation.error}`)
    }

    // Generate file path
    const filePath = generateFilePath(userId, applicationId, documentType, file.name)

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false // Don't overwrite existing files
      })

    if (uploadError) throw uploadError
    if (!uploadData) throw new Error('Upload failed - no data returned')

    // Create database record - Match actual table schema
    // Actual columns: id, app_id, document_type, storage_path, file_size_bytes
    const { data: document, error: dbError } = await supabase
      .from('documents')
      .insert({
        app_id: applicationId,
        document_type: documentType,
        storage_path: filePath,
        file_size_bytes: file.size
      })
      .select()
      .single()

    if (dbError) {
      // If DB insert fails, try to delete the uploaded file
      await supabase.storage.from(STORAGE_BUCKET).remove([filePath])
      throw dbError
    }

    if (!document) throw new Error('Failed to create document record')

    return document as DocumentRecord
  } catch (error) {
    console.error('Upload document error:', error)
    throw error
  }
}

/**
 * Upload multiple documents at once
 * @param documents - Array of upload parameters
 * @returns Array of created document records
 */
export async function uploadMultipleDocuments(
  documents: UploadDocumentParams[]
): Promise<DocumentRecord[]> {
  try {
    const uploadPromises = documents.map(doc => uploadDocument(doc))
    return await Promise.all(uploadPromises)
  } catch (error) {
    console.error('Upload multiple documents error:', error)
    throw error
  }
}

// ============================================================================
// Document Retrieval Functions
// ============================================================================

/**
 * Get public URL for a document (for public buckets only)
 * @param filePath - Storage file path
 * @returns Public URL string
 */
export function getDocumentUrl(filePath: string): string {
  try {
    const { data } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath)

    return data.publicUrl
  } catch (error) {
    console.error('Get document URL error:', error)
    throw error
  }
}

/**
 * Create a signed URL for private document access
 * @param filePath - Storage file path
 * @param expiresIn - URL expiration time in seconds (default: 1 hour)
 * @returns Signed URL with expiration
 */
export async function getDocumentSignedUrl(
  filePath: string,
  expiresIn: number = 3600
): Promise<string> {
  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(filePath, expiresIn)

    if (error) throw error
    if (!data?.signedUrl) throw new Error('Failed to create signed URL')

    return data.signedUrl
  } catch (error) {
    console.error('Get document signed URL error:', error)
    throw error
  }
}

/**
 * Get all documents for an application
 * @param applicationId - Application ID
 * @returns Array of document records
 */
export async function getApplicationDocuments(
  applicationId: string
): Promise<DocumentRecord[]> {
  try {
    console.log('getApplicationDocuments called with ID:', applicationId);
    
    // Try with application_id first (new schema)
    const { data: data1, error: error1 } = await supabase
      .from('documents')
      .select('*')
      .eq('application_id', applicationId)
      .order('created_at', { ascending: false })

    console.log('Query with application_id - Error:', error1, 'Data count:', data1?.length || 0);

    // If no results and no error, try with app_id (old schema)
    if (!error1 && (!data1 || data1.length === 0)) {
      console.log('No results with application_id, trying app_id...');
      const { data: data2, error: error2 } = await supabase
        .from('documents')
        .select('*')
        .eq('app_id', applicationId)
        .order('created_at', { ascending: false })
      
      console.log('Query with app_id - Error:', error2, 'Data count:', data2?.length || 0);
      
      if (error2) throw error2
      return (data2 || []) as DocumentRecord[]
    }

    if (error1) throw error1

    return (data1 || []) as DocumentRecord[]
  } catch (error) {
    console.error('Get application documents error:', error)
    throw error
  }
}

/**
 * Get all documents for a user across all applications
 * @param userId - User ID
 * @returns Array of document records
 */
export async function getUserDocuments(userId: string): Promise<DocumentRecord[]> {
  try {
    const { data: documents, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('uploaded_at', { ascending: false })

    if (error) throw error

    return (documents || []) as DocumentRecord[]
  } catch (error) {
    console.error('Get user documents error:', error)
    throw error
  }
}

/**
 * Get a specific document by ID
 * @param documentId - Document ID
 * @returns Document record or null
 */
export async function getDocumentById(
  documentId: string
): Promise<DocumentRecord | null> {
  try {
    const { data: document, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    return document as DocumentRecord
  } catch (error) {
    console.error('Get document by ID error:', error)
    throw error
  }
}

// ============================================================================
// Document Deletion Functions
// ============================================================================

/**
 * Delete a document from storage and database
 * @param documentId - Document ID
 * @param filePath - Storage file path
 * @returns Success status
 */
export async function deleteDocument(
  documentId: string,
  filePath: string
): Promise<{ success: boolean }> {
  try {
    // Delete from storage first
    const { error: storageError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([filePath])

    if (storageError) {
      console.warn('Storage deletion warning:', storageError)
      // Continue with DB deletion even if storage deletion fails
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)

    if (dbError) throw dbError

    return { success: true }
  } catch (error) {
    console.error('Delete document error:', error)
    throw error
  }
}

/**
 * Delete multiple documents at once
 * @param documents - Array of {documentId, filePath}
 * @returns Success status
 */
export async function deleteMultipleDocuments(
  documents: Array<{ documentId: string; filePath: string }>
): Promise<{ success: boolean }> {
  try {
    const deletePromises = documents.map(doc =>
      deleteDocument(doc.documentId, doc.filePath)
    )
    await Promise.all(deletePromises)
    return { success: true }
  } catch (error) {
    console.error('Delete multiple documents error:', error)
    throw error
  }
}

// ============================================================================
// Document Verification Functions (Admin)
// ============================================================================

/**
 * Verify a document (admin function)
 * @param documentId - Document ID
 * @param adminId - Admin user ID
 * @returns Updated document record
 */
export async function verifyDocument(
  documentId: string,
  adminId: string
): Promise<DocumentRecord> {
  try {
    console.log('Verifying document:', { documentId, adminId });
    
    // First, check if document exists
    const { data: existing, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single()
    
    console.log('Existing document:', existing, 'Error:', fetchError);
    
    if (fetchError || !existing) {
      throw new Error(`Document not found: ${documentId}`)
    }

    // Now update it
    const { data: document, error } = await supabase
      .from('documents')
      .update({
        verification_status: 'verified',
        verified_by: adminId,
        verified_at: new Date().toISOString(),
        rejection_reason: null // Clear any previous rejection
      })
      .eq('id', documentId)
      .select()
      .maybeSingle()

    console.log('Update result:', document, 'Error:', error);

    if (error) throw error
    if (!document) throw new Error('Failed to verify document - no rows updated')

    return document as DocumentRecord
  } catch (error) {
    console.error('Verify document error:', error)
    throw error
  }
}

/**
 * Reject a document (admin function)
 * @param documentId - Document ID
 * @param adminId - Admin user ID
 * @param reason - Rejection reason
 * @returns Updated document record
 */
export async function rejectDocument(
  documentId: string,
  adminId: string,
  reason: string
): Promise<DocumentRecord> {
  try {
    const { data: document, error } = await supabase
      .from('documents')
      .update({
        verification_status: 'rejected',
        verified_by: adminId,
        verified_at: new Date().toISOString(),
        rejection_reason: reason
      })
      .eq('id', documentId)
      .select()
      .single()

    if (error) throw error
    if (!document) throw new Error('Failed to reject document')

    return document as DocumentRecord
  } catch (error) {
    console.error('Reject document error:', error)
    throw error
  }
}

/**
 * Verify multiple documents at once
 * @param documentIds - Array of document IDs
 * @param adminId - Admin user ID
 * @returns Array of updated documents
 */
export async function verifyMultipleDocuments(
  documentIds: string[],
  adminId: string
): Promise<DocumentRecord[]> {
  try {
    const verifyPromises = documentIds.map(id => verifyDocument(id, adminId))
    return await Promise.all(verifyPromises)
  } catch (error) {
    console.error('Verify multiple documents error:', error)
    throw error
  }
}

// ============================================================================
// Document Replacement Functions
// ============================================================================

/**
 * Replace an existing document with a new file
 * @param params - Replace document parameters
 * @returns Updated document record
 */
export async function replaceDocument(
  params: ReplaceDocumentParams
): Promise<DocumentRecord> {
  try {
    const {
      documentId,
      oldFilePath,
      newFile,
      applicationId,
      userId,
      documentType
    } = params

    // Validate new file
    const validation = validateFile(newFile)
    if (!validation.valid) {
      throw new Error(validation.error)
    }

    // Generate new file path
    const newFilePath = generateFilePath(
      userId,
      applicationId,
      documentType,
      newFile.name
    )

    // Upload new file
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(newFilePath, newFile, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) throw uploadError
    if (!uploadData) throw new Error('Upload failed - no data returned')

    // Update database record
    const { data: document, error: dbError } = await supabase
      .from('documents')
      .update({
        file_name: newFile.name,
        file_path: newFilePath,
        file_size: newFile.size,
        file_type: newFile.type,
        status: 'uploaded', // Reset to uploaded status
        verified_by: null,
        verified_at: null,
        rejection_reason: null,
        uploaded_at: new Date().toISOString()
      })
      .eq('id', documentId)
      .select()
      .single()

    if (dbError) {
      // If DB update fails, try to delete the newly uploaded file
      await supabase.storage.from(STORAGE_BUCKET).remove([newFilePath])
      throw dbError
    }

    if (!document) throw new Error('Failed to update document record')

    // Delete old file from storage
    await supabase.storage.from(STORAGE_BUCKET).remove([oldFilePath])

    return document as DocumentRecord
  } catch (error) {
    console.error('Replace document error:', error)
    throw error
  }
}

// ============================================================================
// Document Download Functions
// ============================================================================

/**
 * Download a document file
 * @param filePath - Storage file path
 * @returns File blob
 */
export async function downloadDocument(filePath: string): Promise<Blob> {
  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(filePath)

    if (error) throw error
    if (!data) throw new Error('Failed to download document')

    return data
  } catch (error) {
    console.error('Download document error:', error)
    throw error
  }
}

/**
 * Trigger browser download for a document
 * @param filePath - Storage file path
 * @param filename - Download filename
 */
export async function triggerDocumentDownload(
  filePath: string,
  filename: string
): Promise<void> {
  try {
    const blob = await downloadDocument(filePath)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Trigger document download error:', error)
    throw error
  }
}

// ============================================================================
// Document Statistics Functions
// ============================================================================

/**
 * Get document statistics for an application
 * @param applicationId - Application ID
 * @returns Document statistics
 */
export async function getDocumentStats(applicationId: string): Promise<{
  total: number
  uploaded: number
  verified: number
  rejected: number
}> {
  try {
    const documents = await getApplicationDocuments(applicationId)

    const stats = {
      total: documents.length,
      uploaded: 0,
      verified: 0,
      rejected: 0
    }

    documents.forEach(doc => {
      if (doc.status in stats) {
        stats[doc.status]++
      }
    })

    return stats
  } catch (error) {
    console.error('Get document stats error:', error)
    throw error
  }
}
