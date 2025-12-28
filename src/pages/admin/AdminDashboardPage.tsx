import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, FileText, BarChart, Settings, Search, Bell, Eye, CheckCircle, XCircle, Clock, Users, LogOut } from 'lucide-react';
import supabase from '../../utils/supabaseClient';

interface Application {
  id: string;
  user_id: string;
  status: string;
  submitted_at: string;
  created_at: string;
  form_data: {
    fullName?: string;
    postAppliedFor?: string;
    email?: string;
  };
  profiles: {
    email: string;
    full_name: string;
  };
}

interface Metrics {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    submitted: 'bg-blue-100 text-blue-800',
    pending: 'bg-gray-100 text-gray-800',
    under_review: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    accepted: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    documents_pending: 'bg-blue-100 text-blue-800',
    completed: 'bg-purple-100 text-purple-800',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors[status] || colors.pending}`}>
      {status.replace(/_/g, ' ').toUpperCase()}
    </span>
  );
};

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState('Admin User');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);

      // Fetch admin profile
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', user.id)
          .single();
        
        if (profile?.full_name) {
          setAdminName(profile.full_name);
        }
      }

      // Fetch recent applications (last 7, excluding drafts)
      const { data: appsData, error: appsError } = await supabase
        .from('applications')
        .select(`
          id,
          user_id,
          status,
          submitted_at,
          created_at,
          form_data,
          profiles!applications_user_id_fkey (
            email,
            full_name
          )
        `)
        .neq('status', 'draft')
        .order('created_at', { ascending: false })
        .limit(7);

      if (appsError) throw appsError;
      
      // Transform data to match interface
      const transformedApps = (appsData || []).map(app => ({
        ...app,
        profiles: Array.isArray(app.profiles) ? app.profiles[0] : app.profiles
      })) as Application[];
      
      setApplications(transformedApps);

      // Calculate metrics
      const { data: allApps, error: metricsError } = await supabase
        .from('applications')
        .select('status')
        .neq('status', 'draft');

      if (metricsError) throw metricsError;

      const calculatedMetrics = {
        total: allApps?.length || 0,
        pending: allApps?.filter(a => a.status === 'submitted' || a.status === 'under_review').length || 0,
        approved: allApps?.filter(a => a.status === 'accepted').length || 0,
        rejected: allApps?.filter(a => a.status === 'rejected').length || 0,
      };

      setMetrics(calculatedMetrics);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const { error } = await supabase.rpc('approve_application', { p_app_id: id });
      
      if (error) throw error;
      
      alert('Application approved successfully!');
      fetchAdminData(); // Refresh data
    } catch (error) {
      console.error('Error approving application:', error);
      alert('Failed to approve application');
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      const { error } = await supabase.rpc('reject_application', { 
        p_app_id: id,
        p_rejection_reason: reason
      });
      
      if (error) throw error;
      
      alert('Application rejected');
      fetchAdminData(); // Refresh data
    } catch (error) {
      console.error('Error rejecting application:', error);
      alert('Failed to reject application');
    }
  };

  const handleView = (id: string) => {
    navigate(`/admin/applications/${id}`);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login');
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

          <div className="hidden md:flex items-center gap-3">
            <div className="relative">
              <Search size={18} className="text-gray-400 absolute left-3 top-2.5" />
              <input className="input-field pl-10 w-96" placeholder="Search applications..." />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">3</span>
            </div>
            <div className="relative">
              <button onClick={() => setProfileOpen((s) => !s)} className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold">
                  {adminName.charAt(0).toUpperCase()}
                </div>
                <span className="font-medium">{adminName}</span>
              </button>
              {profileOpen && (
                <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 w-48">
                  <button className="w-full text-left px-4 py-2 hover:bg-gray-50">Profile</button>
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 text-red-600 flex items-center gap-2"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`fixed top-16 left-0 h-[calc(100vh-64px)] w-64 bg-white border-r p-4 hidden md:block`}> 
        <nav className="space-y-2">
          <Link to="/admin/dashboard" className="flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-600 rounded">
            <Home size={20} />
            <span className="font-medium">Dashboard</span>
          </Link>
          <Link to="/admin/applications" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded cursor-pointer">
            <FileText size={20} />
            <span>Applications</span>
          </Link>
          <Link to="/admin/reports" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded cursor-pointer">
            <BarChart size={20} />
            <span>Reports</span>
          </Link>
          <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded cursor-pointer">
            <Settings size={20} />
            <span>Settings</span>
          </div>
        </nav>
      </aside>

      {/* Main */}
      <main className="md:ml-64 mt-16 p-4 md:p-8">
        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <Users size={40} className="text-blue-500" />
              <div>
                <div className="text-3xl font-bold">{loading ? '...' : metrics.total}</div>
                <div className="text-gray-600">Total Applications</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <Clock size={40} className="text-orange-500" />
              <div>
                <div className="text-3xl font-bold text-orange-600">{loading ? '...' : metrics.pending}</div>
                <div className="text-gray-600">Pending Review</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <CheckCircle size={40} className="text-green-500" />
              <div>
                <div className="text-3xl font-bold text-green-600">{loading ? '...' : metrics.approved}</div>
                <div className="text-gray-600">Approved</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <XCircle size={40} className="text-red-500" />
              <div>
                <div className="text-3xl font-bold text-red-600">{loading ? '...' : metrics.rejected}</div>
                <div className="text-gray-600">Rejected</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Applications Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="flex justify-between items-center p-6 border-b">
            <h3 className="text-xl font-semibold">Recent Applications</h3>
            <Link to="/admin/applications" className="text-blue-600 hover:underline">View All</Link>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading applications...</div>
          ) : applications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No applications submitted yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="text-left text-sm text-gray-600 bg-gray-50">
                    <th className="px-6 py-3">S.No</th>
                    <th className="px-6 py-3">Candidate</th>
                    <th className="px-6 py-3">Post</th>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app, idx) => {
                    const candidateName = app.form_data?.fullName || app.profiles?.full_name || 'N/A';
                    const candidateEmail = app.form_data?.email || app.profiles?.email || '';
                    const post = app.form_data?.postAppliedFor || 'N/A';
                    const date = app.submitted_at 
                      ? new Date(app.submitted_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                      : new Date(app.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

                    return (
                      <tr key={app.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition`}>
                        <td className="px-6 py-4 align-top">{idx + 1}</td>
                        <td className="px-6 py-4 align-top">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                              {candidateName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium">{candidateName}</div>
                              <div className="text-sm text-gray-500">{candidateEmail || '—'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 align-top">{post}</td>
                        <td className="px-6 py-4 align-top text-sm">{date}</td>
                        <td className="px-6 py-4 align-top"><StatusBadge status={app.status} /></td>
                        <td className="px-6 py-4 align-top">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleView(app.id)} 
                              className="p-2 hover:bg-gray-200 rounded transition"
                              title="View Details"
                            >
                              <Eye size={18} className="text-blue-600" />
                            </button>
                            {app.status !== 'accepted' && app.status !== 'approved' && app.status !== 'rejected' && (
                              <>
                                <button 
                                  onClick={() => handleApprove(app.id)} 
                                  className="p-2 hover:bg-green-50 rounded transition"
                                  title="Approve"
                                >
                                  <CheckCircle size={18} className="text-green-600" />
                                </button>
                                <button 
                                  onClick={() => handleReject(app.id)} 
                                  className="p-2 hover:bg-red-50 rounded transition"
                                  title="Reject"
                                >
                                  <XCircle size={18} className="text-red-600" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
