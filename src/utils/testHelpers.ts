/**
 * Test Helpers and Debug Utilities
 * Use these functions to debug authentication, database, and storage issues
 */

import { supabase } from '../lib/supabase';

/**
 * Check if user is authenticated and log details
 */
export async function checkAuthState() {
  console.group('🔐 Authentication State Check');
  
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session Error:', sessionError);
      return { authenticated: false, error: sessionError };
    }

    if (!session) {
      console.warn('⚠️ No active session');
      return { authenticated: false, session: null };
    }

    console.log('✅ Session found');
    console.log('User ID:', session.user.id);
    console.log('Email:', session.user.email);
    console.log('Session expires:', new Date(session.expires_at! * 1000).toLocaleString());

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      console.error('❌ Profile Error:', profileError);
      return { authenticated: true, session, profile: null, error: profileError };
    }

    console.log('✅ Profile found');
    console.log('Role:', profile.role);
    console.log('Full Name:', profile.full_name);
    
    console.groupEnd();
    
    return { authenticated: true, session, profile, error: null };
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    console.groupEnd();
    return { authenticated: false, error: err };
  }
}

/**
 * Verify database connection and basic queries
 */
export async function verifyDatabaseConnection() {
  console.group('🗄️ Database Connection Check');
  
  try {
    // Test 1: Simple query
    console.log('Test 1: Checking profiles table...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('count');

    if (profilesError) {
      console.error('❌ Profiles query failed:', profilesError);
      return { connected: false, error: profilesError };
    }
    console.log('✅ Profiles table accessible');

    // Test 2: Applications table
    console.log('Test 2: Checking candidate_applications table...');
    const { data: apps, error: appsError } = await supabase
      .from('candidate_applications')
      .select('count');

    if (appsError) {
      console.error('❌ Applications query failed:', appsError);
      return { connected: false, error: appsError };
    }
    console.log('✅ Applications table accessible');

    // Test 3: Documents table
    console.log('Test 3: Checking documents table...');
    const { data: docs, error: docsError } = await supabase
      .from('documents')
      .select('count');

    if (docsError) {
      console.error('❌ Documents query failed:', docsError);
      return { connected: false, error: docsError };
    }
    console.log('✅ Documents table accessible');

    console.log('✅ All database tables accessible');
    console.groupEnd();
    
    return { connected: true, error: null };
  } catch (err) {
    console.error('❌ Database connection error:', err);
    console.groupEnd();
    return { connected: false, error: err };
  }
}

/**
 * Test RLS policies for current user
 */
export async function testRLSPolicies() {
  console.group('🔒 RLS Policy Test');
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('⚠️ No authenticated user - cannot test RLS');
      console.groupEnd();
      return { success: false, error: 'Not authenticated' };
    }

    console.log('Testing RLS for user:', user.email);

    // Get user profile to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    console.log('User role:', profile?.role);

    // Test 1: Can user view their own profile?
    console.log('\nTest 1: View own profile');
    const { data: ownProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('❌ Cannot view own profile:', profileError);
    } else {
      console.log('✅ Can view own profile');
    }

    // Test 2: Can user create application?
    if (profile?.role === 'candidate') {
      console.log('\nTest 2: Create application (candidate)');
      const { error: createError } = await supabase
        .from('candidate_applications')
        .insert({
          user_id: user.id,
          status: 'draft',
          form_data: { test: true }
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Cannot create application:', createError);
      } else {
        console.log('✅ Can create application');
      }
    }

    // Test 3: Can user view applications?
    console.log('\nTest 3: View applications');
    const { data: userApps, error: appsError } = await supabase
      .from('candidate_applications')
      .select('*');

    if (appsError) {
      console.error('❌ Cannot view applications:', appsError);
    } else {
      console.log(`✅ Can view ${userApps?.length || 0} application(s)`);
    }

    // Test 4: Admin-only test
    if (profile?.role === 'admin') {
      console.log('\nTest 4: View all profiles (admin only)');
      const { data: allProfiles, error: allProfilesError } = await supabase
        .from('profiles')
        .select('count');

      if (allProfilesError) {
        console.error('❌ Cannot view all profiles:', allProfilesError);
      } else {
        console.log('✅ Can view all profiles (admin access)');
      }
    }

    console.log('\n✅ RLS policy tests completed');
    console.groupEnd();
    
    return { success: true, role: profile?.role };
  } catch (err) {
    console.error('❌ RLS test error:', err);
    console.groupEnd();
    return { success: false, error: err };
  }
}

/**
 * Test storage bucket access
 */
export async function testStorageAccess() {
  console.group('📁 Storage Access Test');
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('⚠️ No authenticated user - cannot test storage');
      console.groupEnd();
      return { success: false, error: 'Not authenticated' };
    }

    // Test 1: List buckets
    console.log('Test 1: Listing storage buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    if (bucketsError) {
      console.error('❌ Cannot list buckets:', bucketsError);
    } else {
      console.log('✅ Available buckets:', buckets.map(b => b.name).join(', '));
    }

    // Test 2: Check candidate-documents bucket
    console.log('\nTest 2: Checking candidate-documents bucket...');
    const { data: docFiles, error: docError } = await supabase.storage
      .from('candidate-documents')
      .list();

    if (docError) {
      console.error('❌ Cannot access candidate-documents:', docError);
    } else {
      console.log('✅ candidate-documents bucket accessible');
      console.log(`Found ${docFiles?.length || 0} file(s)`);
    }

    // Test 3: Check profile-photos bucket
    console.log('\nTest 3: Checking profile-photos bucket...');
    const { data: photoFiles, error: photoError } = await supabase.storage
      .from('profile-photos')
      .list();

    if (photoError) {
      console.error('❌ Cannot access profile-photos:', photoError);
    } else {
      console.log('✅ profile-photos bucket accessible');
      console.log(`Found ${photoFiles?.length || 0} file(s)`);
    }

    console.log('\n✅ Storage access tests completed');
    console.groupEnd();
    
    return { success: true };
  } catch (err) {
    console.error('❌ Storage test error:', err);
    console.groupEnd();
    return { success: false, error: err };
  }
}

