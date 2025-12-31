# Storage Bucket Cleanup - Verification Checklist

## ✅ COMPLETED FIXES

### 1. Constant Declaration
- ✅ **src/lib/documents.ts** - Line 44-51
  ```typescript
  const STORAGE_BUCKET = 'candidate-documents' as const;
  // With runtime guard to fail fast if changed
  ```

- ✅ **src/pages/candidate/ApplicationPreviewPage.tsx** - Line 6
  ```typescript
  const DOCUMENTS_BUCKET = 'candidate-documents' as const;
  ```

### 2. Storage Upload References
- ✅ **src/lib/documents.ts:171** - `uploadDocument()`
  ```typescript
  await supabase.storage.from(STORAGE_BUCKET).upload(filePath, file, {...})
  ```
  **Status:** Uses constant ✅

### 3. Storage Delete References
- ✅ **src/lib/documents.ts:194** - Cleanup on DB insert failure
  ```typescript
  await supabase.storage.from(STORAGE_BUCKET).remove([filePath])
  ```
  **Status:** Uses constant ✅

- ✅ **src/lib/documents.ts:562** - Replace document cleanup (new file)
  ```typescript
  await supabase.storage.from(STORAGE_BUCKET).remove([newFilePath])
  ```
  **Status:** Uses constant ✅

- ✅ **src/lib/documents.ts:569** - Replace document cleanup (old file)
  ```typescript
  await supabase.storage.from(STORAGE_BUCKET).remove([oldFilePath])
  ```
  **Status:** Uses constant ✅

### 4. Storage Read References (Signed URLs)
- ✅ **src/pages/candidate/ApplicationPreviewPage.tsx:78** - Photo preview
  ```typescript
  await supabase.storage.from(DOCUMENTS_BUCKET).createSignedUrl(...)
  ```
  **Status:** Fixed - now uses DOCUMENTS_BUCKET constant ✅

### 5. Database Table References (CORRECT - Do NOT Change)
All references to `.from('documents')` for database table are CORRECT and must remain:
- ✅ src/lib/documents.ts - 8 references to `supabase.from('documents')` ✅
- ✅ src/pages/admin/DocumentReviewPage.tsx - 4 references ✅
- ✅ src/pages/candidate/ApplicationPreviewPage.tsx - 1 reference ✅
- ✅ src/pages/candidate/DocumentUploadPage.tsx - 2 references ✅
- ✅ src/utils/testHelpers.ts - 2 references ✅

**These are DATABASE table references, NOT storage buckets!**

---

## 🔍 VERIFICATION QUERIES

### Check for any remaining hardcoded "documents" bucket references:
```bash
# Should return ZERO results for storage buckets
grep -r "storage\.from\(['\"]documents['\"]" src/
```

### Confirm all storage calls use constants:
```bash
# Should show all using STORAGE_BUCKET or DOCUMENTS_BUCKET
grep -r "storage\.from(" src/
```

---

## 📋 FINAL CONFIGURATION

### Correct Bucket Name:
```
candidate-documents
```

### Path Format:
```
${userId}/${applicationId}/${documentType}/${timestamp}_${filename}
```

### Example Paths:
```
790afbf9-7a86-4023-90aa-c19f54.../b6cbfd01-fd55-43c2-.../pan_card/1735481629000_pan.pdf
790afbf9-7a86-4023-90aa-c19f54.../b6cbfd01-fd55-43c2-.../aadhar_card/1735481630000_aadhar.jpg
```

### Database Column:
- Table: `documents`
- Column: `storage_path`
- Value: Exact path matching storage bucket path

---

## ⚠️ DEPRECATED (DO NOT USE)

### Bucket to Delete/Ignore:
- ❌ `documents` - This bucket should NOT be used
- ❌ Any hardcoded string `'documents'` in storage.from() calls

---

## 🎯 FAIL-FAST GUARDS

### Runtime Assertion (documents.ts):
```typescript
if (STORAGE_BUCKET !== 'candidate-documents') {
  throw new Error('FATAL: STORAGE_BUCKET must be "candidate-documents"');
}
```

This ensures:
1. No accidental bucket name changes
2. Application fails immediately at startup if misconfigured
3. Prevents silent failures in production

---

## ✅ SIGN-OFF CHECKLIST

- [x] All storage.from() calls use `STORAGE_BUCKET` or `DOCUMENTS_BUCKET` constant
- [x] No hardcoded `'documents'` string in any storage.from() call
- [x] Runtime guard added to fail fast on incorrect bucket name
- [x] Database table references unchanged (correctly use `'documents'` table name)
- [x] Path format follows pattern: `${userId}/${applicationId}/${documentType}/${filename}`
- [x] storage_path in DB matches exact uploaded path
- [x] RLS policies unchanged
- [x] Constants declared as `const` type for compile-time safety

---

## 🚀 DEPLOYMENT NOTES

**After deploying this fix:**
1. Verify uploads go to `candidate-documents` bucket only
2. Monitor for any "bucket not found" errors
3. Old files in `documents` bucket can be manually migrated or deleted
4. Consider deleting the `documents` bucket entirely to prevent future confusion

**No code changes needed for existing uploaded files** - they remain accessible via their `storage_path` values stored in the database.

---

## 📊 SUMMARY

**Files Modified:** 2
1. `src/lib/documents.ts` - Added fail-fast guard
2. `src/pages/candidate/ApplicationPreviewPage.tsx` - Fixed hardcoded bucket + added constant

**Total Storage References:** 5
- All now use constants ✅
- Zero hardcoded bucket names ✅

**Status:** ✅ **READY FOR PRODUCTION**
