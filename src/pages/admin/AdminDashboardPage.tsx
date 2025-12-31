import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, FileText, BarChart, Settings, Bell, CheckCircle, XCircle, Clock, Users, LogOut } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { signOut } from '../../lib/auth';

interface ApplicationRow {
  id: string;
  status: string;
  submitted_at: string | null;
  created_at: string | null;
}

interface Metrics {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState<{ label: string; count: number; x: number; y: number } | null>(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);

      if (!user) {
        navigate('/admin/login');
        return;
      }

      const { data, error } = await supabase
        .from('candidate_applications')
        .select('id, status, submitted_at, created_at')
        .order('submitted_at', { ascending: false, nullsLast: true })
        .order('created_at', { ascending: false });

      if (error) throw error;

      const rows = data || [];
      setApplications(rows);

      const pending = rows.filter((app) => app.status === 'submitted').length;
      const approved = rows.filter((app) => app.status === 'accepted').length;
      const rejected = rows.filter((app) => app.status === 'rejected').length;

      setMetrics({
        total: rows.length,
        pending,
        approved,
        rejected,
      });
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const statusDistribution = useMemo(() => {
    const dist = {
      submitted: applications.filter((a) => a.status === 'submitted').length,
      approved: applications.filter((a) => a.status === 'accepted').length,
      rejected: applications.filter((a) => a.status === 'rejected').length,
    };
    const total = dist.submitted + dist.approved + dist.rejected || 1;

    const percentages = {
      submitted: Math.round((dist.submitted / total) * 100),
      approved: Math.round((dist.approved / total) * 100),
      rejected: Math.round((dist.rejected / total) * 100),
    };

    return { dist, percentages, total };
  }, [applications]);

