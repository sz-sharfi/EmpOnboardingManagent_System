# Final Integration Checklist

Complete checklist before deploying to production. Test each item systematically.

---

## BACKEND CHECKLIST

### Database Schema

- [ ] **All tables created with correct schema**
  ```sql
  -- Verify tables exist
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'candidate_applications', 'documents', 'admin_actions_log')
  ORDER BY table_name;
  -- Expected: 4 rows
  ```

- [ ] **Indexes added for performance**
  ```sql
  -- Check indexes
  SELECT tablename, indexname 
  FROM pg_indexes 
  WHERE schemaname = 'public'
  ORDER BY tablename;
  -- Should see indexes on: user_id, status, application_id, etc.
  ```

- [ ] **RLS enabled on all tables**
  ```sql
  -- Verify RLS enabled
  SELECT tablename, rowsecurity 
  FROM pg_tables 
  WHERE schemaname = 'public';
  -- All should show rowsecurity = true
  ```

- [ ] **RLS policies tested and working**
  ```sql
  -- Count policies per table
  SELECT tablename, COUNT(*) as policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  GROUP BY tablename
  ORDER BY tablename;
  -- Each table should have 2-4 policies
  ```
  
  **Test Script:**
  ```javascript
  // As candidate - should only see own data
  await testHelpers.testRLS()
  ```

- [ ] **Storage buckets created**
  ```sql
  -- Verify buckets exist
  SELECT name, public, file_size_limit 
  FROM storage.buckets
  ORDER BY name;
  -- Expected: candidate-documents (5MB), profile-photos (2MB)
  ```

- [ ] **Storage policies configured**
  ```sql
  -- Check storage policies
  SELECT bucket_id, name, definition
  FROM storage.policies
  ORDER BY bucket_id, name;
  -- Should have upload, select, delete policies per bucket
  ```

- [ ] **Triggers active**
  ```sql
  -- List active triggers
  SELECT trigger_name, event_object_table, action_timing, event_manipulation
  FROM information_schema.triggers
  WHERE trigger_schema = 'public'
  ORDER BY event_object_table;
  -- Expected: create_profile_on_signup, update_timestamps, etc.
  ```

- [ ] **Admin account created and tested**
  ```sql
  -- Verify admin exists
  SELECT u.email, p.role, p.full_name
  FROM auth.users u
  JOIN profiles p ON u.id = p.id
  WHERE p.role = 'admin';
  -- Should show at least 1 admin
  ```
  
  **Test:** Login at `/admin/login` with admin credentials

- [ ] **Database constraints working**
  ```sql
  -- Check constraints
  SELECT conname, contype, conrelid::regclass
  FROM pg_constraint
  WHERE connamespace = 'public'::regnamespace
  ORDER BY conrelid::regclass::text;
  -- Should see CHECK, FOREIGN KEY constraints
  ```

- [ ] **JSONB fields validated**
  ```sql
  -- Test form_data JSONB
  SELECT 
    id,
    form_data->>'fullName' as name,
    form_data->'education' as education
  FROM candidate_applications
  LIMIT 1;
  -- Should parse correctly
  ```

---

## FRONTEND CHECKLIST

### Setup & Configuration

- [ ] **Supabase client installed and configured**
  ```bash
  # Check dependency
  grep "@supabase/supabase-js" package.json
  # Should show version
  ```
  
  **Test:**
  ```javascript
  // In browser console
  import { supabase } from './src/lib/supabase';
  console.log(supabase);
  // Should show Supabase client object
  ```

- [ ] **Environment variables set**
  ```bash
  # Check .env exists
  cat .env
  # Should show VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
  ```
  
  **Test:**
  ```javascript
  testHelpers.checkEnv()
  // Should show both variables as "Set"
  ```

### Authentication & Authorization

- [ ] **AuthContext working**
  
  **Test:**
  1. Login to app
  2. Open browser console
  3. Run:
     ```javascript
     await testHelpers.checkAuth()
     // Should show authenticated: true, user details, profile with role
     ```

- [ ] **Protected routes blocking unauthorized access**
  
  **Test:**
  1. Logout (or use incognito window)
  2. Try to access `/candidate/dashboard`
  3. **Expected:** Redirect to `/candidate/login`
  4. Try to access `/admin/dashboard`
  5. **Expected:** Redirect to `/admin/login`

### User Flows - Signup

