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
  postAppliedFor: string;
  name: string;
  fatherOrHusbandName: string;
  photo: string | null;
  permanentAddress: string;
  communicationAddress: string;
  dateOfBirth: string;
  sex: 'Male' | 'Female' | 'Other';
  nationality: string;
  maritalStatus: 'Single' | 'Married' | 'Divorced' | 'Widowed';
  religion: string;
  mobileNo: string;
  email: string;
  bankName: string;
  accountNo: string;
  ifsc: string;
  branch: string;
  panNo: string;
  aadharNo: string;
  education: EducationDetail[];
  status: ApplicationStatus;
  submittedAt: string;
  documents: DocumentUpload[];
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
