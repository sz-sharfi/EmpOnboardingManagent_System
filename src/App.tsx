import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/candidate/LoginPage';
import DashboardPage from './pages/candidate/DashboardPage';
import ApplicationFormPage from './pages/candidate/ApplicationFormPage';
import DocumentUploadPage from './pages/candidate/DocumentUploadPage';
import ApplicationPreviewPage from './pages/candidate/ApplicationPreviewPage';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Candidate Routes */}
        <Route path="/candidate/login" element={<LoginPage />} />
        <Route path="/candidate/dashboard" element={<DashboardPage />} />
        <Route path="/candidate/apply" element={<ApplicationFormPage />} />
        <Route path="/candidate/documents" element={<DocumentUploadPage />} />
        <Route path="/candidate/preview" element={<ApplicationPreviewPage />} />

        {/* Default Route */}
        <Route path="/" element={<Navigate to="/candidate/login" replace />} />
        <Route path="*" element={<Navigate to="/candidate/login" replace />} />
      </Routes>
    </Router>
  );
}
