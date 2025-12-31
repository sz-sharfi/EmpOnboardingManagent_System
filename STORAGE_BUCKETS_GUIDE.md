# Supabase Storage Buckets Setup Guide

Complete guide for setting up storage buckets for the Employee Onboarding System.

---

## 📋 Overview

We need two storage buckets:
1. **candidate-documents** - For application documents (PAN, Aadhar, certificates, etc.)
2. **profile-photos** - For user profile pictures

---

## 🎯 Method 1: Supabase Dashboard (UI)

### Step 1: Access Storage Section

1. Log in to your Supabase project
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"** button

---

### Step 2: Create Candidate Documents Bucket

1. **Bucket Configuration:**
   - **Name:** `candidate-documents`
   - **Public bucket:** ❌ **OFF** (Private)
   - **File size limit:** `5242880` bytes (5 MB)
   - **Allowed MIME types:** Click "Add MIME type" and add:
     - `application/pdf`
     - `image/jpeg`
     - `image/jpg`
     - `image/png`

2. Click **"Create bucket"**

3. **Folder Structure Convention:**
   ```
   candidate-documents/
   └── {user_id}/
       └── {application_id}/
           └── {document_type}/
               └── {filename}
   
   Example:
   candidate-documents/
   └── 550e8400-e29b-41d4-a716-446655440000/
       └── 123e4567-e89b-12d3-a456-426614174000/
           └── pan_card/
               └── pan_scan.pdf
   ```

---

### Step 3: Create Profile Photos Bucket

1. **Bucket Configuration:**
   - **Name:** `profile-photos`
   - **Public bucket:** ❌ **OFF** (Private)
   - **File size limit:** `2097152` bytes (2 MB)
   - **Allowed MIME types:** Click "Add MIME type" and add:
     - `image/jpeg`
     - `image/jpg`
     - `image/png`
     - `image/webp`

2. Click **"Create bucket"**

3. **Folder Structure Convention:**
   ```
   profile-photos/
   └── {user_id}/
       └── {filename}
   
   Example:
   profile-photos/
   └── 550e8400-e29b-41d4-a716-446655440000/
       └── avatar.jpg
   ```

---

### Step 4: Configure Storage Policies (Dashboard)

⚠️ **Important:** Storage policies cannot be fully configured via UI. You must use SQL Editor.

1. Go to **Storage** > Select bucket > **Policies** tab
2. Click **"New policy"**
3. You'll see a SQL editor - this is where you need to paste the SQL commands

**Recommendation:** Use Method 2 (SQL) for policy setup as it's more reliable.

---

## 💻 Method 2: SQL Editor (Recommended)

### Complete SQL Setup

1. Open your Supabase project
2. Navigate to **SQL Editor** in the left sidebar
3. Click **"New query"**
4. Copy and paste the SQL from `storage_buckets_setup.sql`
5. Click **"Run"** or press `Ctrl + Enter`

**File Location:** `supabase/storage_buckets_setup.sql`

This will:
- ✅ Create both storage buckets
- ✅ Set size limits and MIME types
- ✅ Create all storage policies
- ✅ Verify the setup

---

## 🔐 Storage Policies Summary

### Candidate Documents Bucket Policies

| Policy Name | Operation | Who | Description |
|------------|-----------|-----|-------------|
| Candidates upload own documents | INSERT | Authenticated users | Can upload to their own `{user_id}/` folder |
| Candidates view own documents | SELECT | Authenticated users | Can view files in their own folder |
| Candidates delete own documents | DELETE | Authenticated users | Can delete their own uploaded files |
| Admins view all candidate documents | SELECT | Admins only | Can view all candidate documents |

**Security Rules:**
- ✅ Users can only access files in folders matching their user ID
- ✅ Admins can view all documents for review purposes
- ✅ No public access - all files require authentication

---

### Profile Photos Bucket Policies

| Policy Name | Operation | Who | Description |
|------------|-----------|-----|-------------|
| Users upload own profile photo | INSERT | Authenticated users | Can upload to their own `{user_id}/` folder |
| Users view own profile photo | SELECT | Authenticated users | Can view their own profile photo |
| Users update own profile photo | UPDATE | Authenticated users | Can replace their profile photo |
| Users delete own profile photo | DELETE | Authenticated users | Can delete their profile photo |
| Admins view all profile photos | SELECT | Admins only | Can view all user photos |

**Security Rules:**
- ✅ Users can only manage their own profile photos
- ✅ Admins can view all profile photos
- ✅ No public access - authentication required

---

## 📁 Folder Structure Examples

### Candidate Documents

```
candidate-documents/
├── 550e8400-e29b-41d4-a716-446655440000/     # User ID
│   ├── app-001/                               # Application ID
│   │   ├── pan_card/
│   │   │   └── pan_card_front.pdf
│   │   ├── aadhar_card/
│   │   │   ├── aadhar_front.jpg
│   │   │   └── aadhar_back.jpg
│   │   ├── tenth_certificate/
│   │   │   └── 10th_marksheet.pdf
│   │   └── photo/
│   │       └── passport_photo.jpg
│   └── app-002/
│       └── ...
└── 660e8400-e29b-41d4-a716-446655440001/     # Another User
    └── ...
```

### Profile Photos

