import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Home, FileText, BarChart, Settings, Bell, Download, Eye, ZoomIn, ZoomOut, RotateCw, CheckCircle, XCircle, X } from 'lucide-react';
import supabase from '../../utils/supabaseClient';

// Storage bucket constant - MUST match Supabase storage bucket name
const DOCUMENTS_BUCKET = 'candidate-documents' as const;

interface Document {
  id: string;
  app_id: string;
  document_type: string;
  storage_path: string;
  file_size_bytes: number;
  verification_status: string;
  verified_at: string | null;
  rejection_reason: string | null;
  created_at: string;
}

interface Application {
  id: string;
  form_data: {
    fullName?: string;
    postAppliedFor?: string;
  };
  profiles: {
    email: string;
    full_name: string;
  };
}

export default function DocumentReviewPage() {
  const navigate = useNavigate();
  const { appId } = useParams<{ appId: string }>();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentDoc, setCurrentDoc] = useState<Document | null>(null);
  const [currentDocUrl, setCurrentDocUrl] = useState<string>('');
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [docToReject, setDocToReject] = useState<Document | null>(null);

  useEffect(() => {
    if (appId) {
      fetchDocuments();
      fetchApplication();
    } else {
      fetchAllDocuments();
    }
  }, [appId]);

  const fetchApplication = async () => {
    if (!appId) return;
    
    try {
      const { data, error } = await supabase
        .from('candidate_applications')
        .select(`
          *,
          profiles (
            email,
            full_name
          )
        `)
        .eq('id', appId)
        .single();

      if (error) throw error;
      setApplication(data);
    } catch (error) {
      console.error('Error fetching application:', error);
    }
  };

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (appId) {
        query = query.eq('app_id', appId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllDocuments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('verification_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = async (doc: Document) => {
    try {
      const { data } = await supabase.storage
        .from(DOCUMENTS_BUCKET)
        .createSignedUrl(doc.storage_path, 3600);

      if (data?.signedUrl) {
        setCurrentDocUrl(data.signedUrl);
        setCurrentDoc(doc);
        setViewerOpen(true);
        setZoom(100);
        setRotation(0);
      }
    } catch (error) {
      console.error('Error loading document:', error);
      alert('Failed to load document');
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const { data } = await supabase.storage
        .from(DOCUMENTS_BUCKET)
        .createSignedUrl(doc.storage_path, 60);

      if (data?.signedUrl) {
        const a = document.createElement('a');
        a.href = data.signedUrl;
        a.download = doc.document_type;
        a.click();
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document');
    }
  };

  const handleVerify = async (doc: Document) => {
    try {
      const { error } = await supabase.rpc('verify_document', {
        p_doc_id: doc.id,
        p_verified: true,
        p_rejection_reason: null
      });

      if (error) throw error;
      
      alert('Document verified successfully!');
      fetchDocuments();
      setViewerOpen(false);
    } catch (error) {
      console.error('Error verifying document:', error);
      alert('Failed to verify document');
    }
  };

  const openRejectModal = (doc: Document) => {
    setDocToReject(doc);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!docToReject || !rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      const { error } = await supabase.rpc('verify_document', {
        p_doc_id: docToReject.id,
        p_verified: false,
        p_rejection_reason: rejectionReason
      });

      if (error) throw error;
      
      alert('Document rejected. Candidate will be notified.');
      fetchDocuments();
      setShowRejectModal(false);
      setViewerOpen(false);
      setDocToReject(null);
    } catch (error) {
      console.error('Error rejecting document:', error);
      alert('Failed to reject document');
    }
  };

  const handleVerifyAll = async () => {
    if (!confirm('Are you sure you want to verify all pending documents?')) return;

    const pendingDocs = documents.filter(d => d.verification_status === 'pending');
    
    try {
      for (const doc of pendingDocs) {
        await supabase.rpc('verify_document', {
          p_doc_id: doc.id,
          p_verified: true,
          p_rejection_reason: null
        });
      }
      
      alert(`${pendingDocs.length} documents verified successfully!`);
      fetchDocuments();
    } catch (error) {
      console.error('Error verifying all documents:', error);
      alert('Failed to verify all documents');
    }
  };

  const handleDownloadAll = async () => {
    alert('Downloading all documents as ZIP... (Feature in development)');
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-gray-100 text-gray-800',
      verified: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors[status] || colors.pending}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const verifiedCount = documents.filter(d => d.verification_status === 'verified').length;
  const pendingCount = documents.filter(d => d.verification_status === 'pending').length;
  const rejectedCount = documents.filter(d => d.verification_status === 'rejected').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Nav */}
      <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Home size={22} className="text-blue-600" />
            <span className="font-bold">Admin Portal</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Bell size={20} />
            </div>
            <div className="relative">
              <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-200" />
                <span className="font-medium">Admin User</span>
              </button>
              {profileOpen && (
                <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 w-48">
                  <button className="w-full text-left px-4 py-2 hover:bg-gray-50">Profile</button>
                  <button onClick={() => navigate('/admin/login')} className="w-full text-left px-4 py-2 hover:bg-gray-50">Logout</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className="fixed top-16 left-0 h-[calc(100vh-64px)] w-64 bg-white border-r p-4 hidden md:block">
        <nav className="space-y-2">
          <Link to="/admin/dashboard" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded">
            <Home size={20} />
            <span>Dashboard</span>
          </Link>
          <Link to="/admin/applications" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded">
            <FileText size={20} />
            <span>Applications</span>
          </Link>
          <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-600 rounded">
            <FileText size={20} />
            <span className="font-medium">Document Review</span>
          </div>
          <Link to="/admin/reports" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded">
            <BarChart size={20} />
            <span>Reports</span>
          </Link>
          <Link to="/admin/settings" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded">
            <Settings size={20} />
            <span>Settings</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 pt-20 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Review Documents
                  {application && ` - ${application.form_data.fullName || application.profiles.full_name}`}
                </h1>
                <p className="text-gray-600 mt-1">
                  {documents.length} document{documents.length !== 1 ? 's' : ''} uploaded
                </p>
              </div>
              <div className="flex items-center gap-2">
                {pendingCount > 0 && (
                  <button onClick={handleVerifyAll} className="btn-primary flex items-center gap-2">
                    <CheckCircle size={18} />
                    Verify All
                  </button>
                )}
                <button onClick={handleDownloadAll} className="btn-secondary flex items-center gap-2">
                  <Download size={18} />
                  Download All
                </button>
                {appId && (
                  <button onClick={() => navigate(`/admin/applications/${appId}`)} className="btn-secondary">
                    Back to Application
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Status Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Verified</p>
                  <p className="text-2xl font-bold text-green-600">{verifiedCount}</p>
                </div>
                <CheckCircle size={32} className="text-green-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
                </div>
                <FileText size={32} className="text-yellow-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Rejected</p>
                  <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
                </div>
                <XCircle size={32} className="text-red-600" />
              </div>
            </div>
          </div>

          {/* Documents Grid */}
          {loading ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading documents...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <FileText size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No documents uploaded</h3>
              <p className="text-gray-600">Documents will appear here once uploaded by the candidate.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc) => (
                <div key={doc.id} className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FileText size={20} className="text-blue-600" />
                      <h3 className="font-medium text-gray-900 text-sm">{doc.document_type}</h3>
                    </div>
                    {getStatusBadge(doc.verification_status)}
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Size:</span>
                      <span className="text-gray-900">{formatFileSize(doc.file_size_bytes)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Uploaded:</span>
                      <span className="text-gray-900">{new Date(doc.created_at).toLocaleDateString()}</span>
                    </div>
                    {doc.verified_at && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Verified:</span>
                        <span className="text-gray-900">{new Date(doc.verified_at).toLocaleDateString()}</span>
                      </div>
                    )}
                    {doc.rejection_reason && (
                      <div className="text-sm">
                        <span className="text-red-600 font-medium">Reason:</span>
                        <p className="text-gray-700 mt-1">{doc.rejection_reason}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewDocument(doc)}
                      className="flex-1 btn-secondary text-sm flex items-center justify-center gap-2"
                    >
                      <Eye size={14} />
                      View
                    </button>
                    <button
                      onClick={() => handleDownload(doc)}
                      className="p-2 hover:bg-gray-100 rounded"
                      title="Download"
                    >
                      <Download size={16} />
                    </button>
                    {doc.verification_status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleVerify(doc)}
                          className="p-2 hover:bg-green-50 rounded text-green-600"
                          title="Verify"
                        >
                          <CheckCircle size={16} />
                        </button>
                        <button
                          onClick={() => openRejectModal(doc)}
                          className="p-2 hover:bg-red-50 rounded text-red-600"
                          title="Reject"
                        >
                          <XCircle size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Document Viewer Modal */}
      {viewerOpen && currentDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Viewer Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-medium text-gray-900">{currentDoc.document_type}</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => setZoom(z => Math.max(50, z - 10))} className="p-2 hover:bg-gray-100 rounded">
                  <ZoomOut size={18} />
                </button>
                <span className="text-sm text-gray-600">{zoom}%</span>
                <button onClick={() => setZoom(z => Math.min(200, z + 10))} className="p-2 hover:bg-gray-100 rounded">
                  <ZoomIn size={18} />
                </button>
                <button onClick={() => setRotation(r => (r + 90) % 360)} className="p-2 hover:bg-gray-100 rounded">
                  <RotateCw size={18} />
                </button>
                <button onClick={() => handleDownload(currentDoc)} className="p-2 hover:bg-gray-100 rounded">
                  <Download size={18} />
                </button>
                <button onClick={() => setViewerOpen(false)} className="p-2 hover:bg-gray-100 rounded">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Viewer Content */}
            <div className="flex-1 overflow-auto p-4 bg-gray-100">
              <div className="flex items-center justify-center min-h-full">
                <img
                  src={currentDocUrl}
                  alt={currentDoc.document_type}
                  style={{
                    transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                    transition: 'transform 0.2s'
                  }}
                  className="max-w-full h-auto"
                />
              </div>
            </div>

            {/* Viewer Actions */}
            {currentDoc.verification_status === 'pending' && (
              <div className="flex items-center justify-end gap-2 p-4 border-t">
                <button onClick={() => setViewerOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button onClick={() => openRejectModal(currentDoc)} className="btn-danger flex items-center gap-2">
                  <XCircle size={18} />
                  Reject
                </button>
                <button onClick={() => handleVerify(currentDoc)} className="btn-primary flex items-center gap-2">
                  <CheckCircle size={18} />
                  Verify Document
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && docToReject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="text-red-600" size={20} />
              </div>
              <div>
                <h3 className="font-bold text-lg">Reject Document</h3>
                <p className="text-sm text-gray-600">{docToReject.document_type}</p>
              </div>
            </div>

            <p className="text-gray-700 mb-4">
              Please provide a reason for rejection. The candidate will be notified.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                className="input-field w-full h-24"
                placeholder="e.g., Image is unclear, document is expired, incorrect document type..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setDocToReject(null);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button onClick={handleReject} className="btn-danger">
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
