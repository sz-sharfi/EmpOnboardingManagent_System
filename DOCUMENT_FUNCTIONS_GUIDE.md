# Document Storage Functions Documentation

Complete guide to document upload, management, and verification functions.

---

## 📋 Overview

The [src/lib/documents.ts](src/lib/documents.ts) module provides comprehensive document management:
- ✅ File upload to Supabase Storage
- ✅ Document metadata management
- ✅ Signed URL generation for secure access
- ✅ Admin verification/rejection workflow
- ✅ Document replacement
- ✅ File validation and security
- ✅ Batch operations

---

## 🗂️ Storage Configuration

### Storage Bucket
```typescript
STORAGE_BUCKET = 'candidate-documents'
```

### File Path Structure
```
{userId}/{applicationId}/{documentType}/{timestamp}_{filename}

Example:
550e8400-e29b-41d4-a716-446655440000/
└── app-123/
    ├── pan_card/
    │   └── 1703945678901_pan_card.pdf
    ├── aadhar_card/
    │   ├── 1703945679012_aadhar_front.jpg
    │   └── 1703945679123_aadhar_back.jpg
    └── tenth_certificate/
        └── 1703945680234_10th_marksheet.pdf
```

### File Restrictions
- **Max Size:** 5MB
- **Allowed Types:** PDF, JPG, JPEG, PNG
- **Naming:** Auto-sanitized (lowercase, special chars replaced with `_`)

### Document Types
```typescript
DOCUMENT_TYPES = {
  PAN_CARD: 'pan_card',
  AADHAR_CARD: 'aadhar_card',
  PASSPORT: 'passport',
  TENTH_CERTIFICATE: 'tenth_certificate',
  TWELFTH_CERTIFICATE: 'twelfth_certificate',
  BACHELORS_DEGREE: 'bachelors_degree',
  MASTERS_DEGREE: 'masters_degree',
  POLICE_CLEARANCE: 'police_clearance',
  PHOTO: 'photo',
  SIGNATURE: 'signature',
  OTHER: 'other'
}
```

---

## 📄 TypeScript Interfaces

### UploadDocumentParams
```typescript
interface UploadDocumentParams {
  applicationId: string
  userId: string
  documentType: string
  file: File
}
```

### DocumentRecord
```typescript
interface DocumentRecord {
  id: string
  application_id: string
  user_id: string
  document_type: string
  file_name: string
  file_path: string
  file_size: number
  file_type: string
  status: 'uploaded' | 'verified' | 'rejected'
  verified_by?: string | null
  verified_at?: string | null
  rejection_reason?: string | null
  is_required: boolean
  uploaded_at: string
}
```

### ReplaceDocumentParams
```typescript
interface ReplaceDocumentParams {
  documentId: string
  oldFilePath: string
  newFile: File
  applicationId: string
  userId: string
  documentType: string
}
```

---

## 🚀 Functions Reference

### **Upload Functions**

#### 1. `uploadDocument(params)`

Upload a single document to storage and create database record.

**Parameters:**
```typescript
params: UploadDocumentParams
```

**Returns:** `Promise<DocumentRecord>`

**Validation:**
- File size ≤ 5MB
- MIME type in allowed list
- Unique filename with timestamp

**Example:**
```typescript
import { uploadDocument, DOCUMENT_TYPES } from '../lib/documents'

const fileInput = document.querySelector('input[type="file"]')
const file = fileInput.files[0]

const document = await uploadDocument({
  applicationId: 'app-123',
  userId: user.id,
  documentType: DOCUMENT_TYPES.PAN_CARD,
  file: file
})

console.log('Uploaded:', document.file_path)
```

---

#### 2. `uploadMultipleDocuments(documents)`

Upload multiple documents at once.

**Parameters:**
```typescript
documents: UploadDocumentParams[]
```

**Returns:** `Promise<DocumentRecord[]>`

**Example:**
```typescript
const uploads = [
  { applicationId, userId, documentType: 'pan_card', file: panFile },
  { applicationId, userId, documentType: 'aadhar_card', file: aadharFile }
]

const results = await uploadMultipleDocuments(uploads)
console.log(`Uploaded ${results.length} documents`)
```

---

### **Retrieval Functions**

#### 3. `getDocumentUrl(filePath)`

Get public URL for a document (only works if bucket is public).

**Parameters:**
```typescript
filePath: string
```

**Returns:** `string` (URL)

**Note:** For private buckets, use `getDocumentSignedUrl()` instead.

