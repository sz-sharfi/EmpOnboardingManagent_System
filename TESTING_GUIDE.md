# Testing & Troubleshooting Guide

Complete checklist and debug guide for the Employee Onboarding System.

---

## Quick Start - Browser Console Testing

Open browser console and run:
```javascript
// Run complete health check
await testHelpers.healthCheck()

// Check authentication
await testHelpers.checkAuth()

// Test database connection
await testHelpers.checkDB()

// Test RLS policies
await testHelpers.testRLS()

// Test storage access
await testHelpers.testStorage()

// Test file upload
await testHelpers.testUpload()

// Debug specific application
await testHelpers.debugApp('application-uuid')
```

---

## DATABASE SCHEMA VALIDATION

### 1. Verify All Tables Exist

Run in Supabase SQL Editor:
```sql
-- Check all required tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'profiles',
    'candidate_applications',
    'documents',
    'admin_actions_log'
  )
ORDER BY table_name;
```

**Expected Result:** 4 rows
- admin_actions_log
- candidate_applications
- documents
- profiles

### 2. Verify Table Structures

```sql
-- Check profiles table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Check candidate_applications table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'candidate_applications'
ORDER BY ordinal_position;

-- Check documents table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'documents'
ORDER BY ordinal_position;
```

### 3. Verify Triggers

```sql
-- List all triggers
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
```

**Expected Triggers:**
- `create_profile_on_signup` on `auth.users`
- `update_application_progress` on `candidate_applications`
- `update_application_progress_on_doc` on `documents`

### 4. Verify Indexes

```sql
-- Check indexes
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

---

## RLS POLICY VALIDATION

### 1. Check Policies Exist

```sql
-- List all RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### 2. Test RLS for Candidate

```sql
-- Set role to candidate (simulate user)
SET request.jwt.claims = json_build_object(
  'sub', 'candidate-user-uuid',
  'role', 'candidate'
);

-- Test: Can candidate view own profile?
SELECT * FROM profiles WHERE id = 'candidate-user-uuid';

-- Test: Can candidate create application?
-- (This should work)

-- Test: Can candidate view other's applications?
SELECT * FROM candidate_applications WHERE user_id != 'candidate-user-uuid';
-- (This should return 0 rows)
```

### 3. Test RLS for Admin

```sql
-- Set role to admin
SET request.jwt.claims = json_build_object(
  'sub', 'admin-user-uuid',
  'role', 'admin'
);

-- Test: Can admin view all applications?
SELECT count(*) FROM candidate_applications;
-- (Should see all applications)

-- Test: Can admin update any application?
-- (Should work)
```

### 4. Common RLS Errors

**Error:** `new row violates row-level security policy`

**Cause:** INSERT policy not allowing the operation

**Fix:**
```sql
-- Check INSERT policies
SELECT * FROM pg_policies 
WHERE tablename = 'your_table' 
  AND cmd = 'INSERT';

-- Verify policy allows user to insert
```

---

## STORAGE BUCKET VALIDATION

### 1. Verify Buckets Exist

```sql
-- Check storage buckets
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
ORDER BY name;
```

**Expected Buckets:**
- `candidate-documents` (private, 5MB limit)
- `profile-photos` (private, 2MB limit)

### 2. Check Storage Policies

```sql
-- View storage policies
SELECT 
  name,
  bucket_id,
  definition
FROM storage.policies
ORDER BY bucket_id, name;
```

**Expected Policies per bucket:**
- `Allow authenticated uploads`
- `Allow users to view own files`
- `Allow users to delete own files`
- `Allow admins to view all files`

### 3. Test Storage Upload

Use browser console:
```javascript
// Test upload
const testFile = new Blob(['test'], { type: 'text/plain' });
const { data, error } = await supabase.storage
  .from('candidate-documents')
  .upload('test/test.txt', testFile);

console.log({ data, error });
```

### 4. Storage Troubleshooting

**Error:** `Bucket not found`

**Fix:**
```sql
-- Create missing bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('candidate-documents', 'candidate-documents', false, 5242880);
```

**Error:** `new row violates row-level security policy for table "objects"`

**Fix:** Add storage policies (see `supabase/storage_buckets_setup.sql`)

---

## AUTHENTICATION FLOW TESTING

### ✅ Candidate Signup Flow

**Steps:**
1. Navigate to `/candidate/signup`
2. Fill form:
   - Full Name: Test Candidate
   - Email: test@example.com
   - Password: Test1234!
   - Confirm Password: Test1234!
3. Click "Sign Up"

