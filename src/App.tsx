import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import AssessmentOnboardingPage from './pages/AssessmentOnboardingPage';
import AssessmentChatPage from './pages/AssessmentChatPage';
import AssessmentResultPage from './pages/AssessmentResultPage';
import ResourcesPage from './pages/ResourcesPage';
import UserDashboardPage from './pages/UserDashboardPage';
import CounsellorDashboardPage from './pages/CounsellorDashboardPage';
import CaseDetailPage from './pages/CaseDetailPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ChatbotPage from './pages/ChatbotPage';
import DailyCheckInPage from './pages/DailyCheckInPage';
import ProgressTrackingPage from './pages/ProgressTrackingPage';
import SupportRequestPage from './pages/SupportRequestPage';
import StressScalePage from './pages/StressScalePage';
import PrivacyPage from './pages/PrivacyPage';
import ProfilePage from './pages/ProfilePage';

function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center max-w-md px-4">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-slate-800 mb-2">Unauthorized Access</h1>
        <p className="text-slate-500 mb-6">You do not have permission to access this page.</p>
        <a href="/" className="bg-[#0f2547] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#1a3a6b] transition-colors">Return to Home</a>
      </div>
    </div>
  );
}

function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center max-w-md px-4">
        <div className="text-6xl font-bold text-slate-200 mb-4">404</div>
        <h1 className="text-xl font-bold text-slate-800 mb-2">Page Not Found</h1>
        <p className="text-slate-500 mb-6">The page you are looking for does not exist.</p>
        <a href="/" className="bg-[#0f2547] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#1a3a6b] transition-colors">Return to Home</a>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div className="app-shell">
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/resources" element={<ResourcesPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/profile" element={<ProtectedRoute roles={['victim', 'admin']}><ProfilePage /></ProtectedRoute>} />
              <Route path="/stress-scale" element={<StressScalePage />} />

              {/* Assessment flow — public (consent handled within flow) */}
              <Route path="/assessment" element={<AssessmentOnboardingPage />} />
              <Route path="/assessment/chat" element={<AssessmentChatPage />} />
              <Route path="/assessment/result" element={<AssessmentResultPage />} />

              {/* Chat & Voice — accessible without login but recommended to be logged in */}
              <Route path="/chat" element={<ChatbotPage />} />

              {/* User dashboard and features — requires login */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute roles={['victim', 'admin']}>
                    <UserDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/checkin"
                element={
                  <ProtectedRoute roles={['victim', 'admin']}>
                    <DailyCheckInPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/progress"
                element={
                  <ProtectedRoute roles={['victim', 'admin']}>
                    <ProgressTrackingPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/support"
                element={
                  <ProtectedRoute roles={['victim', 'admin']}>
                    <SupportRequestPage />
                  </ProtectedRoute>
                }
              />

              {/* Counsellor / Moderator routes */}
              <Route
                path="/counsellor"
                element={
                  <ProtectedRoute roles={['counsellor', 'admin']}>
                    <CounsellorDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/counsellor/case/:caseId"
                element={
                  <ProtectedRoute roles={['counsellor', 'admin']}>
                    <CaseDetailPage />
                  </ProtectedRoute>
                }
              />

              {/* Admin routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute roles={['admin']}>
                    <AdminDashboardPage />
                  </ProtectedRoute>
                }
              />

              {/* Misc */}
              <Route path="/unauthorized" element={<UnauthorizedPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </div>
  );
}