- [ ] **Signup flow working**
  
  **Test Script:**
  ```
  1. Go to /candidate/signup
  2. Fill form:
     - Full Name: "Test Candidate"
     - Email: "test@example.com"
     - Password: "Test1234!"
     - Confirm: "Test1234!"
  3. Click "Sign Up"
  4. Expected:
     ✅ User created in auth.users
     ✅ Profile created in profiles with role='candidate'
     ✅ Redirect to /candidate/login
     ✅ Success message shown
  ```
  
  **Verify in Database:**
  ```sql
  SELECT u.email, p.role, p.full_name, p.created_at
  FROM auth.users u
  JOIN profiles p ON u.id = p.id
  WHERE u.email = 'test@example.com';
  ```

### User Flows - Login

- [ ] **Login flow working (both roles)**
  
  **Test as Candidate:**
  ```
  1. Go to /candidate/login
  2. Enter: test@example.com / Test1234!
  3. Click "Login"
  4. Expected:
     ✅ Redirect to /candidate/dashboard
     ✅ User name shows in header
     ✅ Dashboard loads application data
  ```
  
  **Test as Admin:**
  ```
  1. Go to /admin/login
  2. Enter: admin@jrminfosystems.com / [admin password]
  3. Click "Login"
  4. Expected:
     ✅ Redirect to /admin/dashboard
     ✅ Admin name shows in header
     ✅ Dashboard shows all applications
     ✅ Metrics displayed (total, pending, approved, rejected)
  ```

- [ ] **Logout working**
  
  **Test:**
  ```
  1. Login as any user
  2. Click profile dropdown → Logout
  3. Expected:
     ✅ Redirect to login page
     ✅ Session cleared
     ✅ Cannot access protected routes
  ```
  
  **Verify:**
  ```javascript
  await testHelpers.checkAuth()
  // Should show authenticated: false
  ```

### Application Management

- [ ] **Dashboard loading real data**
  
  **Test:**
  ```
  1. Login as candidate
  2. Go to /candidate/dashboard
  3. Expected:
     ✅ Shows application status (if exists)
     ✅ Shows progress percentage
     ✅ Shows recent activities
     ✅ Quick action buttons work
  ```
  
  **Browser Console:**
  ```javascript
  // Check network tab - should see API calls to Supabase
  // Look for: /rest/v1/candidate_applications
  ```

- [ ] **Application form saving to database**
  
  **Test - Save Draft:**
  ```
  1. Login as candidate (without application)
  2. Go to /candidate/application
  3. Fill Step 1 (basic info):
     - Post: "Software Engineer"
     - Name: "Test User"
     - Father Name: "Test Father"
     - Address: "123 Test St"
  4. Click "Save as Draft"
  5. Expected:
     ✅ "Draft saved" message
     ✅ Can close browser and come back
     ✅ Data persists
  ```
  
  **Verify:**
  ```sql
  SELECT 
    id, status, 
    form_data->>'fullName' as name,
    form_data->>'postAppliedFor' as position
  FROM candidate_applications
  WHERE user_id = (
    SELECT id FROM auth.users WHERE email = 'test@example.com'
  );
  -- Should show status='draft' with form data
  ```
  
  **Test - Submit Application:**
  ```
  1. Complete all form steps
  2. Upload required documents (Step 4)
  3. Click "Submit Application"
  4. Expected:
     ✅ Status changes to 'submitted'
     ✅ submitted_at timestamp set
     ✅ Success modal shown
     ✅ Redirect to dashboard
     ✅ Cannot edit anymore
  ```
  
  **Verify:**
  ```sql
  SELECT id, status, submitted_at, progress_percent
  FROM candidate_applications
  WHERE status = 'submitted'
  ORDER BY submitted_at DESC
  LIMIT 1;
  ```

### Document Management

- [ ] **Document upload working**
  
  **Test:**
  ```
  1. Go to application form Step 4
  2. Click "Upload" for PAN Card
  3. Select a PDF or image file
  4. Expected:
     ✅ File size validation (max 5MB)
     ✅ File type validation (PDF, JPG, PNG)
     ✅ Upload progress shown
     ✅ Preview/thumbnail displayed
     ✅ Can remove and re-upload
  ```
  
  **Verify in Database:**
  ```sql
  SELECT 
    d.document_type,
    d.file_name,
    d.file_size,
    d.verification_status,
    d.created_at
  FROM documents d
  JOIN candidate_applications ca ON d.application_id = ca.id
  WHERE ca.user_id = (SELECT id FROM auth.users WHERE email = 'test@example.com')
  ORDER BY d.created_at DESC;
  ```
  
  **Verify in Storage:**
  ```javascript
  // Browser console
  const { data, error } = await supabase.storage
    .from('candidate-documents')
    .list();
  console.log(data); // Should show uploaded files
  ```

### Admin Features

