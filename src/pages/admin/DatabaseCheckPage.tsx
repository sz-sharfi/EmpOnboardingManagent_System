import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function DatabaseCheckPage() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkDatabase = async () => {
    setLoading(true);
    const checks: any = {
      timestamp: new Date().toISOString(),
      auth: null,
      profiles: null,
      applications: null,
      documents: null,
      errors: []
    };

    try {
      // Check auth
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      checks.auth = {
        user: user ? { id: user.id, email: user.email } : null,
        error: authError?.message
      };

      // Check profiles
      const { data: profilesData, error: profilesError, count: profilesCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' });
      checks.profiles = {
        count: profilesCount,
        data: profilesData?.slice(0, 3),
        error: profilesError?.message
      };

      // Check applications
      const { data: appsData, error: appsError, count: appsCount } = await supabase
        .from('candidate_applications')
        .select('*', { count: 'exact' });
      checks.applications = {
        count: appsCount,
        data: appsData?.slice(0, 3),
        error: appsError?.message
      };

      // Check documents
      const { data: docsData, error: docsError, count: docsCount } = await supabase
        .from('documents')
        .select('*', { count: 'exact' });
      checks.documents = {
        count: docsCount,
        data: docsData?.slice(0, 3),
        error: docsError?.message
      };

    } catch (error: any) {
      checks.errors.push(error.message);
    }

    setResults(checks);
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Database Connection Check</h1>
      
      <button
        onClick={checkDatabase}
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? 'Checking...' : 'Run Database Check'}
      </button>

      {results && (
        <div className="mt-8 space-y-6">
          {/* Auth Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              {results.auth?.user ? '✅' : '❌'} Authentication
            </h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(results.auth, null, 2)}
            </pre>
          </div>

          {/* Profiles */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              {results.profiles?.error ? '❌' : '✅'} Profiles Table
            </h2>
            <div className="mb-2">
              <span className="font-medium">Total Records: </span>
              <span className="text-2xl font-bold">{results.profiles?.count ?? 'N/A'}</span>
            </div>
            {results.profiles?.error && (
              <div className="bg-red-100 text-red-800 p-3 rounded mb-4">
                Error: {results.profiles.error}
              </div>
            )}
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(results.profiles?.data, null, 2)}
            </pre>
          </div>

          {/* Applications */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              {results.applications?.error ? '❌' : '✅'} Candidate Applications Table
            </h2>
            <div className="mb-2">
              <span className="font-medium">Total Records: </span>
              <span className="text-2xl font-bold">{results.applications?.count ?? 'N/A'}</span>
            </div>
            {results.applications?.error && (
              <div className="bg-red-100 text-red-800 p-3 rounded mb-4">
                Error: {results.applications.error}
              </div>
            )}
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(results.applications?.data, null, 2)}
            </pre>
          </div>

          {/* Documents */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              {results.documents?.error ? '❌' : '✅'} Documents Table
            </h2>
            <div className="mb-2">
              <span className="font-medium">Total Records: </span>
              <span className="text-2xl font-bold">{results.documents?.count ?? 'N/A'}</span>
            </div>
            {results.documents?.error && (
              <div className="bg-red-100 text-red-800 p-3 rounded mb-4">
                Error: {results.documents.error}
              </div>
            )}
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(results.documents?.data, null, 2)}
            </pre>
          </div>

          {/* General Errors */}
          {results.errors.length > 0 && (
            <div className="bg-red-100 text-red-800 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">❌ Errors</h2>
              <ul className="list-disc pl-6 space-y-2">
                {results.errors.map((error: string, idx: number) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
