export type ApplicationStatus = 
  | 'draft' 
  | 'submitted' 
  | 'under_review' 
  | 'approved' 
  | 'rejected' 
  | 'documents_pending' 
  | 'completed';

export interface EducationDetail {
  level: '10th' | '12th' | "Bachelor's" | "Master's";
  yearOfPassing: string;
  percentage: string;
}

export interface DocumentUpload {
  id: string;
  type: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  status: 'pending' | 'uploaded' | 'verified' | 'rejected';
}

export interface CandidateApplication {
  id: string;
  user_id: string;
  post_applied_for: string;
  name: string;
  father_or_husband_name: string;
  photo_url: string | null;
  permanent_address: string;
  communication_address: string;
  date_of_birth: string;
  sex: 'Male' | 'Female' | 'Other';
  nationality: string;
  marital_status: 'Single' | 'Married' | 'Divorced' | 'Widowed';
  religion: string;
  mobile_no: string;
  email: string;
  bank_name: string;
  account_no: string;
  ifsc_code: string;
  branch: string;
  pan_no: string;
  aadhar_no: string;
  education: EducationDetail[] | any; // JSONB from database
  declaration_place?: string | null;
  declaration_date?: string | null;
  declaration_accepted?: boolean;
  status: ApplicationStatus;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  rejection_reason?: string | null;
  admin_notes?: string | null;
  created_at: string;
  updated_at: string;
  submitted_at?: string | null;
}

export interface FormErrors {
  [key: string]: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'candidate' | 'admin';
}
