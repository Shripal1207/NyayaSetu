import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useFirebase } from './context/FirebaseContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/layout/Layout'
import Loader from './components/ui/Loader'

import HomePage from './pages/HomePage'
import AdvocateLoginPage from './pages/AdvocateLoginPage'
import ChatbotPage from './pages/ChatbotPage'
import DocumentAnalyzerPage from './pages/DocumentAnalyzerPage'
import LawyerSearchPage from './pages/LawyerSearchPage'
import LawyerProfilePage from './pages/LawyerProfilePage'
import LawyerVerificationPage from './pages/LawyerVerificationPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import BookConsultationPage from './pages/BookConsultationPage'
import ConsultationsPage from './pages/ConsultationsPage'
import VideoCallPage from './pages/VideoCallPage'
import ProfilePage from './pages/ProfilePage'
import LegalDictionaryPage from './pages/LegalDictionaryPage'
import ManageMeetingsPage from './pages/ManageMeetingsPage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import TermsPage from './pages/TermsPage'
import NotFoundPage from './pages/NotFoundPage'

// Pages that should NOT have the sidebar
const noSidebarRoutes = ['/', '/call', '/advocate-login']

function AppContent() {
  const location = useLocation()
  const { loading } = useFirebase()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Loader size="lg" />
      </div>
    )
  }

  // Check if current route should have sidebar
  const shouldHaveSidebar = !noSidebarRoutes.some(route =>
    location.pathname === route || location.pathname.startsWith('/call/')
  )

  const routes = (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/advocate-login" element={<AdvocateLoginPage />} />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/dictionary" element={<LegalDictionaryPage />} />
      <Route path="/chat" element={<ChatbotPage />} />
      <Route path="/analyze" element={<DocumentAnalyzerPage />} />
      <Route path="/lawyers" element={<LawyerSearchPage />} />

      <Route
        path="/lawyer/:id"
        element={
          <ProtectedRoute>
            <LawyerProfilePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/verification"
        element={
          <ProtectedRoute>
            <LawyerVerificationPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/book/:lawyerId"
        element={
          <ProtectedRoute>
            <BookConsultationPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/consultations"
        element={
          <ProtectedRoute>
            <ConsultationsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/call/:roomId"
        element={
          <ProtectedRoute>
            <VideoCallPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/manage-meetings"
        element={
          <ProtectedRoute>
            <ManageMeetingsPage />
          </ProtectedRoute>
        }
      />

      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  )

  // Wrap with Layout if sidebar should be shown
  if (shouldHaveSidebar) {
    return <Layout>{routes}</Layout>
  }

  return routes
}

function App() {
  return <AppContent />
}

export default App
