# DATABASE STRUCTURE & DATA FLOW
================================================================================

## 📊 TABLE RELATIONSHIPS

```
┌─────────────────┐
│  auth.users     │  ← Supabase Auth (automatic)
│  - id           │
│  - email        │
│  - password     │
└────────┬────────┘
         │
         │ (1:1)
         ▼
┌─────────────────┐
│  profiles       │  ← User Profile Information
│  - id           │  (Primary Key, Foreign Key → auth.users.id)
│  - email        │
│  - full_name    │
│  - role         │  ('candidate' or 'admin')
│  - avatar_url   │
└────────┬────────┘
         │
         │ (1:1)
         ▼
┌─────────────────┐
│  applications   │  ← Application Form Data
│  - id           │  (Primary Key)
│  - user_id      │  (Foreign Key → auth.users.id)
│  - name         │
│  - email        │
│  - mobile_no    │
│  - pan_no       │
│  - aadhar_no    │
│  - education    │  (JSON array)
│  - status       │  ('draft', 'submitted', 'approved', etc.)
└────────┬────────┘
         │
         │ (1:Many)
         ▼
┌─────────────────┐
│  documents      │  ← Uploaded Files
│  - id           │  (Primary Key)
│  - application_id│  (Foreign Key → applications.id)
│  - user_id      │  (Foreign Key → auth.users.id)
│  - document_type│  ('PAN_CARD', 'AADHAR_CARD', etc.)
│  - file_name    │
│  - file_path    │  (Path in Storage bucket)
│  - file_size    │
│  - status       │  ('pending', 'verified', 'rejected')
└─────────────────┘
```

---

## 🔄 DATA FLOW: User Journey

### **Step 1: User Registration**
**User Action:** Sign up at `/candidate/signup`
**Data Stored:**
- `auth.users` table (automatic by Supabase)
  ```sql
  id: uuid
  email: "candidate@example.com"
  encrypted_password: [hashed]
  ```
- `profiles` table (via trigger `on_auth_user_created`)
  ```sql
  id: [same as auth.users.id]
  email: "candidate@example.com"
  full_name: "John Doe"
  role: "candidate"
  ```

**Query to see your profile:**
```sql
SELECT * FROM profiles WHERE email = 'sz.sharfi8541@gmail.com';
```

---

### **Step 2: Fill Application Form**
**User Action:** Fill form at `/candidate/application-form`
**Data Stored:**
- `applications` table
  ```sql
  id: uuid (e.g., "550e8400-e29b-41d4-a716-446655440000")
  user_id: [references profiles.id]
  post_applied_for: "Software Engineer"
  name: "John Doe"
  email: "candidate@example.com"
  mobile_no: "9876543210"
  pan_no: "ABCDE1234F"
  aadhar_no: "123456789012"
  education: [{"level": "10th", "year": "2010", ...}, ...]
  status: "draft"  → Changes to "submitted" when submitted
  ```

**Query to see application:**
```sql
SELECT 
  a.id,
  a.name,
  a.email,
  a.status,
  p.full_name as candidate_name
FROM applications a
JOIN profiles p ON a.user_id = p.id
WHERE a.user_id = (SELECT id FROM profiles WHERE email = 'sz.sharfi8541@gmail.com');
```

---

### **Step 3: Upload Documents**
**User Action:** Upload files at `/candidate/document-upload`
**Data Stored:**

**A) In `documents` table (metadata):**
```sql
id: uuid (e.g., "660e8400-e29b-41d4-a716-446655440001")
application_id: [references applications.id]
user_id: [references profiles.id]
document_type: "PAN_CARD"
file_name: "john_pan.pdf"
file_path: "candidate-documents/[user_id]/[file_name]"
file_size: 245678
mime_type: "application/pdf"
status: "pending"  → Changes to "verified" by admin
```

**B) In Storage bucket (actual file):**
```
Storage Location:
└── candidate-documents/
    └── [user_id]/
        ├── john_pan.pdf
        ├── john_aadhar.pdf
        ├── john_10th_certificate.pdf
        └── john_12th_certificate.pdf
```

**Query to see which documents belong to whom:**
```sql
SELECT 
  d.id,
  d.document_type,
  d.file_name,
  d.file_size,
  d.status,
  a.name as candidate_name,
  a.email as candidate_email,
  p.full_name as profile_name
FROM documents d
JOIN applications a ON d.application_id = a.id
JOIN profiles p ON d.user_id = p.id
ORDER BY d.created_at DESC;
```

**To find all documents for a specific user:**
```sql
SELECT 
  d.document_type,
  d.file_name,
  d.status,
  d.created_at
FROM documents d
WHERE d.user_id = (SELECT id FROM profiles WHERE email = 'sz.sharfi8541@gmail.com');
```

---

## 🔍 IDENTIFYING DOCUMENTS

### **Method 1: By User Email**
```sql
SELECT 
  p.email as user_email,
  p.full_name,
  a.name as application_name,
  d.document_type,
  d.file_name,
  d.file_path
FROM documents d
JOIN profiles p ON d.user_id = p.id
JOIN applications a ON d.application_id = a.id
WHERE p.email = 'candidate@example.com';
```

### **Method 2: By Application ID**
```sql
SELECT 
  d.document_type,
  d.file_name,
  d.status,
  d.created_at
FROM documents d
WHERE d.application_id = 'YOUR_APPLICATION_ID';
```

