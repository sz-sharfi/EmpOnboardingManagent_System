import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Save, Check, CheckCircle, User, Upload, FileText, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { createApplication, updateApplication, submitApplication, getUserApplication } from '../../lib/applications';
import { uploadDocument } from '../../lib/documents';
import { uploadProfilePhoto } from '../../lib/auth';

interface FormData {
  postAppliedFor: string;
  fullName: string;
  fatherOrHusbandName: string;
  photo: File | null;
  permanentAddress: string;
  communicationAddress: string;
  sameAsPermAddress: boolean;
  dateOfBirth: string;
  sex: string;
  nationality: string;
  maritalStatus: string;
  religion: string;
  mobileNo: string;
  email: string;
  bankName: string;
  accountNo: string;
  ifscCode: string;
  branch: string;
  panNo: string;
  aadharNo: string;
  education: Array<{ level: string; yearOfPassing: string; percentage: string }>;
  declaration: boolean;
  place: string;
  date: string;
}

interface DocumentFile {
  type: 'PAN Card' | 'Aadhar Card' | '10th Certificate' | '12th Certificate' | "Bachelor's Certificate";
  file: File | null;
  preview: string | null;
}

const initialFormData: FormData = {
  postAppliedFor: '',
  fullName: '',
  fatherOrHusbandName: '',
  photo: null,
  permanentAddress: '',
  communicationAddress: '',
  sameAsPermAddress: false,
  dateOfBirth: '',
  sex: '',
  nationality: 'Indian',
  maritalStatus: '',
  religion: '',
  mobileNo: '',
  email: '',
  bankName: '',
  accountNo: '',
  ifscCode: '',
  branch: '',
  panNo: '',
  aadharNo: '',
  education: [
    { level: '10th Std', yearOfPassing: '', percentage: '' },
    { level: '12th Std', yearOfPassing: '', percentage: '' },
    { level: "Bachelor's Degree", yearOfPassing: '', percentage: '' },
    { level: "Master's Degree", yearOfPassing: '', percentage: '' },
  ],
  declaration: false,
  place: '',
  date: new Date().toISOString().split('T')[0],
};