**Example:**
```typescript
const url = getDocumentUrl(document.file_path)
console.log('Public URL:', url)
```

---

#### 4. `getDocumentSignedUrl(filePath, expiresIn?)`

Create temporary signed URL for private document access.

**Parameters:**
```typescript
filePath: string
expiresIn?: number  // Seconds, default: 3600 (1 hour)
```

**Returns:** `Promise<string>` (Signed URL)

**Example:**
```typescript
// 1 hour expiry (default)
const url = await getDocumentSignedUrl(document.file_path)

// Custom expiry (24 hours)
const url24h = await getDocumentSignedUrl(document.file_path, 86400)

// Use in img tag
<img src={url} alt="Document" />
```

---

#### 5. `getApplicationDocuments(applicationId)`

Get all documents for an application.

**Parameters:**
```typescript
applicationId: string
```

**Returns:** `Promise<DocumentRecord[]>`

**Example:**
```typescript
const documents = await getApplicationDocuments('app-123')

documents.forEach(doc => {
  console.log(`${doc.document_type}: ${doc.status}`)
})
```

---

#### 6. `getUserDocuments(userId)`

Get all documents for a user across all applications.

**Parameters:**
```typescript
userId: string
```

**Returns:** `Promise<DocumentRecord[]>`

**Example:**
```typescript
const allDocs = await getUserDocuments(user.id)
console.log(`User has ${allDocs.length} total documents`)
```

---

#### 7. `getDocumentById(documentId)`

Get a specific document by ID.

**Parameters:**
```typescript
documentId: string
```

**Returns:** `Promise<DocumentRecord | null>`

**Example:**
```typescript
const doc = await getDocumentById('doc-123')
if (doc) {
  console.log('Document found:', doc.file_name)
}
```

---

### **Deletion Functions**

#### 8. `deleteDocument(documentId, filePath)`

Delete document from storage and database.

**Parameters:**
```typescript
documentId: string
filePath: string
```

**Returns:** `Promise<{ success: boolean }>`

**Example:**
```typescript
const result = await deleteDocument(doc.id, doc.file_path)
if (result.success) {
  console.log('Document deleted successfully')
}
```

---

#### 9. `deleteMultipleDocuments(documents)`

Delete multiple documents at once.

**Parameters:**
```typescript
documents: Array<{ documentId: string; filePath: string }>
```

**Returns:** `Promise<{ success: boolean }>`

**Example:**
```typescript
const toDelete = documents.map(d => ({
  documentId: d.id,
  filePath: d.file_path
}))

await deleteMultipleDocuments(toDelete)
```

---

### **Admin Verification Functions**

#### 10. `verifyDocument(documentId, adminId)`

Verify a document (admin function).

**Parameters:**
```typescript
documentId: string
adminId: string
```

**Returns:** `Promise<DocumentRecord>`

**Side Effects:**
- Status → 'verified'
- Sets `verified_by` and `verified_at`
- Clears `rejection_reason`

**Example:**
```typescript
const verified = await verifyDocument(doc.id, admin.id)
console.log('Verified at:', verified.verified_at)
```

---

#### 11. `rejectDocument(documentId, adminId, reason)`

Reject a document (admin function).

**Parameters:**
```typescript
documentId: string
adminId: string
reason: string
```

**Returns:** `Promise<DocumentRecord>`

**Side Effects:**
- Status → 'rejected'
- Sets `verified_by`, `verified_at`, and `rejection_reason`

**Example:**
```typescript
const rejected = await rejectDocument(
  doc.id,
  admin.id,
  'Image is blurry, please reupload'
)
```

---

#### 12. `verifyMultipleDocuments(documentIds, adminId)`

Verify multiple documents at once.

**Parameters:**
```typescript
documentIds: string[]
adminId: string
```

**Returns:** `Promise<DocumentRecord[]>`

**Example:**
```typescript
const ids = ['doc-1', 'doc-2', 'doc-3']
const verified = await verifyMultipleDocuments(ids, admin.id)
console.log(`Verified ${verified.length} documents`)
```

---

### **Document Replacement Functions**

#### 13. `replaceDocument(params)`

Replace an existing document with a new file.

**Parameters:**
```typescript
params: ReplaceDocumentParams
```

**Returns:** `Promise<DocumentRecord>`

**Process:**
1. Upload new file
2. Update database record
3. Delete old file
4. Reset verification status