**Expected:**
- ✅ User created in `auth.users`
- ✅ Profile created in `profiles` with role='candidate'
- ✅ Redirect to `/candidate/login`
- ✅ Success message displayed

**Verification:**
```sql
SELECT u.id, u.email, p.role, p.full_name
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'test@example.com';
```

### ✅ Candidate Login Flow

**Steps:**
1. Navigate to `/candidate/login`
2. Enter credentials
3. Click "Login"

**Expected:**
- ✅ Session created
- ✅ Redirect to `/candidate/dashboard`
- ✅ AuthContext populated with user and profile
- ✅ Navigation shows user name

**Browser Console Check:**
```javascript
await testHelpers.checkAuth()
// Should show authenticated: true, role: candidate
```

### ✅ Admin Login Flow

**Steps:**
1. Navigate to `/admin/login`
2. Login as admin
3. Should redirect to `/admin/dashboard`

**Expected:**
- ✅ Role verification passes
- ✅ Can access admin routes
- ✅ Cannot access candidate routes

---

## ROLE-BASED ACCESS TESTING

### Test Protected Routes

**Candidate Routes (require role='candidate'):**
```
/candidate/dashboard
/candidate/application
/candidate/documents
/candidate/status
```

**Admin Routes (require role='admin'):**
```
/admin/dashboard
/admin/applications
/admin/applications/:id
/admin/reports
```

### Test Access Control

**As Candidate:**
1. Login as candidate
2. Try to access `/admin/dashboard`
3. **Expected:** Redirect to `/candidate/dashboard`

**As Admin:**
1. Login as admin
2. Try to access `/candidate/dashboard`
3. **Expected:** Redirect to `/admin/dashboard`

### Verify in Code

Check `src/components/ProtectedRoute.tsx`:
```typescript
// Should redirect based on role mismatch
if (profile && allowedRoles && !allowedRoles.includes(profile.role))
```

---

## DOCUMENT UPLOAD TESTING

### ✅ Upload Flow

**Steps:**
1. Login as candidate
2. Go to application form
3. Upload documents:
   - PAN Card (PDF/Image)
   - Aadhar Card (PDF/Image)
   - 10th Certificate (PDF/Image)

**Expected:**
- ✅ File size validation (max 5MB)
- ✅ File type validation
- ✅ Upload to `candidate-documents` bucket
- ✅ Database record created in `documents` table
- ✅ Preview/thumbnail shown

**Verification:**
```sql
-- Check uploaded documents
SELECT 
  d.id,
  d.document_type,
  d.file_name,
  d.file_size,
  d.verification_status,
  d.created_at,
  ca.user_id
FROM documents d
JOIN candidate_applications ca ON d.application_id = ca.id
WHERE ca.user_id = 'user-uuid'
ORDER BY d.created_at DESC;
```

### ✅ Document Verification (Admin)

**Steps:**
1. Login as admin
2. Go to application detail
3. View uploaded documents
4. Click "Verify" or "Reject"

**Expected:**
- ✅ Can download/view document
- ✅ Verification status updates
- ✅ Admin action logged

**Verification:**
```sql
-- Check admin actions
SELECT * FROM admin_actions_log
WHERE action_type = 'document_verified'
ORDER BY created_at DESC;
```

---

## APPLICATION CRUD TESTING

### ✅ Create Application (Draft)

**Steps:**
1. Login as candidate
2. Go to application form
3. Fill partial data
4. Click "Save as Draft"

**Expected:**
- ✅ Application created with status='draft'
- ✅ form_data JSON saved
- ✅ Draft can be resumed later

**Verification:**
```sql
SELECT 
  id,
  user_id,
  status,
  form_data,
  created_at,
  updated_at
FROM candidate_applications
WHERE status = 'draft'
ORDER BY created_at DESC;
```

### ✅ Submit Application

**Steps:**
1. Complete application form
2. Upload required documents
3. Click "Submit Application"

**Expected:**
- ✅ Status changes to 'submitted'
- ✅ `submitted_at` timestamp set
- ✅ Cannot edit after submission
- ✅ Confirmation modal shown

**Verification:**
```sql
SELECT 
  id,
  status,
  submitted_at,
  progress_percent
FROM candidate_applications
WHERE status = 'submitted'
ORDER BY submitted_at DESC;
```

### ✅ Review Application (Admin)

**Steps:**
1. Login as admin
2. View application list
3. Click on application
4. Review details
5. Approve or Reject

**Expected:**
- ✅ Can view all application data
- ✅ Can view uploaded documents
- ✅ Can approve (status → 'accepted')
- ✅ Can reject with reason
- ✅ Timeline shows all actions

