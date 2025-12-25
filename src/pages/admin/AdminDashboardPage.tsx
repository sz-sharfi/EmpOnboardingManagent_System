import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, FileText, BarChart, Settings, Search, Bell, Eye, CheckCircle, XCircle, Clock, Users } from 'lucide-react';

const mockApplications = [
  { id: '1', name: 'John Doe', email: 'john.doe@example.com', post: 'Software Engineer', date: '2024-12-20', status: 'under_review', photo: null },
  { id: '2', name: 'Jane Smith', email: 'jane.smith@example.com', post: 'Product Manager', date: '2024-12-19', status: 'approved', photo: null },
  { id: '3', name: 'Bob Johnson', email: 'bob.johnson@example.com', post: 'Designer', date: '2024-12-18', status: 'pending', photo: null },
  { id: '4', name: 'Alice Brown', email: 'alice.brown@example.com', post: 'Data Analyst', date: '2024-12-17', status: 'under_review', photo: null },
  { id: '5', name: 'Charlie Wilson', email: 'charlie.wilson@example.com', post: 'HR Manager', date: '2024-12-16', status: 'approved', photo: null },
  { id: '6', name: 'Diana Davis', email: 'diana.davis@example.com', post: 'Marketing Lead', date: '2024-12-15', status: 'rejected', photo: null },
  { id: '7', name: 'Eve Martinez', email: 'eve.martinez@example.com', post: 'DevOps Engineer', date: '2024-12-14', status: 'documents_pending', photo: null },
];

const mockMetrics = {
  total: 45,
  pending: 12,
  approved: 28,
  rejected: 5,
};

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-800',
    under_review: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
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
  const [applications, setApplications] = useState(mockApplications);

  const handleApprove = (id: string) => {
    console.log('Approve', id);
    setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'approved' } : a)));
  };

  const handleReject = (id: string) => {
    console.log('Reject', id);
    setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'rejected' } : a)));
  };

  const handleView = (id: string) => {
    navigate(`/admin/applications/${id}`);
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
                <div className="w-8 h-8 rounded-full bg-gray-200" />
                <span className="font-medium">Admin User</span>
              </button>
              {profileOpen && (
                <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 w-48">
                  <button className="w-full text-left px-4 py-2 hover:bg-gray-50">Profile</button>
                  <button className="w-full text-left px-4 py-2 hover:bg-gray-50">Logout</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`fixed top-16 left-0 h-[calc(100vh-64px)] w-64 bg-white border-r p-4 hidden md:block`}> 
        <nav className="space-y-2">
          <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-600 rounded">
            <Home />
            <span className="font-medium">Dashboard</span>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer">
            <FileText />
            <span>Applications</span>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer">
            <BarChart />
            <span>Reports</span>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer">
            <Settings />
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
                <div className="text-3xl font-bold">{mockMetrics.total}</div>
                <div className="text-gray-600">Total Applications</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <Clock size={40} className="text-orange-500" />
              <div>
                <div className="text-3xl font-bold text-orange-600">{mockMetrics.pending}</div>
                <div className="text-gray-600">Pending Review</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <CheckCircle size={40} className="text-green-500" />
              <div>
                <div className="text-3xl font-bold text-green-600">{mockMetrics.approved}</div>
                <div className="text-gray-600">Approved</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <XCircle size={40} className="text-red-500" />
              <div>
                <div className="text-3xl font-bold text-red-600">{mockMetrics.rejected}</div>
                <div className="text-gray-600">Rejected</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Applications Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="flex justify-between items-center p-6 border-b">
            <h3 className="text-xl font-semibold">Recent Applications</h3>
            <Link to="#" className="text-blue-600">View All</Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="text-left text-sm text-gray-600">
                  <th className="px-6 py-3">S.No</th>
                  <th className="px-6 py-3">Candidate</th>
                  <th className="px-6 py-3">Post</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app, idx) => (
                  <tr key={app.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition`}>
                    <td className="px-6 py-4 align-top">{idx + 1}</td>
                    <td className="px-6 py-4 align-top">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200" />
                        <div>
                          <div className="font-medium">{app.name}</div>
                          <div className="text-sm text-gray-500">{app.email || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top">{app.post}</td>
                    <td className="px-6 py-4 align-top">{app.date}</td>
                    <td className="px-6 py-4 align-top"><StatusBadge status={app.status} /></td>
                    <td className="px-6 py-4 align-top">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleView(app.id)} className="p-2 hover:bg-gray-100 rounded"><Eye /></button>
                        <button onClick={() => handleApprove(app.id)} className="p-2 hover:bg-gray-100 rounded text-green-600"><CheckCircle /></button>
                        <button onClick={() => handleReject(app.id)} className="p-2 hover:bg-gray-100 rounded text-red-600"><XCircle /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
