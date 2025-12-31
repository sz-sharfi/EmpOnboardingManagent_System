import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Printer, Download, AlertCircle, FileText, Clock, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getApplicationById, approveApplication, rejectApplication } from '../../lib/applications';
import { getApplicationDocuments, getDocumentSignedUrl, verifyDocument, rejectDocument } from '../../lib/documents';
import { useAuth } from '../../contexts/AuthContext';

interface ProfileData {
  id: string;
  email: string;
  full_name: string;
  role: string;
  avatar_url: string | null;
}

interface ApplicationData {
  id: string;
  user_id: string;
  status: string;
  submitted_at: string | null;
  created_at: string | null;
  post_applied_for: string | null;
  name: string | null;
  email: string | null;
  rejection_reason?: string | null;
  admin_notes?: string | null;
  profile: ProfileData | null;
  form_data?: any;
  // Individual fields that might exist
  father_or_husband_name?: string | null;
  permanent_address?: string | null;
  communication_address?: string | null;
  date_of_birth?: string | null;
  sex?: string | null;
  nationality?: string | null;
  marital_status?: string | null;
  religion?: string | null;
  mobile_no?: string | null;
  bank_name?: string | null;
  account_no?: string | null;
  ifsc_code?: string | null;
  branch?: string | null;
  pan_no?: string | null;
  aadhar_no?: string | null;
  education?: any;
}

interface DocumentData {
  id: string;
  application_id: string;
  document_type: string;
  storage_path: string;
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
  const { user } = useAuth();
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
  const [viewerDoc, setViewerDoc] = useState<DocumentData | null>(null);
  const [viewerUrl, setViewerUrl] = useState('');
  const [rejectingDoc, setRejectingDoc] = useState<DocumentData | null>(null);
  const [docRejectionReason, setDocRejectionReason] = useState('');

  // useMemo must be called before any early returns
  const candidateName = useMemo(() => application?.name || application?.profile?.full_name || 'N/A', [application]);
  const candidateEmail = useMemo(() => application?.email || application?.profile?.email || 'N/A', [application]);
  const statusClass = useMemo(() => {
    if (application?.status === 'accepted') return 'bg-green-100 text-green-800';
    if (application?.status === 'rejected') return 'bg-red-100 text-red-800';
    return 'bg-blue-100 text-blue-800';
  }, [application?.status]);

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
      if (!id) return;

