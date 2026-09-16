import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { ThemeProvider } from './context/ThemeContext';
import AccessibilityButton from './components/AccessibilityButton';
import ChatWidget from './components/ChatWidget';
import StaffAssistantWidget from './components/StaffAssistantWidget';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import FindDoctors from './pages/FindDoctors';
import DoctorAvailability from './pages/DoctorAvailability';
import ConsultationRoom from './pages/ConsultationRoom';
import HealthNavigator from './pages/HealthNavigator';
import HealthJourney from './pages/HealthJourney';
import FollowUps from './pages/FollowUps';
import CareCircle from './pages/CareCircle';
import ResourceMap from './pages/ResourceMap';
import CrisisSupport from './pages/CrisisSupport';
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import Announcements from './pages/Announcements';

// Lazy-loaded: recharts is a sizeable dependency, and per this project's
// own Rural Mode principle, we shouldn't make low-bandwidth users
// download charting code on every page load - only when they actually
// open a page that needs a chart.
const Analytics = lazy(() => import('./pages/Analytics'));
const VitalsMonitoring = lazy(() => import('./pages/VitalsMonitoring'));
const MaternalCare = lazy(() => import('./pages/MaternalCare'));
const VaccinationRoutes = lazy(() => import('./pages/VaccinationRoutes'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));

const ChartFallback = <div style={{ padding: '2rem' }}>Loading…</div>;

// Restricts a route to specific roles, after auth is already confirmed by
// ProtectedRoute - e.g. only patients can book, only doctors manage
// availability, only admins see the verification panel.
function RoleRoute({ roles, children }) {
  const { user } = useAuth();
  if (!roles.includes(user?.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <ThemeProvider>
      <AccessibilityProvider>
        <AuthProvider>
          <BrowserRouter>
            <AccessibilityButton />
            <AuthedChatWidget />
            <AuthedStaffAssistant />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/consultation/:id" element={<ProtectedRoute><ConsultationRoom /></ProtectedRoute>} />
              <Route path="/followups" element={<ProtectedRoute><FollowUps /></ProtectedRoute>} />
              <Route path="/resource-map" element={<ProtectedRoute><ResourceMap /></ProtectedRoute>} />
              <Route path="/crisis-support" element={<ProtectedRoute><CrisisSupport /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><Suspense fallback={ChartFallback}><Analytics /></Suspense></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route
                path="/messages"
                element={<ProtectedRoute><RoleRoute roles={['doctor', 'admin']}><Messages /></RoleRoute></ProtectedRoute>}
              />
              <Route
                path="/announcements"
                element={<ProtectedRoute><RoleRoute roles={['doctor', 'admin']}><Announcements /></RoleRoute></ProtectedRoute>}
              />

              <Route
                path="/find-doctors"
                element={<ProtectedRoute><RoleRoute roles={['patient']}><FindDoctors /></RoleRoute></ProtectedRoute>}
              />
              <Route
                path="/navigator"
                element={<ProtectedRoute><RoleRoute roles={['patient']}><HealthNavigator /></RoleRoute></ProtectedRoute>}
              />
              <Route
                path="/journey"
                element={<ProtectedRoute><RoleRoute roles={['patient']}><HealthJourney /></RoleRoute></ProtectedRoute>}
              />
              <Route
                path="/care-circle"
                element={<ProtectedRoute><RoleRoute roles={['patient']}><CareCircle /></RoleRoute></ProtectedRoute>}
              />
              <Route
                path="/vitals"
                element={<ProtectedRoute><RoleRoute roles={['patient']}><Suspense fallback={ChartFallback}><VitalsMonitoring /></Suspense></RoleRoute></ProtectedRoute>}
              />
              <Route
                path="/maternal-care"
                element={<ProtectedRoute><RoleRoute roles={['patient']}><Suspense fallback={ChartFallback}><MaternalCare /></Suspense></RoleRoute></ProtectedRoute>}
              />
              <Route
                path="/availability"
                element={<ProtectedRoute><RoleRoute roles={['doctor']}><DoctorAvailability /></RoleRoute></ProtectedRoute>}
              />
              <Route
                path="/vaccination-routes"
                element={<ProtectedRoute><RoleRoute roles={['doctor', 'admin']}><Suspense fallback={ChartFallback}><VaccinationRoutes /></Suspense></RoleRoute></ProtectedRoute>}
              />
              <Route
                path="/admin"
                element={<ProtectedRoute><RoleRoute roles={['admin']}><Suspense fallback={ChartFallback}><AdminPanel /></Suspense></RoleRoute></ProtectedRoute>}
/>

              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </AccessibilityProvider>
    </ThemeProvider>
  );
}

// The chat widget needs a logged-in user (it's patient-only, see
// ChatWidget.jsx) but must sit outside <Routes> so it persists across page
// navigation instead of remounting - this small wrapper just reads auth
// state safely since it's still inside AuthProvider.
function AuthedChatWidget() {
  const { user } = useAuth();
  if (!user) return null;
  return <ChatWidget />;
}

// Same pattern as AuthedChatWidget, for the doctor/admin "hover to ask"
// assistant instead of the patient one - the two are mutually exclusive by
// role, so they share the same floating position without ever overlapping.
function AuthedStaffAssistant() {
  const { user } = useAuth();
  if (!user) return null;
  return <StaffAssistantWidget />;
}
