import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Save, Send, User, MapPin, Calendar, Phone, Mail, Building, CreditCard, FileText, Check } from 'lucide-react';

interface FormData {
  // Step 1
  postAppliedFor: string;
  fullName: string;
  fatherOrHusbandName: string;
  photo: File | null;
  permanentAddress: string;
  communicationAddress: string;
  sameAsPermAddress: boolean;
  // Step 2
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
  // Step 3
  education: Array<{ level: string; yearOfPassing: string; percentage: string }>;
  declaration: boolean;
  place: string;
  date: string;
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

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const handleEducationChange = (index: number, field: string, value: string) => {
    const newEducation = [...formData.education];
    newEducation[index] = { ...newEducation[index], [field]: value };
    setFormData((prev) => ({
      ...prev,
      education: newEducation,
    }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        photo: file,
      }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.postAppliedFor.trim()) newErrors.postAppliedFor = 'Required field';
    if (!formData.fullName.trim()) newErrors.fullName = 'Required field';
    if (!formData.fatherOrHusbandName.trim()) newErrors.fatherOrHusbandName = 'Required field';
    if (!formData.permanentAddress.trim()) newErrors.permanentAddress = 'Required field';
    if (!formData.communicationAddress.trim()) newErrors.communicationAddress = 'Required field';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Required field';
    if (!formData.sex) newErrors.sex = 'Required field';
    if (!formData.maritalStatus) newErrors.maritalStatus = 'Required field';
    if (!formData.religion.trim()) newErrors.religion = 'Required field';
    if (!formData.mobileNo.trim()) newErrors.mobileNo = 'Required field';
    else if (!/^\d{10}$/.test(formData.mobileNo.replace(/\D/g, ''))) newErrors.mobileNo = 'Invalid phone number';
    if (!formData.email.trim()) newErrors.email = 'Required field';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email';
    if (!formData.bankName.trim()) newErrors.bankName = 'Required field';
    if (!formData.accountNo.trim()) newErrors.accountNo = 'Required field';
    if (!formData.ifscCode.trim()) newErrors.ifscCode = 'Required field';
    if (!formData.branch.trim()) newErrors.branch = 'Required field';
    if (!formData.panNo.trim()) newErrors.panNo = 'Required field';
    if (!formData.aadharNo.trim()) newErrors.aadharNo = 'Required field';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.education[0].yearOfPassing) newErrors.edu0Year = '10th year required';
    if (!formData.education[1].yearOfPassing) newErrors.edu1Year = '12th year required';
    if (!formData.education[2].yearOfPassing) newErrors.edu2Year = "Bachelor's year required";
    if (!formData.declaration) newErrors.declaration = 'You must agree to declaration';
    if (!formData.place.trim()) newErrors.place = 'Required field';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSaveAsDraft = () => {
    console.log('Saved as draft:', formData);
    alert('Application saved as draft');
  };

  const handleSubmit = () => {
    if (!validateStep3()) return;
    console.log('Application submitted:', formData);
    setShowSuccessModal(true);
  };

