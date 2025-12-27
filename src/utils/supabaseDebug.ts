import supabase from './supabaseClient';

/**
 * Test Supabase Connection and Database Setup
 * Run this in browser console or add a test button to call it
 */
export async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase Connection...\n');
  
  // Test 1: Check Supabase client initialization
  try {
    console.log('✓ Supabase client initialized');
    console.log('  URL:', import.meta.env.VITE_SUPABASE_URL);
  } catch (err) {
    console.error('✗ Supabase client initialization failed:', err);
    return;
  }

  // Test 2: Check authentication status
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    
    if (user) {
      console.log('✓ User authenticated');
      console.log('  User ID:', user.id);
      console.log('  Email:', user.email);
    } else {
      console.log('⚠ No user authenticated - please login first');
      return;
    }
  } catch (err) {
    console.error('✗ Authentication check failed:', err);
    return;
  }

  // Test 3: Check profiles table
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user');
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (error) throw error;
    
    console.log('✓ Profile exists');
    console.log('  Profile:', data);
  } catch (err: any) {
    console.error('✗ Profile check failed:', err);
    if (err.message?.includes('relation') || err.message?.includes('does not exist')) {
      console.log('  💡 Run the migration script in Supabase SQL Editor');
    }
    return;
  }

  // Test 4: Check applications table
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user');
    
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('user_id', user.id);
    
    if (error) throw error;
    
    console.log('✓ Applications table accessible');
    console.log('  Found applications:', data?.length || 0);
    if (data && data.length > 0) {
      console.log('  Latest application:', data[data.length - 1]);
    }
  } catch (err: any) {
    console.error('✗ Applications table check failed:', err);
    return;
  }

  // Test 5: Try to insert a test draft
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user');
    
    const testData = {
      user_id: user.id,
      status: 'draft',
      form_data: { test: 'test_data', timestamp: new Date().toISOString() },
      preview_data: {},
      progress_percent: 0
    };
    
    const { data, error } = await supabase
      .from('applications')
      .insert(testData)
      .select('id')
      .single();
    
    if (error) throw error;
    
    console.log('✓ Test insert successful');
    console.log('  Created application ID:', data?.id);
    
    // Clean up test data
    if (data?.id) {
      await supabase.from('applications').delete().eq('id', data.id);
      console.log('✓ Test data cleaned up');
    }
  } catch (err: any) {
    console.error('✗ Test insert failed:', err);
    if (err.message?.includes('policy')) {
      console.log('  💡 Check Row Level Security policies');
    }
    return;
  }

  console.log('\n✅ All tests passed! Database is ready to use.');
}

/**
 * Check current application status
 */
export async function checkApplicationStatus(appId: string | null) {
  if (!appId) {
    console.log('No application ID provided');
    return;
  }

  try {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('id', appId)
      .single();

    if (error) throw error;

    console.log('Application status:', data);
    return data;
  } catch (err) {
    console.error('Failed to get application status:', err);
    return null;
  }
}

/**
 * List all applications for current user
 */
export async function listUserApplications() {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('Please login first');
      return;
    }

    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    console.log(`Found ${data?.length || 0} applications:`);
    data?.forEach((app, idx) => {
      console.log(`${idx + 1}. ID: ${app.id}, Status: ${app.status}, Created: ${app.created_at}`);
    });

    return data;
  } catch (err) {
    console.error('Failed to list applications:', err);
    return null;
  }
}

// Make functions available in browser console for debugging
if (typeof window !== 'undefined') {
  (window as any).testSupabase = testSupabaseConnection;
  (window as any).checkApp = checkApplicationStatus;
  (window as any).listApps = listUserApplications;
  
  console.log('🔧 Debug functions available:');
  console.log('  - testSupabase() - Test complete setup');
  console.log('  - checkApp(id) - Check application status');
  console.log('  - listApps() - List all your applications');
}

export default {
  testSupabaseConnection,
  checkApplicationStatus,
  listUserApplications
};
