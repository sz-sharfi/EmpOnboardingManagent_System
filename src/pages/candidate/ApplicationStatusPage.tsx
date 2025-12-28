import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, FileText, Upload, Bell, Clock, CheckCircle, XCircle, AlertCircle, ArrowRight } from 'lucide-react';
import supabase from '../../utils/supabaseClient';

interface Activity {
  id: string;
  activity_type: string;
  description: string;
  performed_by_name: string;
  performed_by_role: string;
  metadata: any;
  created_at: string;
}

interface Application {
  id: string;
  status: string;
  submitted_at: string;
  rejection_reason: string | null;
  admin_notes: string | null;
  progress_percent: number;
  form_data: {
    fullName?: string;
    postAppliedFor?: string;
  };
}

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'submitted':
    case 'under_review':
      return <Clock className="text-yellow-600" size={24} />;
    case 'accepted':
      return <CheckCircle className="text-green-600" size={24} />;
    case 'rejected':
      return <XCircle className="text-red-600" size={24} />;
    default:
      return <AlertCircle className="text-gray-600" size={24} />;
  }
};

const TimelineStep = ({ 
  title, 
  date, 
  status 
}: { 
  title: string; 
  date?: string; 
  status: 'completed' | 'current' | 'upcoming'; 
}) => {
  return (
    <div className="flex items-start gap-4">
      <div className="flex flex-col items-center">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${
            status === 'completed'
              ? 'bg-green-500 text-white'
              : status === 'current'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-500'
          }`}
        >
          {status === 'completed' ? <CheckCircle size={20} /> : <Clock size={20} />}
        </div>
        {status !== 'upcoming' && <div className="w-0.5 h-16 bg-gray-300 mt-2" />}
      </div>
      <div className="flex-1 pb-8">
        <h4 className={`font-medium ${status === 'upcoming' ? 'text-gray-500' : 'text-gray-900'}`}>
          {title}
        </h4>
        {date && <p className="text-sm text-gray-600 mt-1">{date}</p>}
      </div>
    </div>
  );
};

export default function ApplicationStatusPage() {
  const navigate = useNavigate();
  const [application, setApplication] = useState<Application | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    fetchApplicationStatus();
  }, []);

  const fetchApplicationStatus = async () => {
    try {
      setLoading(true);
      
      // Get user's application
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/candidate/login');
        return;
      }

      const { data: appData, error: appError } = await supabase
        .from('applications')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'draft')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (appError) throw appError;
      setApplication(appData);

      // Get activity timeline
      const { data: activityData, error: actError } = await supabase
        .rpc('get_application_timeline', { p_app_id: appData.id });

      if (actError) throw actError;
      setActivities(activityData || []);

    } catch (error) {
      console.error('Error fetching application status:', error);
    } finally {
      setLoading(false);
    }
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
          <p className="mt-4 text-gray-600">Loading your application status...</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Application Found</h3>
          <p className="text-gray-600 mb-4">You haven't submitted an application yet.</p>
          <button onClick={() => navigate('/candidate/dashboard')} className="btn-primary">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      submitted: 'bg-blue-100 text-blue-800 border-blue-300',
      under_review: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      accepted: 'bg-green-100 text-green-800 border-green-300',
      rejected: 'bg-red-100 text-red-800 border-red-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getStatusMessage = (status: string) => {
    const messages: Record<string, string> = {
      submitted: 'Your application has been submitted and is awaiting review.',
      under_review: 'Your application is currently being reviewed by our team.',
      accepted: 'Congratulations! Your application has been approved.',
      rejected: 'Your application was not approved at this time.',
    };
    return messages[status] || 'Application status unknown.';
  };

  const getNextAction = (status: string) => {
    switch (status) {
      case 'submitted':
      case 'under_review':
        return 'Please wait while we review your application. You will be notified of any updates.';
      case 'accepted':
        return 'Please upload the required documents to complete your onboarding.';
      case 'rejected':
        return 'If you have questions, please contact our support team.';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Nav */}
      <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Home size={22} className="text-blue-600" />
            <span className="font-bold">JRM Infosystems</span>
          </div>

          <div className="flex items-center gap-4">
            <Bell size={20} className="text-gray-600 cursor-pointer" />
            <div className="relative">
              <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                  {application.form_data.fullName?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="font-medium hidden md:block">{application.form_data.fullName || 'User'}</span>
              </button>
              {profileOpen && (
                <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 w-48">
                  <button onClick={() => navigate('/candidate/dashboard')} className="w-full text-left px-4 py-2 hover:bg-gray-50">Dashboard</button>
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-red-600">Logout</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 pb-12">
        <div className="max-w-5xl mx-auto px-4">
          {/* Page Title */}
          <div className="mb-8">
            <button onClick={() => navigate('/candidate/dashboard')} className="text-blue-600 hover:underline mb-4 flex items-center gap-2">
              ← Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Track Your Application</h1>
            <p className="text-gray-600 mt-2">Application ID: {application.id.slice(0, 8)}...</p>
          </div>

          {/* Status Banner */}
          <div className={`rounded-lg border-2 p-6 mb-8 ${getStatusColor(application.status)}`}>
            <div className="flex items-start gap-4">
              <StatusIcon status={application.status} />
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-2">
                  {application.status.replace(/_/g, ' ').toUpperCase()}
                </h2>
                <p className="mb-2">{getStatusMessage(application.status)}</p>
                <p className="text-sm font-medium">{getNextAction(application.status)}</p>
                {application.rejection_reason && (
                  <div className="mt-4 p-4 bg-white rounded border">
                    <p className="font-medium text-sm mb-1">Reason for Rejection:</p>
                    <p className="text-sm">{application.rejection_reason}</p>
                  </div>
                )}
              </div>
            </div>
            {application.status === 'accepted' && (
              <button
                onClick={() => navigate('/candidate/documents')}
                className="mt-4 btn-primary flex items-center gap-2"
              >
                Upload Documents
                <ArrowRight size={18} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Timeline */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Application Journey</h3>
                <div>
                  <TimelineStep
                    title="Application Submitted"
                    date={application.submitted_at ? new Date(application.submitted_at).toLocaleString() : undefined}
                    status="completed"
                  />
                  <TimelineStep
                    title={application.status === 'under_review' || application.status === 'accepted' || application.status === 'rejected' ? 'Under Review' : 'Awaiting Review'}
                    date={application.status !== 'submitted' ? 'In Progress' : undefined}
                    status={application.status === 'under_review' ? 'current' : application.status === 'accepted' || application.status === 'rejected' ? 'completed' : 'upcoming'}
                  />
                  <TimelineStep
                    title={application.status === 'accepted' ? 'Application Approved' : application.status === 'rejected' ? 'Application Rejected' : 'Decision Pending'}
                    date={application.status === 'accepted' || application.status === 'rejected' ? 'Completed' : undefined}
                    status={application.status === 'accepted' || application.status === 'rejected' ? 'completed' : 'upcoming'}
                  />
                  {application.status === 'accepted' && (
                    <TimelineStep
                      title="Upload Documents"
                      status={application.progress_percent === 100 ? 'completed' : 'current'}
                    />
                  )}
                  {application.status === 'accepted' && (
                    <TimelineStep
                      title="Onboarding Complete"
                      status={application.progress_percent === 100 ? 'completed' : 'upcoming'}
                    />
                  )}
                </div>
              </div>

              {/* Activity Log */}
              <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Activity Log</h3>
                <div className="space-y-4">
                  {activities.length === 0 ? (
                    <p className="text-gray-600 text-center py-4">No activity yet</p>
                  ) : (
                    activities.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3 pb-4 border-b last:border-b-0">
                        <div className="w-2 h-2 rounded-full bg-blue-600 mt-2" />
                        <div className="flex-1">
                          <p className="text-gray-900">{activity.description}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            {new Date(activity.created_at).toLocaleString()}
                            {activity.performed_by_name && activity.performed_by_role === 'admin' && (
                              <span> • by Admin</span>
                            )}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Application Info */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="font-bold text-gray-900 mb-4">Application Details</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-600">Name</p>
                    <p className="font-medium text-gray-900">{application.form_data.fullName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Position</p>
                    <p className="font-medium text-gray-900">{application.form_data.postAppliedFor || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Submitted On</p>
                    <p className="font-medium text-gray-900">
                      {application.submitted_at ? new Date(application.submitted_at).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Progress</p>
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${application.progress_percent}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{application.progress_percent}% Complete</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => navigate('/candidate/application/preview')}
                    className="w-full btn-secondary flex items-center justify-center gap-2"
                  >
                    <FileText size={18} />
                    View Application
                  </button>
                  {application.status === 'accepted' && (
                    <button
                      onClick={() => navigate('/candidate/documents')}
                      className="w-full btn-primary flex items-center justify-center gap-2"
                    >
                      <Upload size={18} />
                      Upload Documents
                    </button>
                  )}
                </div>
              </div>

              {/* Contact Support */}
              <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                <h3 className="font-bold text-blue-900 mb-2">Need Help?</h3>
                <p className="text-sm text-blue-800 mb-4">
                  If you have any questions about your application, feel free to contact us.
                </p>
                <p className="text-sm text-blue-900 font-medium">support@jrminfosystems.com</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
