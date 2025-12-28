import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Filter, Download, Eye, Trash2, Home, FileText, BarChart, Settings, Bell, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
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

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    submitted: 'bg-blue-100 text-blue-800',
    under_review: 'bg-yellow-100 text-yellow-800',
    accepted: 'bg-green-100 text-green-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors[status] || colors.draft}`}>
      {status.replace(/_/g, ' ').toUpperCase()}
    </span>
  );
};

export default function ApplicationListPage() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [profileOpen, setProfileOpen] = useState(false);
  const [adminName, setAdminName] = useState('Admin User');
  
  const itemsPerPage = 10;

  useEffect(() => {
    fetchApplications();
    fetchAdminProfile();
  }, []);

  const fetchAdminProfile = async () => {
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
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this application?')) return;
    
    try {
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchApplications();
    } catch (error) {
      console.error('Error deleting application:', error);
      alert('Failed to delete application');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  const handleExport = () => {
    const csv = [
      ['Name', 'Email', 'Post', 'Status', 'Submitted Date'],
      ...filteredApplications.map(app => [
        app.form_data.fullName || app.profiles.full_name || '',
        app.profiles.email,
        app.form_data.postAppliedFor || '',
        app.status,
        app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : 'N/A'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `applications_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSelectApp = (id: string) => {
    setSelectedApps(prev =>
      prev.includes(id) ? prev.filter(appId => appId !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedApps.length === filteredApplications.length) {
      setSelectedApps([]);
    } else {
      setSelectedApps(filteredApplications.map(app => app.id));
    }
  };

  // Filter and sort applications
  let filteredApplications = applications.filter(app => {
    const matchesSearch = 
      (app.form_data.fullName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (app.profiles.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (app.form_data.postAppliedFor?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Sort
  if (sortBy === 'newest') {
    filteredApplications = filteredApplications.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  } else if (sortBy === 'oldest') {
    filteredApplications = filteredApplications.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  } else if (sortBy === 'name') {
    filteredApplications = filteredApplications.sort((a, b) => 
      (a.form_data.fullName || a.profiles.full_name || '').localeCompare(
        b.form_data.fullName || b.profiles.full_name || ''
      )
    );
  }

  // Pagination
  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedApplications = filteredApplications.slice(startIndex, startIndex + itemsPerPage);

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
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
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
      <aside className="fixed top-16 left-0 h-[calc(100vh-64px)] w-64 bg-white border-r p-4 hidden md:block">
        <nav className="space-y-2">
          <Link to="/admin/dashboard" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded">
            <Home size={20} />
            <span>Dashboard</span>
          </Link>
          <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-600 rounded">
            <FileText size={20} />
            <span className="font-medium">Applications</span>
          </div>
          <Link to="/admin/documents" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded">
            <FileText size={20} />
            <span>Document Review</span>
          </Link>
          <Link to="/admin/reports" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded">
            <BarChart size={20} />
            <span>Reports</span>
          </Link>
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
              <h1 className="text-2xl font-bold text-gray-900">All Applications</h1>
              <p className="text-gray-600 mt-1">
                {filteredApplications.length} application{filteredApplications.length !== 1 ? 's' : ''} found
              </p>
            </div>
            <button onClick={handleExport} className="btn-primary flex items-center gap-2">
              <Download size={18} />
              Export to CSV
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search size={18} className="text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search by name, email, or post..."
                  className="input-field pl-10 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <Filter size={18} className="text-gray-400 absolute left-3 top-3 pointer-events-none" />
                <select
                  className="input-field pl-10 w-full"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="submitted">Submitted</option>
                  <option value="under_review">Under Review</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {/* Sort */}
              <div>
                <select
                  className="input-field w-full"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name">Name A-Z</option>
                </select>
              </div>

              {/* Bulk Actions */}
              {selectedApps.length > 0 && (
                <div>
                  <select className="input-field w-full" defaultValue="">
                    <option value="" disabled>Bulk Actions ({selectedApps.length} selected)</option>
                    <option value="approve">Approve Selected</option>
                    <option value="reject">Reject Selected</option>
                    <option value="delete">Delete Selected</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Applications Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading applications...</p>
              </div>
            ) : paginatedApplications.length === 0 ? (
              <div className="p-8 text-center">
                <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
                <p className="text-gray-600">Try adjusting your filters or search criteria.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={selectedApps.length === filteredApplications.length}
                            onChange={toggleSelectAll}
                            className="rounded"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">S.No</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Candidate</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Post Applied</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submission Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {paginatedApplications.map((app, index) => (
                        <tr key={app.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedApps.includes(app.id)}
                              onChange={() => toggleSelectApp(app.id)}
                              className="rounded"
                            />
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{startIndex + index + 1}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-sm">
                                {(app.form_data.fullName || app.profiles.full_name || app.profiles.email)?.[0]?.toUpperCase()}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {app.form_data.fullName || app.profiles.full_name || 'N/A'}
                                </div>
                                <div className="text-sm text-gray-500">{app.profiles.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {app.form_data.postAppliedFor || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={app.status} />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => navigate(`/admin/applications/${app.id}`)}
                                className="p-2 hover:bg-blue-50 rounded text-blue-600"
                                title="View Details"
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(app.id)}
                                className="p-2 hover:bg-red-50 rounded text-red-600"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-4 py-3 border-t flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredApplications.length)} of {filteredApplications.length} results
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page => {
                          return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                        })
                        .map((page, index, array) => {
                          if (index > 0 && array[index - 1] !== page - 1) {
                            return (
                              <span key={`ellipsis-${page}`} className="px-2">...</span>
                            );
                          }
                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`px-3 py-1 rounded ${
                                currentPage === page
                                  ? 'bg-blue-600 text-white'
                                  : 'hover:bg-gray-100'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        })}
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