- [ ] **Admin can view all applications**
  
  **Test:**
  ```
  1. Login as admin
  2. Go to /admin/dashboard
  3. Expected:
     ✅ See all submitted applications
     ✅ See application count (total, pending, approved, rejected)
     ✅ Can filter by status
     ✅ Can search applications
  ```
  
  **Verify:**
  ```sql
  -- Admin should see all
  SELECT COUNT(*) 
  FROM candidate_applications 
  WHERE status != 'draft';
  ```

- [ ] **Admin can approve/reject applications**
  
  **Test Approve:**
  ```
  1. Click on a submitted application
  2. Review details
  3. Click "Approve Application"
  4. Add optional notes
  5. Click "Confirm"
  6. Expected:
     ✅ Status changes to 'accepted'
     ✅ reviewed_by set to admin ID
     ✅ reviewed_at timestamp set
     ✅ Timeline shows approval
     ✅ Candidate sees updated status
  ```
  
  **Verify:**
  ```sql
  SELECT 
    id, status, reviewed_by, reviewed_at
  FROM candidate_applications
  WHERE status = 'accepted'
  ORDER BY reviewed_at DESC;
  ```
  
  **Test Reject:**
  ```
  1. Click on a submitted application
  2. Click "Reject Application"
  3. Enter rejection reason
  4. Click "Confirm"
  5. Expected:
     ✅ Status changes to 'rejected'
     ✅ rejection_reason saved
     ✅ Candidate sees rejection reason
  ```

- [ ] **Admin can verify documents**
  
  **Test:**
  ```
  1. Go to application detail
  2. Click "Documents" tab
  3. Click on a document to view
  4. Click "Verify" or "Reject"
  5. Expected:
     ✅ Can view/download document
     ✅ verification_status updates
     ✅ verified_by set to admin ID
     ✅ verified_at timestamp set
  ```
  
  **Verify:**
  ```sql
  SELECT 
    document_type,
    verification_status,
    verified_by,
    verified_at
  FROM documents
  WHERE verification_status IN ('verified', 'rejected')
  ORDER BY verified_at DESC;
  ```

- [ ] **Role-based access control working**
  
  **Test:**
  ```
  1. Login as candidate
  2. Try to access /admin/dashboard
  3. Expected: Redirect to /candidate/dashboard
  
  4. Login as admin
  5. Try to access /candidate/dashboard
  6. Expected: Redirect to /admin/dashboard
  ```

---

## TESTING CHECKLIST - End-to-End Flow

### Complete Candidate Journey

- [ ] **Create candidate account**
  ```
  1. Go to /candidate/signup
  2. Email: journey-test@example.com
  3. Password: Journey2024!
  4. Sign up
  5. ✅ Account created
  ```

- [ ] **Fill and submit application**
  ```
  1. Login with above credentials
  2. Go to application form
  3. Fill all 4 steps:
     - Step 1: Basic info
     - Step 2: Personal details
     - Step 3: Education & banking
     - Step 4: Upload documents (PAN, Aadhar, 10th)
  4. Submit application
  5. ✅ Application submitted
  ```

- [ ] **Upload documents**
  ```
  (Already done in Step 4 above)
  ✅ Documents uploaded
  ```

### Complete Admin Journey

- [ ] **Create admin account**
  ```
  Run SQL from CREATE_ADMIN_ACCOUNT.md
  OR use Supabase dashboard
  ✅ Admin account ready
  ```

- [ ] **Admin can see application**
  ```
  1. Login as admin
  2. Go to dashboard
  3. ✅ See journey-test@example.com's application
  ```

- [ ] **Admin can approve application**
  ```
  1. Click on the application
  2. Review all details
  3. Click "Approve"
  4. ✅ Application approved
  ```

- [ ] **Candidate gets updated status**
  ```
  1. Login as journey-test@example.com
  2. Go to dashboard
  3. ✅ See status "Accepted"
  ```

- [ ] **Candidate can upload documents after approval**
  ```
  (This depends on your flow - usually docs are uploaded before submission)
  ✅ Documents accessible
  ```

- [ ] **Admin can verify documents**
  ```
  1. Login as admin
  2. Go to application → Documents tab
  3. Verify each document
  4. ✅ All documents verified
  ```

- [ ] **Application status updates correctly**
  ```
  1. Check progress percentage
  2. ✅ Shows 100% when all docs verified
  ```

---

## SECURITY CHECKLIST

### Data Access Control

