import type { CandidateApplication, ApplicationStatus } from '../types';

export const mockApplications: CandidateApplication[] = [
  {
    id: 'APP-001',
    postAppliedFor: 'Software Engineer',
    name: 'John Doe',
    fatherOrHusbandName: 'Richard Doe',
    photo: null,
    permanentAddress: '123 Main Street, City, State - 123456',
    communicationAddress: '123 Main Street, City, State - 123456',
    dateOfBirth: '1995-01-15',
    sex: 'Male',
    nationality: 'Indian',
    maritalStatus: 'Single',
    religion: 'Not Specified',
    mobileNo: '+91 9876543210',
    email: 'john.doe@email.com',
    bankName: 'State Bank of India',
    accountNo: '1234567890',
    ifsc: 'SBIN0001234',
    branch: 'Main Branch',
    panNo: 'ABCDE1234F',
    aadharNo: '123456789012',
    education: [
      { level: '10th', yearOfPassing: '2010', percentage: '85.5' },
      { level: '12th', yearOfPassing: '2012', percentage: '88.0' },
      { level: "Bachelor's", yearOfPassing: '2016', percentage: '78.5' },
      { level: "Master's", yearOfPassing: '', percentage: '' },
    ],
    status: 'under_review',
    submittedAt: '2024-12-20T10:30:00',
    documents: [
      {
        id: 'DOC-001',
        type: 'Resume',
        fileName: 'john_doe_resume.pdf',
        fileSize: 245000,
        uploadedAt: '2024-12-20T10:15:00',
        status: 'verified',
      },
    ],
  },
  {
    id: 'APP-002',
    postAppliedFor: 'Product Manager',
    name: 'Sarah Johnson',
    fatherOrHusbandName: 'Michael Johnson',
    photo: null,
    permanentAddress: '456 Oak Avenue, Metro City, State - 654321',
    communicationAddress: '789 Elm Road, Metro City, State - 654322',
    dateOfBirth: '1992-07-22',
    sex: 'Female',
    nationality: 'Indian',
    maritalStatus: 'Married',
    religion: 'Christian',
    mobileNo: '+91 9876543211',
    email: 'sarah.johnson@email.com',
    bankName: 'HDFC Bank',
    accountNo: '9876543210',
    ifsc: 'HDFC0001567',
    branch: 'Main Branch',
    panNo: 'FGHIJ5678K',
    aadharNo: '234567890123',
    education: [
      { level: '10th', yearOfPassing: '2008', percentage: '92.0' },
      { level: '12th', yearOfPassing: '2010', percentage: '90.5' },
      { level: "Bachelor's", yearOfPassing: '2014', percentage: '86.0' },
      { level: "Master's", yearOfPassing: '2016', percentage: '89.5' },
    ],
    status: 'approved',
    submittedAt: '2024-12-18T14:45:00',
    documents: [
      {
        id: 'DOC-002',
        type: 'Resume',
        fileName: 'sarah_johnson_resume.pdf',
        fileSize: 267000,
        uploadedAt: '2024-12-18T14:20:00',
        status: 'verified',
      },
      {
        id: 'DOC-003',
        type: 'Certificate',
        fileName: 'masters_certificate.pdf',
        fileSize: 512000,
        uploadedAt: '2024-12-18T14:25:00',
        status: 'verified',
      },
    ],
  },
  {
    id: 'APP-003',
    postAppliedFor: 'Data Analyst',
    name: 'Rajesh Kumar',
    fatherOrHusbandName: 'Vikram Kumar',
    photo: null,
    permanentAddress: '321 Pine Street, Tech City, State - 789012',
    communicationAddress: '321 Pine Street, Tech City, State - 789012',
    dateOfBirth: '1998-03-10',
    sex: 'Male',
    nationality: 'Indian',
    maritalStatus: 'Single',
    religion: 'Hindu',
    mobileNo: '+91 9876543212',
    email: 'rajesh.kumar@email.com',
    bankName: 'Axis Bank',
    accountNo: '5555666677',
    ifsc: 'AXIS0001890',
    branch: 'North Branch',
    panNo: 'KLMNO9012P',
    aadharNo: '345678901234',
    education: [
      { level: '10th', yearOfPassing: '2013', percentage: '88.0' },
      { level: '12th', yearOfPassing: '2015', percentage: '85.5' },
      { level: "Bachelor's", yearOfPassing: '2019', percentage: '81.0' },
      { level: "Master's", yearOfPassing: '', percentage: '' },
    ],
    status: 'documents_pending',
    submittedAt: '2024-12-15T09:20:00',
    documents: [],
  },
  {
    id: 'APP-004',
    postAppliedFor: 'UI/UX Designer',
    name: 'Priya Sharma',
    fatherOrHusbandName: 'Ashok Sharma',
    photo: null,
    permanentAddress: '654 Birch Lane, Design City, State - 456789',
    communicationAddress: '654 Birch Lane, Design City, State - 456789',
    dateOfBirth: '1996-11-28',
    sex: 'Female',
    nationality: 'Indian',
    maritalStatus: 'Single',
    religion: 'Sikh',
    mobileNo: '+91 9876543213',
    email: 'priya.sharma@email.com',
    bankName: 'IndusInd Bank',
    accountNo: '4444333322',
    ifsc: 'INDB0001234',
    branch: 'Downtown',
    panNo: 'QRSTU3456V',
    aadharNo: '456789012345',
    education: [
      { level: '10th', yearOfPassing: '2011', percentage: '90.0' },
      { level: '12th', yearOfPassing: '2013', percentage: '89.0' },
      { level: "Bachelor's", yearOfPassing: '2017', percentage: '84.5' },
      { level: "Master's", yearOfPassing: '', percentage: '' },
    ],
    status: 'rejected',
    submittedAt: '2024-12-10T11:00:00',
    documents: [
      {
        id: 'DOC-004',
        type: 'Portfolio',
        fileName: 'priya_design_portfolio.pdf',
        fileSize: 3200000,
        uploadedAt: '2024-12-10T10:30:00',
        status: 'rejected',
      },
    ],
  },
  {
    id: 'APP-005',
    postAppliedFor: 'DevOps Engineer',
    name: 'Amit Patel',
    fatherOrHusbandName: 'Suresh Patel',
    photo: null,
    permanentAddress: '987 Maple Drive, Infrastructure City, State - 321654',
    communicationAddress: '987 Maple Drive, Infrastructure City, State - 321654',
    dateOfBirth: '1993-06-05',
    sex: 'Male',
    nationality: 'Indian',
    maritalStatus: 'Married',
    religion: 'Buddhist',
    mobileNo: '+91 9876543214',
    email: 'amit.patel@email.com',
    bankName: 'Kotak Bank',
    accountNo: '7777888899',
    ifsc: 'KKBK0001567',
    branch: 'East Branch',
    panNo: 'WXYZ6789A',
    aadharNo: '567890123456',
    education: [
      { level: '10th', yearOfPassing: '2009', percentage: '87.0' },
      { level: '12th', yearOfPassing: '2011', percentage: '86.5' },
      { level: "Bachelor's", yearOfPassing: '2015', percentage: '79.0' },
      { level: "Master's", yearOfPassing: '2018', percentage: '82.0' },
    ],
    status: 'completed',
    submittedAt: '2024-12-05T15:30:00',
    documents: [
      {
        id: 'DOC-005',
        type: 'Resume',
        fileName: 'amit_patel_resume.pdf',
        fileSize: 198000,
        uploadedAt: '2024-12-05T15:00:00',
        status: 'verified',
      },
      {
        id: 'DOC-006',
        type: 'Certificates',
        fileName: 'certifications.pdf',
        fileSize: 892000,
        uploadedAt: '2024-12-05T15:10:00',
        status: 'verified',
      },
    ],
  },
  {
    id: 'APP-006',
    postAppliedFor: 'Business Analyst',
    name: 'Emma Wilson',
    fatherOrHusbandName: 'David Wilson',
    photo: null,
    permanentAddress: '147 Cedar Road, Business District, State - 135790',
    communicationAddress: '258 Spruce Avenue, Business District, State - 135791',
    dateOfBirth: '1997-09-14',
    sex: 'Female',
    nationality: 'Indian',
    maritalStatus: 'Single',
    religion: 'Not Specified',
    mobileNo: '+91 9876543215',
    email: 'emma.wilson@email.com',
    bankName: 'Yes Bank',
    accountNo: '1111222233',
    ifsc: 'YESB0001234',
    branch: 'Central Branch',
    panNo: 'BCDE7890F',
    aadharNo: '678901234567',
    education: [
      { level: '10th', yearOfPassing: '2012', percentage: '91.0' },
      { level: '12th', yearOfPassing: '2014', percentage: '90.5' },
      { level: "Bachelor's", yearOfPassing: '2018', percentage: '87.5' },
      { level: "Master's", yearOfPassing: '', percentage: '' },
    ],
    status: 'submitted',
    submittedAt: '2024-12-01T13:15:00',
    documents: [
      {
        id: 'DOC-007',
        type: 'Resume',
        fileName: 'emma_wilson_resume.pdf',
        fileSize: 156000,
        uploadedAt: '2024-12-01T13:00:00',
        status: 'pending',
      },
    ],
  },
];

