import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Printer, Download, ArrowLeft, Mail, Phone, MapPin, User as UserIcon } from 'lucide-react';
import supabase from '../../utils/supabaseClient';

interface FormData {
  postAppliedFor: string;
  fullName: string;
  fatherOrHusbandName: string;
  photo: string | null;
  permanentAddress: string;
  communicationAddress: string;
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
  place: string;
  date: string;
}

export default function ApplicationPreviewPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchApplication();
  }, []);

  const fetchApplication = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) {
        navigate('/candidate/login');
        return;
      }

      const { data, error } = await supabase
        .from('applications')
        .select('form_data, id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        alert('Failed to load application');
        return;
      }

      const appData = data.form_data as FormData;
      setFormData(appData);

      // Try to fetch photo from documents table
      if (data.id) {
        try {
          // First try to find a document with type 'Photo'
          const { data: photoDoc } = await supabase
            .from('documents')
            .select('storage_path')
            .eq('app_id', data.id)
            .eq('document_type', 'Photo')
            .single();

          if (photoDoc?.storage_path) {
            const { data: urlData, error: urlError } = await supabase.storage
              .from('documents')
              .createSignedUrl(photoDoc.storage_path, 3600);

            if (urlError) {
              console.error('Error creating signed URL:', urlError);
            } else if (urlData?.signedUrl) {
              setPhotoUrl(urlData.signedUrl);
            }
          }
        } catch (photoError) {
          console.log('Photo not found in documents');
          // Silently fail and show placeholder
        }
      }
    } catch (error) {
      console.error('Error fetching application:', error);
    }
  };

  const handlePrint = () => window.print();
  const handleDownloadPDF = () => alert('PDF download feature coming soon');

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white shadow-sm p-4 print:hidden">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <button
            onClick={() => navigate('/candidate/dashboard')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowLeft size={20} />
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Application Preview</h1>
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium text-gray-700"
            >
              <Printer size={20} />
              Print
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium text-gray-700"
            >
              <Download size={20} />
              PDF
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 py-8 print:py-0">
        {!formData ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <p className="text-gray-600 mb-4">Loading your application...</p>
          </div>
        ) : (
          <div className="bg-white shadow-lg rounded-lg print:shadow-none print:rounded-none">
            {/* Resume Header */}
            <div className="relative bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8 print:bg-blue-700">
              <div className="flex justify-between items-start">
                {/* Left side - Name and Contact */}
                <div className="flex-1">
                  <h1 className="text-4xl font-bold mb-2">{formData.fullName}</h1>
                  <h2 className="text-xl font-medium mb-6 text-blue-100">
                    {formData.postAppliedFor}
                  </h2>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail size={16} />
                      <span>{formData.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={16} />
                      <span>{formData.mobileNo}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin size={16} className="mt-1 flex-shrink-0" />
                      <span>{formData.permanentAddress}</span>
                    </div>
                  </div>
                </div>

                {/* Right side - Profile Photo */}
                <div className="ml-8 flex-shrink-0">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt="Profile"
                      className="w-32 h-32 rounded-lg object-cover border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-lg bg-white/20 border-4 border-white shadow-lg flex items-center justify-center">
                      <UserIcon size={48} className="text-white/60" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Resume Body */}
            <div className="p-8">
              {/* Personal Information */}
              <section className="mb-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-blue-600">
                  Personal Information
                </h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Father's / Husband's Name</p>
                    <p className="text-base text-gray-900">{formData.fatherOrHusbandName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Date of Birth</p>
                    <p className="text-base text-gray-900">{formData.dateOfBirth}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Gender</p>
                    <p className="text-base text-gray-900">{formData.sex}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Marital Status</p>
                    <p className="text-base text-gray-900">{formData.maritalStatus}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Nationality</p>
                    <p className="text-base text-gray-900">{formData.nationality}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Religion</p>
                    <p className="text-base text-gray-900">{formData.religion}</p>
                  </div>
                </div>
              </section>

              {/* Address Information */}
              <section className="mb-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-blue-600">
                  Address
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Permanent Address</p>
                    <p className="text-base text-gray-900">{formData.permanentAddress}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Communication Address</p>
                    <p className="text-base text-gray-900">{formData.communicationAddress}</p>
                  </div>
                </div>
              </section>

              {/* Educational Qualifications */}
              <section className="mb-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-blue-600">
                  Educational Qualifications
                </h3>
                <div className="space-y-4">
                  {formData.education.filter(edu => edu.level && (edu.yearOfPassing || edu.percentage)).map((edu, idx) => (
                    <div key={idx} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-1 h-full bg-blue-600 rounded"></div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg text-gray-900">{edu.level}</h4>
                        <div className="flex gap-8 mt-2 text-sm text-gray-600">
                          {edu.yearOfPassing && (
                            <div>
                              <span className="font-medium">Year:</span> {edu.yearOfPassing}
                            </div>
                          )}
                          {edu.percentage && (
                            <div>
                              <span className="font-medium">Percentage:</span> {edu.percentage}%
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Identity Documents */}
              <section className="mb-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-blue-600">
                  Identity Documents
                </h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-600">PAN Number</p>
                    <p className="text-base text-gray-900 font-mono">{formData.panNo}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Aadhar Number</p>
                    <p className="text-base text-gray-900 font-mono">{formData.aadharNo}</p>
                  </div>
                </div>
              </section>

              {/* Banking Information */}
              <section className="mb-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-blue-600">
                  Banking Information
                </h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Bank Name</p>
                    <p className="text-base text-gray-900">{formData.bankName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Account Number</p>
                    <p className="text-base text-gray-900 font-mono">{formData.accountNo}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600">IFSC Code</p>
                    <p className="text-base text-gray-900 font-mono">{formData.ifscCode}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Branch</p>
                    <p className="text-base text-gray-900">{formData.branch}</p>
                  </div>
                </div>
              </section>

              {/* Declaration */}
              <section className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Declaration</h3>
                <p className="text-sm text-gray-700 leading-relaxed mb-6">
                  I hereby declare that all statements made in the application are true, complete and correct to the best of my knowledge and belief. I understand that in the event of any information being found untrue/false/incorrect or I do not satisfy the eligibility criteria, my candidature/appointment will be cancelled/terminated, without assigning any reasons thereof.
                </p>
                <div className="flex justify-between items-end pt-4 border-t border-gray-300">
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Place</p>
                    <p className="text-base text-gray-900 mt-1">{formData.place || 'N/A'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-600">Date</p>
                    <p className="text-base text-gray-900 mt-1">{formData.date || 'N/A'}</p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}
      </main>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            background: white;
          }
          header {
            display: none !important;
          }
          main {
            padding: 0 !important;
            max-width: 100% !important;
          }
          .shadow-lg {
            box-shadow: none !important;
          }
          .rounded-lg {
            border-radius: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}