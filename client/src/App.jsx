import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Auth pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Passenger pages
import PassengerHome from './pages/passenger/PassengerHome';
import MyRides from './pages/passenger/MyRides';
import RideTracking from './pages/passenger/RideTracking';

// Driver pages
import DriverDashboard from './pages/driver/DriverDashboard';
import DriverRideRequests from './pages/driver/DriverRideRequests';
import DriverHistory from './pages/driver/DriverHistory';
import DriverOnboarding from './pages/driver/DriverOnboarding';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminDrivers from './pages/admin/AdminDrivers';
import AdminRides from './pages/admin/AdminRides';

// Common
import Layout from './components/common/Layout';
import LoadingScreen from './components/common/LoadingScreen';

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) {
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (user.role === 'DRIVER') return <Navigate to="/driver" replace />;
    return <Navigate to="/passenger" replace />;
  }
  return children;
};

const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
  if (user.role === 'DRIVER') return <Navigate to="/driver" replace />;
  return <Navigate to="/passenger" replace />;
};

function AppRoutes() {
  return (
    <SocketProvider>
      <Routes>
        {/* Root */}
        <Route path="/" element={<RootRedirect />} />

        {/* Public */}
        <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

        {/* Passenger */}
        <Route path="/passenger" element={<PrivateRoute roles={['PASSENGER']}><Layout /></PrivateRoute>}>
          <Route index         element={<PassengerHome />} />
          <Route path="rides"  element={<MyRides />} />
          <Route path="ride/:id" element={<RideTracking />} />
        </Route>

        {/* Driver */}
        <Route path="/driver" element={<PrivateRoute roles={['DRIVER']}><Layout /></PrivateRoute>}>
          <Route index           element={<DriverDashboard />} />
          <Route path="requests" element={<DriverRideRequests />} />
          <Route path="history"  element={<DriverHistory />} />
          <Route path="onboarding" element={<DriverOnboarding />} />
        </Route>

        {/* Admin */}
        <Route path="/admin" element={<PrivateRoute roles={['ADMIN']}><Layout /></PrivateRoute>}>
          <Route index          element={<AdminDashboard />} />
          <Route path="users"   element={<AdminUsers />} />
          <Route path="drivers" element={<AdminDrivers />} />
          <Route path="rides"   element={<AdminRides />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SocketProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