/**
 * Comprehensive health check
 */
export async function runHealthCheck() {
  console.clear();
  console.log('🏥 Running System Health Check...\n');
  
  const results = {
    auth: await checkAuthState(),
    database: await verifyDatabaseConnection(),
    rls: await testRLSPolicies(),
    storage: await testStorageAccess(),
  };

  console.log('\n' + '='.repeat(50));
  console.log('📊 HEALTH CHECK SUMMARY');
  console.log('='.repeat(50));
  console.log('Authentication:', results.auth.authenticated ? '✅ PASS' : '❌ FAIL');
  console.log('Database:', results.database.connected ? '✅ PASS' : '❌ FAIL');
  console.log('RLS Policies:', results.rls.success ? '✅ PASS' : '❌ FAIL');
  console.log('Storage:', results.storage.success ? '✅ PASS' : '❌ FAIL');
  console.log('='.repeat(50));

  return results;
}

/**
 * Log environment variables (safe - hides sensitive data)
 */
export function checkEnvironment() {
  console.group('🌍 Environment Check');
  
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  console.log('VITE_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.log('VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Set' : '❌ Missing');
  
  if (supabaseUrl) {
    console.log('Supabase URL:', supabaseUrl);
  }
  
  if (supabaseKey) {
    console.log('Anon Key:', supabaseKey.substring(0, 20) + '...[HIDDEN]');
  }

  console.groupEnd();
}

/**
 * Debug helper to log application state
 */
export async function debugApplicationState(applicationId: string) {
  console.group(`📋 Application Debug: ${applicationId}`);
  
  try {
    // Get application
    const { data: app, error: appError } = await supabase
      .from('candidate_applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (appError) {
      console.error('❌ Application not found:', appError);
      console.groupEnd();
      return;
    }

    console.log('Application Details:');
    console.log('- ID:', app.id);
    console.log('- User ID:', app.user_id);
    console.log('- Status:', app.status);
    console.log('- Progress:', app.progress_percent + '%');
    console.log('- Submitted:', app.submitted_at || 'Not submitted');
    console.log('- Form Data:', app.form_data);

    // Get documents
    const { data: docs, error: docsError } = await supabase
      .from('documents')
      .select('*')
      .eq('application_id', applicationId);

    if (docsError) {
      console.error('❌ Documents error:', docsError);
    } else {
      console.log(`\nDocuments (${docs?.length || 0}):`);
      docs?.forEach(doc => {
        console.log(`- ${doc.document_type}: ${doc.verification_status}`);
      });
    }

    console.groupEnd();
  } catch (err) {
    console.error('❌ Debug error:', err);
    console.groupEnd();
  }
}

/**
 * Test file upload capability
 */
export async function testFileUpload() {
  console.group('📤 File Upload Test');
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('❌ Not authenticated');
      console.groupEnd();
      return { success: false };
    }

    // Create a small test file
    const testContent = 'This is a test file';
    const testFile = new Blob([testContent], { type: 'text/plain' });
    const fileName = `test-${Date.now()}.txt`;
    const filePath = `${user.id}/${fileName}`;

    console.log('Uploading test file:', fileName);

    const { data, error } = await supabase.storage
      .from('candidate-documents')
      .upload(filePath, testFile);

    if (error) {
      console.error('❌ Upload failed:', error);
      console.groupEnd();
      return { success: false, error };
    }

    console.log('✅ Upload successful:', data.path);

    // Clean up - delete test file
    const { error: deleteError } = await supabase.storage
      .from('candidate-documents')
      .remove([filePath]);

    if (deleteError) {
      console.warn('⚠️ Could not delete test file:', deleteError);
    } else {
      console.log('✅ Test file cleaned up');
    }

    console.groupEnd();
    return { success: true };
  } catch (err) {
    console.error('❌ Upload test error:', err);
    console.groupEnd();
    return { success: false, error: err };
  }
}

// Expose to window for easy access in browser console
if (typeof window !== 'undefined') {
  (window as any).testHelpers = {
    checkAuth: checkAuthState,
    checkDB: verifyDatabaseConnection,
    testRLS: testRLSPolicies,
    testStorage: testStorageAccess,
    healthCheck: runHealthCheck,
    checkEnv: checkEnvironment,
    debugApp: debugApplicationState,
    testUpload: testFileUpload,
  };
  
  console.log('🛠️ Test helpers loaded! Use window.testHelpers in console:');
  console.log('  - testHelpers.healthCheck()');
  console.log('  - testHelpers.checkAuth()');
  console.log('  - testHelpers.checkDB()');
  console.log('  - testHelpers.testRLS()');
  console.log('  - testHelpers.testStorage()');
  console.log('  - testHelpers.testUpload()');
  console.log('  - testHelpers.debugApp(appId)');
}
