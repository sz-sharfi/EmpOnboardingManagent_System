import { useState } from 'react';
import supabase from '../utils/supabaseClient';
import { testSupabaseConnection, listUserApplications } from '../utils/supabaseDebug';

/**
 * Database Test Page
 * Temporary page to test Supabase connection and database operations
 * 
 * To use:
 * 1. Add route in App.tsx: <Route path="/test-db" element={<TestDatabasePage />} />
 * 2. Navigate to /test-db in your browser
 * 3. Run tests and check console
 */
export default function TestDatabasePage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const runTest = async (testName: string, testFn: () => Promise<any>) => {
    setLoading(true);
    setResult(`Running ${testName}...`);
    
    try {
      const data = await testFn();
      setResult(`✓ ${testName} passed!\n${JSON.stringify(data, null, 2)}`);
      console.log(`✓ ${testName} passed`, data);
    } catch (error: any) {
      setResult(`✗ ${testName} failed!\n${error.message}\n${JSON.stringify(error, null, 2)}`);
      console.error(`✗ ${testName} failed`, error);
    } finally {
      setLoading(false);
    }
  };

  const tests = [
    {
      name: 'Check Auth Status',
      fn: async () => {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        return { user: data.user?.email, id: data.user?.id };
      }
    },
    {
      name: 'Check Profile',
      fn: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    {
      name: 'List Applications',
      fn: async () => {
        return await listUserApplications();
      }
    },
    {
      name: 'Create Test Draft',
      fn: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        
        const testData = {
          user_id: user.id,
          status: 'draft',
          form_data: {
            fullName: 'Test User',
            email: 'test@example.com',
            postAppliedFor: 'Test Position',
            timestamp: new Date().toISOString()
          },
          preview_data: {},
          progress_percent: 0
        };
        
        const { data, error } = await supabase
          .from('applications')
          .insert(testData)
          .select('*')
          .single();
        
        if (error) throw error;
        
        // Clean up
        if (data?.id) {
          await supabase.from('applications').delete().eq('id', data.id);
        }
        
        return { ...data, note: 'Test data was created and deleted' };
      }
    },
    {
      name: 'Full Connection Test',
      fn: async () => {
        await testSupabaseConnection();
        return { message: 'Check console for detailed results' };
      }
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Database Connection Test
          </h1>
          
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-gray-700">
              <strong>Instructions:</strong> Click any test button below to verify your database setup.
              Check the browser console (F12) for detailed logs.
            </p>
          </div>

          <div className="space-y-4 mb-8">
            {tests.map((test) => (
              <button
                key={test.name}
                onClick={() => runTest(test.name, test.fn)}
                disabled={loading}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-left font-medium"
              >
                {loading ? '⏳ Running...' : `▶ ${test.name}`}
              </button>
            ))}
          </div>

          {result && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Result:</h3>
              <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-x-auto text-sm whitespace-pre-wrap">
                {result}
              </pre>
            </div>
          )}

          <div className="mt-8 pt-6 border-t">
            <h3 className="text-lg font-semibold mb-3">Environment Check:</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className={import.meta.env.VITE_SUPABASE_URL ? 'text-green-600' : 'text-red-600'}>
                  {import.meta.env.VITE_SUPABASE_URL ? '✓' : '✗'}
                </span>
                <span className="font-medium">VITE_SUPABASE_URL:</span>
                <span className="text-gray-600">
                  {import.meta.env.VITE_SUPABASE_URL || '❌ Not set'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={import.meta.env.VITE_SUPABASE_ANON_KEY ? 'text-green-600' : 'text-red-600'}>
                  {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✓' : '✗'}
                </span>
                <span className="font-medium">VITE_SUPABASE_ANON_KEY:</span>
                <span className="text-gray-600">
                  {import.meta.env.VITE_SUPABASE_ANON_KEY ? '••••••••' : '❌ Not set'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <h3 className="text-lg font-semibold mb-2 text-yellow-800">Quick Fixes:</h3>
            <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
              <li>If tests fail, check browser console for detailed errors</li>
              <li>Make sure you're logged in (visit /candidate/login)</li>
              <li>Verify .env file exists with correct credentials</li>
              <li>Confirm migration script ran in Supabase SQL Editor</li>
              <li>Check Supabase Dashboard → Table Editor for tables</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