      const data = await getApplicationById(id);
      setApplication(data);
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
      if (!id) {
        console.log('No application ID, skipping document fetch');
        return;
      }
      console.log('=== FETCHING DOCUMENTS ===');
      console.log('Application ID:', id);
      const docs = await getApplicationDocuments(id);
      console.log('Documents fetched - Count:', docs?.length || 0);
      console.log('Documents data:', JSON.stringify(docs, null, 2));
      setDocuments(docs);
    } catch (error) {
      console.error('Error fetching documents:', error);
      alert('Failed to load documents. Check console for details.');
    }
  };

  const fetchTimeline = async () => {
    try {
      const { data, error } = await supabase.rpc('get_application_timeline', { p_app_id: id });

      if (error) throw error;

      if (data) {
        setActivities(data);
      }
    } catch (error) {
      console.error('Error fetching timeline:', error);
    }
  };

  const handleApprove = () => setShowApprovalModal(true);
  const handleReject = () => setShowRejectionModal(true);

  const confirmApprove = async () => {
    if (!id || !user) {
      console.error('Missing required data:', { id, user });
      alert('Unable to approve: Missing application ID or user information');
      return;
    }

    try {
      console.log('Approving application:', { id, userId: user.id, notes });
      await approveApplication(id, user.id, notes || undefined);
      alert('Application approved successfully!');
      setShowApprovalModal(false);
      setNotes('');
      setChecklist({
        basic: false,
        address: false,
        personal: false,
        banking: false,
        identity: false,
        education: false,
      });
      await fetchApplication();
      await fetchTimeline();
    } catch (error: any) {
      console.error('Error approving application:', error);
      alert(`Failed to approve application: ${error.message}`);
    }
  };

  const confirmReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please enter a rejection reason');
      return;
    }

    if (!id || !user) {
      console.error('Missing required data:', { id, user });
      alert('Unable to reject: Missing application ID or user information');
      return;
    }

    try {
      console.log('Rejecting application:', { id, userId: user.id, reason: rejectionReason });
      await rejectApplication(id, user.id, rejectionReason);
      alert('Application rejected successfully');
      setShowRejectionModal(false);
      setRejectionReason('');
      await fetchApplication();
      await fetchTimeline();
    } catch (error: any) {
      console.error('Error rejecting application:', error);
      alert(`Failed to reject application: ${error.message}`);
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
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const handleVerifyDocument = async (doc: DocumentData) => {
    if (!user?.id) {
      alert('User not authenticated');
      return;
    }

    try {
      await verifyDocument(doc.id, user.id);
      alert('Document verified successfully!');
      await fetchDocuments();
      await fetchTimeline();
    } catch (error: any) {
      console.error('Error verifying document:', error);
      alert(`Failed to verify document: ${error.message}`);
    }
  };

  const handleRejectDocument = async () => {
    if (!rejectingDoc || !user?.id) return;

    if (!docRejectionReason.trim()) {
      alert('Please enter a rejection reason');
      return;
    }

    try {
      await rejectDocument(rejectingDoc.id, user.id, docRejectionReason);
      alert('Document rejected successfully');
      setRejectingDoc(null);
      setDocRejectionReason('');
      await fetchDocuments();
      await fetchTimeline();
    } catch (error: any) {
      console.error('Error rejecting document:', error);
      alert(`Failed to reject document: ${error.message}`);
    }
  };

  const openDocument = async (doc: DocumentData, action: 'view' | 'download') => {
    try {
      const url = await getDocumentSignedUrl(doc.storage_path);
      if (!url) {
        alert('Could not generate signed URL');
        return;
      }

      if (action === 'download') {
        const response = await fetch(url);
        const blob = await response.blob();
        const fileExt = doc.storage_path.split('.').pop() || 'pdf';
        const fileName = `${doc.document_type}.${fileExt}`;
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      } else {
        setViewerDoc(doc);
        setViewerUrl(url);
      }
    } catch (error) {
      console.error('Error handling document:', error);
      alert('Failed to process document');
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

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="bg-white shadow-sm p-4 mb-6 rounded">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/admin/dashboard')} className="flex items-center gap-2 text-blue-600">
              <ArrowLeft /> Back
            </button>

            <div className="flex items-center gap-4">
              {application.profile?.avatar_url ? (
                <img src={application.profile.avatar_url} alt={candidateName} className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-2xl">
                  {candidateName
                    .split(' ')
                    .map((part) => part[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase() || 'C'}
                </div>
              )}
              <div>
                <div className="text-2xl font-bold">{candidateName}</div>
                <div className="text-gray-600">{application.post_applied_for || 'N/A'}</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 no-print">
            <span className={`px-3 py-1 rounded-full font-medium ${statusClass}`}>
              {application.status.replace('_', ' ').toUpperCase()}
            </span>
            <button 
              onClick={handleApprove} 
              disabled={application.status === 'accepted' || application.status === 'rejected'}
              className={`px-4 py-2 rounded flex items-center gap-2 ${
                application.status === 'accepted' || application.status === 'rejected'
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              <CheckCircle /> Approve
            </button>
            <button 
              onClick={handleReject} 
              disabled={application.status === 'accepted' || application.status === 'rejected'}
              className={`px-4 py-2 rounded flex items-center gap-2 ${
                application.status === 'accepted' || application.status === 'rejected'
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              <XCircle /> Reject
            </button>
            <button onClick={() => window.print()} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2">
              <Download /> Download PDF
            </button>
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
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h4 className="text-lg font-semibold mb-4">Basic Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Post Applied For</label>
                    <p className="text-gray-900">{application.post_applied_for || application.form_data?.postAppliedFor || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Full Name</label>
                    <p className="text-gray-900">{application.name || application.form_data?.fullName || candidateName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Father/Husband Name</label>
                    <p className="text-gray-900">{application.father_or_husband_name || application.form_data?.fatherOrHusbandName || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Date of Birth</label>
                    <p className="text-gray-900">{application.date_of_birth || application.form_data?.dateOfBirth || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Sex</label>
                    <p className="text-gray-900">{application.sex || application.form_data?.sex || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Nationality</label>
                    <p className="text-gray-900">{application.nationality || application.form_data?.nationality || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Marital Status</label>
                    <p className="text-gray-900">{application.marital_status || application.form_data?.maritalStatus || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Religion</label>
                    <p className="text-gray-900">{application.religion || application.form_data?.religion || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Submitted At</label>
                    <p className="text-gray-900">
                      {application.submitted_at
                        ? new Date(application.submitted_at).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Not submitted'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h4 className="text-lg font-semibold mb-4">Contact Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Mobile Number</label>
                    <p className="text-gray-900">{application.mobile_no || application.form_data?.mobileNo || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <p className="text-gray-900">{application.email || application.form_data?.email || candidateEmail}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-600">Permanent Address</label>
                    <p className="text-gray-900">{application.permanent_address || application.form_data?.permanentAddress || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-600">Communication Address</label>
                    <p className="text-gray-900">{application.communication_address || application.form_data?.communicationAddress || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h4 className="text-lg font-semibold mb-4">Banking & Identity Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Bank Name</label>
                    <p className="text-gray-900">{application.bank_name || application.form_data?.bankName || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Account Number</label>
                    <p className="text-gray-900">{application.account_no || application.form_data?.accountNo || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">IFSC Code</label>
                    <p className="text-gray-900">{application.ifsc_code || application.form_data?.ifscCode || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Branch</label>
                    <p className="text-gray-900">{application.branch || application.form_data?.branch || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">PAN Number</label>
                    <p className="text-gray-900">{application.pan_no || application.form_data?.panNo || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Aadhar Number</label>
                    <p className="text-gray-900">{application.aadhar_no || application.form_data?.aadharNo || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h4 className="text-lg font-semibold mb-4">Educational Qualifications</h4>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border px-4 py-2 text-left">Level</th>
                        <th className="border px-4 py-2 text-left">Year of Passing</th>
                        <th className="border px-4 py-2 text-left">Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(application.form_data?.education || application.education || [])
                        .filter((edu: any) => edu.yearOfPassing || edu.percentage)
                        .map((edu: any, idx: number) => (
                          <tr key={idx}>
                            <td className="border px-4 py-2">{edu.level || 'N/A'}</td>
                            <td className="border px-4 py-2">{edu.yearOfPassing || 'N/A'}</td>
                            <td className="border px-4 py-2">{edu.percentage ? `${edu.percentage}%` : 'N/A'}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  {!(application.form_data?.education || application.education) && (
                    <p className="text-center py-4 text-gray-500">No educational qualifications provided</p>
                  )}
                </div>
              </div>

              {application.rejection_reason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
                  <p className="font-semibold">Rejection Reason</p>
                  <p className="text-sm mt-1">{application.rejection_reason}</p>
                </div>
              )}
            </>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  {application.profile?.avatar_url ? (
                    <img src={application.profile.avatar_url} alt={candidateName} className="w-16 h-16 rounded-full object-cover border-2 border-gray-200" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl border-2 border-gray-200">
                      {candidateName
                        .split(' ')
                        .map((part) => part[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase() || 'C'}
                    </div>
                  )}
                  <div>
                    <h4 className="text-lg font-semibold">Uploaded Documents</h4>
                    <p className="text-sm text-gray-500">Candidate: {candidateName} • App ID: {application.id.substring(0, 8)}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Profile Photo Card */}
                {application.profile?.avatar_url && (
                  <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-24 h-24 rounded-lg overflow-hidden border-2 border-white shadow-md">
                          <img 
                            src={application.profile.avatar_url} 
                            alt={`${candidateName} Photo`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h5 className="font-semibold text-gray-900">Candidate Profile Photo</h5>
                            <span className="text-xs text-gray-500 font-mono">App #{application.id.substring(0, 8)}</span>
                          </div>
                          <p className="text-sm text-gray-500">Candidate: {candidateName}</p>
                          <div className="mt-2 text-sm text-gray-600">
                            <p className="font-medium">This is the candidate's profile photograph for verification purposes.</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 min-w-[200px]">
                        <div className="flex gap-2">
                          <button
                            onClick={() => window.open(application.profile.avatar_url, '_blank')}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded hover:bg-gray-50 text-sm font-medium"
                          >
                            <Eye size={16} />
                            View
                          </button>
                          <a
                            href={application.profile.avatar_url}
                            download={`${candidateName}_photo.jpg`}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                          >
                            <Download size={16} />
                            Download
                          </a>
                        </div>
                        <div className="text-xs text-gray-500 text-center mt-1">
                          Profile photos are verified as part of application review
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Regular Documents */}
                  {/* Regular Documents */}
                {documents.length > 0 ? (
                  <div className="space-y-4">
                    {documents.map((doc) => {
                    const docStatus = (doc as any).verification_status || doc.verification_status || 'pending';
                    return (
                      <div key={doc.id} className="border rounded-lg p-4 hover:bg-gray-50 transition">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4 flex-1">
                            <FileText className="text-blue-600 mt-1" size={24} />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h5 className="font-semibold text-gray-900">{doc.document_type}</h5>
                                <span className="text-xs text-gray-500 font-mono">App #{application.id.substring(0, 8)}</span>
                              </div>
                              <p className="text-sm text-gray-500">Candidate: {candidateName}</p>
                              <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-gray-600">
                                <div>
                                  <span className="font-medium">Size:</span> {formatFileSize((doc as any).file_size_bytes || 0)}
                                </div>
                                <div>
                                  <span className="font-medium">Uploaded:</span> {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : '—'}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">Status:</span>
                                  <span
                                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                                      docStatus === 'verified'
                                        ? 'bg-green-100 text-green-800'
                                        : docStatus === 'rejected'
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                    }`}
                                  >
                                    {docStatus}
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
                          <div className="flex flex-col gap-2 min-w-[200px]">
                            <div className="flex gap-2">
                              <button
                                onClick={() => openDocument(doc, 'view')}
                                className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded hover:bg-gray-50 text-sm font-medium"
                              >
                                <Eye size={16} />
                                View
                              </button>
                              <button
                                onClick={() => openDocument(doc, 'download')}
                                className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                              >
                                <Download size={16} />
                                Download
                              </button>
                            </div>
                            {docStatus !== 'verified' && docStatus !== 'rejected' && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleVerifyDocument(doc)}
                                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium"
                                >
                                  <CheckCircle size={16} />
                                  Verify
                                </button>
                                <button
                                  onClick={() => setRejectingDoc(doc)}
                                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium"
                                >
                                  <XCircle size={16} />
                                  Reject
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="mx-auto text-gray-300 mb-4" size={48} />
                    <p className="text-gray-500">No documents uploaded yet</p>
                    <p className="text-sm text-gray-400 mt-1">Documents will appear here once the candidate uploads them through the application form.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="text-lg font-semibold mb-6">Application Timeline</h4>

              {activities.length > 0 ? (
                <div className="space-y-6 relative">
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />
                  {activities.map((activity, idx) => (
                    <div key={activity.id} className="flex gap-4 relative">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 relative z-10 ${
                          activity.activity_type === 'status_changed' && activity.description.includes('approved')
                            ? 'bg-green-500 text-white'
                            : activity.activity_type === 'status_changed' && activity.description.includes('rejected')
                            ? 'bg-red-500 text-white'
                            : activity.activity_type.includes('document')
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-400 text-white'
                        }`}
                      >
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
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'Not submitted'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Post</label>
                <p className="text-gray-900">{application.post_applied_for || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="text-lg font-semibold mb-4">Internal Notes</h4>
            <textarea rows={6} value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full input-field p-3" />
            <button onClick={() => console.log('Saved notes', notes)} className="mt-3 w-full bg-blue-600 text-white py-2 rounded">
              Save Notes
            </button>
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

      {/* Document Viewer */}
      {viewerDoc && viewerUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-5xl w-full h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <p className="font-semibold">{viewerDoc.document_type}</p>
                <p className="text-sm text-gray-500">
                  {candidateName} • App #{application.id.substring(0, 8)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => openDocument(viewerDoc, 'download')} className="btn-secondary flex items-center gap-2">
                  <Download size={16} />
                  Download
                </button>
                <button onClick={() => setViewerDoc(null)} className="btn-secondary">
                  Close
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-gray-100 p-4">
              {viewerUrl.toLowerCase().includes('.pdf') ? (
                <iframe src={viewerUrl} title={viewerDoc.document_type} className="w-full h-full rounded border" />
              ) : (
                <img src={viewerUrl} alt={viewerDoc.document_type} className="max-w-full mx-auto rounded shadow" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full text-center">
            <CheckCircle className="mx-auto mb-4 text-green-500" size={64} />
            <h3 className="text-2xl font-bold mb-2">Approve Application</h3>
            <p className="text-gray-600 mb-4">You are about to approve this application. The candidate will be notified.</p>
            <div className="text-left mb-4">
              <p className="font-medium">Candidate:</p>
              <p className="text-gray-900">
                {candidateName} — {application.post_applied_for || 'N/A'}
              </p>
              <p className="text-sm text-gray-500 mt-2">Application ID: {application.id.substring(0, 8)}</p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowApprovalModal(false)} className="flex-1 border py-2 rounded">
                Cancel
              </button>
              <button onClick={confirmApprove} className="flex-1 bg-green-600 text-white py-2 rounded">
                Confirm Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="text-red-600" size={20} />
              </div>
              <div>
                <h3 className="font-bold text-lg">Reject Application</h3>
                <p className="text-sm text-gray-600">Please provide a rejection reason</p>
              </div>
            </div>

            <textarea
              className="input-field w-full h-28"
              placeholder="Reason for rejection"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />

            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setShowRejectionModal(false);
                  setRejectionReason('');
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button onClick={confirmReject} className="btn-danger">
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Rejection Modal */}
      {rejectingDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="text-red-600" size={20} />
              </div>
              <div>
                <h3 className="font-bold text-lg">Reject Document</h3>
                <p className="text-sm text-gray-600">{rejectingDoc.document_type}</p>
              </div>
            </div>

            <textarea
              className="input-field w-full h-28"
              placeholder="Reason for rejection"
              value={docRejectionReason}
              onChange={(e) => setDocRejectionReason(e.target.value)}
            />

            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setRejectingDoc(null);
                  setDocRejectionReason('');
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button onClick={handleRejectDocument} className="btn-danger">
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

