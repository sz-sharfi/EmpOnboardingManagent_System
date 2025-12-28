import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, FileText, BarChart, Settings, Bell, Download, Calendar } from 'lucide-react';
import supabase from '../../utils/supabaseClient';

interface Statistics {
  total_applications: number;
  pending_review: number;
  approved: number;
  rejected: number;
  documents_pending: number;
  completed: number;
}

interface Application {
  id: string;
  user_id: string;
  status: string;
  submitted_at: string;
  created_at: string;
  form_data: {
    fullName?: string;
    postAppliedFor?: string;
  };
  profiles: {
    email: string;
    full_name: string;
  };
}

export default function ReportsPage() {
  const navigate = useNavigate();
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [dateRange, setDateRange] = useState('this_month');

  useEffect(() => {
    fetchStatistics();
    fetchApplications();
  }, []);

  const fetchStatistics = async () => {
    try {
      const { data, error } = await supabase.rpc('get_admin_statistics');
      if (error) throw error;
      if (data && data.length > 0) {
        setStatistics(data[0]);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          profiles!applications_user_id_fkey (
            email,
            full_name
          )
        `)
        .neq('status', 'draft')
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = () => {
    const csv = [
      ['Date', 'Candidate', 'Email', 'Post', 'Status', 'Submitted Date', 'Processing Time (days)'],
      ...applications.map(app => {
        const submittedDate = app.submitted_at ? new Date(app.submitted_at) : null;
        const currentDate = new Date();
        const processingDays = submittedDate 
          ? Math.floor((currentDate.getTime() - submittedDate.getTime()) / (1000 * 60 * 60 * 24))
          : 'N/A';
        
        return [
          new Date(app.created_at).toLocaleDateString(),
          app.form_data.fullName || app.profiles.full_name || '',
          app.profiles.email,
          app.form_data.postAppliedFor || '',
          app.status,
          submittedDate ? submittedDate.toLocaleDateString() : 'N/A',
          processingDays.toString()
        ];
      })
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `application_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const calculateAverageProcessingTime = () => {
    const completedApps = applications.filter(app => 
      (app.status === 'accepted' || app.status === 'rejected') && app.submitted_at
    );
    
    if (completedApps.length === 0) return 0;
    
    const totalDays = completedApps.reduce((sum, app) => {
      const submittedDate = new Date(app.submitted_at);
      const currentDate = new Date();
      const days = Math.floor((currentDate.getTime() - submittedDate.getTime()) / (1000 * 60 * 60 * 24));
      return sum + days;
    }, 0);
    
    return Math.round(totalDays / completedApps.length);
  };

  const getApprovalRate = () => {
    const total = (statistics?.approved || 0) + (statistics?.rejected || 0);
    if (total === 0) return 0;
    return Math.round(((statistics?.approved || 0) / total) * 100);
  };

  const getApplicationsByMonth = () => {
    const months: Record<string, number> = {};
    applications.forEach(app => {
      const month = new Date(app.created_at).toLocaleString('default', { month: 'short', year: 'numeric' });
      months[month] = (months[month] || 0) + 1;
    });
    return Object.entries(months).slice(-6);
  };

  const getApplicationsByPost = () => {
    const posts: Record<string, number> = {};
    applications.forEach(app => {
      const post = app.form_data.postAppliedFor || 'Not Specified';
      posts[post] = (posts[post] || 0) + 1;
    });
    return Object.entries(posts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Nav */}
      <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Home size={22} className="text-blue-600" />
            <span className="font-bold">Admin Portal</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Bell size={20} />
            </div>
            <div className="relative">
              <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-200" />
                <span className="font-medium">Admin User</span>
              </button>
              {profileOpen && (
                <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 w-48">
                  <button className="w-full text-left px-4 py-2 hover:bg-gray-50">Profile</button>
                  <button onClick={() => navigate('/admin/login')} className="w-full text-left px-4 py-2 hover:bg-gray-50">Logout</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className="fixed top-16 left-0 h-[calc(100vh-64px)] w-64 bg-white border-r p-4 hidden md:block">
        <nav className="space-y-2">
          <Link to="/admin/dashboard" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded">
            <Home size={20} />
            <span>Dashboard</span>
          </Link>
          <Link to="/admin/applications" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded">
            <FileText size={20} />
            <span>Applications</span>
          </Link>
          <Link to="/admin/documents" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded">
            <FileText size={20} />
            <span>Document Review</span>
          </Link>
          <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-600 rounded">
            <BarChart size={20} />
            <span className="font-medium">Reports</span>
          </div>
          <Link to="/admin/settings" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded">
            <Settings size={20} />
            <span>Settings</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 pt-20 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
              <p className="text-gray-600 mt-1">Overview of application statistics and trends</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                className="input-field"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              >
                <option value="this_week">This Week</option>
                <option value="this_month">This Month</option>
                <option value="this_quarter">This Quarter</option>
                <option value="custom">Custom Range</option>
              </select>
              <button onClick={handleExportReport} className="btn-primary flex items-center gap-2">
                <Download size={18} />
                Export Report
              </button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Processed</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {statistics?.total_applications || 0}
                  </p>
                </div>
                <FileText size={32} className="text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Processing Time</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {calculateAverageProcessingTime()}
                    <span className="text-sm font-normal text-gray-600 ml-1">days</span>
                  </p>
                </div>
                <Calendar size={32} className="text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Approval Rate</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {getApprovalRate()}%
                  </p>
                </div>
                <BarChart size={32} className="text-purple-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Review</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {statistics?.pending_review || 0}
                  </p>
                </div>
                <FileText size={32} className="text-yellow-600" />
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Applications Over Time */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Applications Over Time</h3>
              <div className="h-64 flex items-end justify-between gap-2">
                {getApplicationsByMonth().map(([month, count]) => {
                  const maxCount = Math.max(...getApplicationsByMonth().map(([, c]) => c));
                  const height = (count / maxCount) * 100;
                  return (
                    <div key={month} className="flex-1 flex flex-col items-center">
                      <div className="text-sm font-medium text-gray-900 mb-2">{count}</div>
                      <div
                        className="w-full bg-blue-600 rounded-t"
                        style={{ height: `${height}%`, minHeight: '20px' }}
                      />
                      <div className="text-xs text-gray-600 mt-2 -rotate-45 origin-top-left whitespace-nowrap">
                        {month}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Status Distribution */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Status Distribution</h3>
              <div className="space-y-4">
                {[
                  { label: 'Pending Review', count: statistics?.pending_review || 0, color: 'bg-yellow-500' },
                  { label: 'Approved', count: statistics?.approved || 0, color: 'bg-green-500' },
                  { label: 'Rejected', count: statistics?.rejected || 0, color: 'bg-red-500' },
                  { label: 'Documents Pending', count: statistics?.documents_pending || 0, color: 'bg-blue-500' },
                  { label: 'Completed', count: statistics?.completed || 0, color: 'bg-purple-500' },
                ].map(({ label, count, color }) => {
                  const total = statistics?.total_applications || 1;
                  const percentage = (count / total) * 100;
                  return (
                    <div key={label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{label}</span>
                        <span className="text-sm text-gray-600">{count} ({Math.round(percentage)}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className={`${color} h-2 rounded-full`} style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Applications by Department/Post */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Applications by Position</h3>
            <div className="space-y-3">
              {getApplicationsByPost().map(([post, count]) => {
                const maxCount = Math.max(...getApplicationsByPost().map(([, c]) => c));
                const percentage = (count / maxCount) * 100;
                return (
                  <div key={post} className="flex items-center gap-4">
                    <div className="w-48 text-sm font-medium text-gray-700 truncate">{post}</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-8 relative">
                      <div
                        className="bg-blue-600 h-8 rounded-full flex items-center justify-end pr-3"
                        style={{ width: `${percentage}%`, minWidth: '40px' }}
                      >
                        <span className="text-white text-sm font-medium">{count}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Application Log */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-6 border-b">
              <h3 className="text-lg font-bold text-gray-900">Detailed Application Log</h3>
            </div>
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading data...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Candidate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Post</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Processing Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {applications.slice(0, 10).map((app) => {
                      const submittedDate = app.submitted_at ? new Date(app.submitted_at) : null;
                      const currentDate = new Date();
                      const processingDays = submittedDate 
                        ? Math.floor((currentDate.getTime() - submittedDate.getTime()) / (1000 * 60 * 60 * 24))
                        : null;
                      
                      return (
                        <tr key={app.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {new Date(app.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {app.form_data.fullName || app.profiles.full_name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {app.form_data.postAppliedFor || 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              app.status === 'accepted' ? 'bg-green-100 text-green-800' :
                              app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              app.status === 'under_review' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {app.status.replace(/_/g, ' ').toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {processingDays !== null ? `${processingDays} days` : 'N/A'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