**Verification:**
```sql
SELECT 
  id,
  status,
  reviewed_by,
  reviewed_at,
  rejection_reason
FROM candidate_applications
WHERE status IN ('accepted', 'rejected')
ORDER BY reviewed_at DESC;
```

---

## COMMON ISSUES & SOLUTIONS

### Issue 1: Row Level Security Policy Violation

**Error:**
```
new row violates row-level security policy for table "candidate_applications"
```

**Causes:**
1. RLS policies not applied
2. User role not set correctly
3. Policy condition not met

**Solutions:**

**A. Check RLS is enabled:**
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'candidate_applications';
```

**B. Check user role:**
```sql
SELECT role FROM profiles WHERE id = 'user-uuid';
```

**C. Verify policy exists:**
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'candidate_applications' 
  AND cmd = 'INSERT';
```

**D. Re-apply policies:**
```sql
-- Run the migration file again
-- supabase/migrations/complete_schema.sql
```

### Issue 2: Storage Bucket Not Found

**Error:**
```
Bucket not found: candidate-documents
```

**Solution:**
```sql
-- Check if bucket exists
SELECT * FROM storage.buckets WHERE name = 'candidate-documents';

-- If not, create it
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('candidate-documents', 'candidate-documents', false, 5242880);

-- Apply storage policies
-- Run supabase/storage_buckets_setup.sql
```

### Issue 3: Unauthorized / 403 Errors

**Error:**
```
Error: Unauthorized
```

**Causes:**
1. Not authenticated
2. Wrong role
3. RLS blocking access
4. Storage policy blocking access

**Solutions:**

**A. Check authentication:**
```javascript
await testHelpers.checkAuth()
```

**B. Check role:**
```sql
SELECT id, email, role FROM profiles WHERE email = 'your@email.com';
```

**C. Check you're accessing correct resources:**
- Candidates should only access their own applications
- Admins can access all applications

### Issue 4: File Upload Failures

**Error:**
```
Error uploading file
```

**Causes:**
1. File too large
2. Wrong MIME type
3. Storage policy blocking
4. Network error

**Solutions:**

**A. Check file size:**
```javascript
// Max 5MB for documents
if (file.size > 5 * 1024 * 1024) {
  alert('File too large');
}
```

**B. Check storage policies:**
```sql
SELECT * FROM storage.policies 
WHERE bucket_id = 'candidate-documents';
```

**C. Test upload manually:**
```javascript
await testHelpers.testUpload()
```

### Issue 5: Missing Environment Variables

**Error:**
```
Supabase client not initialized
```

**Solution:**

**A. Check .env file exists:**
```bash
# In project root
cat .env
```

**B. Verify variables:**
```javascript
testHelpers.checkEnv()
```

**C. Create .env if missing:**
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**D. Restart dev server:**
```bash
npm run dev
```

### Issue 6: Profile Not Created After Signup

**Error:**
User exists but profile missing

**Cause:**
Trigger didn't fire or failed

**Solution:**

**A. Check if trigger exists:**
```sql
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'create_profile_on_signup';
```

**B. Manually create profile:**
```sql
INSERT INTO profiles (id, role, full_name, email)
SELECT 
  id,
  'candidate' as role,
  raw_user_meta_data->>'full_name' as full_name,
  email
FROM auth.users
WHERE id = 'user-uuid';
```

**C. Re-create trigger:**
```sql
-- Run from migrations/complete_schema.sql
-- Look for "Trigger to create profile on signup"
```

### Issue 7: Cannot Login After Signup

**Error:**
Invalid login credentials

**Causes:**
1. Email not confirmed
2. Wrong password
3. User doesn't exist

**Solutions:**

**A. Check user exists:**
```sql
SELECT email, email_confirmed_at 
FROM auth.users 
WHERE email = 'user@example.com';
```

**B. Confirm email manually:**
```sql
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'user@example.com';
```

**C. Reset password:**
```sql
UPDATE auth.users
SET encrypted_password = crypt('NewPassword123!', gen_salt('bf'))
WHERE email = 'user@example.com';
```

---

## DEBUG SQL QUERIES

### Check User's Role
```sql
SELECT 
  u.id,
  u.email,
  p.role,
  p.full_name
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'user@example.com';
```

### View User's Applications
```sql
SELECT 
  ca.id,
  ca.status,
  ca.submitted_at,
  ca.progress_percent,
  ca.form_data->>'fullName' as candidate_name,
  ca.form_data->>'postAppliedFor' as position
FROM candidate_applications ca
WHERE ca.user_id = 'user-uuid'
ORDER BY ca.created_at DESC;
```