```
profile-photos/
├── 550e8400-e29b-41d4-a716-446655440000/
│   └── profile.jpg
├── 660e8400-e29b-41d4-a716-446655440001/
│   └── avatar.png
└── 770e8400-e29b-41d4-a716-446655440002/
    └── photo.webp
```

---

## 🧪 Testing Storage Setup

### Test 1: Verify Buckets Created

Run in SQL Editor:
```sql
SELECT 
  id,
  name,
  public,
  file_size_limit / 1024 / 1024 AS size_limit_mb,
  allowed_mime_types
FROM storage.buckets
WHERE id IN ('candidate-documents', 'profile-photos');
```

**Expected Output:**
| id | name | public | size_limit_mb | allowed_mime_types |
|----|------|--------|---------------|-------------------|
| candidate-documents | candidate-documents | false | 5 | {application/pdf, image/jpeg, image/jpg, image/png} |
| profile-photos | profile-photos | false | 2 | {image/jpeg, image/jpg, image/png, image/webp} |

---

### Test 2: Verify Policies Created

Run in SQL Editor:
```sql
SELECT 
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
ORDER BY policyname;
```

**Expected:** You should see 9 policies listed.

---

### Test 3: Test Upload via JavaScript

In your React application, you can test uploads:

```javascript
import { supabase } from './lib/supabase'

// Test uploading a document
async function testDocumentUpload() {
  const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
  const userId = (await supabase.auth.getUser()).data.user?.id
  const applicationId = 'app-001'
  const documentType = 'pan_card'
  
  const { data, error } = await supabase.storage
    .from('candidate-documents')
    .upload(`${userId}/${applicationId}/${documentType}/test.pdf`, file)
  
  console.log('Upload result:', { data, error })
}

// Test uploading a profile photo
async function testProfilePhotoUpload() {
  const file = new File(['test'], 'avatar.jpg', { type: 'image/jpeg' })
  const userId = (await supabase.auth.getUser()).data.user?.id
  
  const { data, error } = await supabase.storage
    .from('profile-photos')
    .upload(`${userId}/avatar.jpg`, file, {
      upsert: true // Replace if exists
    })
  
  console.log('Upload result:', { data, error })
}
```

---

## ⚠️ Common Issues & Solutions

### Issue 1: "new row violates row-level security policy"

**Cause:** Storage policies not created or incorrect.

**Solution:**
1. Verify user is authenticated: `await supabase.auth.getUser()`
2. Check folder path matches user ID
3. Re-run storage policy SQL

---

### Issue 2: "File size exceeds maximum allowed"

**Cause:** File larger than bucket limit.

**Solution:**
- Candidate documents: Max 5MB
- Profile photos: Max 2MB
- Compress images before upload
- Use PDF compression for documents

---

### Issue 3: "Invalid MIME type"

**Cause:** File type not in allowed list.

**Solution:**
- Check `allowed_mime_types` for bucket
- Ensure file extension matches MIME type
- For candidate-documents: PDF, JPG, PNG only
- For profile-photos: JPG, PNG, WEBP only

---

### Issue 4: "Bucket does not exist"

**Cause:** Bucket not created or wrong name.

**Solution:**
1. Verify bucket exists in Storage UI
2. Check exact spelling (case-sensitive)
3. Re-run bucket creation SQL

---

## 📝 File Upload Best Practices

1. **Always sanitize filenames:**
   ```javascript
   const sanitizedName = fileName
     .toLowerCase()
     .replace(/[^a-z0-9.-]/g, '_')
   ```

2. **Use consistent folder structure:**
   - Always include user ID as first folder
   - Use UUIDs for application IDs
   - Use descriptive document types

3. **Handle duplicates:**
   ```javascript
   // Use upsert to replace existing files
   const { data } = await supabase.storage
     .from('bucket-name')
     .upload(path, file, { upsert: true })
   ```

4. **Generate signed URLs for temporary access:**
   ```javascript
   const { data } = await supabase.storage
     .from('candidate-documents')
     .createSignedUrl(filePath, 3600) // 1 hour expiry
   ```

5. **Delete old files when replacing:**
   ```javascript
   // Delete old file before uploading new
   await supabase.storage
     .from('profile-photos')
     .remove([oldFilePath])
   ```

---

## ✅ Setup Checklist

- [ ] Create `candidate-documents` bucket (5MB limit)
- [ ] Create `profile-photos` bucket (2MB limit)
- [ ] Set allowed MIME types for both buckets
- [ ] Run storage policy SQL script
- [ ] Verify buckets appear in Storage UI
- [ ] Test document upload as candidate
- [ ] Test profile photo upload
- [ ] Test admin can view all documents
- [ ] Verify unauthorized access is blocked
- [ ] Update `.env` file with bucket names (if needed)

---

## 🔗 Related Files

- SQL Script: `supabase/storage_buckets_setup.sql`
- Database Schema: `supabase/migrations/complete_schema.sql`
- Supabase Client: `src/lib/supabase.ts`

---

## 📚 Next Steps

After completing storage setup:

1. **Create helper functions** for file uploads in your React app
2. **Implement file upload UI** in document upload pages
3. **Add file validation** (size, type, name)
4. **Create preview components** for uploaded documents
5. **Add progress indicators** for uploads
6. **Implement file deletion** functionality

---

**Need Help?** Refer to:
- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Storage RLS Policies Guide](https://supabase.com/docs/guides/storage/security/access-control)