### **Method 3: By Document Type**
```sql
SELECT 
  p.full_name,
  p.email,
  d.file_name,
  d.status
FROM documents d
JOIN profiles p ON d.user_id = p.id
WHERE d.document_type = 'PAN_CARD';
```

---

## 📋 COMPLETE USER DATA QUERY

**To see ALL data for a specific user:**
```sql
SELECT 
  '=== USER PROFILE ===' as section,
  p.id as profile_id,
  p.email,
  p.full_name,
  p.role
FROM profiles p
WHERE p.email = 'sz.sharfi8541@gmail.com'

UNION ALL

SELECT 
  '=== APPLICATION ===' as section,
  a.id::text as profile_id,
  a.email,
  a.name,
  a.status
FROM applications a
WHERE a.user_id = (SELECT id FROM profiles WHERE email = 'sz.sharfi8541@gmail.com')

UNION ALL

SELECT 
  '=== DOCUMENTS ===' as section,
  d.id::text,
  d.document_type,
  d.file_name,
  d.status
FROM documents d
WHERE d.user_id = (SELECT id FROM profiles WHERE email = 'sz.sharfi8541@gmail.com');
```

---

## 📂 STORAGE STRUCTURE

### **Bucket: candidate-documents**
```
candidate-documents/
├── [user-id-1]/
│   ├── pan_card.pdf
│   ├── aadhar_card.pdf
│   ├── 10th_certificate.pdf
│   └── 12th_certificate.pdf
├── [user-id-2]/
│   ├── pan_card.pdf
│   └── aadhar_card.pdf
└── [user-id-3]/
    └── resume.pdf
```

### **Bucket: profile-photos**
```
profile-photos/
├── [user-id-1]/
│   └── avatar.jpg
├── [user-id-2]/
│   └── profile.png
└── [user-id-3]/
    └── photo.jpg
```

**Each user's documents are isolated in their own folder using `user_id`**

---

## 🎯 ADMIN VIEW

**Admin Dashboard Query (to see all applications with documents):**
```sql
SELECT 
  a.id as application_id,
  p.full_name as candidate,
  p.email,
  a.status as application_status,
  COUNT(d.id) as total_documents,
  COUNT(CASE WHEN d.status = 'verified' THEN 1 END) as verified_docs,
  COUNT(CASE WHEN d.status = 'pending' THEN 1 END) as pending_docs
FROM applications a
JOIN profiles p ON a.user_id = p.id
LEFT JOIN documents d ON d.application_id = a.id
GROUP BY a.id, p.full_name, p.email, a.status
ORDER BY a.created_at DESC;
```

---

## 🔐 SECURITY

### **Row Level Security (RLS) ensures:**

1. **Candidates can only see their own data:**
   - Their own profile
   - Their own application
   - Their own documents

2. **Admins can see all data:**
   - All profiles
   - All applications
   - All documents

3. **File access is secured:**
   - Download URLs are signed and expire after 1 hour
   - Users can only access their own files
   - Admins can access all files

---

## 📊 CURRENT DATA SNAPSHOT

Based on your Supabase screenshot:

| Table | Rows | Description |
|-------|------|-------------|
| **profiles** | 3 | 3 registered users (including you) |
| **applications** | 1 | 1 application form submitted |
| **documents** | 5 | 5 files uploaded |
| **activity_logs** | 11 | System activity tracking |
| **audit_logs** | 0 | Admin actions (none yet) |
| **messages** | 0 | Internal messaging (not used) |
| **notifications** | 10 | User notifications |

---

## 🛠️ USEFUL QUERIES FOR DEBUGGING

### **1. Find orphaned documents (documents without application):**
```sql
SELECT * FROM documents 
WHERE application_id NOT IN (SELECT id FROM applications);
```

### **2. Find applications without documents:**
```sql
SELECT 
  a.id,
  a.name,
  a.email,
  COUNT(d.id) as doc_count
FROM applications a
LEFT JOIN documents d ON d.application_id = a.id
GROUP BY a.id, a.name, a.email
HAVING COUNT(d.id) = 0;
```

### **3. Find your current application status:**
```sql
SELECT 
  a.status,
  a.created_at,
  a.submitted_at,
  COUNT(d.id) as uploaded_docs
FROM applications a
LEFT JOIN documents d ON d.application_id = a.id
WHERE a.user_id = (SELECT id FROM profiles WHERE email = 'sz.sharfi8541@gmail.com')
GROUP BY a.status, a.created_at, a.submitted_at;
```

---

## 📝 SUMMARY

**Where user records are submitted:**
- Registration → `profiles` table
- Application form → `applications` table
- Both linked by `user_id`

**Where files are submitted:**
- File metadata → `documents` table
- Actual files → Supabase Storage (`candidate-documents` bucket)
- File path format: `candidate-documents/[user_id]/[filename]`

**How to identify which document belongs to whom:**
```sql
-- Option 1: Simple join
SELECT p.email, d.file_name 
FROM documents d 
JOIN profiles p ON d.user_id = p.id;

-- Option 2: With application info
SELECT 
  p.email as user_email,
  a.name as applicant_name,
  d.document_type,
  d.file_name
FROM documents d
JOIN profiles p ON d.user_id = p.id
JOIN applications a ON d.application_id = a.id;
```

**Each document has TWO foreign keys:**
1. `user_id` → Links to the user who uploaded it
2. `application_id` → Links to the application it belongs to

This dual-linking ensures you can always trace a document back to both the user and their specific application! 🎯
