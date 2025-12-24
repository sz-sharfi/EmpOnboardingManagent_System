import { CandidateApplication } from '../types';

export const mockApplications: CandidateApplication[] = [
  {
    id: '1',
    postAppliedFor: 'Senior Software Engineer',
    name: 'John Doe',
    fatherOrHusbandName: 'Robert Doe',
    photo: null,
    permanentAddress: '123 Main Street, New York, NY 10001',
    communicationAddress: '456 Oak Avenue, New York, NY 10002',
    dateOfBirth: '1990-05-15',
    sex: 'Male',
    nationality: 'American',
    maritalStatus: 'Single',
    religion: 'Christian',
    mobileNo: '5551234567',
    email: 'john.doe@example.com',
    bankName: 'Chase Bank',
    accountNo: '1234567890',
    ifsc: 'CHASUS33',
    branch: 'New York',
    panNo: 'ABCDE1234F',
    aadharNo: '123456789012',
    education: [
      {
        level: "Bachelor's",
        yearOfPassing: '2012',
        percentage: '85',
      },
      {
        level: "Master's",
        yearOfPassing: '2014',
        percentage: '88',
      },
    ],
    status: 'under_review',
    submittedAt: '2024-01-10T10:00:00Z',
    documents: [
      {
        id: '1',
        type: 'resume',
        fileName: 'john_doe_resume.pdf',
        fileSize: 245000,
        uploadedAt: '2024-01-10T09:30:00Z',
        status: 'verified',
      },
    ],
  },
];
