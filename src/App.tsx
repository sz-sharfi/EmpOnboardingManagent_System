import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';

// Auth Provider
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Candidate Pages
import LoginPage from './pages/candidate/LoginPage';
import SignupPage from './pages/candidate/SignupPage';
import DashboardPage from './pages/candidate/DashboardPage';
import ApplicationFormPage from './pages/candidate/ApplicationFormPage';
import DocumentUploadPage from './pages/candidate/DocumentUploadPage';
import ApplicationPreviewPage from './pages/candidate/ApplicationPreviewPage';

// Admin Pages
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import ApplicationDetailPage from './pages/admin/ApplicationDetailPage';
import ApplicationListPage from './pages/admin/ApplicationListPage';
import ReportsPage from './pages/admin/ReportsPage';

// NotFound Page Component
function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="text-center px-6 py-12">
        {/* Illustration/Icon */}
        <div className="mb-8">
          <div className="text-8xl font-bold text-slate-300">404</div>
        </div>

        {/* Content */}
        <h1 className="text-4xl font-bold text-slate-800 mb-4">
          Page Not Found
        </h1>
        <p className="text-lg text-slate-600 mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved. Let's get you back on track.
        </p>

        {/* Link back to home */}
        <Link
          to="/"
          className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Go Back Home
        </Link>
      </div>
    </div>
  );
}

// Portal Switcher Component (Only visible on login/signup pages)
function PortalSwitcher() {
  const [showMenu, setShowMenu] = useState(false);
  const location = useLocation();

  // Only show on login and signup pages
  const showSwitcher = location.pathname.includes('/login') || location.pathname.includes('/signup');

  if (!showSwitcher) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl hover:scale-110 transition-all flex items-center justify-center font-bold text-lg"
        title="Toggle Portal Switcher"
      >
        🔀
      </button>

      {showMenu && (
        <div className="absolute bottom-20 right-0 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden min-w-max">
          <Link
            to="/admin/login"
            className="block px-4 py-3 text-slate-700 hover:bg-blue-50 font-medium transition-colors border-b border-slate-200"
            onClick={() => setShowMenu(false)}
          >
            Switch to Admin
          </Link>
          <Link
            to="/candidate/login"
            className="block px-4 py-3 text-slate-700 hover:bg-blue-50 font-medium transition-colors"
            onClick={() => setShowMenu(false)}
          >
            Switch to Candidate
          </Link>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Root Route */}
          <Route path="/" element={<Navigate to="/candidate/login" replace />} />

          {/* Candidate Routes - Public */}
          <Route path="/candidate/login" element={<LoginPage />} />
          <Route path="/candidate/signup" element={<SignupPage />} />

          {/* Candidate Routes - Protected */}
          <Route 
            path="/candidate/dashboard" 
            element={
              <ProtectedRoute requiredRole="candidate">
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/candidate/apply" 
            element={
              <ProtectedRoute requiredRole="candidate">
                <ApplicationFormPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/candidate/application/preview" 
            element={
              <ProtectedRoute requiredRole="candidate">
                <ApplicationPreviewPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/candidate/documents" 
            element={
              <ProtectedRoute requiredRole="candidate">
                <DocumentUploadPage />
              </ProtectedRoute>
            } 
          />

          {/* Admin Routes - Public */}
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Admin Routes - Protected */}
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/applications" 
            element={
              <ProtectedRoute requiredRole="admin">
                <ApplicationListPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/applications/:id" 
            element={
              <ProtectedRoute requiredRole="admin">
                <ApplicationDetailPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/reports" 
            element={
              <ProtectedRoute requiredRole="admin">
                <ReportsPage />
              </ProtectedRoute>
            } 
          />

          {/* Catch-all Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>

        {/* Portal Switcher for Demo */}
        <PortalSwitcher />
      </AuthProvider>
    </BrowserRouter>
  );
}
