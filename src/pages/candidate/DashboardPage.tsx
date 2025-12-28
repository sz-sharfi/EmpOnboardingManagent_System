import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, LogOut, CheckCircle, User, Eye, FileText, Upload, Clock } from 'lucide-react';
import supabase from '../../utils/supabaseClient';

interface Application {
  id: string;
  status: string;
  submitted_at: string | null;
  progress_percent: number;
  rejection_reason: string | null;
  form_data: {
    fullName?: string;
    postAppliedFor?: string;
  };
}

interface Activity {
  id: string;
  activity_type: string;
  description: string;
  performed_by_name: string;
  performed_by_role: string;
  created_at: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

interface Profile {
  full_name: string;
  email: string;
}

const statusConfig = {
  draft: { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
  submitted: { color: 'bg-blue-100 text-blue-800', label: 'Submitted' },
  under_review: { color: 'bg-yellow-100 text-yellow-800', label: 'Under Review' },
  accepted: { color: 'bg-green-100 text-green-800', label: 'Approved' },
  rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' },
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [application, setApplication] = useState<Application | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/candidate/login');
        return;
      }

      // Get profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (profileData) {
        setProfile(profileData);
      }

      // Get latest application
      const { data: appData } = await supabase
        .from('applications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (appData) {
        setApplication(appData);

        // Get activities for this application
        if (appData.status !== 'draft') {
          const { data: activityData } = await supabase
            .rpc('get_application_timeline', { p_app_id: appData.id });
          
          if (activityData) {
            setActivities(activityData.slice(0, 10)); // Limit to 10 most recent
          }
        }
      }