- [ ] **Candidates can only see their own data**
  
  **Test:**
  ```javascript
  // Login as candidate
  // Try to query another user's application
  const { data, error } = await supabase
    .from('candidate_applications')
    .select('*')
    .neq('user_id', 'current-user-id');
  
  console.log(data);
  // Expected: Empty array (blocked by RLS)
  ```

- [ ] **Admins can see all data**
  
  **Test:**
  ```javascript
  // Login as admin
  const { data, error } = await supabase
    .from('candidate_applications')
    .select('count');
  
  console.log(data);
  // Expected: Full count of all applications
  ```

- [ ] **File uploads restricted to own folders**
  
  **Test:**
  ```javascript
  // As candidate, try to upload to another user's folder
  const { error } = await supabase.storage
    .from('candidate-documents')
    .upload('another-user-id/hack.pdf', file);
  
  console.log(error);
  // Expected: Permission denied error
  ```

### Code Security

- [ ] **SQL injection protected**
  
  ✅ Using Supabase client (parameterized queries)
  ✅ Never using raw SQL with user input
  ✅ All queries through `.select()`, `.insert()`, etc.

- [ ] **XSS protected**
  
  ✅ React auto-escapes all output
  ✅ No `dangerouslySetInnerHTML` without sanitization
  ✅ No `eval()` or `Function()` with user input

- [ ] **API keys not exposed in frontend code**
  
  **Verify:**
  ```bash
  # Search codebase for hardcoded keys
  grep -r "eyJ" src/
  # Should find nothing except in .env
  ```
  
  ✅ Only using `import.meta.env.VITE_SUPABASE_*`
  ✅ Real keys in .env file (gitignored)
  ✅ .env.example has placeholders only

- [ ] **Passwords hashed by Supabase Auth**
  
  ✅ Using `supabase.auth.signUp()`
  ✅ Never storing passwords in database
  ✅ All password handling by Supabase

---

## PERFORMANCE CHECKLIST

- [ ] **Database queries optimized**
  ```sql
  -- Check slow queries (if > 100ms)
  EXPLAIN ANALYZE
  SELECT * FROM candidate_applications WHERE user_id = 'uuid';
  -- Should use index
  ```

- [ ] **Images optimized**
  ```
  ✅ Photos compressed before upload
  ✅ Max 2MB for profile photos
  ✅ Lazy loading for lists
  ```

- [ ] **Bundle size reasonable**
  ```bash
  npm run build
  # Check dist/ size
  # Should be < 500KB for main bundle
  ```

---

## PRE-DEPLOYMENT CHECKLIST

### Code Quality

- [ ] No console errors in browser
- [ ] No TypeScript errors: `npm run build`
- [ ] Code formatted: `npm run format` (if configured)
- [ ] All tests passing (if you have tests)

### Documentation

- [ ] README.md updated with setup instructions
- [ ] Environment variables documented
- [ ] API endpoints documented (if any)
- [ ] Database schema documented

### Security

- [ ] .env in .gitignore
- [ ] No secrets in code
- [ ] RLS policies enabled
- [ ] Admin account secured with strong password

### Deployment

- [ ] Environment variables set in hosting platform
- [ ] Database migrations run on production
- [ ] Storage buckets created
- [ ] Custom domain configured (if needed)
- [ ] HTTPS enabled

---

## POST-DEPLOYMENT VERIFICATION

After deploying to production:

```bash
# Test production URL
open https://your-app.vercel.app

# Run health check
# (Open browser console)
await testHelpers.healthCheck()
```

**Expected:**
- ✅ Authentication: PASS
- ✅ Database: PASS
- ✅ RLS Policies: PASS
- ✅ Storage: PASS

---

## Quick Test Scripts

Copy-paste these into browser console:

### Full System Test
```javascript
// Run complete health check
await testHelpers.healthCheck()
```

### Test Authentication
```javascript
await testHelpers.checkAuth()
```

### Test Database
```javascript
await testHelpers.checkDB()
```

### Test File Upload
```javascript
await testHelpers.testUpload()
```

### Debug Application
```javascript
// Replace with actual application ID
await testHelpers.debugApp('application-uuid-here')
```

---

## Rollback Plan (If Issues Found)

If critical issues discovered post-deployment:

1. **Revert deployment**
   ```bash
   # Vercel
   vercel rollback
   
   # Netlify
   # Use dashboard to restore previous deploy
   ```

2. **Fix issues locally**
   - Debug and fix
   - Test thoroughly
   - Re-deploy

3. **Database rollback** (if needed)
   ```sql
   -- Restore from backup
   -- Or manually fix data
   ```

---

**✅ All checks passed? You're ready to go live!**

Need help with any failing check? See TESTING_GUIDE.md for troubleshooting.
