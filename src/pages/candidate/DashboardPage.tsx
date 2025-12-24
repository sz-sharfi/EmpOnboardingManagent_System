import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, LogOut, CheckCircle, Clock, User, Eye, FileText, Upload } from 'lucide-react';

interface ApplicationData {
  id: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  progress: number;
  lastUpdated: string;
}

interface Notification {
  id: number;
  message: string;
  time: string;
}

const mockApplicationData: ApplicationData = {
  id: 'APP-001',
  status: 'under_review',
  progress: 40,
  lastUpdated: '2024-12-24',
};

const mockNotifications: Notification[] = [
  { id: 1, message: 'Application submitted successfully', time: '2 hours ago' },
  { id: 2, message: 'Application under review', time: '1 hour ago' },
  { id: 3, message: 'Please check your email', time: '30 mins ago' },
];

const statusConfig = {
  pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
  under_review: { color: 'bg-blue-100 text-blue-800', label: 'Under Review' },
  approved: { color: 'bg-green-100 text-green-800', label: 'Approved' },
  rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' },
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [appData] = useState<ApplicationData>(mockApplicationData);
  const [notifications] = useState<Notification[]>(mockNotifications);

  const getStatusConfig = (status: string) => {
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  };

  const handleLogout = () => {
    navigate('/candidate/login');
  };

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
              <span className="text-gray-800 font-medium">John Doe</span>
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
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Welcome, John Doe!</h2>

        {/* Status Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Application Status</h3>
            <span className={`badge ${getStatusConfig(appData.status).color}`}>
              {getStatusConfig(appData.status).label}
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Progress</span>
              <span className="text-sm font-medium text-gray-700">{appData.progress}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${appData.progress}%` }}
              />
            </div>
          </div>

          <p className="text-gray-600">Your application is being reviewed by our team</p>
        </div>

        {/* Three Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column - Timeline */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-6">Application Progress</h3>
            
            <div className="space-y-6 relative">
              {/* Timeline Line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

              {/* Timeline Steps */}
              {[
                { step: 1, label: 'Submit Application', completed: true },
                { step: 2, label: 'Under Review', completed: false, current: true },
                { step: 3, label: 'Upload Documents', completed: false },
                { step: 4, label: 'Complete', completed: false },
              ].map((item, idx) => (
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
                    {item.completed ? <CheckCircle size={24} /> : item.step}
                  </div>
                  <div className="pt-2">
                    <p className="font-medium text-gray-800">{item.label}</p>
                    {item.current && <p className="text-sm text-gray-500">In Progress</p>}
                  </div>
                </div>
              ))}
            </div>
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
              disabled
              className="w-full p-6 border-2 border-gray-300 rounded-lg bg-white opacity-50 cursor-not-allowed text-left"
            >
              <div className="flex items-start gap-3">
                <Upload className="text-gray-400 flex-shrink-0 mt-1" size={24} />
                <div>
                  <h4 className="font-semibold text-gray-800">Upload Documents</h4>
                  <p className="text-sm text-gray-600">Coming after form submission</p>
                </div>
              </div>
            </button>

            {/* View Application */}
            <button
              onClick={() => navigate('/candidate/preview')}
              className="w-full p-6 border-2 border-blue-500 rounded-lg bg-white hover:shadow-lg transition cursor-pointer text-left"
            >
              <div className="flex items-start gap-3">
                <Eye className="text-blue-600 flex-shrink-0 mt-1" size={24} />
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

            <div className="space-y-3">
              {notifications.map((notif, idx) => (
                <div
                  key={notif.id}
                  className={`flex items-start gap-3 py-3 ${
                    idx !== notifications.length - 1 ? 'border-b border-gray-200' : ''
                  }`}
                >
                  <Bell size={16} className="text-blue-500 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">{notif.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
