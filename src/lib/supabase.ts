import { createClient } from '@supabase/supabase-js'

// Database type definitions
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'candidate' | 'admin'
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          role?: 'candidate' | 'admin'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'candidate' | 'admin'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      candidate_applications: {
        Row: {
          id: string
          user_id: string
          post_applied_for: string
          name: string
          father_or_husband_name: string
          photo: string | null
          permanent_address: string
          communication_address: string
          date_of_birth: string
          sex: 'Male' | 'Female' | 'Other'
          nationality: string
          marital_status: 'Single' | 'Married' | 'Divorced' | 'Widowed'
          religion: string
          mobile_no: string
          email: string
          bank_name: string
          account_no: string
          ifsc: string
          branch: string
          pan_no: string
          aadhar_no: string
          education: any // JSONB
          status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'documents_pending' | 'completed'
          submitted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          post_applied_for: string
          name: string
          father_or_husband_name: string
          photo?: string | null
          permanent_address: string
          communication_address: string
          date_of_birth: string
          sex: 'Male' | 'Female' | 'Other'
          nationality: string
          marital_status: 'Single' | 'Married' | 'Divorced' | 'Widowed'
          religion: string
          mobile_no: string
          email: string
          bank_name: string
          account_no: string
          ifsc: string
          branch: string
          pan_no: string
          aadhar_no: string
          education?: any
          status?: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'documents_pending' | 'completed'
          submitted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          post_applied_for?: string
          name?: string
          father_or_husband_name?: string
          photo?: string | null
          permanent_address?: string
          communication_address?: string
          date_of_birth?: string
          sex?: 'Male' | 'Female' | 'Other'
          nationality?: string
          marital_status?: 'Single' | 'Married' | 'Divorced' | 'Widowed'
          religion?: string
          mobile_no?: string
          email?: string
          bank_name?: string
          account_no?: string
          ifsc?: string
          branch?: string
          pan_no?: string
          aadhar_no?: string
          education?: any
          status?: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'documents_pending' | 'completed'
          submitted_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          application_id: string
          user_id: string
          document_type: string
          file_name: string
          file_path: string
          file_size: number
          mime_type: string
          status: 'pending' | 'uploaded' | 'verified' | 'rejected'
          uploaded_at: string
          verified_at: string | null
          verified_by: string | null
          rejection_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          application_id: string
          user_id: string
          document_type: string
          file_name: string
          file_path: string
          file_size: number
          mime_type: string
          status?: 'pending' | 'uploaded' | 'verified' | 'rejected'
          uploaded_at?: string
          verified_at?: string | null
          verified_by?: string | null
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          application_id?: string
          user_id?: string
          document_type?: string
          file_name?: string
          file_path?: string
          file_size?: number
          mime_type?: string
          status?: 'pending' | 'uploaded' | 'verified' | 'rejected'
          uploaded_at?: string
          verified_at?: string | null
          verified_by?: string | null
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable')
}

// Create and export Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

export default supabase
