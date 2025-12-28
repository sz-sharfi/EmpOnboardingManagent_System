import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Download, ArrowLeft, CheckCircle, Clock, XCircle } from 'lucide-react';
import supabase from '../../utils/supabaseClient';

interface DocumentData {
  id: string;
  document_type: string;
  storage_path: string;
  file_size_bytes: number;
  verification_status: string;
  created_at: string;
  verified_at: string | null;
  rejection_reason: string | null;
}

export default function DocumentUploadPage() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      
      // Get authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/candidate/login');
        return;
      }

      // Get user's application
      const { data: appData, error: appError } = await supabase
        .from('applications')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (appError || !appData) {
        console.error('Error fetching application:', appError);
        return;
      }

      // Fetch documents for this application
      const { data: docsData, error: docsError } = await supabase
        .from('documents')
        .select('*')
        .eq('app_id', appData.id)
        .order('created_at', { ascending: false });

      if (docsError) {
        console.error('Error fetching documents:', docsError);
        return;
      }

      if (docsData) {
        setDocuments(docsData);
        console.log('Fetched documents:', docsData);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownloadDocument = async (doc: DocumentData) => {
    try {
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
    } catch (error: any) {
      console.error('Error downloading document:', error);
      alert(`Failed to download document: ${error.message || 'Unknown error'}`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="text-green-500" size={24} />;
      case 'rejected':
        return <XCircle className="text-red-500" size={24} />;
      default:
        return <Clock className="text-yellow-500" size={24} />;
    }
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      verified: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm p-4 mb-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/candidate/dashboard')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowLeft size={20} />
            Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-gray-900">My Documents</h1>
          <div className="w-24"></div> {/* Spacer for centering */}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 pb-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your documents...</p>
          </div>
        ) : (
          <>
            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <FileText className="text-blue-500 flex-shrink-0 mt-0.5" size={24} />
              <div>
                <h3 className="font-semibold text-blue-900">Document Overview</h3>
                <p className="text-sm text-blue-800">
                  All documents were uploaded through your application form. 
                  You can view and download them here.
                </p>
              </div>
            </div>

            {/* Documents Grid */}
            {documents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="bg-white rounded-lg shadow-md p-6 border-2 transition hover:shadow-lg"
                  >
                    {/* Document Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3 flex-1">
                        {getStatusIcon(doc.verification_status)}
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-800 mb-1">
                            {doc.document_type}
                          </h3>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(doc.verification_status)}`}
                          >
                            {doc.verification_status.charAt(0).toUpperCase() + doc.verification_status.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Document Details */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">File Size:</span>
                        <span className="font-medium text-gray-900">
                          {formatFileSize(doc.file_size_bytes)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Uploaded:</span>
                        <span className="font-medium text-gray-900">
                          {formatDate(doc.created_at)}
                        </span>
                      </div>
                      {doc.verified_at && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Verified:</span>
                          <span className="font-medium text-gray-900">
                            {formatDate(doc.verified_at)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Rejection Reason */}
                    {doc.rejection_reason && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-xs font-medium text-red-800 mb-1">Rejection Reason:</p>
                        <p className="text-sm text-red-700">{doc.rejection_reason}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <button
                      onClick={() => handleDownloadDocument(doc)}
                      className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2"
                    >
                      <Download size={18} />
                      Download Document
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-lg shadow">
                <FileText className="mx-auto text-gray-300 mb-4" size={64} />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Documents Found</h3>
                <p className="text-gray-500 mb-6">
                  You haven't uploaded any documents yet through your application form.
                </p>
                <button
                  onClick={() => navigate('/candidate/apply')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Go to Application Form
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}