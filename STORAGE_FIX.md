# 🚨 QUICK FIX - Storage Upload Error

## Error You're Seeing:
```
StorageApiError: new row violates row-level security policy
Failed to upload PAN Card
```

## Solution:
Apply the storage policies migration to fix file upload permissions.

## Steps to Fix (Choose One):

### Option 1: Supabase Dashboard (Recommended)
1. **Open Supabase Dashboard** → SQL Editor
2. **Copy** the contents of `supabase/migrations/004_storage_policies.sql`
3. **Paste** into SQL Editor
4. **Click "Run"**
5. ✅ Done! Try uploading again

### Option 2: Supabase CLI
```bash
cd d:\onboarding-ui-vite\onboarding-ui-vite
supabase db push
```

## What This Migration Does:
✅ Creates the `documents` storage bucket (if not exists)  
✅ Sets 5MB file size limit  
✅ Restricts to PDF, JPEG, PNG files  
✅ Adds RLS policies so users can upload to their own applications  
✅ Allows admins to view all documents  

## After Running Migration:
Your document uploads will work! The form will:
1. ✅ Upload files to Supabase Storage
2. ✅ Create document records in database
3. ✅ Auto-calculate progress percentage
4. ✅ Submit application successfully

---

**File to run:** [supabase/migrations/004_storage_policies.sql](supabase/migrations/004_storage_policies.sql)
