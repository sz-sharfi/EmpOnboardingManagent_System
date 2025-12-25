import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';

// Candidate Pages
import LoginPage from './pages/candidate/LoginPage';
import DashboardPage from './pages/candidate/DashboardPage';
import ApplicationFormPage from './pages/candidate/ApplicationFormPage';
import DocumentUploadPage from './pages/candidate/DocumentUploadPage';
import ApplicationPreviewPage from './pages/candidate/ApplicationPreviewPage';

// Admin Pages
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import ApplicationDetailPage from './pages/admin/ApplicationDetailPage';

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

// Portal Switcher Component (Demo purposes)
function PortalSwitcher() {
  const [showMenu, setShowMenu] = useState(false);

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
      <Routes>
        {/* Root Route */}
        <Route path="/" element={<Navigate to="/candidate/login" replace />} />

        {/* Candidate Routes */}
        <Route path="/candidate/login" element={<LoginPage />} />
        <Route path="/candidate/dashboard" element={<DashboardPage />} />
        <Route path="/candidate/apply" element={<ApplicationFormPage />} />
        <Route path="/candidate/documents" element={<DocumentUploadPage />} />
        <Route path="/candidate/preview" element={<ApplicationPreviewPage />} />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/admin/applications/:id" element={<ApplicationDetailPage />} />

        {/* Catch-all Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      {/* Portal Switcher for Demo */}
      <PortalSwitcher />
    </BrowserRouter>
  );
}
