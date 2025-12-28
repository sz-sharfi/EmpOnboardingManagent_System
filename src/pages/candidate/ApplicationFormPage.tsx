import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Save, Check, CheckCircle, User, Upload, FileText, X } from 'lucide-react';
import supabase from '../../utils/supabaseClient';
import '../../utils/supabaseDebug'; // Import debug utilities

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
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [appId, setAppId] = useState<string | null>(() => {
    try { return localStorage.getItem('applicationId'); } catch { return null; }
  });
  const [documents, setDocuments] = useState<DocumentFile[]>([
    { type: 'PAN Card', file: null, preview: null },
    { type: 'Aadhar Card', file: null, preview: null },
    { type: '10th Certificate', file: null, preview: null },
    { type: '12th Certificate', file: null, preview: null },
    { type: "Bachelor's Certificate", file: null, preview: null },
  ]);
  const [uploadingDocs, setUploadingDocs] = useState(false);

  // Check authentication and load existing draft on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        console.warn('User not authenticated:', error);
        return;
      }
      
      console.log('✓ User authenticated:', user.email);
      
      // Load existing draft if we have an appId
      if (appId && appId !== 'pending') {
        try {
          const { data, error: loadError } = await supabase
            .from('applications')
            .select('form_data, status')
            .eq('id', appId)
            .eq('user_id', user.id)
            .single();
          
          if (loadError) {
            console.error('Failed to load draft:', loadError);
            // Clear invalid appId
            setAppId(null);
            localStorage.removeItem('applicationId');
          } else if (data && data.status === 'draft' && data.form_data) {
            console.log('✓ Loaded existing draft');
            // Optionally restore form data
            // setFormData({ ...initialFormData, ...data.form_data });
          }
        } catch (err) {
          console.error('Error loading draft:', err);
        }
      }
    };
    
    checkAuth();
  }, [appId]);

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

  const handleDocumentUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please upload only PDF, JPEG, or PNG files');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size should not exceed 5MB');
        return;
      }
      
      const newDocuments = [...documents];
      newDocuments[index].file = file;
      
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
    try {
      // Get authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        alert('Please sign in to save your application.');
        console.error('Auth error:', authError);
        return;
      }

      const formDataForDB = prepareFormDataForDB();
      console.log('Saving draft for user:', user.id);
      console.log('Form data:', formDataForDB);

      let savedAppId = appId;

      // If we have an existing app ID, update it
      if (appId && appId !== 'pending') {
        console.log('Updating existing application:', appId);
        
        const { data: updateData, error: updateError } = await supabase
          .from('applications')
          .update({
            form_data: formDataForDB,
            preview_data: {},
            updated_at: new Date().toISOString()
          })
          .eq('id', appId)
          .eq('user_id', user.id)
          .select('id')
          .single();

        if (updateError) {
          console.error('Update error:', updateError);
          throw new Error(`Failed to update draft: ${updateError.message}`);
        }

        savedAppId = updateData?.id || appId;
      } else {
        // Create new application
        console.log('Creating new application');
        
        const { data: insertData, error: insertError } = await supabase
          .from('applications')
          .insert({
            user_id: user.id,
            status: 'draft',
            form_data: formDataForDB,
            preview_data: {},
            progress_percent: 0
          })
          .select('id')
          .single();

        if (insertError) {
          console.error('Insert error:', insertError);
          throw new Error(`Failed to create draft: ${insertError.message}`);
        }

        if (!insertData?.id) {
          throw new Error('No application ID returned from insert');
        }

        savedAppId = insertData.id;
      }

      // Store the app ID
      setAppId(savedAppId);
      if (savedAppId) {
        try {
          localStorage.setItem('applicationId', savedAppId);
        } catch (e) {
          console.warn('Could not save to localStorage:', e);
        }
      }

      alert('✓ Draft saved successfully!');
      console.log('Draft saved with ID:', savedAppId);
      
    } catch (err: unknown) {
      console.error('Save draft exception:', err);
      const msg = err instanceof Error ? err.message : String(err);
      alert('Failed to save draft: ' + msg);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep4()) {
      alert('Please upload all required documents.');
      return;
    }

    try {
      setUploadingDocs(true);
      
      // Get authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        alert('Please sign in to submit your application.');
        console.error('Auth error:', authError);
        return;
      }

      const formDataForDB = prepareFormDataForDB();
      console.log('Submitting application for user:', user.id);

      let finalAppId = appId;

      // Step 1: Save/Update the draft with final data
      if (appId && appId !== 'pending') {
        console.log('Updating existing application before submit:', appId);
        
        const { error: updateError } = await supabase
          .from('applications')
          .update({
            form_data: formDataForDB,
            preview_data: {},
            updated_at: new Date().toISOString()
          })
          .eq('id', appId)
          .eq('user_id', user.id);

        if (updateError) {
          console.error('Update error:', updateError);
          throw new Error(`Failed to update application: ${updateError.message}`);
        }

        finalAppId = appId;
      } else {
        console.log('Creating new application for submission');
        
        const { data: insertData, error: insertError } = await supabase
          .from('applications')
          .insert({
            user_id: user.id,
            status: 'draft',
            form_data: formDataForDB,
            preview_data: {},
            progress_percent: 0
          })
          .select('id')
          .single();

        if (insertError) {
          console.error('Insert error:', insertError);
          throw new Error(`Failed to create application: ${insertError.message}`);
        }

        if (!insertData?.id) {
          throw new Error('No application ID returned');
        }

        finalAppId = insertData.id;
      }

      // Step 2: Upload photo if exists
      if (formData.photo) {
        console.log('Uploading photo...');
        const fileExt = formData.photo.name.split('.').pop();
        const fileName = `${finalAppId}/Photo_${Date.now()}.${fileExt}`;
        
        const { data: photoUploadData, error: photoUploadError } = await supabase.storage
          .from('documents')
          .upload(fileName, formData.photo, {
            cacheControl: '3600',
            upsert: false
          });

        if (photoUploadError) {
          console.error('Failed to upload photo:', photoUploadError);
          // Don't fail the whole submission, just log the error
        } else {
          console.log('✓ Uploaded photo');
          
          // Create document record for photo
          const { error: photoInsertError } = await supabase
            .from('documents')
            .insert({
              app_id: finalAppId,
              document_type: 'Photo',
              storage_path: photoUploadData.path,
              file_size_bytes: formData.photo.size
            });

          if (photoInsertError) {
            console.error('Failed to create photo record:', photoInsertError);
          }
        }
      }

      // Step 3: Upload documents
      const uploadedDocs = [];
      
      for (const doc of documents) {
        if (doc.file) {
          const fileExt = doc.file.name.split('.').pop();
          const fileName = `${finalAppId}/${doc.type.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.${fileExt}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('documents')
            .upload(fileName, doc.file, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            console.error(`Failed to upload ${doc.type}:`, uploadError);
            throw new Error(`Failed to upload ${doc.type}: ${uploadError.message}`);
          }
          
          // Create document record in database
          const { error: docInsertError } = await supabase
            .from('documents')
            .insert({
              app_id: finalAppId,
              document_type: doc.type,
              storage_path: uploadData.path,
              file_size_bytes: doc.file.size
            });

          if (docInsertError) {
            console.error(`Failed to create document record for ${doc.type}:`, docInsertError);
            throw new Error(`Failed to save ${doc.type} record: ${docInsertError.message}`);
          }
          
          uploadedDocs.push(doc.type);
        }
      }

      // Step 4: Submit the application (change status to submitted)
      console.log('Submitting application with ID:', finalAppId);
      
      const { data: submitData, error: submitError } = await supabase
        .from('applications')
        .update({
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', finalAppId)
        .eq('user_id', user.id)
        .select('id, status, submitted_at')
        .single();

      if (submitError) {
        console.error('Submit error:', submitError);
        throw new Error(`Failed to submit application: ${submitError.message}`);
      }

      console.log('Application submitted successfully:', submitData);

      // Clear stored app ID
      try {
        localStorage.removeItem('applicationId');
      } catch (e) {
        console.warn('Could not clear localStorage:', e);
      }
      
      setAppId(null);
      setUploadingDocs(false);
      setShowSuccessModal(true);
      
    } catch (err: unknown) {
      console.error('Submit exception:', err);
      const msg = err instanceof Error ? err.message : String(err);
      alert('Failed to submit application: ' + msg);
      setUploadingDocs(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white ${step < currentStep ? 'bg-green-500' : step === currentStep ? 'bg-blue-600' : 'bg-gray-300'}`}>
                  {step < currentStep ? <Check size={20} /> : step}
                </div>
                {step < 4 && <div className="flex-1 h-1 mx-2 bg-gray-300 hidden sm:block">{step < currentStep && <div className="h-full bg-green-500" />}</div>}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm font-medium text-gray-700">
            <span>Basic Info</span>
            <span>Personal & Banking</span>
            <span>Education</span>
            <span>Documents</span>
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
            {currentStep < 4 ? <button onClick={handleNext} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Next <ChevronRight className="inline ml-2" size={18} /></button> : <button onClick={handleSubmit} disabled={uploadingDocs} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">{uploadingDocs ? 'Uploading...' : <><CheckCircle className="inline mr-2" size={18} />Submit Application</>}</button>}
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-md w-full text-center">
            <CheckCircle className="mx-auto mb-4 text-green-500" size={64} />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h3>
            <p className="text-gray-600 mb-6">Your application has been submitted successfully. You will receive updates on your email.</p>
            <button onClick={() => { setShowSuccessModal(false); navigate('/candidate/dashboard'); }} className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-medium">Go to Dashboard</button>
          </div>
        </div>
      )}
    </div>
  );
}
