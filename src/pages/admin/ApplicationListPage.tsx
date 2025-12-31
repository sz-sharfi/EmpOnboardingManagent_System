import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Download,
  Eye,
  Home,
  FileText,
  BarChart,
  Settings,
  Bell,
  ChevronLeft,
  ChevronRight,
  LogOut,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { approveApplication, rejectApplication } from '../../lib/applications';

interface ApplicationRow {
  id: string;
  user_id: string;
  status: string;
  submitted_at: string | null;
  created_at: string | null;
  post_applied_for: string | null;
  name: string | null;
  email: string | null;
  photo_url: string | null;
}

interface MergedApplication extends ApplicationRow {
  candidate_name: string;
  candidate_email: string;
  candidate_avatar: string | null;
}

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    submitted: 'bg-blue-100 text-blue-800',
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
  const { user, profile, signOut } = useAuth();
  const [applications, setApplications] = useState<MergedApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [profileOpen, setProfileOpen] = useState(false);

  const itemsPerPage = 10;

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      
      // Verify admin role before fetching
      if (!profile || profile.role !== 'admin') {
        console.error('Access denied: User is not an admin');
        alert('Access denied. Admin role required.');
        navigate('/admin/login');
        return;
      }

      console.log('Fetching all applications for admin:', profile.email);
      
      // Step 1: Fetch applications WITHOUT joins to avoid schema cache issues
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('candidate_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (applicationsError) {
        console.error('Supabase query error:', applicationsError);
        console.error('Error details:', {
          message: applicationsError.message,
          code: applicationsError.code,
          details: applicationsError.details,
          hint: applicationsError.hint
        });
        throw applicationsError;
      }

      console.log(`Successfully fetched ${applicationsData?.length || 0} applications`);
      
      if (!applicationsData || applicationsData.length === 0) {
        console.warn('No applications found in candidate_applications table');
        setApplications([]);
        return;
      }

      // Step 2: Extract unique user_id values from applications
      const userIds = [...new Set(applicationsData.map(app => app.user_id).filter(Boolean))];
      console.log('=== DEBUG: User IDs extracted ===');
      console.log('userIds array:', userIds);
      console.log(`Fetching profiles for ${userIds.length} unique users`);

      if (userIds.length === 0) {
        console.warn('No valid user_id values found in applications');
        setApplications(applicationsData.map(app => ({ 
          ...app, 
          candidate_name: 'Unknown',
          candidate_email: app.email || 'N/A',
          candidate_avatar: null
        })));
        return;
      }

      // Step 3: Fetch profiles by matching profiles.id IN candidate_applications.user_id
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        console.error('Profile error details:', {
          message: profilesError.message,
          code: profilesError.code,
          hint: profilesError.hint
        });
      }

      console.log('=== DEBUG: Profiles fetched ===');
      console.log('profilesData:', profilesData || []);
      console.log(`Successfully fetched ${profilesData?.length || 0} profiles`);

      // Step 4: Create profiles map by strict equality: profile.id === application.user_id
      const profilesMap = new Map<string, { full_name: string | null; email: string; avatar_url: string | null }>();
      if (profilesData && profilesData.length > 0) {
        profilesData.forEach(profile => {
          console.log(`Mapping profile: id=${profile.id}, name=${profile.full_name}, email=${profile.email}`);
          profilesMap.set(profile.id, {
            full_name: profile.full_name,
            email: profile.email,
            avatar_url: profile.avatar_url
          });
        });
      }

      // Step 5: Merge applications with profiles
      const mergedApplications: MergedApplication[] = applicationsData.map(app => {
        const matchedProfile = profilesMap.get(app.user_id);
        console.log(`Merging app ${app.id}: user_id=${app.user_id}, matched_profile=`, matchedProfile);
        
        return {
          ...app,
          candidate_name: matchedProfile?.full_name || 'Unknown',
          candidate_email: matchedProfile?.email || app.email || 'N/A',
          candidate_avatar: matchedProfile?.avatar_url || null
        };
      });

      console.log('=== DEBUG: Final merged applications ===');
      console.log('mergedApplications:', mergedApplications);
      console.log('Merged applications count:', mergedApplications.length);
      
      setApplications(mergedApplications);
    } catch (error: any) {
      console.error('Error fetching applications from candidate_applications:', error);
      alert(`Failed to load applications: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Reset to first page when filters/search/sort change so we don't show an empty page
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortBy]);

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const handleExport = () => {
    const csv = [
      ['Name', 'Email', 'Post', 'Status', 'Submitted Date'],
      ...filteredApplications.map((app) => [
        app.candidate_name,
        app.candidate_email,
        app.post_applied_for || '',
        app.status,
        app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : 'N/A',
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `applications_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredApplications = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    let result = applications.filter((app) => {
      const post = app.post_applied_for || '';

      const matchesSearch =
        normalizedSearch.length === 0 ||
        app.candidate_name.toLowerCase().includes(normalizedSearch) ||
        app.candidate_email.toLowerCase().includes(normalizedSearch) ||
        post.toLowerCase().includes(normalizedSearch);

      const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    if (sortBy === 'newest') {
      result = result.sort(
        (a, b) =>
          new Date(b.submitted_at || b.created_at || '').getTime() -
          new Date(a.submitted_at || a.created_at || '').getTime()
      );
    } else if (sortBy === 'oldest') {
      result = result.sort(
        (a, b) =>
          new Date(a.submitted_at || a.created_at || '').getTime() -
          new Date(b.submitted_at || b.created_at || '').getTime()
      );
    } else if (sortBy === 'name') {
      result = result.sort((a, b) => a.candidate_name.localeCompare(b.candidate_name));
    }

    return result;
  }, [applications, searchTerm, statusFilter, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedApplications = filteredApplications.slice(startIndex, startIndex + itemsPerPage);

  const handleApprove = async (applicationId: string) => {
    if (!user) {
      console.error('Cannot approve application: no authenticated user found');
      return;
    }

    try {
      await approveApplication(applicationId, user.id);
      await fetchApplications();
    } catch (error) {
      console.error('Error approving application from list:', error);
      alert('Failed to approve application. Please try again.');
    }
  };

  const handleReject = async (applicationId: string) => {
    if (!user) {
      console.error('Cannot reject application: no authenticated user found');
      return;
    }

    const reason = window.prompt('Enter rejection reason for this application:');
    if (!reason || !reason.trim()) {
      return;
    }

    try {
      await rejectApplication(applicationId, user.id, reason.trim());
      await fetchApplications();
    } catch (error) {
      console.error('Error rejecting application from list:', error);
      alert('Failed to reject application. Please try again.');
    }
  };

  const renderAvatar = (app: MergedApplication) => {
    if (app.candidate_avatar) {
      return <img src={app.candidate_avatar} alt={app.candidate_name} className="w-8 h-8 rounded-full object-cover" />;
    }
    
    // Render initials if no avatar
    const initials = app.candidate_name !== 'Unknown' 
      ? app.candidate_name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
      : 'U';
    
    return (
      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-sm">
        {initials}
      </div>
    );
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
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name || 'Admin'} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
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

              <div className="relative">
                <Filter size={18} className="text-gray-400 absolute left-3 top-3 pointer-events-none" />
                <select
                  className="input-field pl-10 w-full"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="submitted">Submitted</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <select
                  className="input-field w-full"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name">Name A-Z</option>
                </select>
              </div>
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
                          <td className="px-4 py-3 text-sm text-gray-900">{startIndex + index + 1}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {renderAvatar(app)}
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {app.candidate_name}
                                </div>
                                <div className="text-sm text-gray-500">{app.candidate_email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{app.post_applied_for || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {app.submitted_at
                                ? new Date(app.submitted_at).toLocaleDateString()
                                : app.created_at
                                ? new Date(app.created_at).toLocaleDateString()
                                : 'N/A'}
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
                                {app.status === 'submitted' && (
                                  <>
                                    <button
                                      onClick={() => handleApprove(app.id)}
                                      className="p-2 hover:bg-green-50 rounded text-green-600"
                                      title="Approve Application"
                                    >
                                      <CheckCircle size={16} />
                                    </button>
                                    <button
                                      onClick={() => handleReject(app.id)}
                                      className="p-2 hover:bg-red-50 rounded text-red-600"
                                      title="Reject Application"
                                    >
                                      <XCircle size={16} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="px-4 py-3 border-t flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredApplications.length)} of {filteredApplications.length} results
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((page) => {
                          return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                        })
                        .map((page, index, array) => {
                          if (index > 0 && array[index - 1] !== page - 1) {
                            return (
                              <span key={`ellipsis-${page}`} className="px-2">
                                ...
                              </span>
                            );
                          }
                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`px-3 py-1 rounded ${
                                currentPage === page ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        })}
                      <button
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
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