  const handleCommunicationAddressToggle = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      sameAsPermAddress: checked,
      communicationAddress: checked ? prev.permanentAddress : '',
    }));
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white ${
                    step < currentStep
                      ? 'bg-green-500'
                      : step === currentStep
                      ? 'bg-blue-600'
                      : 'bg-gray-300'
                  }`}
                >
                  {step < currentStep ? <Check size={20} /> : step}
                </div>
                <div className="flex-1 h-1 mx-2 bg-gray-300 hidden sm:block">
                  {step < currentStep && <div className="h-full bg-green-500" />}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm font-medium text-gray-700">
            <span>Basic Info</span>
            <span>Personal & Banking</span>
            <span>Education</span>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* STEP 1 */}
          {currentStep === 1 && (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Application Form - Basic Information</h2>

              {/* Basic Information Section */}
              <div className="mb-8 pb-6 border-b">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h3>

                <div className="space-y-4">
                  <div>
                    <label className="form-label">
                      Post Applied For <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 text-gray-400" size={20} />
                      <input
                        type="text"
                        placeholder="e.g., Software Engineer"
                        className="input-field pl-10"
                        value={formData.postAppliedFor}
                        onChange={(e) => handleInputChange('postAppliedFor', e.target.value)}
                      />
                    </div>
                    {errors.postAppliedFor && <p className="text-red-500 text-sm mt-1">{errors.postAppliedFor}</p>}
                  </div>

                  <div>
                    <label className="form-label">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 text-gray-400" size={20} />
                      <input
                        type="text"
                        placeholder="Your full name"
                        className="input-field pl-10"
                        value={formData.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                      />
                    </div>
                    {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
                  </div>

                  <div>
                    <label className="form-label">
                      Father's / Husband's Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 text-gray-400" size={20} />
                      <input
                        type="text"
                        placeholder="Father's or Husband's name"
                        className="input-field pl-10"
                        value={formData.fatherOrHusbandName}
                        onChange={(e) => handleInputChange('fatherOrHusbandName', e.target.value)}
                      />
                    </div>
                    {errors.fatherOrHusbandName && <p className="text-red-500 text-sm mt-1">{errors.fatherOrHusbandName}</p>}
                  </div>

                  {/* Photo Upload */}
                  <div>
                    <label className="form-label">Passport Size Photo</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="mb-4"
                    />
                    {photoPreview && (
                      <div className="mt-4">
                        <img src={photoPreview} alt="Preview" className="w-32 h-32 rounded border border-gray-300 object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Address Details Section */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Address Details</h3>

                <div className="space-y-4">
                  <div>
                    <label className="form-label">
                      Permanent Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 text-gray-400" size={20} />
                      <textarea
                        rows={3}
                        placeholder="Enter your permanent address"
                        className="input-field pl-10 resize-y"
                        value={formData.permanentAddress}
                        onChange={(e) => handleInputChange('permanentAddress', e.target.value)}
                      />
                    </div>
                    {errors.permanentAddress && <p className="text-red-500 text-sm mt-1">{errors.permanentAddress}</p>}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="sameAddress"
                      checked={formData.sameAsPermAddress}
                      onChange={(e) => handleCommunicationAddressToggle(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <label htmlFor="sameAddress" className="text-sm text-gray-700">
                      Communication address same as permanent
                    </label>
                  </div>

                  <div>
                    <label className="form-label">
                      Communication Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 text-gray-400" size={20} />
                      <textarea
                        rows={3}
                        placeholder="Enter your communication address"
                        className="input-field pl-10 resize-y"
                        value={formData.communicationAddress}
                        onChange={(e) => handleInputChange('communicationAddress', e.target.value)}
                        disabled={formData.sameAsPermAddress}
                      />
                    </div>
                    {errors.communicationAddress && <p className="text-red-500 text-sm mt-1">{errors.communicationAddress}</p>}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* STEP 2 */}
          {currentStep === 2 && (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Application Form - Personal & Banking Details</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {/* Personal Details */}
                <div className="md:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Personal Details</h3>
                </div>

                <div>
                  <label className="form-label">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 text-gray-400" size={20} />
                    <input
                      type="date"
                      className="input-field pl-10"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    />
                  </div>
                  {errors.dateOfBirth && <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth}</p>}
                </div>

                <div>
                  <label className="form-label">
                    Sex <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="input-field"
                    value={formData.sex}
                    onChange={(e) => handleInputChange('sex', e.target.value)}
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.sex && <p className="text-red-500 text-sm mt-1">{errors.sex}</p>}
                </div>

                <div>
                  <label className="form-label">Nationality</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.nationality}
                    onChange={(e) => handleInputChange('nationality', e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label">
                    Marital Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="input-field"
                    value={formData.maritalStatus}
                    onChange={(e) => handleInputChange('maritalStatus', e.target.value)}
                  >
                    <option value="">Select</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                  </select>
                  {errors.maritalStatus && <p className="text-red-500 text-sm mt-1">{errors.maritalStatus}</p>}
                </div>

                <div>
                  <label className="form-label">
                    Religion <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Christian"
                    className="input-field"
                    value={formData.religion}
                    onChange={(e) => handleInputChange('religion', e.target.value)}
                  />
                  {errors.religion && <p className="text-red-500 text-sm mt-1">{errors.religion}</p>}
                </div>

                <div>
                  <label className="form-label">
                    Mobile No. <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 text-gray-400" size={20} />
                    <span className="absolute left-10 top-3 text-gray-600">+91</span>
                    <input
                      type="tel"
                      placeholder="10 digit number"
                      className="input-field pl-16"
                      value={formData.mobileNo}
                      onChange={(e) => handleInputChange('mobileNo', e.target.value)}
                    />
                  </div>
                  {errors.mobileNo && <p className="text-red-500 text-sm mt-1">{errors.mobileNo}</p>}
                </div>

                <div>
                  <label className="form-label">
                    Email ID <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                    <input
                      type="email"
                      placeholder="your.email@example.com"
                      className="input-field pl-10"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                {/* Banking Information */}
                <div className="md:col-span-2 mt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Banking Information</h3>
                </div>

                <div>
                  <label className="form-label">
                    Bank Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="e.g., HDFC Bank"
                      className="input-field pl-10"
                      value={formData.bankName}
                      onChange={(e) => handleInputChange('bankName', e.target.value)}
                    />
                  </div>
                  {errors.bankName && <p className="text-red-500 text-sm mt-1">{errors.bankName}</p>}
                </div>

                <div>
                  <label className="form-label">
                    SB A/C No. <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-3 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="Account number"
                      className="input-field pl-10"
                      value={formData.accountNo}
                      onChange={(e) => handleInputChange('accountNo', e.target.value)}
                    />
                  </div>
                  {errors.accountNo && <p className="text-red-500 text-sm mt-1">{errors.accountNo}</p>}
                </div>

                <div>
                  <label className="form-label">
                    IFSC Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., SBIN0001234"
                    className="input-field"
                    value={formData.ifscCode}
                    onChange={(e) => handleInputChange('ifscCode', e.target.value)}
                  />
                  {errors.ifscCode && <p className="text-red-500 text-sm mt-1">{errors.ifscCode}</p>}
                </div>

                <div>
                  <label className="form-label">
                    Branch <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Branch name"
                    className="input-field"
                    value={formData.branch}
                    onChange={(e) => handleInputChange('branch', e.target.value)}
                  />
                  {errors.branch && <p className="text-red-500 text-sm mt-1">{errors.branch}</p>}
                </div>

                {/* Identity Documents */}
                <div className="md:col-span-2 mt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Identity Documents</h3>
                </div>

                <div>
                  <label className="form-label">
                    PAN No. <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="e.g., ABCDE1234F"
                      className="input-field pl-10"
                      value={formData.panNo}
                      onChange={(e) => handleInputChange('panNo', e.target.value.toUpperCase())}
                    />
                  </div>
                  {errors.panNo && <p className="text-red-500 text-sm mt-1">{errors.panNo}</p>}
                </div>

                <div>
                  <label className="form-label">
                    Aadhar No. <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="e.g., 1234 5678 9012"
                      className="input-field pl-10"
                      value={formData.aadharNo}
                      onChange={(e) => handleInputChange('aadharNo', e.target.value)}
                    />
                  </div>
                  {errors.aadharNo && <p className="text-red-500 text-sm mt-1">{errors.aadharNo}</p>}
                </div>
              </div>
            </>
          )}

          {/* STEP 3 */}
          {currentStep === 3 && (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Application Form - Education & Declaration</h2>

              {/* Education Table */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Educational Qualifications</h3>
                <div className="overflow-x-auto border border-gray-300 rounded-lg">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-100 border-b">
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Qualification Level</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Year of Passing</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">% of Marks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.education.map((edu, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-3 text-sm text-gray-700 border-b border-gray-200">
                            {edu.level}
                          </td>
                          <td className="px-4 py-3 border-b border-gray-200">
                            <input
                              type="number"
                              placeholder="YYYY"
                              className="input-field text-sm"
                              value={edu.yearOfPassing}
                              onChange={(e) => handleEducationChange(idx, 'yearOfPassing', e.target.value)}
                            />
                            {errors[`edu${idx}Year`] && (
                              <p className="text-red-500 text-xs mt-1">{errors[`edu${idx}Year`]}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 border-b border-gray-200">
                            <input
                              type="number"
                              step="0.01"
                              placeholder="e.g., 85.5"
                              className="input-field text-sm"
                              value={edu.percentage}
                              onChange={(e) => handleEducationChange(idx, 'percentage', e.target.value)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-sm text-gray-500 mt-2">* Master's Degree is optional</p>
              </div>

              {/* Declaration */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Declaration</h3>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    I hereby declare that all statements made in the application are true, complete and correct to the best of my knowledge and belief. I understand that in the event of any information being found untrue/false/incorrect or I do not satisfy the eligibility criteria, my candidature/appointment will be cancelled/terminated, without assigning any reasons thereof.
                  </p>
                </div>

                <div className="mb-4 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="declaration"
                    checked={formData.declaration}
                    onChange={(e) => handleInputChange('declaration', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <label htmlFor="declaration" className="text-sm text-gray-700">
                    I agree to the above declaration <span className="text-red-500">*</span>
                  </label>
                </div>
                {errors.declaration && <p className="text-red-500 text-sm mb-4">{errors.declaration}</p>}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">
                      Place <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter place"
                      className="input-field"
                      value={formData.place}
                      onChange={(e) => handleInputChange('place', e.target.value)}
                    />
                    {errors.place && <p className="text-red-500 text-sm mt-1">{errors.place}</p>}
                  </div>
                  <div>
                    <label className="form-label">Date</label>
                    <input
                      type="date"
                      className="input-field bg-gray-100 text-gray-600 cursor-not-allowed"
                      value={formData.date}
                      disabled
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between gap-3 mt-8">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className={`flex items-center gap-2 px-6 py-2 rounded-md transition ${
                currentStep === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'btn-secondary'
              }`}
            >
              <ChevronLeft size={20} />
              Previous
            </button>

            <button
              onClick={handleSaveAsDraft}
              className="flex items-center gap-2 px-6 py-2 rounded-md btn-secondary"
            >
              <Save size={20} />
              Save as Draft
            </button>

            {currentStep < 3 && (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                Next
                <ChevronRight size={20} />
              </button>
            )}

            {currentStep === 3 && (
              <>
                <button
                  onClick={() => navigate('/candidate/preview')}
                  className="flex items-center gap-2 px-6 py-2 rounded-md border border-blue-500 text-blue-600 hover:bg-blue-50 transition"
                >
                  Preview
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex items-center gap-2 px-8 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 transition"
                >
                  <Send size={20} />
                  Submit
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full text-center">
            <CheckCircle className="mx-auto mb-4 text-green-500" size={64} />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted Successfully!</h3>
            <p className="text-gray-600 mb-6">
              Your application has been submitted and is under review. You will receive an email notification shortly.
            </p>
            <button
              onClick={() => {
                setShowSuccessModal(false);
                navigate('/candidate/dashboard');
              }}
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition font-medium"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
