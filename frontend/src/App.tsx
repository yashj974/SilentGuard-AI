import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './theme/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, AdminRoute } from './components/auth/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { OAuthAuthorizePage } from './pages/OAuthAuthorizePage';
import { BookDemoPage } from './pages/BookDemoPage';
import { OverviewPage } from './pages/OverviewPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { IntegrationsPage } from './pages/IntegrationsPage';
import { ProjectDetailsPage } from './pages/ProjectDetailsPage';
import { FindingsPage } from './pages/FindingsPage';
import { DebtExplorerPage } from './pages/DebtExplorerPage';
import { RemediationLabPage } from './pages/RemediationLabPage';
import { ChangeImpactPage } from './pages/ChangeImpactPage';
import { RiskPoliciesPage } from './pages/RiskPoliciesPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ProfilePage } from './pages/ProfilePage';
import { MyBookingsPage } from './pages/MyBookingsPage';
import { AdminBookingsPage } from './pages/AdminBookingsPage';

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public SaaS Landing Page */}
            <Route path="/" element={<LandingPage />} />

            {/* Dedicated Book a Demo Page */}
            <Route path="/book-demo" element={<BookDemoPage />} />
            <Route path="/demo" element={<Navigate to="/book-demo" replace />} />

            {/* Authentication Page */}
            <Route path="/login" element={<AuthPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/signup" element={<AuthPage initialMode="signup" />} />
            <Route path="/oauth/callback" element={<OAuthAuthorizePage />} />
            <Route path="/oauth/authorize/:provider" element={<OAuthAuthorizePage />} />

            {/* Protected Developer Workspace & Account Management */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/workspace" element={<OverviewPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/integrations" element={<IntegrationsPage />} />
              <Route path="/project-details" element={<ProjectDetailsPage />} />
              <Route path="/findings" element={<FindingsPage />} />
              <Route path="/debt-explorer" element={<DebtExplorerPage />} />
              <Route path="/remediation-lab" element={<RemediationLabPage />} />
              <Route path="/change-impact" element={<ChangeImpactPage />} />
              <Route path="/risk-policies" element={<RiskPoliciesPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/settings" element={<SettingsPage />} />

              {/* Authenticated Account & Demo Booking Management */}
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/my-bookings" element={<MyBookingsPage />} />
              <Route
                path="/admin/demo-requests"
                element={
                  <AdminRoute>
                    <AdminBookingsPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/bookings"
                element={
                  <AdminRoute>
                    <AdminBookingsPage />
                  </AdminRoute>
                }
              />

              {/* Aliases for dashboard navigation */}
              <Route path="/dashboard" element={<Navigate to="/workspace" replace />} />
              <Route path="/overview" element={<Navigate to="/workspace" replace />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
