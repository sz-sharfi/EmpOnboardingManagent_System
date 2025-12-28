import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Printer, Download, AlertCircle } from 'lucide-react';
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

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState<ApplicationData | null>(null);
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

  const handleApprove = () => {
    setShowApprovalModal(true);
  };

  const handleReject = () => {
    setShowRejectionModal(true);
  };

  const confirmApprove = async () => {
    try {
      const { error } = await supabase.rpc('approve_application', { p_app_id: id });
      
      if (error) throw error;
      
      alert('Application approved successfully!');
      setShowApprovalModal(false);
      navigate('/admin/dashboard');
    } catch (error) {
      console.error('Error approving application:', error);
      alert('Failed to approve application');
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
      
      if (error) throw error;
      
      alert('Application rejected');
      setShowRejectionModal(false);
      navigate('/admin/dashboard');
    } catch (error) {
      console.error('Error rejecting application:', error);
      alert('Failed to reject application');
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