**Example:**
```typescript
const newFile = fileInput.files[0]

const updated = await replaceDocument({
  documentId: doc.id,
  oldFilePath: doc.file_path,
  newFile: newFile,
  applicationId: doc.application_id,
  userId: doc.user_id,
  documentType: doc.document_type
})

console.log('Replaced with:', updated.file_name)
```

---

### **Download Functions**

#### 14. `downloadDocument(filePath)`

Download document as Blob.

**Parameters:**
```typescript
filePath: string
```

**Returns:** `Promise<Blob>`

**Example:**
```typescript
const blob = await downloadDocument(doc.file_path)
const url = URL.createObjectURL(blob)
// Use url in <img> or <a> tag
```

---

#### 15. `triggerDocumentDownload(filePath, filename)`

Trigger browser download for a document.

**Parameters:**
```typescript
filePath: string
filename: string
```

**Returns:** `Promise<void>`

**Example:**
```typescript
await triggerDocumentDownload(doc.file_path, doc.file_name)
// Browser will download the file
```

---

### **Statistics Functions**

#### 16. `getDocumentStats(applicationId)`

Get document statistics for an application.

**Parameters:**
```typescript
applicationId: string
```

**Returns:**
```typescript
Promise<{
  total: number
  uploaded: number
  verified: number
  rejected: number
}>
```

**Example:**
```typescript
const stats = await getDocumentStats('app-123')
console.log(`Verified: ${stats.verified}/${stats.total}`)
```

---

## 🎯 Usage Examples

### Example 1: Document Upload with Preview

```typescript
import { uploadDocument, getDocumentSignedUrl } from '../lib/documents'

function DocumentUploader({ applicationId, userId, documentType }) {
  const [uploading, setUploading] = useState(false)
  const [document, setDocument] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)
    try {
      // Upload document
      const doc = await uploadDocument({
        applicationId,
        userId,
        documentType,
        file
      })
      
      setDocument(doc)

      // Get preview URL
      const url = await getDocumentSignedUrl(doc.file_path)
      setPreviewUrl(url)
      
      alert('Document uploaded successfully!')
    } catch (error) {
      alert('Upload failed: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <input 
        type="file" 
        onChange={handleUpload}
        accept=".pdf,.jpg,.jpeg,.png"
        disabled={uploading}
      />
      
      {uploading && <p>Uploading...</p>}
      
      {previewUrl && (
        <div>
          <h3>Preview:</h3>
          {document.file_type.startsWith('image/') ? (
            <img src={previewUrl} alt="Preview" />
          ) : (
            <a href={previewUrl} target="_blank">View PDF</a>
          )}
        </div>
      )}
    </div>
  )
}
```

---

### Example 2: Document List with Actions

```typescript
import { 
  getApplicationDocuments, 
  getDocumentSignedUrl,
  deleteDocument,
  replaceDocument 
} from '../lib/documents'

function DocumentList({ applicationId, userId, isAdmin }) {
  const [documents, setDocuments] = useState([])

  useEffect(() => {
    loadDocuments()
  }, [applicationId])

  const loadDocuments = async () => {
    const docs = await getApplicationDocuments(applicationId)
    setDocuments(docs)
  }

  const handleView = async (doc) => {
    const url = await getDocumentSignedUrl(doc.file_path)
    window.open(url, '_blank')
  }

  const handleDelete = async (doc) => {
    if (!confirm('Delete this document?')) return
    
    await deleteDocument(doc.id, doc.file_path)
    loadDocuments()
  }

  const handleReplace = async (doc, newFile) => {
    await replaceDocument({
      documentId: doc.id,
      oldFilePath: doc.file_path,
      newFile,
      applicationId,
      userId,
      documentType: doc.document_type
    })
    loadDocuments()
  }

  return (
    <div>
      <h2>Documents ({documents.length})</h2>
      {documents.map(doc => (
        <div key={doc.id} className="document-item">
          <div>
            <strong>{doc.document_type}</strong>
            <span className={`status-${doc.status}`}>
              {doc.status}
            </span>
          </div>
          <div>
            <button onClick={() => handleView(doc)}>View</button>
            {!isAdmin && doc.status !== 'verified' && (
              <>
                <button onClick={() => handleDelete(doc)}>Delete</button>
                <input 
                  type="file" 
                  onChange={(e) => handleReplace(doc, e.target.files[0])}
                />
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
```

---

### Example 3: Admin Document Review