      // Get notifications
      const { data: notifData } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (notifData) {
        setNotifications(notifData);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkNotificationRead = async (notifId: string) => {
    try {
      await supabase.rpc('mark_notification_as_read', { p_notif_id: notifId });
      setNotifications(prev => 
        prev.map(n => n.id === notifId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getTimelineSteps = () => {
    if (!application) return [];

    const steps = [
      {
        step: 1,
        label: 'Submit Application',
        completed: application.status !== 'draft',
        current: application.status === 'draft'
      },
      {
        step: 2,
        label: 'Under Review',
        completed: ['accepted', 'rejected'].includes(application.status),
        current: ['submitted', 'under_review'].includes(application.status)
      },
      {
        step: 3,
        label: application.status === 'accepted' ? 'Approved' : application.status === 'rejected' ? 'Rejected' : 'Decision',
        completed: ['accepted', 'rejected'].includes(application.status),
        current: false
      }
    ];

    if (application.status === 'accepted') {
      steps.push({
        step: 4,
        label: 'Upload Documents',
        completed: application.progress_percent === 100,
        current: application.progress_percent < 100
      });
    }

    return steps;
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  const getStatusConfig = (status: string) => {
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/candidate/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">JRM INFOSYSTEMS</h1>
          
          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition"
            >
              <User size={20} className="text-gray-600" />
              <span className="text-gray-800 font-medium">
                {profile?.full_name || profile?.email || 'User'}
              </span>
            </button>
            
            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200">
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left flex items-center gap-2 text-gray-700 hover:bg-gray-50 rounded-lg border-b"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <h2 className="text-3xl font-bold text-gray-900 mb-6">
          Welcome, {profile?.full_name || profile?.email || 'User'}!
        </h2>

        {/* Status Card */}
        {application && application.status !== 'draft' ? (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Application Status</h3>
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusConfig(application.status).color}`}>
                {getStatusConfig(application.status).label}
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Progress</span>
                <span className="text-sm font-medium text-gray-700">{application.progress_percent}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${application.progress_percent}%` }}
                />
              </div>
            </div>

            <p className="text-gray-600">
              {application.status === 'submitted' && 'Your application has been submitted and is awaiting review.'}
              {application.status === 'under_review' && 'Your application is being reviewed by our team.'}
              {application.status === 'accepted' && 'Congratulations! Your application has been approved. Please upload the required documents.'}
              {application.status === 'rejected' && 'Your application was not approved at this time.'}
            </p>

            {application.rejection_reason && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-800 mb-1">Reason for rejection:</p>
                <p className="text-sm text-red-700">{application.rejection_reason}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Get Started</h3>
            <p className="text-blue-800 mb-4">
              Welcome to JRM Infosystems onboarding portal! Start by filling out your application form.
            </p>
            <button
              onClick={() => navigate('/candidate/apply')}
              className="btn-primary"
            >
              Start Application
            </button>
          </div>
        )}

        {/* Three Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column - Timeline */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-6">Application Progress</h3>
            
            {application && application.status !== 'draft' ? (
              <div className="space-y-6 relative">
                {/* Timeline Line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

                {/* Timeline Steps */}
                {getTimelineSteps().map((item, idx) => (
                  <div key={idx} className="flex gap-4 relative">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 relative z-10 ${
                        item.completed
                          ? 'bg-green-500 text-white'
                          : item.current
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-300 text-gray-600'
                      }`}
                    >
                      {item.completed ? <CheckCircle size={24} /> : item.current ? <Clock size={24} /> : item.step}
                    </div>
                    <div className="pt-2">
                      <p className="font-medium text-gray-800">{item.label}</p>
                      {item.current && <p className="text-sm text-gray-500">In Progress</p>}
                      {item.completed && <p className="text-sm text-green-600">Completed</p>}
                    </div>
                  </div>
                ))}

                {/* Activity Log Section */}
                {activities.length > 0 && (
                  <div className="mt-8 pt-6 border-t">
                    <h4 className="text-sm font-semibold text-gray-700 mb-4">Recent Activity</h4>
                    <div className="space-y-3">
                      {activities.slice(0, 5).map((activity) => (
                        <div key={activity.id} className="flex items-start gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-gray-800">{activity.description}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{getTimeAgo(activity.created_at)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No application submitted yet</p>
                <button
                  onClick={() => navigate('/candidate/apply')}
                  className="btn-primary text-sm"
                >
                  Start Application
                </button>
              </div>
            )}
          </div>

          {/* Center Column - Quick Actions */}
          <div className="space-y-4">
            {/* Fill Application Form */}
            <button
              onClick={() => navigate('/candidate/apply')}
              className="w-full p-6 border-2 border-blue-500 rounded-lg bg-white hover:shadow-lg transition cursor-pointer text-left"
            >
              <div className="flex items-start gap-3">
                <FileText className="text-blue-600 flex-shrink-0 mt-1" size={24} />
                <div>
                  <h4 className="font-semibold text-gray-800">Fill Application Form</h4>
                  <p className="text-sm text-gray-600">Complete your application details</p>
                </div>
              </div>
            </button>

            {/* Upload Documents */}
            <button
              onClick={() => application?.status === 'accepted' && navigate('/candidate/documents')}
              disabled={application?.status !== 'accepted'}
              className={`w-full p-6 border-2 rounded-lg bg-white text-left transition ${
                application?.status === 'accepted'
                  ? 'border-green-500 hover:shadow-lg cursor-pointer'
                  : 'border-gray-300 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-start gap-3">
                <Upload className={`flex-shrink-0 mt-1 ${application?.status === 'accepted' ? 'text-green-600' : 'text-gray-400'}`} size={24} />
                <div>
                  <h4 className="font-semibold text-gray-800">Upload Documents</h4>
                  <p className="text-sm text-gray-600">
                    {application?.status === 'accepted' 
                      ? 'Upload required documents' 
                      : 'Available after approval'}
                  </p>
                </div>
              </div>
            </button>

            {/* View Application */}
            <button
              onClick={() => application && navigate('/candidate/application/preview')}
              disabled={!application || application.status === 'draft'}
              className={`w-full p-6 border-2 rounded-lg bg-white text-left transition ${
                application && application.status !== 'draft'
                  ? 'border-blue-500 hover:shadow-lg cursor-pointer'
                  : 'border-gray-300 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-start gap-3">
                <Eye className={`flex-shrink-0 mt-1 ${application && application.status !== 'draft' ? 'text-blue-600' : 'text-gray-400'}`} size={24} />
                <div>
                  <h4 className="font-semibold text-gray-800">View Application</h4>
                  <p className="text-sm text-gray-600">Preview submitted details</p>
                </div>
              </div>
            </button>
          </div>

          {/* Right Column - Notifications */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Bell size={20} />
              Recent Updates
            </h3>

            {notifications.length > 0 ? (
              <div className="space-y-3">
                {notifications.map((notif, idx) => (
                  <div
                    key={notif.id}
                    className={`flex items-start gap-3 py-3 ${
                      idx !== notifications.length - 1 ? 'border-b border-gray-200' : ''
                    } ${!notif.read ? 'bg-blue-50 -mx-3 px-3 rounded' : ''}`}
                    onClick={() => !notif.read && handleMarkNotificationRead(notif.id)}
                  >
                    <Bell size={16} className={`flex-shrink-0 mt-1 ${
                      notif.type === 'success' ? 'text-green-500' :
                      notif.type === 'warning' ? 'text-yellow-500' :
                      notif.type === 'error' ? 'text-red-500' :
                      'text-blue-500'
                    }`} />
                    <div className="flex-1">
                      <p className={`text-sm ${!notif.read ? 'font-semibold' : ''} text-gray-800`}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{getTimeAgo(notif.created_at)}</p>
                    </div>
                    {!notif.read && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Bell size={48} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500 text-sm">No notifications yet</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