export default function ApplicationFormPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [appId, setAppId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<DocumentFile[]>([
    { type: 'PAN Card', file: null, preview: null },
    { type: 'Aadhar Card', file: null, preview: null },
    { type: '10th Certificate', file: null, preview: null },
    { type: '12th Certificate', file: null, preview: null },
    { type: "Bachelor's Certificate", file: null, preview: null },
  ]);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadState, setUploadState] = useState<'idle' | 'creating_app' | 'uploading_docs' | 'done' | 'error'>('idle');

  // Check authentication and load existing draft on mount
  useEffect(() => {
    const loadExistingApplication = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      try {
        // Load existing application/draft
        const existingApp = await getUserApplication(user.id);
        
        if (existingApp && existingApp.status === 'draft') {
          setAppId(existingApp.id);
          
          // Restore form data if it exists
          if (existingApp.form_data) {
            setFormData({ ...initialFormData, ...existingApp.form_data });
          }
        }
      } catch (error) {
        console.error('Error loading application:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadExistingApplication();
  }, [user]);

  const handleInputChange = (field: keyof FormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleEducationChange = (index: number, field: string, value: string) => {
    const newEducation = [...formData.education];
    newEducation[index] = { ...newEducation[index], [field]: value };
    setFormData((prev) => ({ ...prev, education: newEducation }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, photo: file }));
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.postAppliedFor.trim()) newErrors.postAppliedFor = 'Required';
    if (!formData.fullName.trim()) newErrors.fullName = 'Required';
    if (!formData.fatherOrHusbandName.trim()) newErrors.fatherOrHusbandName = 'Required';
    if (!formData.permanentAddress.trim()) newErrors.permanentAddress = 'Required';
    if (!formData.communicationAddress.trim()) newErrors.communicationAddress = 'Required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Required';
    if (!formData.sex) newErrors.sex = 'Required';
    if (!formData.maritalStatus) newErrors.maritalStatus = 'Required';
    if (!formData.mobileNo.trim()) newErrors.mobileNo = 'Required';
    if (!formData.email.trim()) newErrors.email = 'Required';
    if (!formData.bankName.trim()) newErrors.bankName = 'Required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.declaration) newErrors.declaration = 'Please agree to declaration';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep4 = () => {
    const newErrors: Record<string, string> = {};
    const requiredDocs = ['PAN Card', 'Aadhar Card', '10th Certificate'];
    
    requiredDocs.forEach(docType => {
      const doc = documents.find(d => d.type === docType);
      if (!doc || !doc.file) {
        newErrors[docType] = `${docType} is required`;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Helper: Safely validate file without crashing on undefined
  const validateFile = (file: File | null | undefined): { valid: boolean; error?: string } => {
    if (!file) {
      return { valid: false, error: 'No file provided' };
    }

    // Validate file size
    if (!file.size || file.size > 5 * 1024 * 1024) {
      return { valid: false, error: 'File size must be less than 5MB' };
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Only PDF, JPEG, and PNG files are allowed' };
    }

    return { valid: true };
  };

  // Helper: Check if required documents are uploaded
  const validateRequiredDocuments = (): { valid: boolean; missing: string[] } => {
    const requiredDocs = ['PAN Card', 'Aadhar Card', '10th Certificate'];
    const missing: string[] = [];

    requiredDocs.forEach(docType => {
      const doc = documents.find(d => d.type === docType);
      if (!doc || !doc.file) {
        missing.push(docType);
      }
    });

    return { valid: missing.length === 0, missing };
  };

  /**
   * Ensure candidate application exists (fetch or create ONCE)
   * Returns application ID, never creates duplicates
   */
  const ensureApplication = async (userId: string): Promise<string> => {
    try {
      // If we already have an appId in state, use it
      if (appId) {
        return appId;
      }

      // Try to fetch existing application
      const existingApp = await getUserApplication(userId);
      
      if (existingApp) {
        setAppId(existingApp.id);
        return existingApp.id;
      }

      // No existing application - create new one
      const formDataForDB = prepareFormDataForDB();
      const newApp = await createApplication(userId, {
        post_applied_for: formData.postAppliedFor,
        form_data: formDataForDB,
      });

      if (!newApp || !newApp.id) {
        throw new Error('Failed to create application - no ID returned');
      }

      setAppId(newApp.id);
      return newApp.id;
    } catch (error: any) {
      console.error('Error ensuring application:', error);
      throw new Error(`Failed to create/fetch application: ${error.message}`);
    }
  };

  /**
   * Upload a single document safely
   * Uploads to storage first, then creates database record
   */
  const uploadSingleDocument = async (
    applicationId: string,
    file: File,
    documentType: string
  ): Promise<void> => {
    if (!applicationId) {
      throw new Error(`Cannot upload ${documentType}: application ID is required`);
    }

    if (!file) {
      throw new Error(`Cannot upload ${documentType}: file is required`);
    }

    if (!user?.id) {
      throw new Error(`Cannot upload ${documentType}: user not authenticated`);
    }

    // Validate file first
    const validation = validateFile(file);
    if (!validation.valid) {
      throw new Error(`${documentType}: ${validation.error}`);
    }

    // Upload to backend
    await uploadDocument({
      applicationId,
      userId: user.id,
      documentType,
      file
    });
  };

  const handleDocumentUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    // Validate file safely
    const validation = validateFile(file);
    if (!validation.valid) {
      alert(validation.error || 'Invalid file');
      e.target.value = ''; // Clear input
      return;
    }
    
    // TypeScript now knows file is defined and valid
    const validFile = file!;
    
    const newDocuments = [...documents];
    newDocuments[index].file = validFile;
    
    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        newDocuments[index].preview = reader.result as string;
        setDocuments(newDocuments);
      };
      reader.readAsDataURL(file);
    } else {
      newDocuments[index].preview = null;
      setDocuments(newDocuments);
    }
    
    // Clear error for this document
    if (errors[newDocuments[index].type]) {
      const newErrors = { ...errors };
      delete newErrors[newDocuments[index].type];
      setErrors(newErrors);
    }
  };

  const handleRemoveDocument = (index: number) => {
    const newDocuments = [...documents];
    newDocuments[index].file = null;
    newDocuments[index].preview = null;
    setDocuments(newDocuments);
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    if (currentStep === 3 && !validateStep3()) return;
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  // Helper function to prepare form data for database (remove File objects)
  const prepareFormDataForDB = () => {
    const { photo, ...dbFormData } = formData;
    return {
      ...dbFormData,
      photo: photo ? photo.name : null // Store only filename
    };
  };

  const handleSaveAsDraft = async () => {
    if (!user) {
      alert('Please sign in to save your application.');
      return;
    }

    try {
      const formDataForDB = prepareFormDataForDB();

      if (appId) {
        // Update existing draft
        await updateApplication(appId, { form_data: formDataForDB });
        alert('Draft saved successfully!');
      } else {
        // Create new draft
        const newApp = await createApplication(user.id, {
          post_applied_for: formData.postAppliedFor,
          form_data: formDataForDB,
        });
        setAppId(newApp.id);
        alert('Draft created successfully!');
      }
    } catch (error: any) {
      console.error('Error saving draft:', error);
      alert(error.message || 'Failed to save draft');
    }
  };

  const handleSubmit = async () => {
    // PHASE 0: Block if already submitting
    if (uploadState !== 'idle') {
      console.warn('Submission already in progress');
      return;
    }

    // PHASE 1: VALIDATION - Fail fast before any operations
    if (!user?.id) {
      alert('Please sign in to submit your application.');
      return;
    }

    // Validate required documents
    const docValidation = validateRequiredDocuments();
    if (!docValidation.valid) {
      alert(`Missing required documents:\n${docValidation.missing.join('\n')}`);
      setErrors(Object.fromEntries(docValidation.missing.map(doc => [doc, 'Required'])));
      return;
    }

    // Validate declaration
    if (!validateStep4()) {
      alert('Please complete all required fields and upload required documents');
      return;
    }

    try {
      setUploadingDocs(true);
      setUploadState('creating_app');

      // PHASE 2: ENSURE APPLICATION EXISTS
      // This guarantees appId is available before any uploads
      const guaranteedAppId = await ensureApplication(user.id);

      if (!guaranteedAppId) {
        throw new Error('Failed to get application ID');
      }

      // PHASE 3: UPLOAD DOCUMENTS SEQUENTIALLY
      setUploadState('uploading_docs');

      const uploadErrors: string[] = [];
      const requiredDocs = ['PAN Card', 'Aadhar Card', '10th Certificate'];

      // Upload photo first (optional)
      if (formData.photo) {
        try {
          // Upload to profile-photos bucket and update profile avatar_url
          await uploadProfilePhoto(user.id, formData.photo);
          console.log('Profile photo uploaded successfully');
        } catch (error: any) {
          console.error('Failed to upload profile photo:', error);
          // Don't fail submission for optional photo
        }
      }

      // Upload required and optional documents
      for (const doc of documents) {
        if (!doc.file) continue; // Skip if no file

        try {
          await uploadSingleDocument(guaranteedAppId, doc.file, doc.type);
        } catch (error: any) {
          console.error(`Failed to upload ${doc.type}:`, error);
          uploadErrors.push(`${doc.type}: ${error.message || 'Upload failed'}`);
        }
      }

      // Check if any REQUIRED document uploads failed
      const failedRequired = uploadErrors.filter(err =>
        requiredDocs.some(req => err.startsWith(req))
      );

      if (failedRequired.length > 0) {
        throw new Error(`Failed to upload required documents:\n${failedRequired.join('\n')}`);
      }

      // PHASE 4: SUBMIT APPLICATION
      await submitApplication(guaranteedAppId);

      setUploadState('done');
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error('Submission error:', error);
      setUploadState('error');
      alert(error.message || 'Failed to submit application');
    } finally {
      setUploadingDocs(false);
      // Reset to idle after 2 seconds to allow retry
      setTimeout(() => setUploadState('idle'), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading application...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-start">
            {[
              { step: 1, label: 'Basic Info' },
              { step: 2, label: 'Personal & Banking' },
              { step: 3, label: 'Education' },
              { step: 4, label: 'Documents' }
            ].map((item) => (
              <div key={item.step} className="flex-1 flex items-start">
                {/* Circle with label underneath */}
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white ${item.step < currentStep ? 'bg-green-500' : item.step === currentStep ? 'bg-blue-600' : 'bg-gray-300'}`}>
                    {item.step < currentStep ? <Check size={20} /> : item.step}
                  </div>
                  <span className="mt-2 text-sm font-medium text-gray-700 text-center">
                    {item.label}
                  </span>
                </div>
                {/* Connector line */}
                {item.step < 4 && (
                  <div className="flex-1 h-1 mt-5 mx-2 bg-gray-300 hidden sm:block">
                    {item.step < currentStep && <div className="h-full bg-green-500" />}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* STEP 1 */}
          {currentStep === 1 && (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Application Form - Basic Information</h2>
              <div className="space-y-6">
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Post Applied For <span className="text-red-500">*</span></label><input type="text" value={formData.postAppliedFor} onChange={(e) => handleInputChange('postAppliedFor', e.target.value)} className="w-full border rounded-lg px-4 py-2" />{errors.postAppliedFor && <p className="text-red-500 text-sm mt-1">{errors.postAppliedFor}</p>}</div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Full Name <span className="text-red-500">*</span></label><input type="text" value={formData.fullName} onChange={(e) => handleInputChange('fullName', e.target.value)} className="w-full border rounded-lg px-4 py-2" />{errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}</div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Father's/Husband's Name <span className="text-red-500">*</span></label><input type="text" value={formData.fatherOrHusbandName} onChange={(e) => handleInputChange('fatherOrHusbandName', e.target.value)} className="w-full border rounded-lg px-4 py-2" />{errors.fatherOrHusbandName && <p className="text-red-500 text-sm mt-1">{errors.fatherOrHusbandName}</p>}</div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Photo Upload</label><div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50"><input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" id="photo-upload" /><label htmlFor="photo-upload" className="cursor-pointer">{photoPreview ? <img src={photoPreview} alt="Preview" className="h-32 w-32 object-cover mx-auto rounded" /> : <div><User size={40} className="mx-auto text-gray-400 mb-2" /><p className="text-gray-600">Upload Passport Size Photo</p></div>}</label></div></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Permanent Address <span className="text-red-500">*</span></label><textarea value={formData.permanentAddress} onChange={(e) => handleInputChange('permanentAddress', e.target.value)} rows={3} className="w-full border rounded-lg px-4 py-2" />{errors.permanentAddress && <p className="text-red-500 text-sm mt-1">{errors.permanentAddress}</p>}</div>
                <div className="flex items-center"><input type="checkbox" checked={formData.sameAsPermAddress} onChange={(e) => { handleInputChange('sameAsPermAddress', e.target.checked); if (e.target.checked) handleInputChange('communicationAddress', formData.permanentAddress); }} className="mr-2" /><label className="text-sm font-medium text-gray-700">Communication address same as permanent</label></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Communication Address <span className="text-red-500">*</span></label><textarea value={formData.communicationAddress} onChange={(e) => handleInputChange('communicationAddress', e.target.value)} disabled={formData.sameAsPermAddress} rows={3} className="w-full border rounded-lg px-4 py-2 disabled:bg-gray-100" />{errors.communicationAddress && <p className="text-red-500 text-sm mt-1">{errors.communicationAddress}</p>}</div>
              </div>
            </>
          )}

          {/* STEP 2 */}
          {currentStep === 2 && (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Application Form - Personal & Banking</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth <span className="text-red-500">*</span></label><input type="date" value={formData.dateOfBirth} onChange={(e) => handleInputChange('dateOfBirth', e.target.value)} className="w-full border rounded-lg px-4 py-2" />{errors.dateOfBirth && <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth}</p>}</div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Sex <span className="text-red-500">*</span></label><select value={formData.sex} onChange={(e) => handleInputChange('sex', e.target.value)} className="w-full border rounded-lg px-4 py-2"><option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select>{errors.sex && <p className="text-red-500 text-sm mt-1">{errors.sex}</p>}</div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Nationality</label><input type="text" value={formData.nationality} onChange={(e) => handleInputChange('nationality', e.target.value)} className="w-full border rounded-lg px-4 py-2" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Marital Status <span className="text-red-500">*</span></label><select value={formData.maritalStatus} onChange={(e) => handleInputChange('maritalStatus', e.target.value)} className="w-full border rounded-lg px-4 py-2"><option value="">Select</option><option value="Single">Single</option><option value="Married">Married</option></select>{errors.maritalStatus && <p className="text-red-500 text-sm mt-1">{errors.maritalStatus}</p>}</div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Religion</label><input type="text" value={formData.religion} onChange={(e) => handleInputChange('religion', e.target.value)} className="w-full border rounded-lg px-4 py-2" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Mobile No <span className="text-red-500">*</span></label><input type="tel" value={formData.mobileNo} onChange={(e) => handleInputChange('mobileNo', e.target.value)} className="w-full border rounded-lg px-4 py-2" />{errors.mobileNo && <p className="text-red-500 text-sm mt-1">{errors.mobileNo}</p>}</div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Email ID <span className="text-red-500">*</span></label><input type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} className="w-full border rounded-lg px-4 py-2" />{errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}</div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Bank Name <span className="text-red-500">*</span></label><input type="text" value={formData.bankName} onChange={(e) => handleInputChange('bankName', e.target.value)} className="w-full border rounded-lg px-4 py-2" />{errors.bankName && <p className="text-red-500 text-sm mt-1">{errors.bankName}</p>}</div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">A/C No</label><input type="text" value={formData.accountNo} onChange={(e) => handleInputChange('accountNo', e.target.value)} className="w-full border rounded-lg px-4 py-2" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">IFSC Code</label><input type="text" value={formData.ifscCode} onChange={(e) => handleInputChange('ifscCode', e.target.value)} className="w-full border rounded-lg px-4 py-2" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Branch</label><input type="text" value={formData.branch} onChange={(e) => handleInputChange('branch', e.target.value)} className="w-full border rounded-lg px-4 py-2" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">PAN No</label><input type="text" value={formData.panNo} onChange={(e) => handleInputChange('panNo', e.target.value)} className="w-full border rounded-lg px-4 py-2" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Aadhar No</label><input type="text" value={formData.aadharNo} onChange={(e) => handleInputChange('aadharNo', e.target.value)} className="w-full border rounded-lg px-4 py-2" /></div>
              </div>
            </>
          )}

          {/* STEP 3 */}
          {currentStep === 3 && (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Application Form - Education & Declaration</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">Educational Qualifications</label>
                  <div className="overflow-x-auto"><table className="w-full border-collapse"><thead><tr className="bg-gray-100"><th className="border px-4 py-2 text-left">Qualification Level</th><th className="border px-4 py-2 text-left">Year of Passing</th><th className="border px-4 py-2 text-left">% of Marks</th></tr></thead><tbody>{formData.education.map((edu, idx) => <tr key={idx}><td className="border px-4 py-2">{edu.level}</td><td className="border px-4 py-2"><input type="number" value={edu.yearOfPassing} onChange={(e) => handleEducationChange(idx, 'yearOfPassing', e.target.value)} className="w-full border rounded px-2 py-1" /></td><td className="border px-4 py-2"><input type="number" value={edu.percentage} onChange={(e) => handleEducationChange(idx, 'percentage', e.target.value)} className="w-full border rounded px-2 py-1" /></td></tr>)}</tbody></table></div>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Declaration</label><div className="bg-gray-50 border rounded-lg p-4 mb-4 text-sm text-gray-600 max-h-32 overflow-y-auto"><p>I hereby declare that the information provided in this application form is true and correct to the best of my knowledge. I understand that any false information may result in rejection of my application or termination of employment.</p></div><div className="flex items-center"><input type="checkbox" checked={formData.declaration} onChange={(e) => handleInputChange('declaration', e.target.checked)} className="mr-2" /><label className="text-sm font-medium text-gray-700">I agree to the above declaration</label></div>{errors.declaration && <p className="text-red-500 text-sm mt-1">{errors.declaration}</p>}</div>
                <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-2">Place</label><input type="text" value={formData.place} onChange={(e) => handleInputChange('place', e.target.value)} className="w-full border rounded-lg px-4 py-2" /></div><div><label className="block text-sm font-medium text-gray-700 mb-2">Date</label><input type="date" value={formData.date} onChange={(e) => handleInputChange('date', e.target.value)} className="w-full border rounded-lg px-4 py-2" /></div></div>
              </div>
            </>
          )}

          {/* STEP 4 - Documents Upload */}
          {currentStep === 4 && (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Application Form - Upload Documents</h2>
              <p className="text-gray-600 mb-6">Please upload the following documents. Documents marked with * are required.</p>
              
              <div className="space-y-6">
                {documents.map((doc, index) => {
                  const isRequired = ['PAN Card', 'Aadhar Card', '10th Certificate'].includes(doc.type);
                  return (
                    <div key={index} className="border rounded-lg p-6 bg-gray-50">
                      <div className="flex items-center justify-between mb-4">
                        <label className="text-sm font-medium text-gray-700">
                          {doc.type} {isRequired && <span className="text-red-500">*</span>}
                        </label>
                        {doc.file && (
                          <button
                            onClick={() => handleRemoveDocument(index)}
                            className="text-red-500 hover:text-red-700 p-1"
                            type="button"
                          >
                            <X size={20} />
                          </button>
                        )}
                      </div>

                      {!doc.file ? (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-white transition-colors">
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => handleDocumentUpload(index, e)}
                            className="hidden"
                            id={`doc-upload-${index}`}
                          />
                          <label htmlFor={`doc-upload-${index}`} className="cursor-pointer">
                            <Upload className="mx-auto mb-3 text-gray-400" size={40} />
                            <p className="text-gray-600 mb-1">Click to upload or drag and drop</p>
                            <p className="text-xs text-gray-500">PDF, JPEG, PNG (Max 5MB)</p>
                          </label>
                        </div>
                      ) : (
                        <div className="bg-white border rounded-lg p-4">
                          <div className="flex items-center gap-4">
                            {doc.preview ? (
                              <img
                                src={doc.preview}
                                alt={doc.type}
                                className="w-20 h-20 object-cover rounded border"
                              />
                            ) : (
                              <div className="w-20 h-20 bg-gray-200 rounded border flex items-center justify-center">
                                <FileText className="text-gray-400" size={32} />
                              </div>
                            )}
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{doc.file.name}</p>
                              <p className="text-sm text-gray-500">
                                {(doc.file.size / 1024).toFixed(2)} KB
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {errors[doc.type] && (
                        <p className="text-red-500 text-sm mt-2">{errors[doc.type]}</p>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Make sure all documents are clear and readable. 
                  Uploaded documents will be verified by the admin before approval.
                </p>
              </div>
            </>
          )}

          {/* Buttons */}
          <div className="flex gap-3 mt-8 justify-between">
            <button onClick={handlePrevious} disabled={currentStep === 1} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"><ChevronLeft className="inline mr-2" size={18} />Previous</button>
            {currentStep < 4 && <button onClick={handleSaveAsDraft} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"><Save className="inline mr-2" size={18} />Save Draft</button>}
            {currentStep < 4 ? <button onClick={handleNext} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Next <ChevronRight className="inline ml-2" size={18} /></button> : <button onClick={handleSubmit} disabled={uploadState !== 'idle'} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">{uploadState === 'creating_app' ? 'Creating Application...' : uploadState === 'uploading_docs' ? 'Uploading Documents...' : uploadState === 'done' ? 'Submitted!' : <><CheckCircle className="inline mr-2" size={18} />Submit Application</>}</button>}
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-md w-full text-center">
            <CheckCircle className="mx-auto mb-4 text-green-500" size={64} />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Hey {formData.fullName || 'there'}, your Application Submitted!
            </h3>
            <p className="text-gray-600 mb-6">
              You'll be notified in your dashboard. Stay tuned!
            </p>
            <button onClick={() => { setShowSuccessModal(false); navigate('/candidate/dashboard'); }} className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-medium">Go to Dashboard</button>
          </div>
        </div>
      )}
    </div>
  );
}