```typescript
import { 
  getApplicationDocuments,
  verifyDocument,
  rejectDocument,
  getDocumentSignedUrl
} from '../lib/documents'

function DocumentReview({ applicationId, adminId }) {
  const [documents, setDocuments] = useState([])
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')

  useEffect(() => {
    loadDocuments()
  }, [applicationId])

  const loadDocuments = async () => {
    const docs = await getApplicationDocuments(applicationId)
    setDocuments(docs)
  }

  const handleSelect = async (doc) => {
    setSelectedDoc(doc)
    const url = await getDocumentSignedUrl(doc.file_path, 7200) // 2 hours
    setPreviewUrl(url)
  }

  const handleVerify = async () => {
    if (!selectedDoc) return
    
    await verifyDocument(selectedDoc.id, adminId)
    alert('Document verified!')
    loadDocuments()
  }

  const handleReject = async () => {
    if (!selectedDoc) return
    
    const reason = prompt('Rejection reason:')
    if (!reason) return
    
    await rejectDocument(selectedDoc.id, adminId, reason)
    alert('Document rejected')
    loadDocuments()
  }

  return (
    <div className="review-panel">
      <div className="document-list">
        {documents.map(doc => (
          <div 
            key={doc.id}
            onClick={() => handleSelect(doc)}
            className={selectedDoc?.id === doc.id ? 'selected' : ''}
          >
            {doc.document_type} - {doc.status}
          </div>
        ))}
      </div>

      <div className="preview-panel">
        {previewUrl && (
          <>
            <iframe src={previewUrl} width="100%" height="600px" />
            
            {selectedDoc?.status === 'uploaded' && (
              <div>
                <button onClick={handleVerify}>✓ Verify</button>
                <button onClick={handleReject}>✗ Reject</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
```

---

### Example 4: Document Progress Tracker

```typescript
import { getDocumentStats } from '../lib/documents'

function DocumentProgress({ applicationId }) {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    loadStats()
  }, [applicationId])

  const loadStats = async () => {
    const statistics = await getDocumentStats(applicationId)
    setStats(statistics)
  }

  if (!stats) return <div>Loading...</div>

  const progress = stats.total > 0 
    ? (stats.verified / stats.total) * 100 
    : 0

  return (
    <div className="progress-tracker">
      <h3>Document Verification Progress</h3>
      
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="stats">
        <div>Total: {stats.total}</div>
        <div>Verified: {stats.verified}</div>
        <div>Pending: {stats.uploaded}</div>
        <div>Rejected: {stats.rejected}</div>
      </div>
    </div>
  )
}
```

---

## 🔒 Security Features

### 1. File Validation
```typescript
// Automatic validation on upload
- Max file size: 5MB
- Allowed types: PDF, JPG, PNG
- Filename sanitization
```

### 2. Storage Security
```typescript
// Storage RLS policies enforce:
- Users can only upload to their own folders
- Users can only view their own documents
- Admins can view all documents
```

### 3. Signed URLs
```typescript
// Private document access
const url = await getDocumentSignedUrl(filePath, 3600)
// URL expires after 1 hour
```

### 4. Database RLS
```typescript
// Row Level Security ensures:
- Users can only see their own documents
- Admins can see all documents
- Document verification requires admin role
```

---

## ✅ Best Practices

1. **Always validate files on client side:**
   ```typescript
   if (file.size > 5 * 1024 * 1024) {
     alert('File too large (max 5MB)')
     return
   }
   ```

2. **Use signed URLs for private documents:**
   ```typescript
   // ✅ Good - temporary access
   const url = await getDocumentSignedUrl(filePath)
   
   // ❌ Bad - public URL won't work for private buckets
   const url = getDocumentUrl(filePath)
   ```

3. **Handle upload errors gracefully:**
   ```typescript
   try {
     await uploadDocument(params)
   } catch (error) {
     if (error.message.includes('File size')) {
       alert('File is too large')
     } else {
       alert('Upload failed, please try again')
     }
   }
   ```

4. **Clean up old files when replacing:**
   ```typescript
   // replaceDocument() automatically handles this
   await replaceDocument(params) // Deletes old file
   ```

5. **Use batch operations for multiple documents:**
   ```typescript
   // ✅ Good - parallel upload
   await uploadMultipleDocuments(files)
   
   // ❌ Bad - sequential
   for (const file of files) {
     await uploadDocument(file)
   }
   ```

---

## 🔗 Related Documentation

- [Storage Buckets Setup](STORAGE_BUCKETS_GUIDE.md)
- [Application Functions](APPLICATION_FUNCTIONS_GUIDE.md)
- [Authentication Guide](AUTHENTICATION_GUIDE.md)
- [Database Schema](supabase/migrations/complete_schema.sql)