/**
 * Get application by ID
 */
export const getApplicationById = (id: string): CandidateApplication | undefined => {
  return mockApplications.find(app => app.id === id);
};

/**
 * Update application status
 */
export const updateApplicationStatus = (id: string, status: ApplicationStatus): void => {
  const app = mockApplications.find(app => app.id === id);
  if (app) {
    app.status = status;
  }
};

/**
 * Get all applications by status
 */
export const getApplicationsByStatus = (status: ApplicationStatus): CandidateApplication[] => {
  return mockApplications.filter(app => app.status === status);
};

/**
 * Get applications by post applied for
 */
export const getApplicationsByPost = (post: string): CandidateApplication[] => {
  return mockApplications.filter(app => app.postAppliedFor === post);
};

/**
 * Get statistics for admin dashboard
 */
export const getApplicationStats = () => {
  return {
    total: mockApplications.length,
    submitted: mockApplications.filter(app => app.status === 'submitted').length,
    underReview: mockApplications.filter(app => app.status === 'under_review').length,
    approved: mockApplications.filter(app => app.status === 'approved').length,
    rejected: mockApplications.filter(app => app.status === 'rejected').length,
    documentsPending: mockApplications.filter(app => app.status === 'documents_pending').length,
    completed: mockApplications.filter(app => app.status === 'completed').length,
  };
};
