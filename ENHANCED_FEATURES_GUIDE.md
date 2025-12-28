# Quick Start Guide - Enhanced Features

## Prerequisites
- Supabase project set up
- Initial migration (001_init.sql) already applied
- Storage bucket 'documents' created
- Frontend dependencies installed

## Step 1: Apply Database Migration

### Using Supabase CLI (Recommended)
```bash
cd supabase
supabase db push
```

### Using Supabase Dashboard
1. Go to your Supabase project
2. Navigate to SQL Editor
3. Copy contents of `supabase/migrations/002_enhanced_features.sql`
4. Paste and run in SQL Editor

## Step 2: Verify Storage Bucket

1. Go to Supabase Dashboard > Storage
2. Ensure `documents` bucket exists
3. Verify it's set to **Private** (not public)
4. Storage policies should already be applied from migration

## Step 3: Start the Application

```bash
# Install dependencies (if not done)
npm install

# Start development server
npm run dev
```

## Step 4: Test New Features

### Test as Candidate

1. **Navigate to Candidate Login**
   - URL: `http://localhost:5173/candidate/login`
   - Sign in with test credentials

2. **View Enhanced Dashboard**
   - Click "Track Application Status" card
   - Should show new status tracking page

3. **Check Status Page**
   - URL: `http://localhost:5173/candidate/status`
   - View timeline
   - See activity log
   - Check progress

4. **Upload Documents** (if application approved)
   - URL: `http://localhost:5173/candidate/documents`
   - Upload required documents
   - See upload status

### Test as Admin

1. **Navigate to Admin Login**
   - URL: `http://localhost:5173/admin/login`
   - Sign in as admin

2. **View Application List**
   - URL: `http://localhost:5173/admin/applications`
   - Search and filter applications
   - Try sorting options
   - Export to CSV

3. **Review Application Details**
   - Click "View" on any application
   - Approve or reject application
   - Add admin notes

4. **Review Documents**
   - URL: `http://localhost:5173/admin/documents`
   - View all pending documents
   - Click "View" to open document viewer
   - Verify or reject documents
   - Try bulk verify all

5. **View Reports**
   - URL: `http://localhost:5173/admin/reports`
   - Check statistics
   - View charts
   - Export report

## Database Testing

### Test Activity Logging

```sql
-- View all activities for an application
SELECT * FROM get_application_timeline('your-app-uuid-here');

-- View all activities
SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 10;
```

### Test Notifications

```sql
-- View notifications for current user
SELECT * FROM notifications WHERE user_id = auth.uid() ORDER BY created_at DESC;

-- Mark a notification as read
SELECT mark_notification_as_read('notification-uuid-here');

-- Mark all as read
SELECT mark_all_notifications_as_read();
```

### Test Admin Functions

```sql
-- Get statistics
SELECT * FROM get_admin_statistics();

-- Approve an application
SELECT * FROM approve_application(
  'app-uuid-here',
  'Application looks good. Please upload documents.'
);

-- Reject an application
SELECT * FROM reject_application(
  'app-uuid-here',
  'Incomplete Information',
  'Missing required educational qualifications.'
);

-- Verify a document
SELECT * FROM verify_document(
  'doc-uuid-here',
  true,  -- approved
  null   -- no rejection reason
);

-- Reject a document
SELECT * FROM verify_document(
  'doc-uuid-here',
  false,  -- not approved
  'Image is too blurry. Please upload a clearer version.'
);
```

## Common Issues & Solutions

### Issue: Migration Fails
**Solution:** 
- Ensure 001_init.sql was applied first
- Check for any conflicting table names
- Verify Supabase connection

### Issue: Storage Upload Fails
**Solution:**
- Verify `documents` bucket exists
- Check bucket is set to Private
- Ensure storage policies are applied
- Check file size limits (5MB default)

### Issue: RLS Errors
**Solution:**
```sql
-- Check if is_admin() function exists
SELECT is_admin();

-- Verify user profile exists
SELECT * FROM profiles WHERE user_id = auth.uid();

-- Check if user has admin role
SELECT role FROM profiles WHERE user_id = auth.uid();
```

### Issue: No Notifications Created
**Solution:**
- Check if triggers are enabled
- Verify create_notification function exists
- Check notifications table RLS policies
- Look for errors in Supabase logs

### Issue: Activity Logs Not Showing
**Solution:**
- Verify triggers are active:
```sql
SELECT * FROM pg_trigger WHERE tgname LIKE '%log%';
```
- Check activity_logs table:
```sql
SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 5;
```

## Feature Highlights

### 🎯 For Candidates
- **Status Tracking**: Real-time application status with visual timeline
- **Activity Feed**: See all updates and actions taken
- **Document Upload**: Easy upload with progress tracking
- **Notifications**: Get notified of important updates

### 🔧 For Admins
- **Application Management**: Search, filter, sort applications
- **Document Review**: Verify or reject documents with reasons
- **Reports & Analytics**: Visual insights and statistics
- **Bulk Operations**: Process multiple items efficiently
- **Export Data**: CSV export for external analysis

### 📊 Automated Features
- **Activity Logging**: All actions automatically logged
- **Notifications**: Auto-notify users on key events
- **Progress Tracking**: Automatic progress calculation
- **Status Updates**: Real-time status synchronization

## Available Routes

### Candidate Routes
| Route | Description |
|-------|-------------|
| `/candidate/login` | Login page |
| `/candidate/dashboard` | Main dashboard |
| `/candidate/apply` | Application form |
| `/candidate/application/preview` | View submitted application |
| `/candidate/documents` | Upload documents |
| `/candidate/status` | **NEW** - Track application status |

### Admin Routes
| Route | Description |
|-------|-------------|
| `/admin/login` | Admin login |
| `/admin/dashboard` | Admin dashboard |
| `/admin/applications` | **NEW** - List all applications |
| `/admin/applications/:id` | View application details |
| `/admin/documents` | **NEW** - Review all documents |
| `/admin/documents/:appId` | **NEW** - Review app-specific docs |
| `/admin/reports` | **NEW** - Reports and analytics |

## Environment Variables

Ensure your `.env` file has:
```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Database Schema Overview

### New Tables
- `activity_logs` - Timeline of all actions
- `notifications` - User notifications

### Enhanced Tables
- `documents` - Added verification fields
- `applications` - Added review fields

### New Functions
- `approve_application()`
- `reject_application()`
- `verify_document()`
- `get_application_timeline()`
- `get_admin_statistics()`
- And more...

## Next Steps

1. ✅ Apply database migration
2. ✅ Test candidate portal features
3. ✅ Test admin portal features
4. ✅ Verify notifications work
5. ✅ Test document upload/review
6. 📋 Implement remaining features (Settings, Email templates, etc.)

## Support

For detailed information, see:
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Complete feature documentation
- [README.md](./README.md) - Project overview
- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Supabase configuration

## Tips

- Use browser DevTools Network tab to debug API calls
- Check Supabase Dashboard > Logs for backend errors
- Use React DevTools to inspect component state
- Check browser console for frontend errors

Happy Testing! 🚀
