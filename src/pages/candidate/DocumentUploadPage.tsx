import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, Check, X, Eye, Download, AlertCircle, CheckCircle } from 'lucide-react';

interface UploadedDocument {
  id: number;
  file: File;
  preview?: string;
}

interface DocumentType {
  id: number;
  name: string;
  required: boolean;
}

const documentTypes: DocumentType[] = [
  { id: 1, name: 'PAN Card', required: true },
  { id: 2, name: 'Aadhar Card', required: true },
  { id: 3, name: 'Passport', required: false },
  { id: 4, name: '10th Certificate', required: true },
  { id: 5, name: '12th Certificate', required: true },
  { id: 6, name: "Bachelor's Degree", required: true },
  { id: 7, name: "Master's Degree", required: false },
  { id: 8, name: 'Police Clearance Certificate', required: true },
];

export default function DocumentUploadPage() {
  const navigate = useNavigate();
  const [uploadedDocuments, setUploadedDocuments] = useState<Record<number, UploadedDocument>>({});
  const [documentStatus, setDocumentStatus] = useState<Record<number, 'not_uploaded' | 'uploaded' | 'verified'>>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleFileUpload = (docId: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      alert('Invalid file type. Please upload PDF, JPG, or PNG.');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit.');
      return;
    }

    // Store file
    let preview: string | undefined;
    if (file.type.startsWith('image/')) {
      preview = URL.createObjectURL(file);
    }

    setUploadedDocuments((prev) => ({
      ...prev,
      [docId]: { id: docId, file, preview },
    }));

    setDocumentStatus((prev) => ({
      ...prev,
      [docId]: 'uploaded',
    }));
  };

  const handleFileRemove = (docId: number) => {
    setUploadedDocuments((prev) => {
      const updated = { ...prev };
      if (updated[docId]?.preview) {
        URL.revokeObjectURL(updated[docId].preview!);
      }
      delete updated[docId];
      return updated;
    });

    setDocumentStatus((prev) => ({
      ...prev,
      [docId]: 'not_uploaded',
    }));
  };

  const handleSubmit = () => {
    // Check if all required documents are uploaded
    const requiredDocs = documentTypes.filter((d) => d.required);
    const allUploaded = requiredDocs.every((doc) => uploadedDocuments[doc.id]);

    if (!allUploaded) {
      const missing = requiredDocs
        .filter((doc) => !uploadedDocuments[doc.id])
        .map((doc) => doc.name)
        .join(', ');
      alert(`Please upload the following required documents: ${missing}`);
      return;
    }

    // Show success modal
    setShowSuccessModal(true);
  };

  const requiredUploaded = documentTypes.filter((d) => d.required).filter((d) => uploadedDocuments[d.id]).length;
  const totalRequired = documentTypes.filter((d) => d.required).length;
  const canSubmit = requiredUploaded === totalRequired;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Document Upload</h1>
        <p className="text-gray-600 mb-8">Please upload all required documents to complete your application</p>

        {/* Success Banner */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8 flex items-start gap-3">
          <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={24} />
          <div>
            <h3 className="font-semibold text-green-900">Application Approved</h3>
            <p className="text-sm text-green-800">Your application has been approved! Please upload the following documents to proceed.</p>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 flex items-start gap-3">
          <AlertCircle className="text-blue-500 flex-shrink-0 mt-0.5" size={24} />
          <p className="text-sm text-blue-800">
            <strong>Accepted formats:</strong> PDF, JPG, PNG | <strong>Maximum file size:</strong> 5MB per document
          </p>
        </div>

        {/* Document Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {documentTypes.map((doc) => {
            const uploaded = uploadedDocuments[doc.id];
            const status = documentStatus[doc.id] || 'not_uploaded';
            const fileInputId = `file-input-${doc.id}`;

            return (
              <div
                key={doc.id}
                className={`bg-white rounded-lg shadow-md p-6 border-2 border-dashed transition min-h-80 flex flex-col justify-between ${
                  status === 'not_uploaded'
                    ? 'border-gray-300 hover:border-blue-400'
                    : 'border-green-300'
                }`}
              >
                {/* Header */}
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">{doc.name}</h3>
                    {doc.required && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded font-medium">
                        Required
                      </span>
                    )}
                  </div>

                  {/* Icon Area */}
                  <div className="flex justify-center mb-4">
                    <FileText size={48} className="text-gray-400" />
                  </div>

                  {/* Status Badge */}
                  <div className="mb-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        status === 'not_uploaded'
                          ? 'bg-gray-100 text-gray-600'
                          : status === 'uploaded'
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-green-100 text-green-600'
                      }`}
                    >
                      {status === 'not_uploaded'
                        ? 'Not Uploaded'
                        : status === 'uploaded'
                        ? 'Uploaded'
                        : 'Verified'}
                    </span>
                  </div>
                </div>

                {/* Upload/File Preview Area */}
                {status === 'not_uploaded' ? (
                  <>
                    <input
                      id={fileInputId}
                      type="file"
                      accept="image/jpeg,image/png,application/pdf"
                      onChange={(e) => handleFileUpload(doc.id, e)}
                      className="hidden"
                    />
                    <label
                      htmlFor={fileInputId}
                      className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium cursor-pointer text-center flex items-center justify-center gap-2"
                    >
                      <Upload size={20} />
                      Upload
                    </label>
                  </>
                ) : (
                  <div className="space-y-3">
                    {uploaded?.preview && (
                      <img
                        src={uploaded.preview}
                        alt="Preview"
                        className="w-full max-h-32 object-cover rounded border border-gray-300"
                      />
                    )}

                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm font-medium text-gray-800 truncate">{uploaded?.file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(uploaded?.file.size || 0)}</p>
                    </div>

                    <div className="flex gap-2">
                      <button className="flex-1 p-2 hover:bg-gray-100 rounded transition flex items-center justify-center gap-1 text-gray-600">
                        <Eye size={18} />
                        View
                      </button>
                      <input
                        id={`${fileInputId}-replace`}
                        type="file"
                        accept="image/jpeg,image/png,application/pdf"
                        onChange={(e) => {
                          handleFileRemove(doc.id);
                          handleFileUpload(doc.id, e);
                        }}
                        className="hidden"
                      />
                      <label
                        htmlFor={`${fileInputId}-replace`}
                        className="flex-1 p-2 hover:bg-gray-100 rounded transition flex items-center justify-center gap-1 text-gray-600 cursor-pointer"
                      >
                        Replace
                      </label>
                      <button
                        onClick={() => handleFileRemove(doc.id)}
                        className="flex-1 p-2 hover:bg-gray-100 rounded transition flex items-center justify-center gap-1 text-red-600"
                      >
                        <X size={18} />
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Submit Button */}
        <div className="border-t bg-white p-4 mt-8 rounded-lg sticky bottom-0 flex justify-center">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`px-8 py-3 rounded-lg font-medium flex items-center gap-2 max-w-md w-full justify-center transition ${
              canSubmit
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <CheckCircle size={20} />
            Submit All Documents ({requiredUploaded}/{totalRequired} required)
          </button>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full text-center">
            <CheckCircle className="mx-auto mb-4 text-green-500" size={64} />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Documents Submitted Successfully!</h3>
            <p className="text-gray-600 mb-6">
              Your documents are now under review. You will be notified once verified.
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