  const submissionsByDay = useMemo(() => {
    // Get last 7 days
    const last7Days: { date: string, label: string, count: number }[] = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
      const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      // Count applications for this date
      const count = applications.filter((app) => {
        const appDate = app.created_at;
        if (!appDate) return false;
        const appDateStr = new Date(appDate).toISOString().split('T')[0];
        return appDateStr === dateStr;
      }).length;
      
      last7Days.push({ date: dateStr, label, count });
    }
    
    return last7Days;
  }, [applications]);

  const donutStyle = useMemo(() => {
    const { percentages } = statusDistribution;
    const submittedSlice = percentages.submitted;
    const approvedSlice = submittedSlice + percentages.approved;
    return {
      background: `conic-gradient(
        #2563eb 0deg ${submittedSlice * 3.6}deg,
        #22c55e ${submittedSlice * 3.6}deg ${approvedSlice * 3.6}deg,
        #ef4444 ${approvedSlice * 3.6}deg 360deg
      )`,
    };
  }, [statusDistribution]);

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
              <button onClick={() => setProfileOpen((s) => !s)} className="flex items-center gap-2">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name || 'Admin'} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold">
                    {(profile?.full_name || profile?.email || 'A').charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="font-medium">{profile?.full_name || profile?.email || 'Admin'}</span>
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

        {/* Charts and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Applications - Takes 2 columns */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Recent Applications</h3>
              <Link to="/admin/applications" className="text-sm text-blue-600 hover:text-blue-700">View All</Link>
            </div>
            <div className="space-y-3">
              {loading ? (
                <p className="text-gray-500 text-center py-8">Loading...</p>
              ) : applications.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No applications yet</p>
              ) : (
                applications.slice(0, 5).map((app) => (
                  <Link
                    key={app.id}
                    to={`/admin/applications/${app.id}`}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        app.status === 'accepted' ? 'bg-green-500' :
                        app.status === 'rejected' ? 'bg-red-500' :
                        'bg-orange-500'
                      }`} />
                      <div>
                        <p className="font-medium">Application #{app.id.substring(0, 8)}</p>
                        <p className="text-sm text-gray-500">
                          {app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : 'Not submitted'}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      app.status === 'accepted' ? 'bg-green-100 text-green-800' :
                      app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {app.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Status Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Status Distribution</h3>
              <span className="text-sm text-gray-500">{statusDistribution.total} total</span>
            </div>
            <div className="flex items-center gap-6">
              <div className="relative w-32 h-32">
                <div className="w-full h-full rounded-full" style={donutStyle}></div>
                <div className="absolute inset-4 bg-white rounded-full flex flex-col items-center justify-center text-sm text-gray-700">
                  <span className="font-semibold">{statusDistribution.total}</span>
                  <span className="text-xs text-gray-500">Applications</span>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-600" />
                  <span className="flex-1">Submitted</span>
                  <span className="font-semibold">{statusDistribution.dist.submitted}</span>
                  <span className="text-gray-500">{statusDistribution.percentages.submitted}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="flex-1">Approved</span>
                  <span className="font-semibold">{statusDistribution.dist.approved}</span>
                  <span className="text-gray-500">{statusDistribution.percentages.approved}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="flex-1">Rejected</span>
                  <span className="font-semibold">{statusDistribution.dist.rejected}</span>
                  <span className="text-gray-500">{statusDistribution.percentages.rejected}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Submissions Over Time</h3>
              <span className="text-sm text-gray-500">Recent activity</span>
            </div>
            {submissionsByDay.length === 0 ? (
              <div className="text-center text-gray-500 py-6">No submissions in the selected period.</div>
            ) : (
              <div className="relative h-64">
                {/* Tooltip */}
                {hoveredPoint && (
                  <div 
                    className="absolute z-10 bg-gray-900 text-white text-xs rounded px-3 py-2 shadow-lg pointer-events-none"
                    style={{
                      left: `${(hoveredPoint.x / 800) * 100}%`,
                      top: `${(hoveredPoint.y / 240) * 100 - 20}%`,
                      transform: 'translate(-50%, -100%)'
                    }}
                  >
                    <div className="font-semibold">{hoveredPoint.label}</div>
                    <div>{hoveredPoint.count} submission{hoveredPoint.count !== 1 ? 's' : ''}</div>
                  </div>
                )}
                
                <svg width="100%" height="100%" viewBox="0 0 800 240" preserveAspectRatio="xMidYMid meet">
                  {/* Grid lines */}
                  {[0, 1, 2, 3, 4, 5].map((i) => {
                    const y = 30 + (i * 35);
                    return (
                      <g key={i}>
                        <line x1="60" y1={y} x2="760" y2={y} stroke="#e5e7eb" strokeWidth="1" />
                      </g>
                    );
                  })}
                  
                  {/* Y-axis labels */}
                  {(() => {
                    const maxCount = Math.max(...submissionsByDay.map(d => d.count), 1);
                    const step = Math.ceil(maxCount / 5);
                    return [0, 1, 2, 3, 4, 5].map((i) => {
                      const value = step * (5 - i);
                      const y = 30 + (i * 35);
                      return (
                        <text key={i} x="45" y={y + 5} fontSize="12" fill="#6b7280" textAnchor="end">
                          {value}
                        </text>
                      );
                    });
                  })()}
                  
                  {/* Line path */}
                  {(() => {
                    const maxCount = Math.max(...submissionsByDay.map(d => d.count), 1);
                    const xStep = 700 / (submissionsByDay.length - 1 || 1);
                    const points = submissionsByDay.map((d, i) => {
                      const x = 60 + (i * xStep);
                      const y = 205 - ((d.count / maxCount) * 175);
                      return { x, y, ...d };
                    });
                    
                    const pathD = points.map((p, i) => 
                      `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`
                    ).join(' ');
                    
                    return (
                      <>
                        {/* Line */}
                        <path
                          d={pathD}
                          fill="none"
                          stroke="#2563eb"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        
                        {/* Data points */}
                        {points.map((p, i) => (
                          <g key={i}>
                            <circle
                              cx={p.x}
                              cy={p.y}
                              r={hoveredPoint?.label === p.label && hoveredPoint?.count === p.count ? "7" : "5"}
                              fill="#2563eb"
                              stroke="white"
                              strokeWidth="2"
                              className="cursor-pointer transition-all"
                              onMouseEnter={() => setHoveredPoint(p)}
                              onMouseLeave={() => setHoveredPoint(null)}
                            />
                          </g>
                        ))}
                        
                        {/* X-axis labels */}
                        {points.map((p, i) => (
                          <text
                            key={i}
                            x={p.x}
                            y="225"
                            fontSize="11"
                            fill="#6b7280"
                            textAnchor="middle"
                          >
                            {p.label}
                          </text>
                        ))}
                      </>
                    );
                  })()}
                  
                  {/* Axes */}
                  <line x1="60" y1="205" x2="760" y2="205" stroke="#9ca3af" strokeWidth="2" />
                  <line x1="60" y1="30" x2="60" y2="205" stroke="#9ca3af" strokeWidth="2" />
                </svg>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
