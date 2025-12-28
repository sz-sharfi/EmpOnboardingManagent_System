import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Printer, Download, AlertCircle, FileText, Clock } from 'lucide-react';
import supabase from '../../utils/supabaseClient';

interface ApplicationData {
  id: string;
  user_id: string;
  status: string;
  submitted_at: string;
  created_at: string;
  form_data: {
    fullName?: string;
    postAppliedFor?: string;
    fatherOrHusbandName?: string;
    permanentAddress?: string;
    communicationAddress?: string;
    dateOfBirth?: string;
    sex?: string;
    nationality?: string;
    maritalStatus?: string;
    religion?: string;
    mobileNo?: string;
    email?: string;
    bankName?: string;
    accountNo?: string;
    ifscCode?: string;
    branch?: string;
    panNo?: string;
    aadharNo?: string;
    education?: Array<{ level: string; yearOfPassing: string; percentage: string }>;
    place?: string;
    date?: string;
  };
  profiles: {
    email: string;
    full_name: string;
  };
}

interface DocumentData {
  id: string;
  document_type: string;
  storage_path: string;
  file_size_bytes: number;
  verification_status: string;
  created_at: string;
  verified_at: string | null;
  verified_by: string | null;
  rejection_reason: string | null;
}

interface ActivityData {
  id: string;
  activity_type: string;
  description: string;
  performed_by_name: string;
  performed_by_role: string;
  created_at: string;
  metadata: any;
}

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'documents' | 'timeline' | 'comments'>('details');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [notes, setNotes] = useState('');
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    basic: false,
    address: false,
    personal: false,
    banking: false,
    identity: false,
    education: false,
  });

  useEffect(() => {
    if (id) {
      fetchApplication();
      fetchDocuments();
      fetchTimeline();
    }
  }, [id]);

  const fetchApplication = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          profiles!applications_user_id_fkey (
            email,
            full_name
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      // Transform profiles if it's an array
      const transformedData = {
        ...data,
        profiles: Array.isArray(data.profiles) ? data.profiles[0] : data.profiles
      } as ApplicationData;

      setApplication(transformedData);
    } catch (error) {
      console.error('Error fetching application:', error);
      alert('Failed to load application details');
      navigate('/admin/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('app_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setDocuments(data);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const fetchTimeline = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_application_timeline', { p_app_id: id });

      if (error) throw error;

      if (data) {
        setActivities(data);
      }
    } catch (error) {
      console.error('Error fetching timeline:', error);
    }
  };

  const handleApprove = () => {
    setShowApprovalModal(true);
  };

  const handleReject = () => {
    setShowRejectionModal(true);
  };

  const confirmApprove = async () => {
    try {
      const { error } = await supabase.rpc('approve_application', { p_app_id: id });
      
      if (error) {
        console.error('Approval error:', error);
        throw error;
      }
      
      alert('Application approved successfully!');
      setShowApprovalModal(false);
      
      // Refresh data
      await fetchApplication();
      await fetchTimeline();
      
    } catch (error: any) {
      console.error('Error approving application:', error);
      const errorMessage = error?.message || 'Failed to approve application';
      alert(`Failed to approve application: ${errorMessage}`);
    }
  };

  const confirmReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please enter a rejection reason');
      return;
    }

    try {
      const { error } = await supabase.rpc('reject_application', { 
        p_app_id: id,
        p_rejection_reason: rejectionReason
      });
      
      if (error) {
        console.error('Rejection error:', error);
        throw error;
      }
      
      alert('Application rejected successfully');
      setShowRejectionModal(false);
      
      // Refresh data
      await fetchApplication();
      await fetchTimeline();
      
    } catch (error: any) {
      console.error('Error rejecting application:', error);
      const errorMessage = error?.message || 'Failed to reject application';
      alert(`Failed to reject application: ${errorMessage}`);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getDocumentUrl = async (storagePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(storagePath, 3600); // 1 hour expiry

      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      console.error('Error getting document URL:', error);
      return null;
    }
  };

  const handleDownloadDocument = async (doc: DocumentData) => {
    try {
      // Create signed URL
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(doc.storage_path, 3600);

      if (error) {
        console.error('Storage error:', error);
        throw error;
      }

      if (data?.signedUrl) {
        // Fetch the file and download it
        const response = await fetch(data.signedUrl);
        const blob = await response.blob();
        
        // Get file extension from storage path
        const fileExt = doc.storage_path.split('.').pop() || 'pdf';
        const fileName = `${doc.document_type}.${fileExt}`;
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        alert('Could not generate download URL');
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-semibold text-gray-600">Loading application...</div>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-semibold text-gray-600">Application not found</div>
          <button 
            onClick={() => navigate('/admin/dashboard')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const formData = application.form_data || {};
  const candidateName = formData.fullName || application.profiles?.full_name || 'N/A';
  const candidateEmail = formData.email || application.profiles?.email || 'N/A';

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="bg-white shadow-sm p-4 mb-6 rounded">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/admin/dashboard')} className="flex items-center gap-2 text-blue-600">
              <ArrowLeft /> Back
            </button>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-2xl">
                {candidateName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-2xl font-bold">{candidateName}</div>
                <div className="text-gray-600">{formData.postAppliedFor || 'N/A'}</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full font-medium ${
              application.status === 'approved' || application.status === 'accepted' ? 'bg-green-100 text-green-800' :
              application.status === 'rejected' ? 'bg-red-100 text-red-800' :
              application.status === 'under_review' ? 'bg-yellow-100 text-yellow-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {application.status.replace('_', ' ').toUpperCase()}
            </span>
            <button onClick={handleApprove} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"><CheckCircle /> Approve</button>
            <button onClick={handleReject} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 flex items-center gap-2"><XCircle /> Reject</button>
            <button className="border px-3 py-2 rounded hover:bg-gray-50 flex items-center gap-2"><Printer /> Print</button>
            <button className="border px-3 py-2 rounded hover:bg-gray-50 flex items-center gap-2"><Download /> Download</button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b">
        <div className="flex gap-8">
          <button onClick={() => setActiveTab('details')} className={`pb-2 ${activeTab === 'details' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}>Application Details</button>
          <button onClick={() => setActiveTab('documents')} className={`pb-2 ${activeTab === 'documents' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}>Documents</button>
          <button onClick={() => setActiveTab('timeline')} className={`pb-2 ${activeTab === 'timeline' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}>Timeline</button>
          <button onClick={() => setActiveTab('comments')} className={`pb-2 ${activeTab === 'comments' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}>Comments</button>
        </div>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Application Details Tab */}
          {activeTab === 'details' && (
            <>
              {/* Details cards */}
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h4 className="text-lg font-semibold mb-4">Basic Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Post Applied For</label>
                    <p className="text-gray-900">{formData.postAppliedFor || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Name</label>
                    <p className="text-gray-900">{candidateName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Father / Husband</label>
                    <p className="text-gray-900">{formData.fatherOrHusbandName || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Submitted At</label>
                    <p className="text-gray-900">
                      {application.submitted_at 
                        ? new Date(application.submitted_at).toLocaleString('en-US', { 
                            year: 'numeric', month: 'short', day: 'numeric', 
                            hour: '2-digit', minute: '2-digit' 
                          })
                        : 'Not submitted'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h4 className="text-lg font-semibold mb-4">Address Details</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Permanent Address</label>
                    <p className="text-gray-900">{formData.permanentAddress || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Communication Address</label>
                    <p className="text-gray-900">{formData.communicationAddress || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h4 className="text-lg font-semibold mb-4">Personal Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Date of Birth</label>
                    <p className="text-gray-900">{formData.dateOfBirth || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Sex</label>
                    <p className="text-gray-900">{formData.sex || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Nationality</label>
                    <p className="text-gray-900">{formData.nationality || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Marital Status</label>
                    <p className="text-gray-900">{formData.maritalStatus || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Religion</label>
                    <p className="text-gray-900">{formData.religion || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Mobile No</label>
                    <p className="text-gray-900">{formData.mobileNo || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <p className="text-gray-900">{candidateEmail}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h4 className="text-lg font-semibold mb-4">Banking Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Bank Name</label>
                    <p className="text-gray-900">{formData.bankName || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Account No</label>
                    <p className="text-gray-900">{formData.accountNo || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">IFSC Code</label>
                    <p className="text-gray-900">{formData.ifscCode || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Branch</label>
                    <p className="text-gray-900">{formData.branch || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h4 className="text-lg font-semibold mb-4">Identity Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">PAN No</label>
                    <p className="text-gray-900">{formData.panNo || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Aadhar No</label>
                    <p className="text-gray-900">{formData.aadharNo || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h4 className="text-lg font-semibold mb-4">Educational Qualifications</h4>
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Level</th>
                      <th className="text-left py-2">Year</th>
                      <th className="text-left py-2">Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(formData.education || []).map((edu, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="py-2">{edu.level}</td>
                        <td className="py-2">{edu.yearOfPassing || 'N/A'}</td>
                        <td className="py-2">{edu.percentage || 'N/A'}%</td>
                      </tr>
                    ))}
                    {(!formData.education || formData.education.length === 0) && (
                      <tr>
                        <td colSpan={3} className="py-4 text-center text-gray-500">
                          No education details provided
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="text-lg font-semibold mb-4">Uploaded Documents</h4>
              
              {documents.length > 0 ? (
                <div className="space-y-4">
                  {documents.map((doc) => (
                    <div key={doc.id} className="border rounded-lg p-4 hover:bg-gray-50 transition">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <FileText className="text-blue-600 mt-1" size={24} />
                          <div className="flex-1">
                            <h5 className="font-semibold text-gray-900">{doc.document_type}</h5>
                            <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">Size:</span> {formatFileSize(doc.file_size_bytes)}
                              </div>
                              <div>
                                <span className="font-medium">Uploaded:</span> {new Date(doc.created_at).toLocaleDateString()}
                              </div>
                              <div>
                                <span className="font-medium">Status:</span>{' '}
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                  doc.verification_status === 'verified' ? 'bg-green-100 text-green-800' :
                                  doc.verification_status === 'rejected' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {doc.verification_status}
                                </span>
                              </div>
                              {doc.verified_at && (
                                <div>
                                  <span className="font-medium">Verified:</span> {new Date(doc.verified_at).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                            {doc.rejection_reason && (
                              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                                <span className="font-medium">Rejection Reason:</span> {doc.rejection_reason}
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDownloadDocument(doc)}
                          className="ml-4 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2 text-sm"
                        >
                          <Download size={16} /> View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="mx-auto text-gray-300 mb-4" size={48} />
                  <p className="text-gray-500">No documents uploaded yet</p>
                  <p className="text-sm text-gray-400 mt-1">Documents will appear here once the candidate uploads them through the application form.</p>
                </div>
              )}
            </div>
          )}

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="text-lg font-semibold mb-6">Application Timeline</h4>
              
              {activities.length > 0 ? (
                <div className="space-y-6 relative">
                  {/* Timeline Line */}
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

                  {/* Timeline Items */}
                  {activities.map((activity, idx) => (
                    <div key={activity.id} className="flex gap-4 relative">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 relative z-10 ${
                        activity.activity_type === 'status_changed' && activity.description.includes('approved')
                          ? 'bg-green-500 text-white'
                          : activity.activity_type === 'status_changed' && activity.description.includes('rejected')
                          ? 'bg-red-500 text-white'
                          : activity.activity_type === 'document_uploaded' || activity.activity_type === 'document_verified'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-400 text-white'
                      }`}>
                        {activity.activity_type === 'status_changed' && activity.description.includes('approved') ? (
                          <CheckCircle size={20} />
                        ) : activity.activity_type === 'status_changed' && activity.description.includes('rejected') ? (
                          <XCircle size={20} />
                        ) : activity.activity_type.includes('document') ? (
                          <FileText size={20} />
                        ) : (
                          <div className="text-xs font-bold">{idx + 1}</div>
                        )}
                      </div>
                      <div className="flex-1 pt-2 pb-4">
                        <p className="font-medium text-gray-900">{activity.description}</p>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                          <span>
                            {activity.performed_by_name || 'System'} 
                            {activity.performed_by_role && (
                              <span className="text-xs ml-1 px-2 py-0.5 bg-gray-100 rounded">
                                {activity.performed_by_role}
                              </span>
                            )}
                          </span>
                          <span>•</span>
                          <span>{getTimeAgo(activity.created_at)}</span>
                        </div>
                        {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                            <details>
                              <summary className="cursor-pointer font-medium">Additional Details</summary>
                              <pre className="mt-2 whitespace-pre-wrap">{JSON.stringify(activity.metadata, null, 2)}</pre>
                            </details>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Clock className="mx-auto text-gray-300 mb-4" size={48} />
                  <p className="text-gray-500">No timeline activities yet</p>
                  <p className="text-sm text-gray-400 mt-1">Application activities will appear here as the application progresses.</p>
                </div>
              )}
            </div>
          )}

          {/* Comments Tab */}
          {activeTab === 'comments' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="text-lg font-semibold mb-4">Comments & Messages</h4>
              <div className="text-center py-12">
                <p className="text-gray-500">Comments functionality coming soon</p>
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <aside className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="text-lg font-semibold mb-4">Quick Info</h4>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Application ID</label>
                <p className="text-gray-900 font-mono text-sm">{application.id.substring(0, 8)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Submitted</label>
                <p className="text-gray-900">
                  {application.submitted_at 
                    ? new Date(application.submitted_at).toLocaleDateString('en-US', { 
                        year: 'numeric', month: 'short', day: 'numeric'
                      })
                    : 'Not submitted'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Post</label>
                <p className="text-gray-900">{formData.postAppliedFor || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="text-lg font-semibold mb-4">Internal Notes</h4>
            <textarea rows={6} value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full input-field p-3" />
            <button onClick={() => console.log('Saved notes', notes)} className="mt-3 w-full bg-blue-600 text-white py-2 rounded">Save Notes</button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="text-lg font-semibold mb-4">Verification Checklist</h4>
            <div className="space-y-2">
              {Object.keys(checklist).map((key) => (
                <label key={key} className="flex items-center gap-2">
                  <input type="checkbox" checked={checklist[key]} onChange={() => setChecklist((c) => ({ ...c, [key]: !c[key] }))} />
                  <span className="text-sm text-gray-700">{key.replace(/^[a-z]/, (s) => s.toUpperCase())} Verified</span>
                </label>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full text-center">
            <CheckCircle className="mx-auto mb-4 text-green-500" size={64} />
            <h3 className="text-2xl font-bold mb-2">Approve Application</h3>
            <p className="text-gray-600 mb-4">You are about to approve this application. The candidate will be notified.</p>
            <div className="text-left mb-4">
              <p className="font-medium">Candidate:</p>
              <p className="text-gray-900">{candidateName} — {formData.postAppliedFor || 'N/A'}</p>
              <p className="text-sm text-gray-500 mt-2">Application ID: {application.id.substring(0, 8)}</p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowApprovalModal(false)} className="flex-1 border py-2 rounded">Cancel</button>
              <button onClick={confirmApprove} className="flex-1 bg-green-600 text-white py-2 rounded">Confirm Approval</button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full text-center">
            <AlertCircle className="mx-auto mb-4 text-red-500" size={64} />
            <h3 className="text-2xl font-bold mb-2">Reject Application</h3>
            <p className="text-gray-600 mb-4">Please provide a reason for rejection.</p>

            <textarea 
              placeholder="Reason for rejection (required)" 
              className="w-full input-field mb-4 p-3"
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />

            <div className="flex gap-3">
              <button onClick={() => {
                setShowRejectionModal(false);
                setRejectionReason('');
              }} className="flex-1 border py-2 rounded">
                Cancel
              </button>
              <button onClick={confirmReject} className="flex-1 bg-red-600 text-white py-2 rounded">
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
