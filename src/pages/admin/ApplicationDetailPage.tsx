import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Info, Printer, Download, User, AlertCircle } from 'lucide-react';

const mockApplication = {
  id: 'APP-001',
  name: 'John Doe',
  photo: null,
  status: 'under_review',
  postAppliedFor: 'Software Engineer',
  fatherOrHusbandName: 'Richard Doe',
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
  aadharNo: '1234 5678 9012',
  education: [
    { level: "10th", yearOfPassing: '2010', percentage: '85.5' },
    { level: "12th", yearOfPassing: '2012', percentage: '88.0' },
    { level: "Bachelor's", yearOfPassing: '2016', percentage: '78.5' },
  ],
  place: 'Mumbai',
  date: '2024-12-24',
  submittedAt: '2024-12-20 10:30 AM',
};

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(mockApplication);
  const [activeTab, setActiveTab] = useState<'details' | 'documents' | 'timeline' | 'comments'>('details');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
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
    // In real app, fetch by id. For MVP we use mock
    setApplication(mockApplication);
  }, [id]);

  const handleApprove = () => {
    setShowApprovalModal(true);
  };

  const handleReject = () => {
    setShowRejectionModal(true);
  };

  const confirmApprove = () => {
    console.log('Approved', application.id);
    setShowApprovalModal(false);
    navigate('/admin/dashboard');
  };

  const confirmReject = (reason: string) => {
    console.log('Rejected', application.id, reason);
    setShowRejectionModal(false);
    navigate('/admin/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="bg-white shadow-sm p-4 mb-6 rounded">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/admin/dashboard')} className="flex items-center gap-2 text-blue-600">
              <ArrowLeft /> Back
            </button>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                <User />
              </div>
              <div>
                <div className="text-2xl font-bold">{application.name}</div>
                <div className="text-gray-600">{application.postAppliedFor}</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 font-medium">{application.status.replace('_', ' ').toUpperCase()}</span>
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
                <p className="text-gray-900">{application.postAppliedFor}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Name</label>
                <p className="text-gray-900">{application.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Father / Husband</label>
                <p className="text-gray-900">{application.fatherOrHusbandName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Submitted At</label>
                <p className="text-gray-900">{application.submittedAt}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h4 className="text-lg font-semibold mb-4">Address Details</h4>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Permanent Address</label>
                <p className="text-gray-900">{application.permanentAddress}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Communication Address</label>
                <p className="text-gray-900">{application.communicationAddress}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h4 className="text-lg font-semibold mb-4">Personal Details</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Date of Birth</label>
                <p className="text-gray-900">{application.dateOfBirth}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Sex</label>
                <p className="text-gray-900">{application.sex}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Nationality</label>
                <p className="text-gray-900">{application.nationality}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Marital Status</label>
                <p className="text-gray-900">{application.maritalStatus}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Mobile</label>
                <p className="text-gray-900">{application.mobileNo}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Email</label>
                <p className="text-gray-900">{application.email}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h4 className="text-lg font-semibold mb-4">Banking Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Bank Name</label>
                <p className="text-gray-900">{application.bankName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Account No.</label>
                <p className="text-gray-900">{application.accountNo}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">IFSC</label>
                <p className="text-gray-900">{application.ifsc}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Branch</label>
                <p className="text-gray-900">{application.branch}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h4 className="text-lg font-semibold mb-4">Identity Documents</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">PAN No.</label>
                <p className="text-gray-900">{application.panNo}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Aadhar No.</label>
                <p className="text-gray-900">{application.aadharNo}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h4 className="text-lg font-semibold mb-4">Educational Qualifications</h4>
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-4 py-2 text-left text-sm font-semibold">Qualification</th>
                  <th className="border px-4 py-2 text-left text-sm font-semibold">Year</th>
                  <th className="border px-4 py-2 text-left text-sm font-semibold">% Marks</th>
                </tr>
              </thead>
              <tbody>
                {application.education.map((edu, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border px-4 py-2">{edu.level}</td>
                    <td className="border px-4 py-2">{edu.yearOfPassing}</td>
                    <td className="border px-4 py-2">{edu.percentage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h4 className="text-lg font-semibold mb-4">Declaration</h4>
            <p className="text-sm text-gray-700 leading-relaxed">I hereby declare that all statements made in the application are true, complete and correct to the best of my knowledge and belief. I understand that in the event of any information being found untrue/false/incorrect or I do not satisfy the eligibility criteria, my candidature/appointment will be cancelled/terminated, without assigning any reasons thereof.</p>
          </div>
        </div>

        {/* Right column */}
        <aside className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="text-lg font-semibold mb-4">Quick Info</h4>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Application ID</label>
                <p className="text-gray-900">{application.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Submitted</label>
                <p className="text-gray-900">{application.submittedAt}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Post</label>
                <p className="text-gray-900">{application.postAppliedFor}</p>
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
            <p className="text-gray-600 mb-4">You are about to approve this application. The candidate will be notified and can proceed to upload documents.</p>
            <div className="text-left mb-4">
              <p className="font-medium">Candidate:</p>
              <p className="text-gray-900">{application.name} — {application.postAppliedFor}</p>
              <p className="text-sm text-gray-500 mt-2">Application ID: {application.id}</p>
            </div>

            <textarea placeholder="Optional message to candidate" className="w-full input-field mb-4 p-3" />

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

            <select className="input-field w-full mb-3">
              <option>Incomplete Information</option>
              <option>Does Not Meet Requirements</option>
              <option>Duplicate Application</option>
              <option>Invalid Documents</option>
              <option>Other</option>
            </select>
            <textarea placeholder="Additional comments (required)" className="w-full input-field mb-4 p-3" />

            <div className="flex gap-3">
              <button onClick={() => setShowRejectionModal(false)} className="flex-1 border py-2 rounded">Cancel</button>
              <button onClick={() => confirmReject('Reason selected')} className="flex-1 bg-red-600 text-white py-2 rounded">Confirm Rejection</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