### Check Document Associations
```sql
SELECT 
  d.id,
  d.document_type,
  d.file_name,
  d.verification_status,
  d.created_at,
  ca.id as application_id,
  ca.user_id
FROM documents d
JOIN candidate_applications ca ON d.application_id = ca.id
WHERE ca.user_id = 'user-uuid'
ORDER BY d.created_at DESC;
```

### View All RLS Policies
```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has USING clause'
    ELSE 'No USING clause'
  END as using_check,
  CASE 
    WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
    ELSE 'No WITH CHECK clause'
  END as with_check_status
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;
```

### Check Storage Policies
```sql
SELECT 
  b.name as bucket_name,
  p.name as policy_name,
  p.definition
FROM storage.buckets b
LEFT JOIN storage.policies p ON b.id = p.bucket_id
ORDER BY b.name, p.name;
```

### View Recent Admin Actions
```sql
SELECT 
  aal.id,
  aal.action_type,
  aal.performed_by,
  aal.application_id,
  aal.details,
  aal.created_at,
  p.full_name as admin_name
FROM admin_actions_log aal
LEFT JOIN profiles p ON aal.performed_by = p.id
ORDER BY aal.created_at DESC
LIMIT 20;
```

### Check Application Progress Calculation
```sql
SELECT 
  ca.id,
  ca.status,
  ca.progress_percent,
  COUNT(d.id) as total_documents,
  COUNT(d.id) FILTER (WHERE d.verification_status = 'verified') as verified_docs,
  CASE 
    WHEN COUNT(d.id) > 0 
    THEN (COUNT(d.id) FILTER (WHERE d.verification_status = 'verified')::float / COUNT(d.id) * 100)::int
    ELSE 0
  END as calculated_progress
FROM candidate_applications ca
LEFT JOIN documents d ON d.application_id = ca.id
GROUP BY ca.id
ORDER BY ca.created_at DESC;
```

---

## TESTING CHECKLIST

### Pre-Launch Checklist

- [ ] **Database Schema**
  - [ ] All tables created
  - [ ] All columns have correct types
  - [ ] Foreign keys set up correctly
  - [ ] Triggers are active
  - [ ] Indexes created

- [ ] **RLS Policies**
  - [ ] RLS enabled on all tables
  - [ ] Candidate can create/view own data
  - [ ] Candidate cannot view other's data
  - [ ] Admin can view all data
  - [ ] Admin can update all data

- [ ] **Storage**
  - [ ] Buckets created
  - [ ] Size limits set (5MB documents, 2MB photos)
  - [ ] Upload policies working
  - [ ] Download policies working
  - [ ] Delete policies working

- [ ] **Authentication**
  - [ ] Signup creates user + profile
  - [ ] Email confirmation works (or is disabled)
  - [ ] Login works for candidates
  - [ ] Login works for admins
  - [ ] Logout works
  - [ ] Password reset works

- [ ] **Authorization**
  - [ ] ProtectedRoute blocks unauthorized access
  - [ ] Role-based redirects work
  - [ ] Candidate cannot access admin routes
  - [ ] Admin cannot access candidate routes

- [ ] **Application Flow**
  - [ ] Can create draft application
  - [ ] Can save draft
  - [ ] Can resume draft
  - [ ] Can submit application
  - [ ] Cannot edit after submission
  - [ ] Admin can view applications
  - [ ] Admin can approve
  - [ ] Admin can reject with reason

- [ ] **Document Management**
  - [ ] Can upload documents
  - [ ] File size validation works
  - [ ] File type validation works
  - [ ] Documents show in list
  - [ ] Admin can view documents
  - [ ] Admin can verify documents
  - [ ] Admin can reject documents

- [ ] **UI/UX**
  - [ ] Loading states show correctly
  - [ ] Error messages are clear
  - [ ] Success messages show
  - [ ] Forms validate input
  - [ ] Responsive on mobile
  - [ ] No console errors

### Performance Checklist

- [ ] Queries use indexes
- [ ] No N+1 query problems
- [ ] File uploads don't block UI
- [ ] Large lists paginated
- [ ] Images optimized

---

## Browser Console Commands

**Open Developer Tools:** F12 or Ctrl+Shift+I

**Quick Tests:**
```javascript
// Full health check
await testHelpers.healthCheck()

// Check if logged in
await testHelpers.checkAuth()

// Test database
await testHelpers.checkDB()

// Test file upload
await testHelpers.testUpload()

// Debug specific app
await testHelpers.debugApp('app-uuid')
```

---

**✅ Testing complete! All systems operational.**
